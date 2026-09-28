/*
 * The star map's engine (#47, #72): one object that owns the camera, the
 * layer, gestures, the glide after a pan, foveation and the one breathing
 * star, and hands each frame to a renderer. React never renders per frame; it
 * tells the engine what the route asks for and gets back the stars on screen,
 * for the parallel DOM, when the map comes to rest.
 *
 * The engine asks for animation frames only while something moves: a pan, a
 * glide, a layer change, or the recommended star breathing. A still map under
 * reduced motion, or while the map is paused (hidden tab, `inert` page area),
 * asks for none.
 */
import { innerLinks, nebulaLinks } from '@/features/starmap/model/links'
import { LEARNING_STATES, orderedNebulae, orderedStars, type Star, type StarMap } from '@/features/starmap/model/starMap'
import { breathAt, easeStandard, motionPolicy, type MotionPolicy } from '@/features/starmap/motion/motionPolicy'
import type { SceneData, SceneFrame, StarMapRenderer, StarMapTheme } from '@/features/starmap/render/types'
import {
  baseScale,
  overviewView,
  panBy,
  transformOf,
  type Bounds,
  type View,
  type Viewport,
} from '@/features/starmap/view/camera'
import { DRAW_THRESHOLD, FOVEATE_ABOVE, focusBand, sharpnessOf } from '@/features/starmap/view/foveation'
import { mapBounds, nebulaDiscs, typicalSpacing, type NebulaDisc } from '@/features/starmap/view/geometry'
import { createInertia, type Inertia } from '@/features/starmap/view/inertia'
import {
  innerTarget,
  interpolateView,
  outerTarget,
  sameTarget,
  viewForTarget,
  type LayerTarget,
  type MapLayer,
} from '@/features/starmap/view/layers'

export type FrameScheduler = {
  request(callback: (now: number) => void): number
  cancel(handle: number): void
}

export const animationFrameScheduler: FrameScheduler = {
  request: (callback) => requestAnimationFrame(callback),
  cancel: (handle) => cancelAnimationFrame(handle),
}

/** A star on screen now, for the parallel DOM. `index` is its keyboard position. */
export type VisibleStar = { index: number; x: number; y: number }

export type StarMapEngineOptions = {
  renderer: StarMapRenderer
  theme: StarMapTheme
  reducedMotion: boolean
  scheduler?: FrameScheduler
  now?: () => number
  /** The student asked for another layer: a tap, a pinch, the wheel. */
  onRequestTarget?: (target: LayerTarget) => void
  /** The stars on screen changed, and how big they are drawn; sent when the map is at rest. */
  onVisibleChange?: (stars: VisibleStar[], glyphSize: number) => void
  /** The first frame with the map on it has been drawn. */
  onFirstFrame?: () => void
}

type Transition =
  | { kind: 'zoom'; startedAt: number; durationMs: number; flight: (t: number) => View; from: MapLayer; to: MapLayer }
  | { kind: 'crossfade'; startedAt: number; durationMs: number; from: MapLayer; to: MapLayer }

type Pointer = { x: number; y: number }

/** A star's box, CSS px: a little over half the gap to its neighbours, 9 to 56. */
export function glyphSizeFor(scale: number, spacing: number): number {
  return Math.max(9, Math.min(56, scale * spacing * 0.55))
}

const TAP_SLOP = 5
const WHEEL_STEP = 120
const WHEEL_COOLDOWN_MS = 450
const PINCH_IN = 1.25
const PINCH_OUT = 0.8
const STAR_LAYER_DIM = 0.35

export class StarMapEngine {
  private readonly renderer: StarMapRenderer
  private readonly scheduler: FrameScheduler
  private readonly now: () => number
  private readonly options: StarMapEngineOptions
  private readonly inertia: Inertia = createInertia()

  private policy: MotionPolicy
  private map: StarMap | null = null
  private stars: Star[] = []
  private nebulaIndex = new Map<string, number>()
  private nebulaIds: string[] = []
  private discs = new Map<string, NebulaDisc>()
  private bounds: Bounds = { minX: 0, minY: 0, maxX: 1, maxY: 1 }
  private spacing = 0.05
  private scene: SceneData | null = null

  private x = new Float32Array(0)
  private y = new Float32Array(0)
  private starAlpha = new Float32Array(0)
  private nebulaX = new Float32Array(0)
  private nebulaY = new Float32Array(0)
  private nebulaR = new Float32Array(0)
  private sharpness = new Float32Array(0)

