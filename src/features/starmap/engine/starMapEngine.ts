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
 *
 * One sky is a ring (#120): the view's `cx` runs on round it without bound,
 * and every frame places each galaxy at its copy nearest the centre of the
 * view (see `view/sky.ts`). Screen positions -- `x`, `y`, `nebulaX` -- are
 * always those of the drawn copy, so taps, keyboard focus, the parallel DOM
 * and `starOnScreen` never meet a star twice or the wrong copy.
 */
import { nebulaLinks, starLinkIndices } from '@/features/starmap/model/links'
import { LEARNING_STATES, orderedNebulae, orderedStars, type Star, type StarMap } from '@/features/starmap/model/starMap'
import { breathAt, easeStandard, motionPolicy, type MotionPolicy } from '@/features/starmap/motion/motionPolicy'
import type { SceneData, SceneFrame, StarMapRenderer, StarMapTheme } from '@/features/starmap/render/types'
import {
  baseScale,
  clampView,
  nearestCopy,
  overviewView,
  panBy,
  transformOf,
  type Bounds,
  type View,
  type Viewport,
} from '@/features/starmap/view/camera'
import { DRAW_THRESHOLD, FOVEATE_ABOVE, focusBand, sharpnessOf } from '@/features/starmap/view/foveation'
import { cloudSpacing, mapBounds, nebulaDiscs, typicalSpacing, type NebulaDisc } from '@/features/starmap/view/geometry'
import {
  galaxyAt,
  galaxyReach,
  galaxyTurns,
  galaxyView,
  NOT_ENROLLED_DIM,
  ringSafeZoom,
  SKY_WRAP,
  skyBounds,
  skyGalaxies,
  type SkyGalaxy,
} from '@/features/starmap/view/sky'
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
  /** The clock the frame timestamps come from; `performance.now` for animation frames. */
  now?: () => number
}

export const animationFrameScheduler: FrameScheduler = {
  request: (callback) => requestAnimationFrame(callback),
  cancel: (handle) => cancelAnimationFrame(handle),
  now: () => performance.now(),
}

/** A star on screen now, for the parallel DOM. `index` is its keyboard position. */
export type VisibleStar = { index: number; x: number; y: number }

/** A nebula's disc on screen now, CSS px, for placing its link's focus indicator. */
export type NebulaDiscOnScreen = { x: number; y: number; r: number }

/** Where one star is drawn in the last frame, CSS px, and the glyph size (#51's lighting layer). */
export type StarOnScreen = { x: number; y: number; size: number }

export type StarMapEngineOptions = {
  renderer: StarMapRenderer
  theme: StarMapTheme
  reducedMotion: boolean
  /**
   * Foveated rendering, on unless set false. Off draws every nebula star by
   * star, which only the phone bench asks for (#44), to see what it saves.
   */
  foveate?: boolean
  /**
   * One sky (#119): the map holds every galaxy along a band; the whole-map
   * layer is a window on the galaxy in focus, nebulae are drawn as clouds,
   * and a portrait screen sees a narrower window instead of a turned map.
   */
  galaxy?: boolean
  /** At rest on the whole-map layer, the galaxy at the centre of the view changed (the header follows it). */
  onCentreGalaxy?: (subjectId: string) => void
  scheduler?: FrameScheduler
  now?: () => number
  /** The student asked for another layer: a tap, a pinch, the wheel. */
  onRequestTarget?: (target: LayerTarget) => void
  /** The stars on screen changed, and how big they are drawn; sent when the map is at rest. */
  onVisibleChange?: (stars: VisibleStar[], glyphSize: number, nebulae: NebulaDiscOnScreen[]) => void
  /** The first frame with the map on it has been drawn. */
  onFirstFrame?: () => void
}

type Transition =
  | { kind: 'zoom'; startedAt: number; durationMs: number; flight: (t: number) => View; from: MapLayer; to: MapLayer }
  | { kind: 'crossfade'; startedAt: number; durationMs: number; from: MapLayer; to: MapLayer }

type Pointer = { x: number; y: number }

/** A star's box, CSS px: a little over half the gap to its neighbours, 9 to 40. */
export function glyphSizeFor(scale: number, spacing: number): number {
  return Math.max(9, Math.min(40, scale * spacing * 0.55))
}

/**
 * Dots on the whole map, glyphs zoomed in: a full glyph per star packs a
 * dense nebula solid, so below 18 px stars are dots, from 26 px glyphs.
 */
