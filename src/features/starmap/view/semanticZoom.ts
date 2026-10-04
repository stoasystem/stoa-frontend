/*
 * Semantic zoom (#134): the star map zooms continuously, with no stops, and
 * what it shows follows how far in it is. "Panorama", "nebula" and "star" are
 * no longer layers the camera snaps to; they only name rough bands of one
 * zoom (`zoomBand`). Every reveal below is a continuous, monotone function of
 * the zoom -- a smoothstep between two thresholds -- so nothing pops in or out
 * at a band's edge.
 *
 * The zoom is measured as `starPx`: the size, in CSS px, a star's glyph would
 * be drawn at (the drawn glyph is the same number clamped to 9..40). It does
 * not depend on the screen, so a threshold reads the same on a phone and on a
 * desktop.
 *
 * The numbers are a first set for the user to tune in the design preview
 * (#134 Z4): every one is here, in `ZOOM` (how the camera moves) and `REVEAL`
 * (what appears when). Nothing else in the star map hard-codes them.
 */
import { baseScale, clampView, transformOf, type Bounds, type View, type Viewport } from '@/features/starmap/view/camera'

/** A pair of thresholds: below the first, 0; above the second, 1; a smoothstep between. */
export type Ramp = readonly [from: number, to: number]

/** How the camera moves. */
export const ZOOM = {
  /** Wheel and trackpad: log2 of zoom per px of `deltaY` (a 100 px mouse notch is about ×1.23). */
  wheelPerPx: 0.003,
  /** A wheel line (Firefox's `deltaMode` 1), and a page, in px. */
  wheelLinePx: 33,
  wheelPagePx: 800,
  /** A trackpad pinch arrives as ctrl+wheel with small deltas: this many times the wheel's rate. */
  pinchWheelBoost: 10,
  /** The wheel, the buttons and a double tap glide to their zoom with this time constant, ms. */
  glideMs: 90,
  /**
   * The wheel's and buttons' glide never zooms faster than this, log2 per
   * second (×64 a second: the panorama to the closest zoom in about half a
   * second), so a hard flick still crosses every fade over several frames.
   */
  maxRate: 6,
  /** After a pinch is let go, its zoom carries on and slows with this time constant, ms. */
  pinchDecayMs: 200,
  /** Below this zoom speed (log2 per ms) a released pinch has stopped. */
  pinchRestSpeed: 0.0004,
  /** One press of + or - (or the keys): ×1.5, in or out. */
  buttonStep: 1.5,
  /** A double tap or double click: ×2 around it. */
  doubleTapStep: 2,
  /** Two taps this close in time (ms) and space (px) are a double tap. */
  doubleTapMs: 320,
  doubleTapPx: 30,
  /** The closest zoom: a star's glyph this many px. The farthest is the panorama (and #120's `ringSafeZoom`). */
  maxGlyph: 40,
  /** A flight to a chosen nebula or star, ms (the switcher's longer flight is the motion policy's). */
  flightMs: 600,
  /** Choosing a nebula flies in until its stars are full glyphs this big (px): the four states tell apart. */
  nebulaGlyph: 28,
  /** Choosing a star flies in until its glyph is this big (px), never out. */
  starGlyph: 34,
  /**
   * Back on the map from a lighting (#140): the star's nebula is seen whole,
   * all its stars within this share of the band between the page's controls...
   */
  wholeNebulaFill: 0.9,
  /**
   * ...with its glyphs within this range (px): never closer than choosing the
   * nebula, and never so far out that stars turn to dots, where in progress
   * and lit look alike -- a nebula too big for that keeps its star in view...
   */
  wholeNebulaGlyph: [22, 28] as Ramp,
  /** The star is kept within this share of the nebula's room around its middle, so its flare has space on every side. */
  wholeNebulaKeep: 0.55,
} as const

