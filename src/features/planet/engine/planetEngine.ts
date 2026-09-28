/*
 * The planet's engine: one object that owns the orientation, the zoom layer,
 * gestures, inertia, the idle drift and breathing, and hands each frame to a
 * renderer (#47). React never renders per frame; it tells the engine what the
 * route asks for and gets back the list of points on screen, for the parallel
 * DOM, only when that list changes.
 *
 * The engine only asks for animation frames while something is moving. Under
 * reduced motion nothing moves by itself, so after the first frame it asks
 * for none until the student touches the planet.
 */
import { geoCircle, geoOrthographic, type GeoProjection } from 'd3-geo'
import { startDrag, type SphereDrag } from '@/features/planet/geo/drag'
import { createInertia, type Inertia } from '@/features/planet/geo/inertia'
import {
  allocateProjected,
  baseRadius,
  discOf,
  invertOnSphere,
  projectPoints,
  type ProjectedPoints,
  type ViewPlacement,
  type Viewport,
} from '@/features/planet/geo/projection'
import { facing, fromEuler, normalize, toEuler } from '@/features/planet/geo/quaternion'
import {
  innerTarget,
  interpolateView,
  outerTarget,
  regionExtent,
  sameTarget,
  viewForTarget,
  type LayerTarget,
  type PlanetLayer,
} from '@/features/planet/geo/zoom'
import {
  LEARNING_STATES,
  orderedPoints,
  orderedRegions,
  type KnowledgeMap,
  type KnowledgePoint,
} from '@/features/planet/model/knowledgeMap'
import {
  AUTO_ROTATE,
  breathAt,
  breathingOf,
  easeStandard,
  motionPolicy,
  type MotionPolicy,
} from '@/features/planet/motion/motionPolicy'
import { STATE_IN_PROGRESS, STATE_LIT, type PlanetRenderer, type PlanetTheme, type SceneData, type SceneFrame } from '@/features/planet/render/types'

export type FrameScheduler = {
  request(callback: (now: number) => void): number
  cancel(handle: number): void
}

export const animationFrameScheduler: FrameScheduler = {
  request: (callback) => requestAnimationFrame(callback),
  cancel: (handle) => cancelAnimationFrame(handle),
}

/** A point on screen now, for the parallel DOM. `index` is its keyboard position. */
export type VisiblePoint = { index: number; x: number; y: number }

export type PlanetEngineOptions = {
  renderer: PlanetRenderer
  theme: PlanetTheme
  reducedMotion: boolean
  scheduler?: FrameScheduler
  now?: () => number
  /** The student asked for another layer: a tap, a pinch, the wheel. */
  onRequestTarget?: (target: LayerTarget) => void
  /** The points on screen changed (membership, or where they sit once still). */
  onVisibleChange?: (points: VisiblePoint[]) => void
  /** The first frame with the planet on it has been drawn. */
  onFirstFrame?: () => void
}

type Transition =
  | { kind: 'zoom'; startedAt: number; durationMs: number; flight: (t: number) => ViewPlacement; from: PlanetLayer; to: PlanetLayer }
  | { kind: 'crossfade'; startedAt: number; durationMs: number; from: PlanetLayer; to: PlanetLayer }

type Pointer = { x: number; y: number }

/**
 * A point's box at the front of the sphere: 15 px on the planet, ~50 px in a
 * region, a little smaller on a crowded planet so neighbours do not merge.
 */
export function glyphSizeFor(k: number, pointCount = 0): number {
  const density = pointCount > 400 ? Math.max(0.65, Math.sqrt(400 / pointCount)) : 1
  return Math.max(10, Math.min(64, 15 * Math.pow(k, 0.9) * density))
}

const TAP_SLOP = 5
const WHEEL_STEP = 120
const WHEEL_COOLDOWN_MS = 450
const PINCH_IN = 1.25
const PINCH_OUT = 0.8
const POINT_LAYER_DIM = 0.35

