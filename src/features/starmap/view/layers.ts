/*
 * The three layers (#72 point 5) and the flight between them.
 *
 *   map     the whole star map: every nebula, the links between them;
 *   nebula  one nebula fills the view: its stars get names, its own
 *           prerequisite lines appear;
 *   star    one star, drawn in HTML/SVG beside the map: skills, progress,
 *           markers, the way into its chapter.
 *
 * The flight is d3-zoom's smooth zoom (van Wijk & Nuij, rho = sqrt 2) in two
 * dimensions: a long move pulls back first, a short one zooms straight in.
 */
import { orderedStars, type Star, type StarMap } from '@/features/starmap/model/starMap'
import { baseScale, overviewView, type Bounds, type View, type Viewport } from '@/features/starmap/view/camera'
import type { NebulaDisc } from '@/features/starmap/view/geometry'

export type MapLayer = 'map' | 'nebula' | 'star'

export type LayerTarget =
  | { layer: 'map' }
  | { layer: 'nebula'; nebulaId: string }
  | { layer: 'star'; nebulaId: string; unitId: string }

const RHO = Math.SQRT2
const RHO2 = 2
const RHO4 = 4
const EPSILON2 = 1e-12

const { cosh, sinh, tanh } = Math

/**
 * The view at `t` in [0, 1] between two views (the caller applies easing).
 * `base` is the pixels per map unit at k = 1, `size` the viewport's shorter side.
 */
export function interpolateView(from: View, to: View, size: number, base: number) {
  // d3.interpolateZoom's [ux, uy, w]: w is the width of the view in map units.
  const w0 = size / (base * from.k)
  const w1 = size / (base * to.k)
  const dx = to.cx - from.cx
  const dy = to.cy - from.cy
  const d2 = dx * dx + dy * dy
  const d1 = Math.sqrt(d2)
  let path: (t: number) => { u: number; w: number }

  if (d2 < EPSILON2) {
    const S = Math.log(w1 / w0) / RHO
    path = (t) => ({ u: t, w: w0 * Math.exp(RHO * t * S) })
  } else {
    const b0 = (w1 * w1 - w0 * w0 + RHO4 * d2) / (2 * w0 * RHO2 * d1)
    const b1 = (w1 * w1 - w0 * w0 - RHO4 * d2) / (2 * w1 * RHO2 * d1)
    const r0 = Math.log(Math.sqrt(b0 * b0 + 1) - b0)
    const r1 = Math.log(Math.sqrt(b1 * b1 + 1) - b1)
    const S = (r1 - r0) / RHO
    path = (t) => {
      const s = t * S
      const coshr0 = cosh(r0)
      const u = (w0 / (RHO2 * d1)) * (coshr0 * tanh(RHO * s + r0) - sinh(r0))
      return { u, w: (w0 * coshr0) / cosh(RHO * s + r0) }
    }
  }

  return (t: number): View => {
    if (t <= 0) return from
    if (t >= 1) return to
    const { u, w } = path(t)
    return {
      cx: from.cx + dx * u,
      cy: from.cy + dy * u,
      k: size / (base * w),
      fx: from.fx + (to.fx - from.fx) * t,
      fy: from.fy + (to.fy - from.fy) * t,
    }
  }
}

/** A wide screen keeps the star card beside the map; a phone puts it below. */
export function isWide(viewport: Viewport): boolean {
  return viewport.width >= 768
}

/** Zoom that makes a nebula fill about 85% of the shorter side. */
export function nebulaZoom(disc: NebulaDisc, viewport: Viewport, bounds: Bounds): number {
  const shorter = Math.min(viewport.width, viewport.height)
  const base = baseScale(viewport, bounds)
  return Math.max(1.4, Math.min(14, (0.85 * shorter) / (2 * disc.r * base)))
}

/** The view a layer asks for. */
export function viewForTarget(
  target: LayerTarget,
  map: Pick<StarMap, 'stars'>,
  discs: ReadonlyMap<string, NebulaDisc>,
  bounds: Bounds,
  viewport: Viewport,
): View {
  if (target.layer === 'map') return overviewView(bounds, viewport)
  const disc = discs.get(target.nebulaId)
  if (!disc) return overviewView(bounds, viewport)
  const k = nebulaZoom(disc, viewport, bounds)
  if (target.layer === 'nebula') return { cx: disc.x, cy: disc.y, k, fx: 0.5, fy: 0.5 }
  const star = map.stars.find((candidate) => candidate.unitId === target.unitId)
  if (!star) return { cx: disc.x, cy: disc.y, k, fx: 0.5, fy: 0.5 }
  const wide = isWide(viewport)
  return { cx: star.x, cy: star.y, k: Math.min(24, k * 1.8), fx: wide ? 0.34 : 0.5, fy: wide ? 0.5 : 0.3 }
}