/** What appears when, by zoom. Each `Ramp` is a fade from 0 to 1 between its two values. */
export const REVEAL = {
  /**
   * A nebula's name fades in as its disc's radius on screen grows over this
   * range (px), once the zoom is this far past the panorama (a factor of the
   * farthest zoom: far out only the nebula under the pointer is named, #123)...
   */
  nebulaNameIn: [150, 230] as Ramp,
  nebulaNamePastPanorama: [1.15, 1.45] as Ramp,
  /** ...and out again as star names take over, by `starPx`. */
  nebulaNameOut: [18, 24] as Ramp,
  /** Star names fade in as the glyph grows over this range (px). */
  starNameIn: [14, 18] as Ramp,
  /** From this glyph size (px) a tap picks a star (and stars on screen are Tab stops); below it, its nebula. The recommended star can always be picked. */
  starsPickableFrom: 14,
  /**
   * Which stars get a name: those within a radius of the view's focus point,
   * a share of the viewport's shorter side growing from `from` to `to` as the
   * glyph grows over `glyph` -- the nearest few first, more as it grows. A
   * name fades out over the last `feather` (share of the shorter side).
   */
  starNameReach: { from: 0.18, to: 1.2, glyph: [14, 32] as Ramp, feather: 0.12 },
  /** At most this many star names at once. */
  starNamesAtMost: 80,
  /** Lines (#121) tiers 1 and 2 (recommended, in progress) fade in as a nebula becomes readable; the panorama's bridges fade out over the same range. */
  linesNear: [8, 12] as Ramp,
  /** Tier 3 (the path walked). */
  linesWalked: [12, 18] as Ramp,
  /** Tier 4 (locked, dashed): only when the glyph is very large. */
  linesLocked: [28, 34] as Ramp,
  /** With a star chosen (its card open): the map behind it dims and only its own lines stay, over this range. */
  starFocus: [12, 20] as Ramp,
  /**
   * Far out the stars are dots, however few there are (#109): dots give way to
   * glyphs by glyph size, and on the panorama they stay dots until the zoom is
   * past it by this factor.
   */
  dotsPastPanorama: [1, 1.5] as Ramp,
  /** Skill dots beside the stars. */
  skills: [28, 32] as Ramp,
  /** Zoomed out until the chosen star's glyph is under this (px), its card closes. */
  cardClosesBelow: 12,
  /** Zoomed out to within this factor of the farthest zoom, a chosen nebula is let go. */
  panoramaBand: 1.25,
  /** A name that gains or loses its place fades over this long (ms): placement never blinks. */
  labelFadeMs: 180,
} as const

/**
 * Dragging a star (#136): the grabbed star follows the hand exactly; the stars
 * it is directly linked to (its prerequisites and successors, one hop, across
 * subjects too) are pulled after it by springs, and everything springs back
 * when it is let go. Nothing is kept: the layout stays the backend's. The
 * springs are damped oscillators, `stiffness` in 1/s^2 and `damping` as a
 * ratio of critical (1 = no overshoot; lower wobbles more). The numbers are a
 * first set for the user to tune by hand in the design preview.
 */
export const DRAG = {
  /** A linked star moves this share of the grabbed star's displacement. */
  followRatio: 0.6,
  /** While held: how a linked star chases its share -- a little behind, settling with a small wobble. */
  follow: { stiffness: 260, damping: 0.42 },
  /** Let go: every moved star (the grabbed one too) springs back to its place with a little overshoot. */
  release: { stiffness: 220, damping: 0.55 },
  /**
   * Linked stars further from the grabbed one lag a little more: the follow
   * stiffness falls by up to this share with their distance on screen (up to
   * `lagReachPx`), so the web does not move as one rigid piece.
   */
  lagSpread: 0.35,
  lagReachPx: 600,
  /** Touch: hold a star this long (ms), without moving more than the tap slop, to grab it; a swipe before that pans. */
  longPressMs: 300,
  /** Stars can be grabbed from this glyph size (px) up: where single stars are hittable (`REVEAL.starsPickableFrom`). */
  grabFromGlyph: 14,
  /** Within this share of the glyph (and at least `grabMinPx`) of a star's centre a press grabs it; touch reaches further. */
  grabReach: 0.5,
  grabMinPx: 10,
  touchGrabReach: 0.7,
  touchGrabMinPx: 18,
  /** The grabbed star grows to this share of its size, easing over `growMs`. */
  grow: 1.22,
  growMs: 90,
  /** While dragging, other stars and names fade to this, other lines to `dimLines`; eased in and out over `emphasisMs`. */
  dimStars: 0.4,
  dimLines: 0.2,
  emphasisMs: 140,
  /** Let go: the emphasis eases out over this long (ms), with the springs. */
  emphasisOutMs: 260,
  /** Below this displacement (px) and speed (px/s) a star has settled and the drag is over. */
  restPx: 0.05,
  restSpeed: 2,
} as const