export class PlanetEngine {
  private readonly renderer: PlanetRenderer
  private readonly scheduler: FrameScheduler
  private readonly now: () => number
  private readonly options: PlanetEngineOptions
  private readonly projection: GeoProjection = geoOrthographic().clipAngle(90).precision(0.7)
  private readonly inertia: Inertia = createInertia()

  private policy: MotionPolicy
  private map: KnowledgeMap | null = null
  private points: KnowledgePoint[] = []
  private regionIndex = new Map<string, number>()
  private scene: SceneData | null = null
  private projected: ProjectedPoints = allocateProjected(0)
  private breathScale = new Float32Array(0)
  private breathAlpha = new Float32Array(0)
  private breathPeriod = new Float32Array(0)
  private breathPhase = new Float32Array(0)

  private viewport: Viewport = { width: 0, height: 0 }
  private view: ViewPlacement = { q: facing(0, 15), k: 1, cx: 0.5, cy: 0.5 }
  private target: LayerTarget = { layer: 'planet' }
  private transition: Transition | null = null
  private handle: number | null = null
  private lastFrameAt: number | null = null
  private drewFirstFrame = false
  private destroyed = false

  private autoRotate: { startedAt: number | null } | null = null
  private pointers = new Map<number, Pointer>()
  private press: { x: number; y: number; at: number; moved: boolean } | null = null
  private drag: SphereDrag | null = null
  private lastMoveAt = 0
  private pinch: { distance: number; fired: boolean } | null = null
  private wheel = { accumulated: 0, lastIntentAt: Number.NEGATIVE_INFINITY }
  private focusPoint = -1
  private paused = false

  private visibleKey = ''
  private emittedOnce = false
  private positionsStale = false

  constructor(options: PlanetEngineOptions) {
    this.options = options
    this.renderer = options.renderer
    this.scheduler = options.scheduler ?? animationFrameScheduler
    this.now = options.now ?? (() => performance.now())
    this.policy = motionPolicy(options.reducedMotion)
    this.renderer.setTheme(options.theme)
  }

  // ---- inputs from React ------------------------------------------------

  setData(map: KnowledgeMap, target: LayerTarget): void {
    this.map = map
    this.points = orderedPoints(map)
    const regions = orderedRegions(map)
    this.regionIndex = new Map(regions.map((region, index) => [region.topicId, index]))
    const count = this.points.length
    const lngLat = new Float64Array(count * 2)
    const state = new Uint8Array(count)
    const progress = new Float32Array(count)
    const reviewDue = new Uint8Array(count)
    const region = new Uint16Array(count)
    this.breathPeriod = new Float32Array(count)
    this.breathPhase = new Float32Array(count)
    let recommended = -1
    this.points.forEach((point, i) => {
      lngLat[i * 2] = point.lng
      lngLat[i * 2 + 1] = point.lat
      state[i] = Math.max(0, LEARNING_STATES.indexOf(point.state))
      progress[i] = point.progress
      reviewDue[i] = point.reviewDue > 0 ? 1 : 0
      region[i] = this.regionIndex.get(point.regionId) ?? 0
      if (point.recommendation && recommended === -1) recommended = i
      const breath = breathingOf(point.lat, point.lng)
      this.breathPeriod[i] = breath.periodMs
      this.breathPhase[i] = breath.phase
    })
    this.scene = {
      count,
      lngLat,
      state,
      progress,
      reviewDue,
      recommended,
      region,
      names: this.points.map((point) => point.name),
      regions: regions.map((r) => ({
        name: r.name,
        lng: r.lng,
        lat: r.lat,
        outline: geoCircle().center([r.lng, r.lat]).radius(regionExtent(map, r.topicId) + 5).precision(4)(),
      })),
    }
    this.projected = allocateProjected(count)
    this.breathScale = new Float32Array(count).fill(1)
    this.breathAlpha = new Float32Array(count).fill(1)
    this.renderer.setData(this.scene)
    this.visibleKey = ''
    this.emittedOnce = false

    // Open facing the first region, or the recommended point's.
    const first = this.points[recommended] ?? this.points[0]
    const home = first ? map.regions.find((r) => r.topicId === first.regionId) : undefined
    if (home) this.view = { ...this.view, q: facing(home.lng, home.lat + 12) }
    this.target = target
    this.view = viewForTarget(target, map, this.viewport, this.view)
    this.transition = null
    this.autoRotate = target.layer === 'planet' && this.policy.autoRotate ? { startedAt: null } : null
    this.invalidate()
  }