export function dotBlendFor(glyphSize: number): number {
  return Math.max(0, Math.min(1, (26 - glyphSize) / 8))
}

export type Orientation = 'landscape' | 'portrait'

export function orientationFor(width: number, height: number): Orientation {
  return height > width * 1.15 ? 'portrait' : 'landscape'
}

/**
 * The map for a viewport. The layout is landscape; on a portrait screen it is
 * turned a quarter clockwise, (x, y) -> (1 - y, x), which keeps it inside
 * [0, 1] and keeps it the same map every time.
 */
export function orient(map: StarMap, orientation: Orientation): StarMap {
  if (orientation === 'landscape') return map
  return { ...map, stars: map.stars.map((star) => ({ ...star, x: 1 - star.y, y: star.x })) }
}

/** A short fingerprint of where the stars are, so tiles of one layout are never reused for another. */
function layoutChecksum(map: StarMap): string {
  let sum = 0
  for (const star of map.stars) sum = (sum * 31 + Math.round(star.x * 1e5) * 7 + Math.round(star.y * 1e5)) % 2147483647
  return sum.toString(36)
}

/** How strongly nebula names are drawn in each layer: dimmer around a chosen nebula, gone behind a star's card. */
export const NEBULA_LABEL_ALPHA: Record<MapLayer, number> = { map: 1, nebula: 0.8, star: 0 }

const TAP_SLOP = 5
const WHEEL_STEP = 120
const WHEEL_COOLDOWN_MS = 450
const PINCH_IN = 1.25
const PINCH_OUT = 0.8
const STAR_LAYER_DIM = 0.35
/** The glyph size a nebula is opened at, at least (CSS px): full glyphs, not dots. */
const NEBULA_GLYPH = 28
/** A flight to another galaxy lasts this many layer changes. */
const GALAXY_FLIGHT = 1.8

export class StarMapEngine {
  private readonly renderer: StarMapRenderer
  private readonly scheduler: FrameScheduler
  private readonly now: () => number
  private readonly options: StarMapEngineOptions
  private readonly inertia: Inertia = createInertia()
  private readonly foveate: boolean

  private policy: MotionPolicy
  /** The map as the read model sent it, and as drawn (turned for a portrait viewport). */
  private source: StarMap | null = null
  private orientation: Orientation = 'landscape'
  private map: StarMap | null = null
  private stars: Star[] = []
  private nebulaIndex = new Map<string, number>()
  private nebulaIds: string[] = []
  private discs = new Map<string, NebulaDisc>()
  /** The recommended star of each subject (one sky has one per subject the student takes). */
  private recommendedBy = new Map<string, number>()
  private bounds: Bounds = { minX: 0, minY: 0, maxX: 1, maxY: 1 }
  private spacing = 0.05
  /** The even-spread spacing, which sizes the dots of the whole map (1.15 to 2.1 px, #110). */
  private dotSpacing = 0.05
  /** One sky: the option is on and the map says which galaxy each nebula is in. */
  private sky = false
  private skyGalaxies: SkyGalaxy[] = []
  /** The galaxy the header names: the route's, then whichever is at the centre of the view at rest. */
  private centred = ''
  private scene: SceneData | null = null
  /** The ring's circumference (one sky of two galaxies or more), else 0: nothing wraps. */
  private wrap = 0
  /** The widest reach of any galaxy from its middle, map units (sets the least zoom on the ring). */
  private ringReach = 0
  /** Each nebula's galaxy index, or -1. */
  private nebulaGalaxy = new Int16Array(0)
  /** Turns of the ring added to each galaxy this frame, times `wrap`: map units, for the renderer. */
  private galaxyShift = new Float64Array(0)

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
  private focusNebula = -1
  private hoveredNebula = -1

  private visibleKey = ''
  private emittedOnce = false
  private positionsStale = false

  constructor(options: StarMapEngineOptions) {
    this.options = options
    this.renderer = options.renderer
    this.foveate = options.foveate ?? true
    this.scheduler = options.scheduler ?? animationFrameScheduler
    // Transitions start on this clock and frames arrive on the scheduler's:
    // they must be one clock, or a flight never gets past its first frame.
    this.now = options.now ?? this.scheduler.now ?? (() => performance.now())
    this.policy = motionPolicy(options.reducedMotion)
    this.renderer.setTheme(options.theme)
  }

  // ---- inputs from React ------------------------------------------------