/**
 * Arrow keys by position (#141, `view/keyboardOrder.ts`): from a star (or,
 * up and down, a nebula) to the nearest one in the arrow's direction. Map
 * units for distances; the cone is a ratio, sideways over ahead.
 */
export const KEYS = {
  /** A candidate counts only this far off the axis: sideways up to this many times its distance ahead (2 ≈ 63°). */
  coneSlope: 2,
  /** Sideways distance weighs this many times ahead, so the one straight ahead wins over a nearer one off to the side. */
  offAxisWeight: 2,
  /** Less than this ahead (map units) is level with the start, not ahead of it. */
  minAhead: 1e-6,
} as const

/**
 * The phone's star card is a sheet (#139, round two E2 of #123): collapsed
 * along the bottom it shows only the star's name and its main action, so the
 * map keeps most of the screen; pulled up or tapped it opens to the details,
 * at most `expandedMax` of the map's height. A chosen star is framed in the
 * map above the collapsed sheet. px unless said otherwise.
 */
export const SHEET = {
  /** Collapsed height: the grabber and one row (the star's glyph, name and state, its action). */
  collapsedPx: 76,
  /** From the stage's sides, and above the page's bottom inset. */
  marginPx: 12,
  /** Room kept clear between the area a chosen star is framed in and the collapsed sheet's top. */
  clearancePx: 16,
  /** Expanded: at most this share of the stage's height. */
  expandedMax: 0.55,
  /** A press on the sheet's head that moves less than this is a tap (it toggles), not a drag. */
  tapSlopPx: 6,
  /** Let go faster than this (px/ms) up or down, the sheet follows the flick; slower, it settles at the nearer state. */
  flickSpeed: 0.4,
} as const

/**
 * The flight first (#139, round two B6 of #123): a star chosen on the map is
 * flown to at once, and the route -- with it the card or sheet and the
 * parallel DOM, a long frame of React's -- follows this many frames into the
 * flight, so the first frames of the flight are on screen within a frame of
 * the tap.
 */
export const CHOICE = {
  routeAfterFrames: 2,
} as const

/**
 * The panorama's light (#137, round two A2 / A3 / A4 / C4 of #123). Far out
 * the sky should read as glowing nebulae grouped into galaxies, not as a
 * scatter of gold grains: lit stars there are small, dim dots, and the light
 * comes from each nebula's cloud -- brighter the larger its lit share (#117) --
 * and from each galaxy's haze, under one very faint, large name. All of it is
 * one continuous function of `pastPanorama` (the zoom over the farthest zoom):
 * the panorama look is whole at the farthest zoom and gives way as the zoom
 * passes it, so nothing pops. The numbers are a first set for the user to
 * tune in round three (#142).
 */