  setTarget(target: LayerTarget): void {
    if (!this.map || sameTarget(target, this.target)) return
    const from = this.target.layer
    this.target = target
    this.cancelGestures()
    this.autoRotate = null
    const to = viewForTarget(target, this.map, this.viewport, this.view)
    const now = this.now()
    if (!this.drewFirstFrame || this.viewport.width === 0) {
      this.view = to
      this.transition = null
    } else if (this.policy.layerTransition === 'crossfade') {
      this.renderer.snapshot()
      this.view = to
      this.transition = { kind: 'crossfade', startedAt: now, durationMs: this.policy.layerMs, from, to: target.layer }
    } else {
      const flight = interpolateView(
        this.view,
        to,
        Math.min(this.viewport.width, this.viewport.height),
        baseRadius(this.viewport),
      )
      this.transition = { kind: 'zoom', startedAt: now, durationMs: this.policy.layerMs, flight, from, to: target.layer }
    }
    this.invalidate()
  }

  setViewport(width: number, height: number, dpr: number): void {
    if (width === this.viewport.width && height === this.viewport.height) {
      this.renderer.resize(this.viewport, dpr)
      this.invalidate()
      return
    }
    this.viewport = { width, height }
    this.renderer.resize(this.viewport, dpr)
    if (this.map && !this.transition) this.view = viewForTarget(this.target, this.map, this.viewport, this.view)
    this.positionsStale = true
    this.invalidate()
  }

  setReducedMotion(reduced: boolean): void {
    this.policy = motionPolicy(reduced)
    if (!this.policy.inertia) this.inertia.stop()
    if (!this.policy.autoRotate) this.autoRotate = null
    if (this.transition?.kind === 'zoom' && reduced) {
      this.view = this.transition.flight(1)
      this.transition = null
    }
    this.invalidate()
  }

  /**
   * Hold everything that moves by itself -- inertia, the drift, breathing --
   * while the planet cannot be used: the page area is `inert` under the
   * phone's Ask sheet (#49), or the tab is hidden. Gestures still work.
   */
  setPaused(paused: boolean): void {
    if (paused === this.paused) return
    this.paused = paused
    if (paused) {
      this.inertia.stop()
      this.autoRotate = null
    }
    this.invalidate()
  }

  get isPaused(): boolean {
    return this.paused
  }

  setTheme(theme: PlanetTheme): void {
    this.renderer.setTheme(theme)
    this.invalidate()
  }

  /** Keyboard focus moved onto a point's link (or off, with -1). */
  setFocusPoint(index: number): void {
    if (index >= 0) this.autoRotate = null
    if (index === this.focusPoint) return
    this.focusPoint = index
    this.invalidate()
  }

  // ---- gestures ---------------------------------------------------------

  pointerDown(id: number, x: number, y: number): void {
    this.pointers.set(id, { x, y })
    this.autoRotate = null
    this.inertia.stop()
    if (this.pointers.size === 1) {
      this.press = { x, y, at: this.now(), moved: false }
      this.drag = null
      this.pinch = null
    } else if (this.pointers.size === 2) {
      this.press = null
      this.drag = null
      this.pinch = { distance: this.pointerSpread(), fired: false }
    }
    this.invalidate()
  }