  private viewport: Viewport = { width: 0, height: 0 }
  private view: View = { cx: 0.5, cy: 0.5, k: 1, fx: 0.5, fy: 0.5 }
  private target: LayerTarget = { layer: 'map' }
  private transition: Transition | null = null
  private handle: number | null = null
  private lastFrameAt: number | null = null
  private drewFirstFrame = false
  private destroyed = false
  private paused = false

  private pointers = new Map<number, Pointer>()
  private press: { x: number; y: number; at: number; moved: boolean } | null = null
  private dragging: { x: number; y: number; at: number } | null = null
  private pinch: { distance: number; fired: boolean } | null = null
  private wheel = { accumulated: 0, lastIntentAt: Number.NEGATIVE_INFINITY }
  private focusStar = -1

  private visibleKey = ''
  private emittedOnce = false
  private positionsStale = false

  constructor(options: StarMapEngineOptions) {
    this.options = options
    this.renderer = options.renderer
    this.scheduler = options.scheduler ?? animationFrameScheduler
    this.now = options.now ?? (() => performance.now())
    this.policy = motionPolicy(options.reducedMotion)
    this.renderer.setTheme(options.theme)
  }

  // ---- inputs from React ------------------------------------------------

  setData(map: StarMap, target: LayerTarget): void {
    this.map = map
    this.stars = orderedStars(map)
    const nebulae = orderedNebulae(map).filter((nebula) => map.stars.some((star) => star.nebulaId === nebula.topicId))
    this.nebulaIds = nebulae.map((nebula) => nebula.topicId)
    this.nebulaIndex = new Map(this.nebulaIds.map((id, index) => [id, index]))
    this.discs = nebulaDiscs(map)
    this.bounds = mapBounds(this.discs)
    this.spacing = typicalSpacing(map, this.discs)

    const count = this.stars.length
    const starIndex = new Map(this.stars.map((star, i) => [star.unitId, i]))
    const scene: SceneData = {
      count,
      mapX: new Float32Array(count),
      mapY: new Float32Array(count),
      state: new Uint8Array(count),
      progress: new Float32Array(count),
      reviewDue: new Uint8Array(count),
      recommended: -1,
      nebula: new Uint16Array(count),
      names: this.stars.map((star) => star.name),
      skills: this.stars.map((star) => star.skills.map((skill) => skill.lit)),
      nebulae: nebulae.map((nebula) => {
        const disc = this.discs.get(nebula.topicId)!
        const members = map.stars.filter((star) => star.nebulaId === nebula.topicId)
        return {
          name: nebula.name,
          x: disc.x,
          y: disc.y,
          r: disc.r,
          lit: members.filter((star) => star.state === 'lit').length,
          total: members.length,
        }
      }),
      links: nebulaLinks(map)
        .map((link) => ({ a: this.nebulaIndex.get(link.a) ?? -1, b: this.nebulaIndex.get(link.b) ?? -1, count: link.count }))
        .filter((link) => link.a >= 0 && link.b >= 0),
      innerLinks: this.nebulaIds.flatMap((id, n) =>
        innerLinks(map, id).map((edge) => ({ from: starIndex.get(edge.from) ?? -1, to: starIndex.get(edge.to) ?? -1, nebula: n })),
      ).filter((edge) => edge.from >= 0 && edge.to >= 0),
    }
    this.stars.forEach((star, i) => {
      scene.mapX[i] = star.x
      scene.mapY[i] = star.y
      scene.state[i] = Math.max(0, LEARNING_STATES.indexOf(star.state))
      scene.progress[i] = star.progress
      scene.reviewDue[i] = star.reviewDue > 0 ? 1 : 0
      scene.nebula[i] = this.nebulaIndex.get(star.nebulaId) ?? 0
      if (star.recommendation && scene.recommended === -1) scene.recommended = i
    })
    this.scene = scene
    this.x = new Float32Array(count)
    this.y = new Float32Array(count)
    this.starAlpha = new Float32Array(count)
    const nebulaCount = nebulae.length
    this.nebulaX = new Float32Array(nebulaCount)
    this.nebulaY = new Float32Array(nebulaCount)
    this.nebulaR = new Float32Array(nebulaCount)
    this.sharpness = new Float32Array(nebulaCount)
    this.renderer.setData(scene)
    this.visibleKey = ''
    this.emittedOnce = false

    // New data for the same layer (a star lit, say) keeps the view where it is.
    const keepView = this.drewFirstFrame && sameTarget(target, this.target)
    this.target = target
    if (!keepView) this.view = this.viewFor(target)
    this.transition = null
    this.invalidate()
  }