  setData(map: StarMap, target: LayerTarget): void {
    const previous = this.source
    this.source = map
    // The same sky with another galaxy in focus (the switcher, or the header
    // following a pan): keep everything drawn, and fly there if the view is
    // not already on it.
    if (
      this.sky &&
      this.map &&
      previous &&
      previous.stars === map.stars &&
      previous.nebulae === map.nebulae &&
      previous.prerequisites === map.prerequisites
    ) {
      this.map = map
      const switched = map.subject.subjectId !== this.centred
      if (this.drewFirstFrame && target.layer === 'map' && this.target.layer === 'map' && switched) {
        this.cancelGestures()
        // A longer flight than a layer change: the sky passes by on the way.
        this.panTo(this.viewFor(target), this.policy.layerMs * GALAXY_FLIGHT)
        this.centred = map.subject.subjectId
      }
      this.invalidate()
      return
    }
    // New data for the same layer (a star lit, say) keeps the view where it is.
    this.load(target, this.drewFirstFrame && sameTarget(target, this.target))
  }

  /** The galaxies along the band (one sky only), left to right. */
  get galaxies(): readonly SkyGalaxy[] {
    return this.skyGalaxies
  }

  private load(target: LayerTarget, keepView: boolean): void {
    const source = this.source
    if (!source) return
    const sky = this.options.galaxy === true && source.nebulae.some((nebula) => nebula.subjectId !== undefined)
    this.sky = sky
    // One sky is never turned: a portrait screen sees a narrower window of the same band.
    const map = sky ? source : orient(source, this.orientation)
    this.map = map
    this.stars = orderedStars(map)
    const nebulae = orderedNebulae(map).filter((nebula) => map.stars.some((star) => star.nebulaId === nebula.topicId))
    this.nebulaIds = nebulae.map((nebula) => nebula.topicId)
    this.nebulaIndex = new Map(this.nebulaIds.map((id, index) => [id, index]))
    this.discs = nebulaDiscs(map)
    this.skyGalaxies = sky ? skyGalaxies(map) : []
    this.bounds = sky && map.stars.length ? skyBounds(this.skyGalaxies) : mapBounds(this.discs)
    this.dotSpacing = typicalSpacing(map, this.discs)
    this.spacing = sky ? cloudSpacing(map, this.discs) : this.dotSpacing
    this.centred = map.subject.subjectId
    const galaxyIndex = new Map(this.skyGalaxies.map((galaxy, index) => [galaxy.subjectId, index]))
    this.nebulaGalaxy = Int16Array.from(nebulae, (nebula) => galaxyIndex.get(nebula.subjectId ?? '') ?? -1)
    this.galaxyShift = new Float64Array(this.skyGalaxies.length)
    this.ringReach = Math.max(
      0,
      ...this.skyGalaxies.map((galaxy) =>
        galaxyReach(galaxy, nebulae.flatMap((nebula) => (nebula.subjectId === galaxy.subjectId ? [this.discs.get(nebula.topicId)!] : []))),
      ),
    )
    // A ring needs room: with a single galaxy (or one wider than half the
    // band) its two copies would show at once, so such a sky stays a strip.
    this.wrap = sky && this.skyGalaxies.length >= 2 && this.ringReach < SKY_WRAP / 2 ? SKY_WRAP : 0

    const count = this.stars.length
    this.recommendedBy = new Map()
    const starIndex = new Map(this.stars.map((star, i) => [star.unitId, i]))
    const scene: SceneData = {
      mapKey: sky ? `sky:${count}:${layoutChecksum(map)}` : `${map.subject.subjectId}:${this.orientation}:${count}:${layoutChecksum(map)}`,
      count,
      galaxy: sky,
      galaxies: this.skyGalaxies.map((galaxy) => ({
        subjectId: galaxy.subjectId,
        name: galaxy.name,
        x0: galaxy.x0,
        x1: galaxy.x1,
        y0: galaxy.y0,
        y1: galaxy.y1,
        tint: galaxy.tint,
        dim: galaxy.enrolled ? 1 : NOT_ENROLLED_DIM,
        nebulae: nebulae.flatMap((nebula, n) => (nebula.subjectId === galaxy.subjectId ? [n] : [])),
      })),
      mapX: new Float32Array(count),
      mapY: new Float32Array(count),
      state: new Uint8Array(count),
      progress: new Float32Array(count),
      reviewDue: new Uint8Array(count),
      recommended: -1,
      recommendations: [],
      nebula: new Uint16Array(count),
      names: this.stars.map((star) => star.name),
      skills: this.stars.map((star) => star.skills.map((skill) => skill.lit)),
      nebulae: nebulae.map((nebula) => {
        const disc = this.discs.get(nebula.topicId)!
        const members = map.stars.filter((star) => star.nebulaId === nebula.topicId)
        return {
          topicId: nebula.topicId,
          name: nebula.name,
          x: disc.x,
          y: disc.y,
          r: disc.r,
          lit: members.filter((star) => star.state === 'lit').length,
          total: members.length,
          ...this.nebulaLook(nebula.topicId, galaxyIndex.get(nebula.subjectId ?? '')),
        }
      }),
      links: nebulaLinks(map)
        .map((link) => ({ a: this.nebulaIndex.get(link.a) ?? -1, b: this.nebulaIndex.get(link.b) ?? -1, count: link.count }))
        .filter((link) => link.a >= 0 && link.b >= 0),
      starLinks: starLinkIndices(map, starIndex),
    }
    this.stars.forEach((star, i) => {
      scene.mapX[i] = star.x
      scene.mapY[i] = star.y
      scene.state[i] = Math.max(0, LEARNING_STATES.indexOf(star.state))
      scene.progress[i] = star.progress
      scene.reviewDue[i] = star.reviewDue > 0 ? 1 : 0
      scene.nebula[i] = this.nebulaIndex.get(star.nebulaId) ?? 0
      if (star.recommendation) {
        ;(scene.recommendations as number[]).push(i)
        const subject = map.nebulae.find((nebula) => nebula.topicId === star.nebulaId)?.subjectId ?? map.subject.subjectId
        if (!this.recommendedBy.has(subject)) this.recommendedBy.set(subject, i)
      }
    })
    scene.recommended = this.recommendedBy.get(map.subject.subjectId) ?? scene.recommendations?.[0] ?? -1
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

    this.target = target
    if (!keepView) this.view = this.viewFor(target)
    this.transition = null
    this.invalidate()
  }