  pointerMove(id: number, x: number, y: number): void {
    const pointer = this.pointers.get(id)
    if (!pointer) return
    pointer.x = x
    pointer.y = y
    const now = this.now()

    if (this.pinch && this.pointers.size >= 2) {
      const ratio = this.pointerSpread() / Math.max(1, this.pinch.distance)
      if (!this.pinch.fired && (ratio > PINCH_IN || ratio < PINCH_OUT)) {
        this.pinch.fired = true
        this.requestStep(ratio > 1 ? 'in' : 'out', x, y)
      }
      return
    }

    if (!this.press) return
    if (!this.press.moved && Math.hypot(x - this.press.x, y - this.press.y) < TAP_SLOP) return
    if (!this.press.moved) {
      this.press.moved = true
      // The point layer holds still: its card is the thing to read.
      if (this.target.layer !== 'point' && !this.transition) {
        this.syncProjection()
        this.drag = startDrag(this.projection, this.view.q, this.press.x, this.press.y)
        this.lastMoveAt = this.press.at
      }
    }
    if (!this.drag) return
    const move = this.drag.move(x, y)
    if (!move) return
    this.view = { ...this.view, q: move.q }
    this.inertia.sample(move.step, Math.max(1, now - this.lastMoveAt), now)
    this.lastMoveAt = now
    this.positionsStale = true
    this.invalidate()
  }

  pointerUp(id: number, x: number, y: number): void {
    const wasPinch = this.pinch !== null
    this.pointers.delete(id)
    if (wasPinch) {
      if (this.pointers.size === 0) this.pinch = null
      return
    }
    const press = this.press
    this.press = null
    if (!press) return
    if (this.drag) {
      this.drag = null
      if (this.policy.inertia) this.inertia.release(this.now())
      else this.inertia.stop()
      this.invalidate()
      return
    }
    if (!press.moved) this.tap(x, y)
  }

  pointerCancel(id: number): void {
    this.pointers.delete(id)
    if (this.pointers.size === 0) this.cancelGestures()
  }

  /** A wheel or trackpad scroll; `deltaY` < 0 zooms in. Returns whether it was used. */
  wheelBy(deltaY: number, x: number, y: number): boolean {
    this.autoRotate = null
    const now = this.now()
    if (now - this.wheel.lastIntentAt < WHEEL_COOLDOWN_MS) return true
    this.wheel.accumulated += deltaY
    if (Math.abs(this.wheel.accumulated) < WHEEL_STEP) return true
    const direction = this.wheel.accumulated < 0 ? 'in' : 'out'
    this.wheel = { accumulated: 0, lastIntentAt: now }
    this.requestStep(direction, x, y)
    return true
  }

  /** The zoom buttons and keys: in centres on what is nearest the middle. */
  step(direction: 'in' | 'out'): void {
    this.requestStep(direction, this.viewport.width * this.view.cx, this.viewport.height * this.view.cy)
  }

  // ---- queries ----------------------------------------------------------

  get layer(): PlanetLayer {
    return this.target.layer
  }

  get currentView(): ViewPlacement {
    return this.view
  }

  get motion(): MotionPolicy {
    return this.policy
  }

  /** Whether the engine has a frame on order. */
  get animating(): boolean {
    return this.handle !== null
  }

  destroy(): void {
    this.destroyed = true
    if (this.handle !== null) this.scheduler.cancel(this.handle)
    this.handle = null
    this.renderer.destroy()
  }

  // ---- internals --------------------------------------------------------

  private pointerSpread(): number {
    const [a, b] = [...this.pointers.values()]
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0
  }

  private cancelGestures() {
    this.press = null
    this.drag = null
    this.pinch = null
    this.inertia.stop()
  }

  private requestStep(direction: 'in' | 'out', x: number, y: number) {
    if (!this.map) return
    const next =
      direction === 'in' ? innerTarget(this.target, this.map, this.nearestPoint(x, y, Number.POSITIVE_INFINITY)) : outerTarget(this.target)
    if (!sameTarget(next, this.target)) this.options.onRequestTarget?.(next)
  }

  /** The visible point nearest `(x, y)` within `radius` px. */
  private nearestPoint(x: number, y: number, radius: number): KnowledgePoint | null {
    let best = -1
    let bestDistance = radius
    const { x: px, y: py, depth } = this.projected
    for (let i = 0; i < this.points.length; i += 1) {
      if (depth[i] <= 0) continue
      const distance = Math.hypot(px[i] - x, py[i] - y)
      if (distance < bestDistance) {
        best = i
        bestDistance = distance
      }
    }
    return best >= 0 ? this.points[best] : null
  }