  setTarget(target: LayerTarget): void {
    if (!this.map || sameTarget(target, this.target)) return
    const from = this.target.layer
    this.target = target
    this.cancelGestures()
    const to = this.viewFor(target)
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
        baseScale(this.viewport, this.bounds),
      )
      this.transition = { kind: 'zoom', startedAt: now, durationMs: this.policy.layerMs, flight, from, to: target.layer }
    }
    this.invalidate()
  }

  /** The page area's size (it narrows when Ask's panel opens, #49): re-centre on the layer. */
  setViewport(width: number, height: number, dpr: number): void {
    const changed = width !== this.viewport.width || height !== this.viewport.height
    this.viewport = { width, height }
    this.renderer.resize(this.viewport, dpr)
    if (changed && this.map && !this.transition) this.view = this.viewFor(this.target)
    this.positionsStale = true
    this.invalidate()
  }

  setReducedMotion(reduced: boolean): void {
    this.policy = motionPolicy(reduced)
    if (!this.policy.inertia) this.inertia.stop()
    if (this.transition?.kind === 'zoom' && reduced) {
      this.view = this.transition.flight(1)
      this.transition = null
    }
    this.invalidate()
  }

  /**
   * Hold everything that moves by itself -- the glide, breathing -- while the
   * map cannot be used: the page area is `inert` under the phone's Ask sheet
   * (#49), or the tab is hidden. Gestures still work.
   */
  setPaused(paused: boolean): void {
    if (paused === this.paused) return
    this.paused = paused
    if (paused) this.inertia.stop()
    this.invalidate()
  }

  get isPaused(): boolean {
    return this.paused
  }

  setTheme(theme: StarMapTheme): void {
    this.renderer.setTheme(theme)
    this.invalidate()
  }

  /** Keyboard focus moved onto a star's link (or off, with -1). Its nebula comes into focus. */
  setFocusStar(index: number): void {
    if (index === this.focusStar) return
    this.focusStar = index
    this.invalidate()
  }

  // ---- gestures ---------------------------------------------------------

  pointerDown(id: number, x: number, y: number): void {
    this.pointers.set(id, { x, y })
    this.inertia.stop()
    if (this.pointers.size === 1) {
      this.press = { x, y, at: this.now(), moved: false }
      this.dragging = null
      this.pinch = null
    } else if (this.pointers.size === 2) {
      this.press = null
      this.dragging = null
      this.pinch = { distance: this.pointerSpread(), fired: false }
    }
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
      // The star layer holds still: its card is the thing to read.
      if (this.target.layer !== 'star' && !this.transition) this.dragging = { x: this.press.x, y: this.press.y, at: this.press.at }
    }
    if (!this.dragging) return
    const dx = x - this.dragging.x
    const dy = y - this.dragging.y
    this.view = panBy(this.view, dx, dy, this.viewport, this.bounds)
    this.inertia.sample(dx, dy, Math.max(1, now - this.dragging.at), now)
    this.dragging = { x, y, at: now }
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
    if (this.dragging) {
      this.dragging = null
      if (this.policy.inertia && !this.paused) this.inertia.release(this.now())
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

  /** A wheel or trackpad scroll; `deltaY` < 0 zooms in. */
  wheelBy(deltaY: number, x: number, y: number): void {
    const now = this.now()
    if (now - this.wheel.lastIntentAt < WHEEL_COOLDOWN_MS) return
    this.wheel.accumulated += deltaY
    if (Math.abs(this.wheel.accumulated) < WHEEL_STEP) return
    const direction = this.wheel.accumulated < 0 ? 'in' : 'out'
    this.wheel = { accumulated: 0, lastIntentAt: now }
    this.requestStep(direction, x, y)
  }

  /** The zoom buttons and keys: in centres on what is nearest the focus point. */
  step(direction: 'in' | 'out'): void {
    this.requestStep(direction, this.viewport.width * this.view.fx, this.viewport.height * this.view.fy)
  }

  // ---- queries ----------------------------------------------------------

  get layer(): MapLayer {
    return this.target.layer
  }

  get currentView(): View {
    return this.view
  }

  get motion(): MotionPolicy {
    return this.policy
  }

  /** The drawn glyph size now, CSS px. */
  get glyphSize(): number {
    return glyphSizeFor(transformOf(this.view, this.viewport, this.bounds).scale, this.spacing)
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

  private viewFor(target: LayerTarget): View {
    if (!this.map || this.viewport.width === 0) return overviewView(this.bounds)
    return viewForTarget(target, this.map, this.discs, this.bounds, this.viewport)
  }

  private pointerSpread(): number {
    const [a, b] = [...this.pointers.values()]
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0
  }

  private cancelGestures() {
    this.press = null
    this.dragging = null
    this.pinch = null
    this.inertia.stop()
  }

  private requestStep(direction: 'in' | 'out', x: number, y: number) {
    if (!this.map) return
    const next =
      direction === 'in'
        ? innerTarget(this.target, this.map, this.nebulaAt(x, y, true), this.nearestStar(x, y, Number.POSITIVE_INFINITY))
        : outerTarget(this.target)
    if (!sameTarget(next, this.target)) this.options.onRequestTarget?.(next)
  }

  /** The star on screen nearest `(x, y)` within `radius` px. */
  private nearestStar(x: number, y: number, radius: number): Star | null {
    let best = -1
    let bestDistance = radius
    for (let i = 0; i < this.stars.length; i += 1) {
      const distance = Math.hypot(this.x[i] - x, this.y[i] - y)
      if (distance < bestDistance) {
        best = i
        bestDistance = distance
      }
    }
    return best >= 0 ? this.stars[best] : null
  }

  /** The nebula under `(x, y)`; with `nearest`, the closest one if none is under it. */
  private nebulaAt(x: number, y: number, nearest = false): string | null {
    let best = -1
    let bestGap = nearest ? Number.POSITIVE_INFINITY : 0
    for (let n = 0; n < this.nebulaIds.length; n += 1) {
      const gap = Math.hypot(this.nebulaX[n] - x, this.nebulaY[n] - y) - this.nebulaR[n] * 1.1
      if (gap < bestGap) {
        best = n
        bestGap = gap
      }
    }
    return best >= 0 ? this.nebulaIds[best] : null
  }

  private tap(x: number, y: number) {
    if (!this.map) return
    const reach = Math.max(22, this.glyphSize * 0.5)
    if (this.target.layer === 'map') {
      const nebulaId = this.nebulaAt(x, y) ?? this.nearestStar(x, y, reach)?.nebulaId
      if (nebulaId) this.options.onRequestTarget?.({ layer: 'nebula', nebulaId })
      return
    }
    const hit = this.nearestStar(x, y, reach)
    if (hit) {
      this.options.onRequestTarget?.({ layer: 'star', nebulaId: hit.nebulaId, unitId: hit.unitId })
      return
    }
    const nebulaId = this.nebulaAt(x, y)
    if (nebulaId && nebulaId !== this.target.nebulaId) this.options.onRequestTarget?.({ layer: 'nebula', nebulaId })
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
    let moving = this.dragging !== null

    // Layer transitions, else the glide after a pan.
    let crossfade = 0
    let progress = 1
    let from: MapLayer = this.target.layer
    if (this.transition) {
      const t = Math.min(1, (now - this.transition.startedAt) / this.transition.durationMs)
      progress = t
      from = this.transition.from
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
    } else if (this.inertia.moving && this.policy.inertia && !this.paused) {
      const step = this.inertia.advance(dt)
      if (step) {
        this.view = panBy(this.view, step[0], step[1], this.viewport, this.bounds)
        moving = true
        keepGoing = true
      }
      this.positionsStale = true
    }

    // Where everything is on screen, and what is in focus.
    const t = transformOf(this.view, this.viewport, this.bounds)
    const scene = this.scene
    const { width, height } = this.viewport
    const focusX = width * this.view.fx
    const focusY = height * this.view.fy
    const band = focusBand(width, height)
    const target = this.target
    const chosen =
      target.layer === 'map' ? (this.focusStar >= 0 ? scene.nebula[this.focusStar] : -1) : (this.nebulaIndex.get(target.nebulaId) ?? -1)
    for (let n = 0; n < scene.nebulae.length; n += 1) {
      const nebula = scene.nebulae[n]
      this.nebulaX[n] = t.ox + nebula.x * t.scale
      this.nebulaY[n] = t.oy + nebula.y * t.scale
      this.nebulaR[n] = nebula.r * t.scale
      this.sharpness[n] =
        scene.count <= FOVEATE_ABOVE ? 1 : sharpnessOf(this.nebulaX[n], this.nebulaY[n], this.nebulaR[n], focusX, focusY, band, n === chosen)
    }
    for (let i = 0; i < scene.count; i += 1) {
      this.x[i] = t.ox + scene.mapX[i] * t.scale
      this.y[i] = t.oy + scene.mapY[i] * t.scale
      this.starAlpha[i] = this.sharpness[scene.nebula[i]]
    }
    // The one exception: the recommended star is the student's way in, so it
    // is drawn, and breathes, even inside a blurred nebula -- one sprite.
    if (scene.recommended >= 0) this.starAlpha[scene.recommended] = 1

    // Only the recommended star breathes (#72 point 6), and only when seen sharp.
    let breath: SceneFrame['breath'] = null
    const rec = scene.recommended
    if (
      rec >= 0 &&
      this.policy.breathing &&
      !this.paused &&
      target.layer !== 'star' &&
      this.starAlpha[rec] >= DRAW_THRESHOLD &&
      this.x[rec] > 0 &&
      this.y[rec] > 0 &&
      this.x[rec] < width &&
      this.y[rec] < height
    ) {
      breath = { index: rec, ...breathAt(now) }
      keepGoing = true
    }

    this.renderer.draw(this.frameState(t, progress, from, crossfade, chosen, breath))

    if (!this.drewFirstFrame) {
      this.drewFirstFrame = true
      this.options.onFirstFrame?.()
    }
    this.emitVisible(moving)
    if (keepGoing) this.invalidate()
  }

  private frameState(
    t: { scale: number; ox: number; oy: number },
    progress: number,
    from: MapLayer,
    crossfade: number,
    chosen: number,
    breath: SceneFrame['breath'],
  ): SceneFrame {
    const to = this.target.layer
    const lerp = (a: number, b: number) => a + (b - a) * progress
    // Names fade in after 60% of the zoom and out over its first 40%.
    const named = (layer: MapLayer) => (layer === 'map' ? 0 : 1)
    const starLabelAlpha =
      named(to) === named(from) ? named(to) : named(to) === 1 ? Math.max(0, (progress - 0.6) / 0.4) : Math.max(0, 1 - progress / 0.4)
    const nebulaLabels = (layer: MapLayer) => (layer === 'map' ? 1 : layer === 'nebula' ? 0.8 : 0)
    const dimOf = (layer: MapLayer) => (layer === 'star' ? STAR_LAYER_DIM : 1)
    const target = this.target
    const focusStar =
      target.layer === 'star' ? this.stars.findIndex((star) => star.unitId === target.unitId) : this.focusStar
    const glyphSize = glyphSizeFor(t.scale, this.spacing)
    return {
      viewport: this.viewport,
      scale: t.scale,
      ox: t.ox,
      oy: t.oy,
      x: this.x,
      y: this.y,
      starAlpha: this.starAlpha,
      nebulaX: this.nebulaX,
      nebulaY: this.nebulaY,
      nebulaR: this.nebulaR,
      sharpness: this.sharpness,
      glyphSize,
      breath,
      starLabelAlpha,
      nebulaLabelAlpha: lerp(nebulaLabels(from), nebulaLabels(to)),
      innerLinkAlpha: starLabelAlpha,
      chosenNebula: chosen,
      focusStar,
      dim: lerp(dimOf(from), dimOf(to)),
      showSkills: glyphSize >= 30,
      crossfade,
    }
  }

  /**
   * Tell React which stars are on screen: on the first frame, then each time
   * the map comes to rest. Nothing is sent while it moves -- re-rendering a
   * thousand links mid-pan costs a slow phone long frames, and the links are
   * invisible until focused. Every star on screen is listed, blurred or not:
   * the blur is visual only (#72 point 6).
   */
  private emitVisible(moving: boolean) {
    const listener = this.options.onVisibleChange
    if (!listener) return
    if (moving && this.emittedOnce) {
      this.positionsStale = true
      return
    }
    const margin = 8
    const list: VisibleStar[] = []
    const keys: number[] = []
    // The star layer's DOM is its card; the map behind it has no links.
    if (this.target.layer !== 'star') {
      for (let i = 0; i < this.stars.length; i += 1) {
        const x = this.x[i]
        const y = this.y[i]
        if (x < -margin || y < -margin || x > this.viewport.width + margin || y > this.viewport.height + margin) continue
        list.push({ index: i, x, y })
        keys.push(i)
      }
    }
    const key = keys.join(',')
    if (this.emittedOnce && key === this.visibleKey && !this.positionsStale) return
    this.emittedOnce = true
    this.visibleKey = key
    this.positionsStale = false
    listener(list, this.glyphSize)
  }
}