  /**
   * A nebula's own tint, near its galaxy's (#117 B2: each its own shade
   * between blue-violet and warm gold, never a rainbow), and its dimming.
   */
  private nebulaLook(topicId: string, galaxy: number | undefined): { tint: number; dim: number } {
    if (galaxy === undefined) return { tint: 0.3, dim: 1 }
    let hash = 2166136261
    for (let i = 0; i < topicId.length; i += 1) hash = Math.imul(hash ^ topicId.charCodeAt(i), 16777619) >>> 0
    const jitter = ((hash % 1000) / 1000 - 0.5) * 0.3
    const owner = this.skyGalaxies[galaxy]
    return { tint: Math.max(0, Math.min(1, owner.tint + jitter)), dim: owner.enrolled ? 1 : NOT_ENROLLED_DIM }
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
  setViewport(width: number, height: number, dpr: number, bands: { top?: number; bottom?: number } = {}): void {
    const changed =
      width !== this.viewport.width ||
      height !== this.viewport.height ||
      bands.top !== this.viewport.top ||
      bands.bottom !== this.viewport.bottom
    this.viewport = { width, height, top: bands.top, bottom: bands.bottom }
    this.renderer.resize(this.viewport, dpr)
    // A portrait page area gets the map turned a quarter, so it fills the screen.
    const orientation = orientationFor(width, height)
    if (orientation !== this.orientation) {
      this.orientation = orientation
      if (this.source && !this.sky) this.load(this.target, false)
    }
    if (changed && this.map && !this.transition) this.view = this.viewFor(this.target)
    this.positionsStale = true
    this.invalidate()
  }

  setReducedMotion(reduced: boolean): void {
    this.policy = motionPolicy(reduced)
    if (!this.policy.inertia) this.inertia.stop()
    if (this.transition?.kind === 'zoom' && reduced) {
      this.view = this.ringSafe(this.transition.flight(1))
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

  /**
   * Keyboard focus moved onto a nebula's link (or off, with -1). The nebula
   * is picked out on the canvas and drawn sharp; if it is not already in the
   * focus region, the map pans to put it there (a crossfade under reduced
   * motion), so neither the nebula nor its link's focus indicator sits under
   * the page's controls (WCAG 2.4.11).
   */
  setFocusNebula(index: number): void {
    if (index === this.focusNebula) return
    this.focusNebula = index
    if (index >= 0 && this.scene && this.target.layer !== 'star' && this.viewport.width > 0) {
      const nebula = this.scene.nebulae[index]
      const t = transformOf(this.view, this.viewport, this.bounds)
      // On the ring, the copy nearest the view: the shorter way round.
      const x = nearestCopy(nebula.x, this.view.cx, this.wrap)
      const sx = t.ox + x * t.scale
      const sy = t.oy + nebula.y * t.scale
      const fx = this.viewport.width * this.view.fx
      const fy = this.viewport.height * this.view.fy
      const band = focusBand(this.viewport.width, this.viewport.height)
      if (Math.hypot(sx - fx, sy - fy) > band.inner) {
        const to = clampView({ ...this.view, cx: x, cy: nebula.y }, this.bounds, this.wrap)
        this.panTo(to)
      }
    }
    this.invalidate()
  }

  /** Move the view without changing layer: a short flight, or a crossfade under reduced motion. */
  private panTo(to: View, flightMs = this.policy.layerMs): void {
    this.inertia.stop()
    const layer = this.target.layer
    const now = this.now()
    if (!this.drewFirstFrame || this.policy.layerTransition === 'crossfade') {
      if (this.drewFirstFrame) {
        this.renderer.snapshot()
        this.transition = { kind: 'crossfade', startedAt: now, durationMs: this.policy.layerMs, from: layer, to: layer }
      }
      this.view = to
    } else {
      const flight = interpolateView(this.view, to, Math.min(this.viewport.width, this.viewport.height), baseScale(this.viewport, this.bounds))
      this.transition = { kind: 'zoom', startedAt: now, durationMs: flightMs, flight, from: layer, to: layer }
    }
    this.positionsStale = true
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
    this.view = panBy(this.view, dx, dy, this.viewport, this.bounds, this.wrap)
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

  /** Where `unitId`'s star was drawn in the last frame; null before one, or for a star not on this map (#51). */
  starOnScreen(unitId: string): StarOnScreen | null {
    const index = this.drewFirstFrame ? this.stars.findIndex((star) => star.unitId === unitId) : -1
    return index < 0 ? null : { x: this.x[index], y: this.y[index], size: this.glyphSize }
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
    if (!this.map || this.viewport.width === 0) return overviewView(this.bounds, this.viewport)
    if (target.layer === 'map' && this.skyGalaxies.length > 0) {
      const galaxy = this.skyGalaxies.find((candidate) => candidate.subjectId === this.map!.subject.subjectId) ?? this.skyGalaxies[0]
      return this.onRing(galaxyView(galaxy, this.skyGalaxies, this.bounds, this.viewport))
    }
    const view = viewForTarget(target, this.map, this.discs, this.bounds, this.viewport)
    if (!this.sky || target.layer === 'map') return view
    // A cloud's rim reaches far past its core: zoom in until its stars are full
    // glyphs, so the four learning states can be told apart (#117).
    const glyphK = NEBULA_GLYPH / (0.55 * baseScale(this.viewport, this.bounds) * this.spacing)
    return this.onRing({ ...view, k: Math.min(60, Math.max(view.k, target.layer === 'star' ? glyphK * 1.5 : glyphK)) })
  }

  /**
   * A view on the ring: at the copy of its centre nearest the current view
   * (so a flight takes the shorter way round), and zoomed in at least far
   * enough that no galaxy is ever on screen twice (`ringSafeZoom`).
   */
  private onRing(view: View): View {
    if (this.wrap <= 0) return view
    return this.ringSafe({ ...view, cx: nearestCopy(view.cx, this.view.cx, this.wrap) })
  }

  private ringSafe(view: View): View {
    if (this.wrap <= 0) return view
    const least = ringSafeZoom(this.ringReach, this.wrap, this.viewport, this.bounds, view.fx)
    return view.k >= least ? view : { ...view, k: least }
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
    if (this.sky) return this.nearestStar(x, y, nearest ? Infinity : 28)?.nebulaId ?? null
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

  hoverAt(x: number | null, y = 0) {
    const id = x === null ? null : this.nebulaAt(x, y)
    const next = id ? this.nebulaIndex.get(id) ?? -1 : -1
    if (next === this.hoveredNebula) return
    this.hoveredNebula = next
    this.invalidate()
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
        // A long flight pulls back, but never so far that the ring shows a galaxy twice.
        this.view = this.ringSafe(this.transition.flight(easeStandard(t)))
        // The flight's last frame is a frame at rest: the parallel DOM (and a
        // focused nebula's name pill) must get these final positions now,
        // since nothing else may ask for another frame.
        moving = t < 1
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
        this.view = panBy(this.view, step[0], step[1], this.viewport, this.bounds, this.wrap)
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
      target.layer === 'map'
        ? this.focusNebula >= 0
          ? this.focusNebula
          : this.focusStar >= 0
            ? scene.nebula[this.focusStar]
            : -1
        : (this.nebulaIndex.get(target.nebulaId) ?? -1)
    // On the ring, each galaxy at its copy nearest the centre of the view.
    const shift = this.galaxyShift
    if (this.wrap > 0) {
      galaxyTurns(this.skyGalaxies, this.view.cx, this.wrap, shift)
      for (let g = 0; g < shift.length; g += 1) shift[g] *= this.wrap
    }
    const shiftOf = (n: number) => (this.wrap > 0 && this.nebulaGalaxy[n] >= 0 ? shift[this.nebulaGalaxy[n]] : 0)
    for (let n = 0; n < scene.nebulae.length; n += 1) {
      const nebula = scene.nebulae[n]
      this.nebulaX[n] = t.ox + (nebula.x + shiftOf(n)) * t.scale
      this.nebulaY[n] = t.oy + nebula.y * t.scale
      this.nebulaR[n] = nebula.r * t.scale
      this.sharpness[n] =
        !this.foveate || scene.count <= FOVEATE_ABOVE ? 1 : sharpnessOf(this.nebulaX[n], this.nebulaY[n], this.nebulaR[n], focusX, focusY, band, n === chosen)
    }
    for (let i = 0; i < scene.count; i += 1) {
      this.x[i] = t.ox + (scene.mapX[i] + shiftOf(scene.nebula[i])) * t.scale
      this.y[i] = t.oy + scene.mapY[i] * t.scale
      this.starAlpha[i] = this.sharpness[scene.nebula[i]]
    }
    // The one exception: the recommended star is the student's way in, so it
    // is drawn, and breathes, even inside a blurred nebula -- one sprite.
    for (const i of scene.recommendations ?? []) this.starAlpha[i] = 1

    // Only the recommended star breathes (#72 point 6), and only when seen sharp.
    let breath: SceneFrame['breath'] = null
    // On one sky, the recommended star of the galaxy the header names.
    const rec = this.recommendedBy.get(this.centred) ?? scene.recommended
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
    const atRest = !moving && !this.transition && !(this.inertia.moving && this.policy.inertia && !this.paused)
    // At rest on the whole sky: the header names whichever galaxy is at the centre.
    if (atRest && target.layer === 'map' && this.skyGalaxies.length > 0) {
      const centre = galaxyAt(this.skyGalaxies, this.view.cx, this.wrap)
      if (centre && centre.subjectId !== this.centred) {
        this.centred = centre.subjectId
        this.options.onCentreGalaxy?.(centre.subjectId)
      }
    }
    // At rest, bring the view back to the first turn of the ring: nothing on
    // screen moves (every galaxy turns with it), the numbers just stay small.
    if (atRest && this.wrap > 0 && (this.view.cx < 0 || this.view.cx >= this.wrap)) {
      this.view = { ...this.view, cx: this.view.cx - Math.floor(this.view.cx / this.wrap) * this.wrap }
    }
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
    const nebulaLabels = (layer: MapLayer) => NEBULA_LABEL_ALPHA[layer]
    const dimOf = (layer: MapLayer) => (layer === 'star' ? STAR_LAYER_DIM : 1)
    const target = this.target
    const focusStar =
      target.layer === 'star' ? this.stars.findIndex((star) => star.unitId === target.unitId) : this.focusStar
    const glyphSize = glyphSizeFor(t.scale, this.spacing)
    return {
      dotBlend: lerp(from === 'map' ? 1 : dotBlendFor(glyphSize), to === 'map' ? 1 : dotBlendFor(glyphSize)),
      dotRadius: Math.max(1.15, Math.min(2.1, t.scale * this.dotSpacing * 0.11)),
      viewport: this.viewport,
      scale: t.scale,
      ox: t.ox,
      oy: t.oy,
      x: this.x,
      y: this.y,
      galaxyShift: this.wrap > 0 ? this.galaxyShift : undefined,
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
      starLayer: lerp(from === 'star' ? 1 : 0, to === 'star' ? 1 : 0),
      chosenNebula: chosen,
      focusStar,
      hoveredNebula: this.hoveredNebula,
      highlightNebula: target.layer === 'star' ? -1 : this.focusNebula,
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
    const nebulae: NebulaDiscOnScreen[] = []
    for (let n = 0; n < this.nebulaX.length; n += 1) nebulae.push({ x: this.nebulaX[n], y: this.nebulaY[n], r: this.nebulaR[n] })
    listener(list, this.glyphSize, nebulae)
  }
}