  private tap(x: number, y: number) {
    if (!this.map) return
    const reach = Math.max(22, glyphSizeFor(this.view.k, this.points.length) * 0.5)
    const hit = this.nearestPoint(x, y, reach)
    if (this.target.layer === 'planet') {
      // A tap on a continent (or a speck on it) opens that region.
      const regionId = hit?.regionId ?? this.regionAt(x, y)
      if (regionId) this.options.onRequestTarget?.({ layer: 'region', regionId })
      return
    }
    if (hit) this.options.onRequestTarget?.({ layer: 'point', regionId: hit.regionId, pointId: hit.unitId })
  }

  /** The region whose centre is nearest the sphere point under `(x, y)`. */
  private regionAt(x: number, y: number): string | null {
    if (!this.map) return null
    this.syncProjection()
    const disc = discOf(this.view, this.viewport)
    if (Math.hypot(x - disc.cx, y - disc.cy) > disc.r) return null
    const geo = invertOnSphere(this.projection, x, y)
    if (!geo) return null
    let best: string | null = null
    let bestCos = -2
    const r = Math.PI / 180
    for (const region of this.map.regions) {
      const cos =
        Math.sin(geo[1] * r) * Math.sin(region.lat * r) +
        Math.cos(geo[1] * r) * Math.cos(region.lat * r) * Math.cos((geo[0] - region.lng) * r)
      if (cos > bestCos) {
        bestCos = cos
        best = region.topicId
      }
    }
    return best
  }

  private syncProjection() {
    const disc = discOf(this.view, this.viewport)
    this.projection
      .rotate(toEuler(this.view.q))
      .scale(disc.r)
      .translate([disc.cx, disc.cy])
  }

  private invalidate() {
    if (this.destroyed || this.handle !== null) return
    this.handle = this.scheduler.request((now) => this.frame(now))
  }

  private frame(now: number) {
    this.handle = null
    if (this.destroyed || !this.scene || !this.map || this.viewport.width === 0) return
    const dt = this.lastFrameAt === null ? 16 : Math.max(0, Math.min(64, now - this.lastFrameAt))
    this.lastFrameAt = now
    let keepGoing = false
    let moving = false

    // Layer transitions.
    let crossfade = 0
    let progress = 1
    let transitionFrom: PlanetLayer = this.target.layer
    if (this.transition) {
      const t = Math.min(1, (now - this.transition.startedAt) / this.transition.durationMs)
      progress = t
      transitionFrom = this.transition.from
      if (this.transition.kind === 'zoom') {
        this.view = this.transition.flight(easeStandard(t))
        moving = true
      } else {
        crossfade = 1 - t
      }
      if (t >= 1) {
        this.transition = null
        this.positionsStale = true
      } else {
        keepGoing = true
      }
    } else if (this.inertia.spinning && this.policy.inertia) {
      const next = this.inertia.advance(this.view.q, dt)
      if (next) {
        this.view = { ...this.view, q: normalize(next) }
        moving = true
        keepGoing = true
      }
      this.positionsStale = true
    } else if (this.autoRotate && this.policy.autoRotate && this.target.layer === 'planet' && !this.press) {
      this.autoRotate.startedAt ??= now
      const elapsed = now - this.autoRotate.startedAt
      if (elapsed >= AUTO_ROTATE.durationMs) {
        this.autoRotate = null
        this.positionsStale = true
      } else {
        const remaining = AUTO_ROTATE.durationMs - elapsed
        const ease = remaining < AUTO_ROTATE.easeOutMs ? remaining / AUTO_ROTATE.easeOutMs : 1
        const [lambda, phi, gamma] = toEuler(this.view.q)
        this.view = { ...this.view, q: fromEuler([lambda + (AUTO_ROTATE.speed * dt * ease) / 1000, phi, gamma]) }
        moving = true
        keepGoing = true
      }
    }
    if (this.drag) moving = true

    // Project every point.
    this.syncProjection()
    projectPoints(this.projection, this.scene.lngLat, this.projected)

    // Breathing: lit and in-progress stars, on the planet and region layers.
    const breathe = this.policy.breathing && !this.paused && this.target.layer !== 'point'
    const { state } = this.scene
    let anyBreathing = false
    for (let i = 0; i < this.scene.count; i += 1) {
      if (breathe && (state[i] === STATE_LIT || state[i] === STATE_IN_PROGRESS) && this.projected.depth[i] > 0) {
        const breath = breathAt(now, this.breathPeriod[i], this.breathPhase[i])
        this.breathScale[i] = breath.scale
        this.breathAlpha[i] = breath.alpha
        anyBreathing = true
      } else {
        this.breathScale[i] = 1
        this.breathAlpha[i] = 1
      }
    }
    if (anyBreathing) keepGoing = true

    this.renderer.draw(this.frameState(progress, transitionFrom, crossfade))

    if (!this.drewFirstFrame) {
      this.drewFirstFrame = true
      this.options.onFirstFrame?.()
    }
    this.emitVisible(moving)
    if (keepGoing) this.invalidate()
  }

