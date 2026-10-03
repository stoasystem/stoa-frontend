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
