/*
 * Foveated rendering (#72 point 6, the user's idea): only the focus is drawn
 * star by star -- the part of the screen near its focus point, and the
 * nebula the student has chosen. Every other nebula is one pre-rendered,
 * low-resolution, already-blurred tile, and the two crossfade as the focus
 * moves. The blur is visual only; the parallel DOM still lists every star.
 *
 * Sharpness is 1 inside the focus and 0 outside, with a soft band between:
 * a nebula whose disc comes within `inner` of the focus point is sharp, one
 * that stays beyond `outer` is a tile, and in between the two crossfade. It
 * depends only on where things are on screen, so panning and zooming fade
 * nebulae in and out continuously, and nothing moves while the map is still.
 */

export type FocusBand = { inner: number; outer: number }

/**
 * The band, in CSS px: sharp within 6% of the viewport's shorter side of the
 * focus point, a tile beyond 20%. On the whole map that is the nebula in the
 * middle and a partial ring around it; zoomed into a nebula, its neighbours.
 */
export function focusBand(width: number, height: number): FocusBand {
  const shorter = Math.min(width, height)
  return { inner: 0.06 * shorter, outer: 0.2 * shorter }
}

/**
 * How sharp a nebula is, 0..1. `(x, y, r)` is its disc on screen, `(fx, fy)`
 * the focus point; a chosen nebula is always sharp.
 */
export function sharpnessOf(x: number, y: number, r: number, fx: number, fy: number, band: FocusBand, chosen: boolean): number {
  if (chosen) return 1
  const gap = Math.hypot(x - fx, y - fy) - r
  if (gap <= band.inner) return 1
  if (gap >= band.outer) return 0
  const t = (band.outer - gap) / (band.outer - band.inner)
  // Smoothstep, so the crossfade has no visible edge.
  return t * t * (3 - 2 * t)
}

/** Stars fainter than this are left to their nebula's tile. */
export const DRAW_THRESHOLD = 0.02

/**
 * A map this small is drawn star by star everywhere: a few hundred sprites
 * cost nothing, and a blurred nebula of three stars would only hide them.
 * Foveation starts above it.
 */
export const FOVEATE_ABOVE = 300