  private frameState(progress: number, from: PlanetLayer, crossfade: number): SceneFrame {
    const to = this.target.layer
    const labelsTo = to === 'planet' ? 0 : 1
    const labelsFrom = from === 'planet' ? 0 : 1
    // Names fade in after 60% of the zoom and out over its first 40%.
    const pointLabelAlpha =
      labelsTo === labelsFrom
        ? labelsTo
        : labelsTo === 1
          ? Math.max(0, (progress - 0.6) / 0.4)
          : Math.max(0, 1 - progress / 0.4)
    const regionLabelAlpha = to === 'planet' ? (from === 'planet' ? 1 : Math.max(0, (progress - 0.6) / 0.4)) : from === 'planet' ? Math.max(0, 1 - progress / 0.4) : 0
    const dimTo = to === 'point' ? POINT_LAYER_DIM : 1
    const dimFrom = from === 'point' ? POINT_LAYER_DIM : 1
    const target = this.target
    const focusRegion = target.layer === 'planet' ? -1 : (this.regionIndex.get(target.regionId) ?? -1)
    const focusPoint =
      target.layer === 'point' ? this.points.findIndex((point) => point.unitId === target.pointId) : this.focusPoint
    return {
      viewport: this.viewport,
      projection: this.projection,
      disc: discOf(this.view, this.viewport),
      x: this.projected.x,
      y: this.projected.y,
      depth: this.projected.depth,
      breathScale: this.breathScale,
      breathAlpha: this.breathAlpha,
      glyphSize: glyphSizeFor(this.view.k, this.points.length),
      pointLabelAlpha,
      regionLabelAlpha,
      focusRegion,
      focusPoint,
      dim: dimFrom + (dimTo - dimFrom) * progress,
      crossfade,
    }
  }

  /**
   * Tell React which points are on screen: on the first frame, then each time
   * the planet comes to rest. Nothing is sent while it moves -- re-rendering a
   * thousand links mid-spin cost a 4x-throttled phone 140 ms frames -- and the
   * links are invisible until focused, so a moving planet does not need them.
   */
  private emitVisible(moving: boolean) {
    const listener = this.options.onVisibleChange
    if (!listener) return
    if (moving && this.emittedOnce) {
      this.positionsStale = true
      return
    }
    const { x, y, depth } = this.projected
    const margin = 8
    const list: VisiblePoint[] = []
    const keys: number[] = []
    // The point layer's DOM is its card; the sphere behind it has no links.
    if (this.target.layer !== 'point') {
      for (let i = 0; i < this.points.length; i += 1) {
        if (depth[i] <= 0.05) continue
        if (x[i] < -margin || y[i] < -margin || x[i] > this.viewport.width + margin || y[i] > this.viewport.height + margin) continue
        list.push({ index: i, x: x[i], y: y[i] })
        keys.push(i)
      }
    }
    const key = keys.join(',')
    if (this.emittedOnce && key === this.visibleKey && !this.positionsStale) return
    this.emittedOnce = true
    this.visibleKey = key
    this.positionsStale = false
    listener(list)
  }
}
