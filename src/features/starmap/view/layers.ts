/*
 * What the route chooses (#72 point 8), and the flight to it. Since #134 the
 * zoom is continuous and these are no longer layers the camera stops at:
 * they are what is chosen, and the route follows the choice, never the zoom.
 *
 *   map     nothing chosen: the galaxy the header names (`/map/<subject>`);
 *   nebula  a nebula chosen (`/map/<subject>/<nebula>`): the camera flies in
 *           until its stars are full glyphs;
 *   star    a star chosen (`.../<star>`): its card opens beside the map (HTML/
 *           SVG: skills, progress, markers, the way into its chapter).
 *
 * What the map shows -- names, lines -- follows the zoom instead
 * (`view/semanticZoom.ts`).
 *
 * The flight is d3-zoom's smooth zoom (van Wijk & Nuij, rho = sqrt 2) in two
 * dimensions: a long move pulls back first, a short one zooms straight in.
 */
import type { Star, StarMap } from '@/features/starmap/model/starMap'
import { baseScale, overviewView, usableHeight, type Bounds, type View, type Viewport } from '@/features/starmap/view/camera'
import { ZOOM } from '@/features/starmap/view/semanticZoom'
import type { NebulaDisc } from '@/features/starmap/view/geometry'

export type LayerTarget =
  | { layer: 'map' }
  /** `whole`: the nebula seen whole, `star` kept in view: back on the map from a lighting (#140). */
  | { layer: 'nebula'; nebulaId: string; whole?: { star: string } }
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
  return Math.max(1.4, Math.min(30, (0.85 * shorter) / (2 * disc.r * base)))
}

/**
 * A nebula seen whole (#140): all its stars within `ZOOM.wholeNebulaFill`
 * of the band between the page's controls, centred in that band, at a zoom
 * within `zoom` (the engine's, from `ZOOM.wholeNebulaGlyph`), with `star`
 * kept near the middle (`ZOOM.wholeNebulaKeep`) even where the nebula is too
 * big for the screen. Null for a nebula with no stars.
 */
export function wholeNebulaView(
  nebulaId: string,
  star: string,
  stars: readonly Pick<Star, 'unitId' | 'nebulaId' | 'x' | 'y'>[],
  viewport: Viewport,
  bounds: Bounds,
  [least, most]: readonly [number, number],
): View | null {
  const own = stars.filter((candidate) => candidate.nebulaId === nebulaId)
  if (own.length === 0) return null
  const xs = own.map((candidate) => candidate.x)
  const ys = own.map((candidate) => candidate.y)
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]
  const usable = usableHeight(viewport)
  const base = baseScale(viewport, bounds)
  const room = { width: ZOOM.wholeNebulaFill * viewport.width, height: ZOOM.wholeNebulaFill * usable }
  const fit = Math.min(room.width / Math.max(1e-6, (maxX - minX) * base), room.height / Math.max(1e-6, (maxY - minY) * base))
  const k = Math.max(least, Math.min(most, fit))
  let cx = (minX + maxX) / 2
  let cy = (minY + maxY) / 2
  const kept = own.find((candidate) => candidate.unitId === star)
  if (kept) {
    const reachX = (ZOOM.wholeNebulaKeep * room.width) / 2 / (base * k)
    const reachY = (ZOOM.wholeNebulaKeep * room.height) / 2 / (base * k)
    cx = Math.max(kept.x - reachX, Math.min(kept.x + reachX, cx))
    cy = Math.max(kept.y - reachY, Math.min(kept.y + reachY, cy))
  }
  const fy = viewport.height > 0 ? ((viewport.top ?? 0) + usable / 2) / viewport.height : 0.5
  return { cx, cy, k, fx: 0.5, fy }
}

/** Where a choice is seen: its centre, and where on screen (`fx`, `fy`); the engine sets the zoom (`view/semanticZoom.ts`'s `ZOOM`). */
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
  return { cx: star.x, cy: star.y, k: k * 1.8, fx: wide ? 0.34 : 0.5, fy: wide ? 0.5 : 0.3 }
}

/**
 * The choice a route asks for, made safe: a nebula or star the map does not
 * have falls back to the nearest choice it does have.
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

/** The choice one step out: a star's card closed (its nebula), a nebula let go (the galaxy). */
export function outerTarget(target: LayerTarget): LayerTarget {
  if (target.layer === 'star') return { layer: 'nebula', nebulaId: target.nebulaId }
  return { layer: 'map' }
}

/** The route a choice lives at (#72 point 8). */
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
  pill = { width: 280, height: NEBULA_FOCUS_HEIGHT },
): { x: number; y: number } {
  const top = bands.top + 4
  const bottom = viewport.height - bands.bottom - 4 - pill.height
  const below = disc.y + disc.r + 8
  const above = disc.y - disc.r - 8 - pill.height
  const y = below <= bottom ? below : above >= top ? above : disc.y - pill.height / 2
  const margin = Math.min(pill.width / 2, viewport.width / 2)
  return {
    x: Math.max(margin, Math.min(viewport.width - margin, disc.x)),
    y: Math.max(top, Math.min(bottom, y)),
  }
}

/** The part of the stage where the map can be seen on the star layer: inside the page's controls, beside or above the card. */
export type ClearArea = { left: number; top: number; right: number; bottom: number }

/**
 * The star layer's way back (#132): once the focused star is panned out of
 * the clear area, a hint sits on the area's edge where a line from its middle
 * to the star leaves it, pointing at the star. `angle` is in radians, 0 to
 * the right, clockwise (screen y grows down); `alignX` / `alignY` say which
 * edge of the hint touches the point (0 start, 0.5 middle, 1 end), so it
 * stays inside the area. Null while the star is in the area.
 */
export function starHintSpot(
  star: { x: number; y: number },
  area: ClearArea,
  slack = 0,
): { x: number; y: number; angle: number; alignX: number; alignY: number } | null {
  if (area.right <= area.left || area.bottom <= area.top) return null
  // Within `slack` px of the area the star still counts as seen: no hint beside a star in plain sight.
  const seen = (value: number, low: number, high: number) => value >= low - slack && value <= high + slack
  if (seen(star.x, area.left, area.right) && seen(star.y, area.top, area.bottom)) return null
  const cx = (area.left + area.right) / 2
  const cy = (area.top + area.bottom) / 2
  const dx = star.x - cx
  const dy = star.y - cy
  const halfW = (area.right - area.left) / 2
  const halfH = (area.bottom - area.top) / 2
  // How far along the ray the area's edge is: the nearer of the two sides it can cross.
  const reach = Math.min(dx === 0 ? Infinity : halfW / Math.abs(dx), dy === 0 ? Infinity : halfH / Math.abs(dy))
  const x = cx + dx * reach
  const y = cy + dy * reach
  const edge = (value: number, low: number, high: number) => (value <= low + 0.5 ? 0 : value >= high - 0.5 ? 1 : 0.5)
  return { x, y, angle: Math.atan2(dy, dx), alignX: edge(x, area.left, area.right), alignY: edge(y, area.top, area.bottom) }
}