export const PANORAMA = {
  /** The panorama look is whole up to the first factor past the farthest zoom and gone by the second. */
  look: [1.02, 1.3] as Ramp,
  /**
   * A lit or in-progress star's dot on the panorama, as shares of its dot
   * zoomed in: smaller and dimmer, and without its glow, so the gold of a
   * lit nebula is its cloud's, not its grains'. The recommended star stays a
   * full glyph at every zoom.
   */
  litDot: { radius: 0.55, alpha: 0.5, glow: 0 },
  /** A ready or locked star's dot on the panorama: a little quieter too, so the cloud carries the picture. */
  otherDot: { radius: 0.85, alpha: 0.75 },
  /**
   * Each nebula's cloud on the panorama: `base`, plus `lit` times its lit
   * share (zoomed in it is `NEBULA_GLOW`, render/galaxy.ts). A fully lit
   * nebula glows several times as bright as an unlit one.
   */
  nebulaGlow: { base: 0.16, lit: 0.34 },
  /** A galaxy's base tint (its haze under its nebulae) on the panorama: strong enough that a galaxy reads as one whole (zoomed in it is `GALAXY_HAZE_ALPHA`, 0.04). */
  galaxyHaze: 0.22,
  /**
   * The galaxy's name, very faint and large under its stars (A3), in the
   * subject's own name (the read model's, in the student's language). It is
   * whole on the panorama and fades out as the zoom passes it by `out`.
   * Its letters are `size` times the galaxy's width on screen (within
   * `minPx`..`maxPx`), spaced `tracking` ems apart, its middle `below` ems
   * under the galaxy's lowest star. A neighbour's name fades out as its
   * middle moves away from the view's (`aside`: its distance from the view's
   * centre as a share of the screen's width), so its cut-off letters never
   * linger at an edge.
   */
  galaxyName: { out: [1.1, 1.8] as Ramp, size: 0.085, minPx: 26, maxPx: 96, tracking: 0.42, weight: 300, below: 0.9, aside: [0.28, 0.5] as Ramp },
  /**
   * A phone held upright (A4): the panorama starts one zoom step (`ZOOM.buttonStep`)
   * further out than a three-quarter view of the widest galaxy, so the whole
   * galaxy in view is on screen; its stars span at most this share of the width.
   * A landscape screen is unchanged.
   */
  portraitFit: 1.3 / ZOOM.buttonStep,
  /**
   * The galaxy haze is dithered (C4): drawn this faint, its whole gradient
   * spans only a dozen 8-bit alpha levels, which showed as vertical bands
   * between galaxies. Each pixel of the haze gets triangular noise of up to
   * ±`dither` of those drawn levels (painted once per sky, so it costs no frame).
   */
  dither: 1.5,
} as const

/**
 * How much of the panorama look is on: 1 at the farthest zoom, 0 once past
 * it (`PANORAMA.look`) -- and always gone where the knowledge lines come in
 * (`REVEAL.linesNear`, by `starPx`): a very wide screen's farthest zoom is
 * already that close, and lines, names and glyph rings are only ever drawn
 * on the zoomed-in light the contrast checks bound.
 */
export function panoramaLook(pastPanorama: number, starPx = 0): number {
  return (1 - ramp(pastPanorama, PANORAMA.look)) * (1 - ramp(starPx, REVEAL.linesNear))
}

/** A star's dot at `look` (0..1): its radius and alpha as shares of its dot zoomed in, and its glow. */
export function panoramaDot(lit: boolean, look: number): { radius: number; alpha: number; glow: number } {
  const quiet = lit ? PANORAMA.litDot : { ...PANORAMA.otherDot, glow: 1 }
  const mix = (to: number) => 1 + (to - 1) * look
  return { radius: mix(quiet.radius), alpha: mix(quiet.alpha), glow: mix(quiet.glow) }
}

/** A galaxy name's visibility, 0..1, by `pastPanorama`: whole far out, fading continuously as the zoom closes in. */
export function galaxyNameAlpha(pastPanorama: number): number {
  return 1 - ramp(pastPanorama, PANORAMA.galaxyName.out)
}

/** A smoothstep from 0 (at or below `from`) to 1 (at or above `to`): continuous, monotone, flat at both ends. */
export function ramp(value: number, [from, to]: Ramp): number {
  if (!(value > from)) return 0
  if (value >= to) return 1
  const t = (value - from) / (to - from)
  return t * t * (3 - 2 * t)
}

/** The glyph a star would be drawn at, unclamped (CSS px): the zoom as every reveal reads it. */
export function starPxFor(scale: number, spacing: number): number {
  return scale * spacing * 0.55
}