/**
 * The layer a route asks for, made safe: a nebula or star the map does not
 * have falls back to the nearest layer it does have.
 */
export function resolveTarget(map: StarMap, topicId: string | undefined, unitId: string | undefined): LayerTarget {
  const nebula = topicId ? map.nebulae.find((candidate) => candidate.topicId === topicId) : undefined
  if (!nebula || !map.stars.some((star) => star.nebulaId === nebula.topicId)) return { layer: 'map' }
  const star = unitId
    ? map.stars.find((candidate) => candidate.unitId === unitId && candidate.nebulaId === nebula.topicId)
    : undefined
  if (!star) return { layer: 'nebula', nebulaId: nebula.topicId }
  return { layer: 'star', nebulaId: nebula.topicId, unitId: star.unitId }
}

/** One layer out: star to its nebula, nebula to the map. */
export function outerTarget(target: LayerTarget): LayerTarget {
  if (target.layer === 'star') return { layer: 'nebula', nebulaId: target.nebulaId }
  return { layer: 'map' }
}

/** One layer in, around the nebula or star nearest the point of interest. */
export function innerTarget(
  target: LayerTarget,
  map: StarMap,
  nearestNebula: string | null,
  nearestStar: Star | null,
): LayerTarget {
  if (target.layer === 'map') {
    const nebulaId = nearestNebula ?? orderedStars(map)[0]?.nebulaId
    return nebulaId ? { layer: 'nebula', nebulaId } : target
  }
  if (target.layer === 'nebula') {
    const inNebula = nearestStar && nearestStar.nebulaId === target.nebulaId ? nearestStar : null
    const star = inNebula ?? orderedStars(map).find((candidate) => candidate.nebulaId === target.nebulaId)
    return star ? { layer: 'star', nebulaId: target.nebulaId, unitId: star.unitId } : target
  }
  return target
}

/** The route a layer lives at (#72 point 8). */
export function pathForTarget(subjectId: string, target: LayerTarget): string {
  const subject = `/map/${encodeURIComponent(subjectId)}`
  if (target.layer === 'map') return subject
  const nebula = `${subject}/${encodeURIComponent(target.nebulaId)}`
  if (target.layer === 'nebula') return nebula
  return `${nebula}/${encodeURIComponent(target.unitId)}`
}

export function sameTarget(a: LayerTarget, b: LayerTarget): boolean {
  if (a.layer !== b.layer) return false
  if (a.layer === 'map') return true
  if (a.layer === 'nebula') return a.nebulaId === (b as typeof a).nebulaId
  return a.nebulaId === (b as typeof a).nebulaId && a.unitId === (b as typeof a).unitId
}

/** The height of a nebula link's focus indicator (its name pill), CSS px. */
export const NEBULA_FOCUS_HEIGHT = 36

/**
 * Where a focused nebula link shows its name (WCAG 2.4.11: a focus indicator
 * the page's own controls never cover): just below the nebula, else just
 * above it, else across its middle -- always inside the band between the
 * page's controls, and horizontally clamped clear of the edges. `x` is the
 * pill's centre, `y` its top.
 */
export function nebulaFocusSpot(
  disc: { x: number; y: number; r: number },
  viewport: { width: number; height: number },
  bands: { top: number; bottom: number },
): { x: number; y: number } {
  const top = bands.top + 4
  const bottom = viewport.height - bands.bottom - 4 - NEBULA_FOCUS_HEIGHT
  const below = disc.y + disc.r + 8
  const above = disc.y - disc.r - 8 - NEBULA_FOCUS_HEIGHT
  const y = below <= bottom ? below : above >= top ? above : disc.y - NEBULA_FOCUS_HEIGHT / 2
  const margin = Math.min(140, viewport.width / 2)
  return {
    x: Math.max(margin, Math.min(viewport.width - margin, disc.x)),
    y: Math.max(top, Math.min(bottom, y)),
  }
}
