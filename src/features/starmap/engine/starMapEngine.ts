/*
 * The star map's engine (#47, #72): one object that owns the camera, what is
 * chosen, gestures, the glides after a pan or a zoom, foveation and the one
 * breathing star, and hands each frame to a renderer. React never renders per
 * frame; it tells the engine what the route has chosen and gets back the
 * stars on screen, for the parallel DOM, when the map comes to rest.
 *
 * Semantic zoom (#134): the zoom is continuous. The wheel and a trackpad zoom
 * by how far they scroll, around the pointer; a pinch around the midpoint of
 * the two fingers, with a glide after it is let go; the + and - buttons and
 * keys by ×1.5, a double tap by ×2, each gliding there. Nothing snaps: what
 * the map shows -- names, lines, dimming -- is a continuous function of the
 * zoom (`view/semanticZoom.ts`). The route follows what is chosen, never the
 * zoom: a tap on a nebula or a star asks for its route and flies there; the
 * engine only asks for a route by itself to let a choice go, when zoomed out
 * past it (a star's card closes once its glyph is too small to read, a
 * nebula is let go back on the panorama).
 *
 * The engine asks for animation frames only while something moves: a pan, a
 * glide, a flight, a name fading, or the recommended star breathing. A still
 * map under reduced motion, or while the map is paused (hidden tab, `inert`
 * page area), asks for none.
 *
 * One sky is a ring (#120): the view's `cx` runs on round it without bound,
 * and every frame places each galaxy at its copy nearest the centre of the
 * view (see `view/sky.ts`). Screen positions -- `x`, `y`, `nebulaX` -- are
 * always those of the drawn copy, so taps, keyboard focus, the parallel DOM
 * and `starOnScreen` never meet a star twice or the wrong copy.
 *
 * A star can be dragged (#136): pressed with a mouse once stars are big
 * enough to pick one by one, or held for `DRAG.longPressMs` on a touch
 * screen. It follows the hand; the stars linked to it are pulled after it by
 * springs and everything springs back when it is let go (`view/starDrag.ts`).
 * The displacements are added to the screen positions each frame and never
 * to the layout. A press on empty space, or a swipe before the hold, still
 * pans; a drag is never a tap.
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
  panoramaZoom,
  ringSafeZoom,
  SKY_WRAP,
  skyBounds,
  skyGalaxies,
  type SkyGalaxy,
} from '@/features/starmap/view/sky'
import { createInertia, type Inertia } from '@/features/starmap/view/inertia'
import { createStarDrag, linkedStars, stepStarDrag, type StarDrag } from '@/features/starmap/view/starDrag'
import { shortestDx } from '@/features/starmap/render/links'
import { interpolateView, sameTarget, viewForTarget, wholeNebulaView, type LayerTarget } from '@/features/starmap/view/layers'
import {
  anchorAt,
  kForGlyph,
  lineReveal,
  nebulaNameAlpha,
  ramp,
  REVEAL,
  skillAlpha,
  starFocusAmount,
  starNameAlpha,
  starNameReach,
  restStarNameAlpha,
  starPxFor,
  DRAG,
  ZOOM,
  zoomAround,
  zoomBand,
  type ZoomBand,
} from '@/features/starmap/view/semanticZoom'

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

/**
 * How far in the map is (#134): the glyph size every reveal reads, its rough
 * band, whether a limit is reached, and whether stars can be picked one by
 * one (a tap, a Tab stop): big enough, and no longer the panorama's dots.
 */
export type ZoomState = { starPx: number; band: ZoomBand; atMin: boolean; atMax: boolean; pickable: boolean }

/**
 * How the camera answers a new choice: `fly` there (a tap on a nebula or a
 * star, a link, the keys), or `stay` where it is (a choice let go: the card
 * closed, zoomed out past it).
 */
export type ChoiceMotion = 'fly' | 'stay'

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
   * One sky (#119): the map holds every galaxy along a band; the panorama is
   * a window on the galaxy in focus, nebulae are drawn as clouds, and a
   * portrait screen sees a narrower window instead of a turned map.
   */
  galaxy?: boolean
  /** At rest with nothing chosen, the galaxy at the centre of the view changed (the header follows it). */
  onCentreGalaxy?: (subjectId: string) => void
  scheduler?: FrameScheduler
  now?: () => number
  /** The student chose something, or let a choice go: a tap, a tap on empty space, zooming out past it. */
  onRequestTarget?: (target: LayerTarget) => void
  /** The stars on screen changed, how big they are drawn, and how far in the map is; sent when the map is at rest. */
  onVisibleChange?: (stars: VisibleStar[], glyphSize: number, nebulae: NebulaDiscOnScreen[], zoom: ZoomState) => void
  /** The first frame with the map on it has been drawn. */
  onFirstFrame?: () => void
}

type Transition =
  | { kind: 'zoom'; startedAt: number; durationMs: number; flight: (t: number) => View }
  | { kind: 'crossfade'; startedAt: number; durationMs: number }

type Pointer = { x: number; y: number }

/** What a pointer is: a mouse (or pen) grabs a star by pressing and moving; a finger by holding first (#136). */
export type PointerKind = 'mouse' | 'touch' | 'pen'