/** The zoom `k` at which a star's glyph is `glyph` px. */
export function kForGlyph(glyph: number, viewport: Viewport, bounds: Bounds, spacing: number): number {
  return glyph / (0.55 * baseScale(viewport, bounds) * Math.max(1e-9, spacing))
}

/**
 * How strongly a nebula's name is drawn: in by its radius on screen once past
 * the panorama (`pastPanorama`: the zoom over the farthest zoom), out as star
 * names take over.
 */
export function nebulaNameAlpha(radiusPx: number, starPx: number, pastPanorama: number): number {
  return ramp(radiusPx, REVEAL.nebulaNameIn) * ramp(pastPanorama, REVEAL.nebulaNamePastPanorama) * (1 - ramp(starPx, REVEAL.nebulaNameOut))
}

/** How strongly star names are drawn. */
export function starNameAlpha(starPx: number): number {
  return ramp(starPx, REVEAL.starNameIn)
}

/** Where star names reach: within `radius` px of the focus point, fading out over the last `feather` px. */
export function starNameReach(starPx: number, shorterSide: number): { radius: number; feather: number } {
  const { from, to, glyph, feather } = REVEAL.starNameReach
  return { radius: shorterSide * (from + (to - from) * ramp(starPx, glyph)), feather: shorterSide * feather }
}

/** A star name's share of its alpha at `distance` px from the focus point. */
export function reachFade(distance: number, reach: { radius: number; feather: number }): number {
  if (distance <= reach.radius - reach.feather) return 1
  if (distance >= reach.radius) return 0
  return (reach.radius - distance) / reach.feather
}

/**
 * The lines by zoom (#121's tiers, crossfaded instead of switched by layer):
 * `bridges` for the panorama's soft bridges between nebulae, `tiers[n]` for
 * tier n's star-to-star lines (index 0 unused).
 */
export function lineReveal(starPx: number): { bridges: number; tiers: [number, number, number, number, number] } {
  const near = ramp(starPx, REVEAL.linesNear)
  return { bridges: 1 - near, tiers: [0, near, near, ramp(starPx, REVEAL.linesWalked), ramp(starPx, REVEAL.linesLocked)] }
}

/** With a star chosen, how far the map has given way to it (dim behind, its own lines only). */
export function starFocusAmount(starPx: number): number {
  return ramp(starPx, REVEAL.starFocus)
}

export function skillAlpha(starPx: number): number {
  return ramp(starPx, REVEAL.skills)
}

export type ZoomBand = 'panorama' | 'nebula' | 'star'

/**
 * Which rough band the zoom is in -- a description only (the stage's
 * `data-zoom-band`, the docs), never a stop: under the near lines'
 * threshold the panorama, under star names' the nebula band, beyond the star band.
 */
export function zoomBand(starPx: number): ZoomBand {
  if (starPx < REVEAL.linesNear[0]) return 'panorama'
  if (starPx < REVEAL.starNameIn[0]) return 'nebula'
  return 'star'
}

/**
 * The view zoomed to `k` around the screen point `(x, y)`: the map point
 * under it stays under it. `y` is bounded as by a pan; on a ring `x` is not.
 */
export function zoomAround(view: View, k: number, x: number, y: number, viewport: Viewport, bounds: Bounds, wrap = 0): View {
  const before = transformOf(view, viewport, bounds)
  const mx = (x - before.ox) / before.scale
  const my = (y - before.oy) / before.scale
  return anchorAt(view, k, mx, my, x, y, viewport, bounds, wrap)
}

/** The view at zoom `k` that puts the map point `(mx, my)` at the screen point `(x, y)` (a pinch: zoom and pan at once). */
export function anchorAt(view: View, k: number, mx: number, my: number, x: number, y: number, viewport: Viewport, bounds: Bounds, wrap = 0): View {
  const scale = baseScale(viewport, bounds) * k
  return clampView(
    { ...view, k, cx: mx - (x - viewport.width * view.fx) / scale, cy: my - (y - viewport.height * view.fy) / scale },
    bounds,
    wrap,
  )
}