/** A star's box, CSS px: a little over half the gap to its neighbours, 9 to 40. */
export function glyphSizeFor(scale: number, spacing: number): number {
  return Math.max(9, Math.min(40, starPxFor(scale, spacing)))
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

/**
 * What makes two maps one sky (#123): the same galaxies, nebulae and stars at
 * the same places. Learning states, names and prerequisites may differ (a
 * star lit); the array objects may too -- the backend, a star-count tier or
 * the preview's override hands over a new map on every render.
 */
const skyKeys = new WeakMap<StarMap, string>()
export function skyLayoutKey(map: StarMap): string {
  const known = skyKeys.get(map)
  if (known !== undefined) return known
  let sum = 0
  const mix = (value: string) => {
    for (let i = 0; i < value.length; i += 1) sum = (Math.imul(sum, 31) + value.charCodeAt(i)) | 0
  }
  for (const nebula of map.nebulae) mix(`${nebula.topicId}@${nebula.subjectId ?? ''};`)
  for (const star of map.stars) mix(`${star.unitId}@${star.nebulaId}:${Math.round(star.x * 1e5)},${Math.round(star.y * 1e5)};`)
  const key = `${map.nebulae.length}:${map.stars.length}:${(sum >>> 0).toString(36)}`
  skyKeys.set(map, key)
  return key
}

/** A nebula's name at full strength: the alpha its contrast is checked at (names fade in to it, #134). */
export const NEBULA_NAME_ALPHA = 1

const TAP_SLOP = 5
/** Behind a chosen star, zoomed in to it, the rest of the map fades to this. */
const STAR_FOCUS_DIM = 0.35
/** A flight to another galaxy lasts this many layer changes. */
const GALAXY_FLIGHT = 1.8
/** Choosing or letting go eases the sky's emphasis in or out with this time constant, ms (at once under reduced motion). */
const EMPHASIS_MS = 140
/** A pinch's zoom speed is averaged over this long, ms, so one jittery move does not decide the glide. */
const PINCH_SMOOTHING_MS = 40
/** A pinch held still this long before it is let go glides no further, ms. */
const PINCH_HOLD_MS = 100

/** Whether `next` only lets a choice of `previous` go: back to the galaxy, or the card closed on its own nebula. */
function letsGo(previous: LayerTarget, next: LayerTarget): boolean {
  if (next.layer === 'map') return previous.layer !== 'map'
  return next.layer === 'nebula' && previous.layer === 'star' && previous.nebulaId === next.nebulaId
}

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
  private nebulaNames = new Float32Array(0)
  /** Eased emphasis (#134): each nebula's lift out of the dimming around a chosen one, how far that dimming is in, and a chosen star's. */
  private nebulaLift = new Float32Array(0)
  private chosenAmount = 0
  private starAmount = 0
  /** The star chosen last: while its emphasis eases out after the card closes, it stays the one picked out. */
  private lastChosenStar = -1
  private sharpness = new Float32Array(0)

  private viewport: Viewport = { width: 0, height: 0 }
  private view: View = { cx: 0.5, cy: 0.5, k: 1, fx: 0.5, fy: 0.5 }
  /** What is chosen: the route's galaxy, nebula or star. */
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
  /** Two fingers: the spread and zoom they started at, the map point they hold, and the zoom's speed (log2 per ms). */
  private pinch: { spread: number; k: number; mx: number; my: number; x: number; y: number; at: number; velocity: number; ended: boolean } | null = null
  /** A zoom still to come (log2 of k), around a screen point: the wheel's, a button's, a released pinch's glide. */
  private zoomGlide: { log: number; x: number; y: number; tauMs: number } | null = null
  private lastTap: { x: number; y: number; at: number; acted: boolean } | null = null
  /**
   * A press on a star that may become a drag of it (#136): `dragging` once it
   * has (the mouse moved past the tap slop, a finger held still long enough).
   * `(hx, hy)`: where the hand is; `(ax, ay)`: where it holds the star, from
   * the star's centre -- each frame the star is put there, so it stays under
   * the hand through a zoom too.
   */
  private grab: { id: number; star: number; kind: PointerKind; at: number; dragging: boolean; hx: number; hy: number; ax: number; ay: number } | null = null
  /** The star being dragged, or springing back after it was let go. */
  private drag: StarDrag | null = null
  /** Every star's displacement by the drag this frame, px (0 for most), and the grabbed star and its linked stars. */
  private dragX = new Float32Array(0)
  private dragY = new Float32Array(0)
  private dragRelated = new Uint8Array(0)
  /** The choice the engine itself asked for last, and how the camera should answer it when the route brings it. */
  private requested: { target: LayerTarget; motion: ChoiceMotion } | null = null
  /** A choice already let go by zooming out (asked once, until the route answers). */
  private released = ''
  private focusStar = -1
  private focusNebula = -1
  private hoveredNebula = -1
  /** The star under the mouse, where single stars can be picked (#138 B2: its name shows), or -1. */
  private hoveredStar = -1

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
    // following a pan): keep the camera, and fly there if the view is not
    // already on it. One sky is decided by its layout, never by whether the
    // arrays are the same objects (#123): a new but equal map is the same sky.
    if (this.sky && this.map && previous && skyLayoutKey(previous) === skyLayoutKey(map)) {
      const centred = this.centred
      if (previous.stars === map.stars && previous.nebulae === map.nebulae && previous.prerequisites === map.prerequisites) {
        this.map = map
      } else {
        // States, names or lines may have changed: draw them, but keep the view and any flight.
        this.load(this.target, true, true)
        this.centred = centred
      }
      if (target.layer !== 'map') {
        // A nebula or star lives under its own galaxy's route: the header names that galaxy now.
        this.centred = map.subject.subjectId
      } else if (this.drewFirstFrame && map.subject.subjectId !== this.centred) {
        // The switcher: a longer flight than a choice, the sky passes by on the way.
        this.cancelGestures()
        this.target = target
        this.released = ''
        this.panTo(this.viewFor(target), this.policy.layerMs * GALAXY_FLIGHT)
        this.centred = map.subject.subjectId
      }
      this.invalidate()
      return
    }
    // New data for the same choice (a star lit, say) keeps the view where it is.
    const keepView = this.drewFirstFrame && sameTarget(target, this.target)
    // Another sky with another galaxy in focus (#123: a link that drops
    // `?points=`, an answer of another size): keeping the view would leave it
    // on the old galaxy, and at rest the route would be put back there. Fly.
    const refocus = keepView && this.sky && target.layer === 'map' && map.subject.subjectId !== this.centred
    this.load(target, keepView)
    if (refocus && this.sky && this.viewport.width > 0) {
      this.cancelGestures()
      this.panTo(this.viewFor(target), this.policy.layerMs * GALAXY_FLIGHT)
      this.invalidate()
    }
  }

  /** The galaxies along the band (one sky only), left to right. */
  get galaxies(): readonly SkyGalaxy[] {
    return this.skyGalaxies
  }

  private load(target: LayerTarget, keepView: boolean, keepTransition = false): void {
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
    // Another sky: a drag of the old one's star is over.
    this.grab = null
    this.drag = null
    this.dragX = new Float32Array(count)
    this.dragY = new Float32Array(count)
    this.dragRelated = new Uint8Array(count)
    const nebulaCount = nebulae.length
    this.nebulaX = new Float32Array(nebulaCount)
    this.nebulaY = new Float32Array(nebulaCount)
    this.nebulaR = new Float32Array(nebulaCount)
    this.nebulaNames = new Float32Array(nebulaCount)
    this.nebulaLift = new Float32Array(nebulaCount)
    this.sharpness = new Float32Array(nebulaCount)
    this.renderer.setData(scene)
    this.visibleKey = ''
    this.emittedOnce = false

    this.target = target
    if (!keepView) this.view = this.viewFor(target)
    if (!keepTransition) this.transition = null
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

  /**
   * The route chose something else (#134 Z2). A new nebula or star: fly to
   * it (a crossfade under reduced motion), never zooming out to open a star.
   * A choice let go -- the card closed, back to the galaxy -- leaves the
   * camera where it is. The engine's own requests say which they are.
   */
  setTarget(target: LayerTarget): void {
    if (!this.map || sameTarget(target, this.target)) return
    const previous = this.target
    this.target = target
    this.released = ''
    const asked = this.requested && sameTarget(this.requested.target, target) ? this.requested.motion : null
    this.requested = null
    const motion: ChoiceMotion = asked ?? (letsGo(previous, target) ? 'stay' : 'fly')
    if (!this.drewFirstFrame || this.viewport.width === 0) {
      this.view = this.viewFor(target)
      this.transition = null
    } else if (motion === 'fly') {
      this.cancelGestures()
      let to = this.viewFor(target)
      // A star opens at least as close as the map already is.
      if (target.layer === 'star') to = this.limit({ ...to, k: Math.max(to.k, this.view.k) })
      this.panTo(to, ZOOM.flightMs)
    }
    this.positionsStale = true
    this.invalidate()
  }

  /**
   * The next route change to `target` is answered with `motion` instead of
   * the default (the page's "Map" link flies back out to the galaxy).
   */
  expectTarget(target: LayerTarget, motion: ChoiceMotion): void {
    this.requested = { target, motion }
  }

  /** The page area's size (it narrows when Ask's panel opens, #49): the view keeps its place, within the zoom's limits. */
  setViewport(width: number, height: number, dpr: number, bands: { top?: number; bottom?: number; sheet?: number } = {}): void {
    const changed =
      width !== this.viewport.width ||
      height !== this.viewport.height ||
      bands.top !== this.viewport.top ||
      bands.bottom !== this.viewport.bottom ||
      bands.sheet !== this.viewport.sheet
    this.viewport = { width, height, top: bands.top, bottom: bands.bottom, sheet: bands.sheet }
    this.renderer.resize(this.viewport, dpr)
    // A portrait page area gets the map turned a quarter, so it fills the screen.
    const orientation = orientationFor(width, height)
    if (orientation !== this.orientation) {
      this.orientation = orientation
      if (this.source && !this.sky) this.load(this.target, false)
    }
    if (changed && this.map && !this.transition) {
      this.view = this.drewFirstFrame ? this.limit(this.ringSafe(clampView(this.view, this.bounds, this.wrap))) : this.viewFor(this.target)
    }
    this.positionsStale = true
    this.invalidate()
  }

  setReducedMotion(reduced: boolean): void {
    this.policy = motionPolicy(reduced)
    if (!this.policy.inertia) {
      this.inertia.stop()
      // A zoom on its way arrives at once.
      const glide = this.zoomGlide
      this.zoomGlide = null
      if (glide) this.applyZoom(glide.log, glide.x, glide.y)
    }
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

  /** Move the view: a short flight, or a crossfade under reduced motion. */
  private panTo(to: View, flightMs = this.policy.layerMs): void {
    this.inertia.stop()
    this.zoomGlide = null
    const now = this.now()
    if (!this.drewFirstFrame || this.policy.layerTransition === 'crossfade') {
      if (this.drewFirstFrame) {
        this.renderer.snapshot()
        this.transition = { kind: 'crossfade', startedAt: now, durationMs: this.policy.layerMs }
      }
      this.view = to
    } else {
      const flight = interpolateView(this.view, to, Math.min(this.viewport.width, this.viewport.height), baseScale(this.viewport, this.bounds))
      this.transition = { kind: 'zoom', startedAt: now, durationMs: flightMs, flight }
    }
    this.positionsStale = true
  }

  /**
   * Back to the chosen star after a pan (#132): it returns to its place
   * beside its card, at the zoom the map is at now, the shorter way round the
   * ring. With a nebula or nothing chosen, back to its view. A flight, or a
   * crossfade under reduced motion.
   */
  recentre(): void {
    if (!this.map || this.viewport.width === 0) return
    this.cancelGestures()
    const to = this.viewFor(this.target)
    this.panTo(this.target.layer === 'star' ? this.ringSafe({ ...to, k: this.view.k }) : to)
    this.invalidate()
  }

  // ---- gestures ---------------------------------------------------------

  pointerDown(id: number, x: number, y: number, kind: PointerKind = 'mouse'): void {
    this.pointers.set(id, { x, y })
    this.inertia.stop()
    if (this.pointers.size === 1) {
      this.press = { x, y, at: this.now(), moved: false }
      this.dragging = null
      this.pinch = null
      // On a star big enough to pick: it may become a drag of it (#136).
      const star = this.grabbable(x, y, kind)
      this.grab = star >= 0 ? { id, star, kind, at: this.now(), dragging: false, hx: x, hy: y, ax: 0, ay: 0 } : null
      // A finger is held before it grabs: the frames watch the clock.
      if (this.grab && kind === 'touch') this.invalidate()
    } else if (this.pointers.size === 2) {
      // Two fingers: from now on they zoom and pan together, around their midpoint.
      // A star held by one of them is let go (it springs back).
      this.letGo()
      this.press = null
      this.dragging = null
      this.zoomGlide = null
      if (this.transition?.kind === 'zoom') this.transition = null
      const [a, b] = [...this.pointers.values()]
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
      const t = transformOf(this.view, this.viewport, this.bounds)
      this.pinch = {
        spread: Math.max(1, this.pointerSpread()),
        k: this.view.k,
        mx: (mid.x - t.ox) / t.scale,
        my: (mid.y - t.oy) / t.scale,
        x: mid.x,
        y: mid.y,
        at: this.now(),
        velocity: 0,
        ended: false,
      }
    }
  }

  pointerMove(id: number, x: number, y: number): void {
    const pointer = this.pointers.get(id)
    if (!pointer) return
    pointer.x = x
    pointer.y = y
    const now = this.now()

    if (this.pinch) {
      const pinch = this.pinch
      if (pinch.ended || this.pointers.size < 2 || !this.map) return
      const [a, b] = [...this.pointers.values()]
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
      const { min, max } = this.zoomLimits()
      const before = this.view.k
      const k = Math.max(min, Math.min(max, (pinch.k * this.pointerSpread()) / pinch.spread))
      // The map point the fingers took hold of stays between them: zoom and pan in one.
      this.view = this.ringSafe(anchorAt(this.view, k, pinch.mx, pinch.my, mid.x, mid.y, this.viewport, this.bounds, this.wrap))
      const dt = Math.max(1, now - pinch.at)
      const rate = (Math.log2(this.view.k) - Math.log2(before)) / dt
      pinch.velocity += (rate - pinch.velocity) * (1 - Math.exp(-dt / PINCH_SMOOTHING_MS))
      pinch.at = now
      pinch.x = mid.x
      pinch.y = mid.y
      this.positionsStale = true
      this.afterUserZoom(this.view.k < before)
      this.invalidate()
      return
    }

    if (!this.press) return
    const grab = this.grab
    if (grab && grab.id === id) {
      if (grab.dragging && this.drag) {
        // The grabbed star follows the hand exactly; the springs do the rest each frame.
        grab.hx = x
        grab.hy = y
        this.press.moved = true
        this.invalidate()
        return
      }
      if (Math.hypot(x - this.press.x, y - this.press.y) >= TAP_SLOP) {
        if (grab.kind === 'touch') {
          // A swipe before the hold: the map pans, as always.
          this.grab = null
        } else {
          // A mouse moved off the press: the star is dragged, from where it was pressed.
          this.press.moved = true
          this.startDrag(grab, this.press.x, this.press.y)
          grab.hx = x
          grab.hy = y
          return
        }
      } else {
        return
      }
    }
    if (!this.press.moved && Math.hypot(x - this.press.x, y - this.press.y) < TAP_SLOP) return
    if (!this.press.moved) {
      this.press.moved = true
      // The map pans at every zoom, a chosen star's too (#132): its card
      // stays open wherever the map is dragged, and the star's lines go with
      // it. Only a flight in progress holds the map.
      if (!this.transition) this.dragging = { x: this.press.x, y: this.press.y, at: this.press.at }
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
    const pinch = this.pinch
    this.pointers.delete(id)
    if (pinch) {
      if (!pinch.ended) {
        pinch.ended = true
        // Let go while still pinching: the zoom carries on and slows (none under reduced motion).
        const now = this.now()
        if (this.policy.inertia && !this.paused && now - pinch.at < PINCH_HOLD_MS && Math.abs(pinch.velocity) > ZOOM.pinchRestSpeed) {
          this.glideZoom(pinch.velocity * ZOOM.pinchDecayMs, pinch.x, pinch.y, ZOOM.pinchDecayMs)
        }
      }
      if (this.pointers.size === 0) this.pinch = null
      this.invalidate()
      return
    }
    const press = this.press
    this.press = null
    const grab = this.grab
    this.grab = null
    if (!press) return
    if (grab?.dragging) {
      // A drag of a star is never a tap: let it go, it springs back.
      this.drag!.held = false
      this.invalidate()
      return
    }
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

  /**
   * The cursor over `(x, y)` for a mouse: `grab` over a star that can be
   * dragged, `grabbing` while one is, else '' (the stage's own).
   */
  cursorAt(x: number, y: number): '' | 'grab' | 'grabbing' {
    if (this.grab?.dragging) return 'grabbing'
    return this.pointers.size === 0 && this.grabbable(x, y, 'mouse') >= 0 ? 'grab' : ''
  }

  /** A star is held by the hand now (#136; a touch's long press then must not open a context menu). */
  get holdingStar(): boolean {
    return Boolean(this.grab?.dragging)
  }

  /** A wheel or trackpad scroll of `deltaY` px (< 0 zooms in), around `(x, y)`: as far as it scrolled, at once. */
  wheelBy(deltaY: number, x: number, y: number): void {
    this.zoomBy(-deltaY * ZOOM.wheelPerPx, x, y)
  }

  /** The zoom buttons and keys: ×1.5 in or out around the view's focus point (the chosen star stays put). */
  step(direction: 'in' | 'out'): void {
    const log = Math.log2(ZOOM.buttonStep) * (direction === 'in' ? 1 : -1)
    this.zoomBy(log, this.viewport.width * this.view.fx, this.viewport.height * this.view.fy)
  }

  /**
   * Zoom by `log` (log2 of the factor) around the screen point `(x, y)`: a
   * glide there, or at once under reduced motion. A flight in progress gives
   * way to the hand.
   */
  zoomBy(log: number, x: number, y: number): void {
    if (!this.map || this.viewport.width === 0 || !log) return
    if (this.transition?.kind === 'zoom') this.transition = null
    if (!this.policy.inertia) {
      this.zoomGlide = null
      this.applyZoom(log, x, y)
      this.invalidate()
      return
    }
    this.glideZoom(log, x, y, ZOOM.glideMs)
  }

  // ---- queries ----------------------------------------------------------

  /** What is chosen (the route's): the galaxy, a nebula, a star. */
  get layer(): LayerTarget['layer'] {
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

  /** How far in the map is now (#134). */
  get zoom(): ZoomState {
    const starPx = this.starPx()
    const { min, max } = this.zoomLimits()
    const pickable = starPx >= REVEAL.starsPickableFrom && ramp(this.view.k / min, REVEAL.dotsPastPanorama) >= 0.5
    return { starPx, band: zoomBand(starPx), atMin: this.view.k <= min * 1.001, atMax: this.view.k >= max * 0.999, pickable }
  }

  /** The zoom's limits now: the panorama (and the ring's least zoom), and a star glyph of `ZOOM.maxGlyph` px. */
  get zoomRange(): { min: number; max: number } {
    return this.zoomLimits()
  }

  /** Where `unitId`'s star was drawn in the last frame; null before one, or for a star not on this map (#51). */
  starOnScreen(unitId: string): StarOnScreen | null {
    const index = this.drewFirstFrame ? this.stars.findIndex((star) => star.unitId === unitId) : -1
    return index < 0 ? null : { x: this.x[index], y: this.y[index], size: this.glyphSize }
  }

  /** With a star chosen, where it was drawn in the last frame (it may be panned off screen, #132); else null. */
  get focusedStarOnScreen(): StarOnScreen | null {
    return this.target.layer === 'star' ? this.starOnScreen(this.target.unitId) : null
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

  private starPx(view: View = this.view): number {
    return starPxFor(transformOf(view, this.viewport, this.bounds).scale, this.spacing)
  }

  /**
   * How far the zoom may go: out to the panorama (#134 Z3; on the ring never
   * past `ringSafeZoom`, #120), in until a star's glyph is `ZOOM.maxGlyph` px.
   */
  private zoomLimits(fx = this.view.fx): { min: number; max: number } {
    if (!this.map || this.viewport.width === 0) return { min: 1, max: 1 }
    const far = this.skyGalaxies.length > 0 ? panoramaZoom(this.skyGalaxies, this.bounds, this.viewport) : 1
    const ring = this.wrap > 0 ? ringSafeZoom(this.ringReach, this.wrap, this.viewport, this.bounds, fx) : 0
    const min = Math.max(far, ring)
    return { min, max: Math.max(min, kForGlyph(ZOOM.maxGlyph, this.viewport, this.bounds, this.spacing)) }
  }

  private limit(view: View): View {
    const { min, max } = this.zoomLimits(view.fx)
    return view.k < min ? { ...view, k: min } : view.k > max ? { ...view, k: max } : view
  }

  /** The view that shows what is chosen: the galaxy's panorama, a nebula's stars as full glyphs, a star beside its card. */
  private viewFor(target: LayerTarget): View {
    if (!this.map || this.viewport.width === 0) return overviewView(this.bounds, this.viewport)
    if (target.layer === 'map') {
      if (this.skyGalaxies.length === 0) return this.limit(overviewView(this.bounds, this.viewport))
      const galaxy = this.skyGalaxies.find((candidate) => candidate.subjectId === this.map!.subject.subjectId) ?? this.skyGalaxies[0]
      return this.limit(this.onRing(galaxyView(galaxy, this.skyGalaxies, this.bounds, this.viewport)))
    }
    const glyphK = (glyph: number) => kForGlyph(glyph, this.viewport, this.bounds, this.spacing)
    if (target.layer === 'nebula' && target.whole) {
      // Back from a lighting (#140): the nebula seen whole, its stars still glyphs.
      const zoom = [glyphK(ZOOM.wholeNebulaGlyph[0]), glyphK(ZOOM.wholeNebulaGlyph[1])] as const
      const whole = wholeNebulaView(target.nebulaId, target.whole.star, this.map.stars, this.viewport, this.bounds, zoom)
      if (whole) return this.limit(this.onRing(whole))
    }
    const view = viewForTarget(target, this.map, this.discs, this.bounds, this.viewport)
    // A cloud's rim reaches far past its core: zoom in until its stars are full
    // glyphs, so the four learning states can be told apart (#117).
    const k = target.layer === 'star' ? glyphK(ZOOM.starGlyph) : Math.max(view.k, glyphK(ZOOM.nebulaGlyph))
    return this.limit(this.onRing({ ...view, k }))
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
    this.letGo()
    this.press = null
    this.dragging = null
    this.pinch = null
    this.zoomGlide = null
    this.inertia.stop()
  }

  /**
   * The star a press at `(x, y)` would grab (#136), or -1: only where single
   * stars can be picked (glyph at least `DRAG.grabFromGlyph` px, past the
   * panorama's dots), never during a flight, within the glyph's reach
   * (further for a finger).
   */
  private grabbable(x: number, y: number, kind: PointerKind): number {
    if (!this.map || this.viewport.width === 0 || this.transition?.kind === 'zoom') return -1
    if (!this.zoom.pickable || this.starPx() < DRAG.grabFromGlyph) return -1
    const glyph = this.glyphSize
    const reach = kind === 'touch' ? Math.max(DRAG.touchGrabMinPx, glyph * DRAG.touchGrabReach) : Math.max(DRAG.grabMinPx, glyph * DRAG.grabReach)
    let best = -1
    let bestDistance = reach
    for (let i = 0; i < this.stars.length; i += 1) {
      const distance = Math.hypot(this.x[i] - x, this.y[i] - y)
      if (distance < bestDistance) {
        best = i
        bestDistance = distance
      }
    }
    return best
  }

  /** The press `grab` becomes a drag of its star, held at the screen point `(x, y)`. */
  private startDrag(grab: NonNullable<StarMapEngine['grab']>, x: number, y: number): StarDrag {
    const scene = this.scene!
    const star = grab.star
    this.inertia.stop()
    let drag = this.drag
    if (!drag || drag.star !== star) {
      // Another star still springing back is put back at once: one drag at a time.
      if (drag) this.applyDrag(0, true)
      const t = transformOf(this.view, this.viewport, this.bounds)
      const distance = (i: number) =>
        Math.hypot(shortestDx(scene.mapX[star], scene.mapX[i]) * t.scale, (scene.mapY[i] - scene.mapY[star]) * t.scale)
      drag = createStarDrag(star, linkedStars(scene.starLinks, star), distance)
      this.drag = drag
    }
    drag.held = true
    grab.dragging = true
    grab.hx = x
    grab.hy = y
    grab.ax = x - this.x[star]
    grab.ay = y - this.y[star]
    this.invalidate()
    return drag
  }

  /** The held star is let go: it and its linked stars spring back (at once under reduced motion). */
  private letGo() {
    this.grab = null
    if (this.drag?.held) {
      this.drag.held = false
      this.invalidate()
    }
  }

  /** Glide by `log` more (log2 of k) around `(x, y)`, with time constant `tauMs`; never past the zoom's limits. */
  private glideZoom(log: number, x: number, y: number, tauMs: number) {
    const { min, max } = this.zoomLimits()
    const now = Math.log2(this.view.k)
    const goal = Math.max(Math.log2(min), Math.min(Math.log2(max), now + (this.zoomGlide?.log ?? 0) + log))
    const remaining = goal - now
    this.zoomGlide = Math.abs(remaining) < 1e-4 ? null : { log: remaining, x, y, tauMs }
    this.invalidate()
  }

  /** Zoom by `log` (log2 of k) around `(x, y)` now, within the limits. Whether the view changed. */
  private applyZoom(log: number, x: number, y: number): boolean {
    const { min, max } = this.zoomLimits()
    const k = Math.max(min, Math.min(max, this.view.k * 2 ** log))
    if (Math.abs(k - this.view.k) < 1e-9 * this.view.k) return false
    const out = k < this.view.k
    this.view = this.ringSafe(zoomAround(this.view, k, x, y, this.viewport, this.bounds, this.wrap))
    this.positionsStale = true
    this.afterUserZoom(out)
    return true
  }

  /**
   * Zoomed out by hand past a choice, let it go (#134 Z2): the chosen star's
   * card closes once its glyph is under `REVEAL.cardClosesBelow` px, a
   * chosen nebula is let go back within `REVEAL.panoramaBand` of the
   * panorama. Asked once; the camera stays where the hand put it.
   */
  private afterUserZoom(out: boolean) {
    if (!out || !this.map) return
    const target = this.target
    if (target.layer === 'star' && this.starPx() < REVEAL.cardClosesBelow) {
      this.release({ layer: 'nebula', nebulaId: target.nebulaId })
    } else if (target.layer === 'nebula' && this.view.k < this.zoomLimits().min * REVEAL.panoramaBand) {
      this.release({ layer: 'map' })
    }
  }

  private release(next: LayerTarget) {
    const key = next.layer === 'map' ? 'map' : `${next.layer}:${next.nebulaId}`
    if (this.released === key) return
    this.released = key
    this.request(next, 'stay')
  }

  private request(target: LayerTarget, motion: ChoiceMotion) {
    this.requested = { target, motion }
    this.options.onRequestTarget?.(target)
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

  /** The recommended star under `(x, y)`: a full glyph at every zoom, so it can be picked from far out too. */
  private beaconAt(x: number, y: number): Star | null {
    const reach = Math.max(14, Math.min(this.glyphSize, 32) * 0.6)
    for (const i of this.scene?.recommendations ?? []) {
      if (Math.hypot(this.x[i] - x, this.y[i] - y) <= reach) return this.stars[i]
    }
    return null
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

  /** A tap; a second one close by, soon after a first that chose nothing, zooms in ×2 around it. */
  private tap(x: number, y: number) {
    if (!this.map) return
    const now = this.now()
    const last = this.lastTap
    if (last && now - last.at < ZOOM.doubleTapMs && Math.hypot(x - last.x, y - last.y) < ZOOM.doubleTapPx) {
      this.lastTap = null
      // After a first tap that chose something, the flight it started is the zoom in.
      if (!last.acted) this.zoomBy(Math.log2(ZOOM.doubleTapStep), x, y)
      return
    }
    this.lastTap = { x, y, at: now, acted: this.choose(x, y) }
  }

  /**
   * What a tap chooses (#134 Z2): a star once stars are big enough to pick
   * (the recommended star at any zoom); with a star's card open, a tap on no
   * star closes it; else the nebula under the tap. Whether it asked for a route.
   */
  private choose(x: number, y: number): boolean {
    const reach = Math.max(22, this.glyphSize * 0.5)
    const hit = this.zoom.pickable ? (this.nearestStar(x, y, reach) ?? this.beaconAt(x, y)) : this.beaconAt(x, y)
    const target = this.target
    if (hit) {
      // A tap on the star already open brings it back to its place beside the card.
      if (target.layer === 'star' && hit.unitId === target.unitId) this.recentre()
      else this.request({ layer: 'star', nebulaId: hit.nebulaId, unitId: hit.unitId }, 'fly')
      return true
    }
    if (target.layer === 'star') {
      this.request({ layer: 'nebula', nebulaId: target.nebulaId }, 'stay')
      return true
    }
    const nebulaId = this.nebulaAt(x, y) ?? this.nearestStar(x, y, reach)?.nebulaId ?? null
    if (!nebulaId || (target.layer === 'nebula' && target.nebulaId === nebulaId)) return false
    this.request({ layer: 'nebula', nebulaId }, 'fly')
    return true
  }

  hoverAt(x: number | null, y = 0) {
    const id = x === null ? null : this.nebulaAt(x, y)
    const next = id ? this.nebulaIndex.get(id) ?? -1 : -1
    const star = x === null ? -1 : this.grabbable(x, y, 'mouse')
    if (next === this.hoveredNebula && star === this.hoveredStar) return
    this.hoveredNebula = next
    this.hoveredStar = star
    this.invalidate()
  }

  private invalidate() {
    if (this.destroyed || this.handle !== null) return
    this.handle = this.scheduler.request((now) => this.frame(now))
  }

  private frame(now: number) {
    this.handle = null
    if (this.destroyed || !this.scene || !this.map || this.viewport.width === 0) return
    // After a pause in the frames (nothing moved), the first step is one frame long, not the whole pause.
    const dt = this.lastFrameAt === null ? 1000 / 60 : Math.max(0, Math.min(64, now - this.lastFrameAt))
    this.lastFrameAt = now
    let keepGoing = false
    let moving = this.dragging !== null || (this.pinch !== null && !this.pinch.ended)
    // A finger held on a star long enough grabs it (#136); until then, watch the clock.
    const grab = this.grab
    if (grab && grab.kind === 'touch' && !grab.dragging && this.press && !this.press.moved) {
      if (now - grab.at >= DRAG.longPressMs) this.startDrag(grab, this.press.x, this.press.y)
      else keepGoing = true
    }

    // A flight, else the glides after a pan and a zoom.
    let crossfade = 0
    if (this.transition) {
      const t = Math.min(1, (now - this.transition.startedAt) / this.transition.durationMs)
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
    } else {
      if (this.inertia.moving && this.policy.inertia && !this.paused) {
        const step = this.inertia.advance(dt)
        if (step) {
          this.view = panBy(this.view, step[0], step[1], this.viewport, this.bounds, this.wrap)
          moving = true
          keepGoing = true
        }
        this.positionsStale = true
      }
      const glide = this.zoomGlide
      if (glide) {
        // The rest of the zoom approaches exponentially: the wheel's notches
        // and the buttons' steps arrive as one smooth zoom, never as a jump.
        // No faster than `ZOOM.maxRate`: a hard flick still crosses each reveal over several frames.
        const most = (ZOOM.maxRate * dt) / 1000
        let step = Math.max(-most, Math.min(most, glide.log * (1 - Math.exp(-dt / glide.tauMs))))
        if (Math.abs(glide.log - step) < 0.002) step = glide.log
        glide.log -= step
        const changed = this.applyZoom(step, glide.x, glide.y)
        // The glide's last frame is a frame at rest, like a flight's.
        if (!changed || Math.abs(glide.log) < 1e-6) this.zoomGlide = null
        else {
          keepGoing = true
          moving = true
        }
      }
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
    if (this.applyDrag(dt)) {
      moving = true
      keepGoing = true
    }

    // Choosing and letting go ease in and out.
    const ease = this.policy.inertia ? 1 - Math.exp(-dt / EMPHASIS_MS) : 1
    const approach = (value: number, to: number) => (Math.abs(to - value) < 0.002 ? to : value + (to - value) * ease)
    this.chosenAmount = approach(this.chosenAmount, chosen >= 0 ? 1 : 0)
    this.starAmount = approach(this.starAmount, target.layer === 'star' ? 1 : 0)
    let easing = (this.chosenAmount > 0 && this.chosenAmount < 1) || (this.starAmount > 0 && this.starAmount < 1)
    for (let n = 0; n < this.nebulaLift.length; n += 1) {
      this.nebulaLift[n] = approach(this.nebulaLift[n], n === chosen ? 1 : 0)
      if (this.nebulaLift[n] > 0 && this.nebulaLift[n] < 1) easing = true
    }
    if (easing) keepGoing = true

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

    this.renderer.draw(this.frameState(t, crossfade, chosen, breath, now))
    // A name still fading in or out wants the next frame too.
    if (this.renderer.stats.settling) keepGoing = true

    if (!this.drewFirstFrame) {
      this.drewFirstFrame = true
      this.options.onFirstFrame?.()
    }
    this.emitVisible(moving)
    const atRest = !moving && !this.transition && !this.zoomGlide && !(this.inertia.moving && this.policy.inertia && !this.paused)
    // At rest with nothing chosen: the header names whichever galaxy is at the centre.
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
    else this.lastFrameAt = null
  }

  /**
   * Step the drag's springs by `dt` and move the grabbed star and its linked
   * stars on screen by their displacements (#136); they are drawn one by one
   * even in a blurred nebula. Whether the drag goes on (false: none, or it
   * has just come to rest, every star back in its place). `end` drops it at once.
   */
  private applyDrag(dt: number, end = false): boolean {
    const drag = this.drag
    if (!drag) return false
    // Held: the star where the hand holds it, whatever the camera did since.
    const grab = this.grab
    if (drag.held && grab?.dragging && grab.star === drag.star) {
      drag.gx = grab.hx - grab.ax - this.x[drag.star]
      drag.gy = grab.hy - grab.ay - this.y[drag.star]
    }
    const alive = !end && stepStarDrag(drag, dt, !this.policy.inertia)
    if (!alive) {
      this.drag = null
      this.dragX.fill(0)
      this.dragY.fill(0)
      this.dragRelated.fill(0)
      this.positionsStale = true
      return false
    }
    const set = (i: number, dx: number, dy: number) => {
      this.dragX[i] = dx
      this.dragY[i] = dy
      this.dragRelated[i] = 1
      this.x[i] += dx
      this.y[i] += dy
      this.starAlpha[i] = 1
    }
    set(drag.star, drag.gx, drag.gy)
    for (let k = 0; k < drag.followers.length; k += 1) set(drag.followers[k], drag.fx[k], drag.fy[k])
    return true
  }

  /** What the renderer draws this frame: every reveal a continuous function of the zoom (#134). */
  private frameState(
    t: { scale: number; ox: number; oy: number },
    crossfade: number,
    chosen: number,
    breath: SceneFrame['breath'],
    now: number,
  ): SceneFrame {
    const target = this.target
    const starPx = starPxFor(t.scale, this.spacing)
    const glyphSize = glyphSizeFor(t.scale, this.spacing)
    if (target.layer === 'star') this.lastChosenStar = this.stars.findIndex((star) => star.unitId === target.unitId)
    const chosenStar = this.starAmount > 0 ? this.lastChosenStar : -1
    // With a star chosen, the map gives way to it as the zoom closes in (eased in as it is chosen, out as its card closes).
    const focus = chosenStar >= 0 ? starFocusAmount(starPx) * this.starAmount : 0
    const focusStar = chosenStar >= 0 ? chosenStar : this.focusStar
    // One sky names a nebula by its size on screen, past the panorama; a flat
    // map of one subject (no galaxies, tests and the bench's old maps) names every nebula.
    const giveWay = this.sky ? 1 - ramp(starPx, REVEAL.nebulaNameOut) : 1
    const pastPanorama = this.view.k / this.zoomLimits().min
    for (let n = 0; n < this.nebulaNames.length; n += 1) this.nebulaNames[n] = this.sky ? nebulaNameAlpha(this.nebulaR[n], starPx, pastPanorama) : 1
    const { width, height } = this.viewport
    return {
      dotBlend: Math.max(dotBlendFor(glyphSize), 1 - ramp(pastPanorama, REVEAL.dotsPastPanorama)),
      dotRadius: Math.max(1.15, Math.min(2.1, t.scale * this.dotSpacing * 0.11)),
      pastPanorama: this.sky ? pastPanorama : undefined,
      starPx,
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
      starLabelAlpha: starNameAlpha(starPx),
      restStarNames: restStarNameAlpha(starPx),
      hoveredStar: this.hoveredStar,
      starNameReach: { x: width * this.view.fx, y: height * this.view.fy, ...starNameReach(starPx, Math.min(width, height)) },
      nebulaLabelAlpha: 1,
      nebulaNames: this.nebulaNames,
      priorityNameAlpha: giveWay,
      lineReveal: lineReveal(starPx),
      starFocus: focus,
      chosenNebula: chosen,
      wholeMap: target.layer === 'map',
      focusStar,
      hoveredNebula: this.hoveredNebula,
      highlightNebula: target.layer === 'star' ? -1 : this.focusNebula,
      dim: 1 - (1 - STAR_FOCUS_DIM) * focus,
      chosenAmount: this.chosenAmount,
      nebulaLift: this.nebulaLift,
      emphasisKey: `${this.chosenAmount.toFixed(3)}:${this.nebulaLift.reduce((sum, lift, n) => sum + lift * (n + 1), 0).toFixed(3)}`,
      drag: this.drag
        ? { star: this.drag.star, related: this.dragRelated, offsetX: this.dragX, offsetY: this.dragY, amount: this.drag.amount, grow: this.drag.grow }
        : undefined,
      showSkills: skillAlpha(starPx),
      crossfade,
      time: now,
      labelFadeMs: this.policy.inertia ? REVEAL.labelFadeMs : 0,
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
    // A chosen star's DOM is its card; the map behind it has no links.
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
    listener(list, this.glyphSize, nebulae, this.zoom)
  }
}
