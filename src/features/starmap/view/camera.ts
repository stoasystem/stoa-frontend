/*
 * The camera over the star map (#72 point 5): a flat map, panned and zoomed,
 * never rotated.
 *
 * The map lives in normalised coordinates, [0, 1] on both axes. A view names
 * the map point `(cx, cy)` to show at the screen position `(fx, fy)` (a
 * fraction of the viewport: 0.5 is the middle) and a zoom `k`. At `k = 1` the
 * whole map fits the viewport.
 */

/**
 * The page area, CSS px. `top` and `bottom` are bands the page keeps for its
 * own controls (the subject switcher above, the legend below); the whole map
 * fits between them.
 */
export type Viewport = { width: number; height: number; top?: number; bottom?: number }

/** The height left for the map between the page's own controls. */
export function usableHeight({ height, top = 0, bottom = 0 }: Viewport): number {
  return Math.max(height * 0.4, height - top - bottom)
}

export type View = {
  cx: number
  cy: number
  k: number
  fx: number
  fy: number
}

/** The part of the map that holds anything, in map units. */
export type Bounds = { minX: number; minY: number; maxX: number; maxY: number }

export const UNIT_BOUNDS: Bounds = { minX: 0, minY: 0, maxX: 1, maxY: 1 }

/**
 * Pixels per map unit at `k = 1`: the map's bounds fill 90% of the width or
 * 92% of the height between the page's own controls, whichever is tighter.
 */
export function baseScale(viewport: Viewport, bounds: Bounds): number {
  const bw = Math.max(1e-6, bounds.maxX - bounds.minX)
  const bh = Math.max(1e-6, bounds.maxY - bounds.minY)
  return Math.max(1, Math.min((viewport.width * 0.9) / bw, (usableHeight(viewport) * 0.92) / bh))
}

export type Transform = { scale: number; ox: number; oy: number }

/** screen = o + map * scale. */
export function transformOf(view: View, viewport: Viewport, bounds: Bounds): Transform {
  const scale = baseScale(viewport, bounds) * view.k
  return {
    scale,
    ox: viewport.width * view.fx - view.cx * scale,
    oy: viewport.height * view.fy - view.cy * scale,
  }
}

export function toScreen(t: Transform, x: number, y: number): [number, number] {
  return [t.ox + x * t.scale, t.oy + y * t.scale]
}

export function toMap(t: Transform, sx: number, sy: number): [number, number] {
  return [(sx - t.ox) / t.scale, (sy - t.oy) / t.scale]
}

/** The whole map, centred in the band between the page's own controls. */
export function overviewView(bounds: Bounds, viewport?: Viewport): View {
  const fy = viewport && viewport.height > 0 ? ((viewport.top ?? 0) + usableHeight(viewport) / 2) / viewport.height : 0.5
  return { cx: (bounds.minX + bounds.maxX) / 2, cy: (bounds.minY + bounds.maxY) / 2, k: 1, fx: 0.5, fy }
}

/** Keep the focus point over the map: a pan may not lose the map off screen. */
export function clampView(view: View, bounds: Bounds): View {
  return {
    ...view,
    cx: Math.min(bounds.maxX, Math.max(bounds.minX, view.cx)),
    cy: Math.min(bounds.maxY, Math.max(bounds.minY, view.cy)),
  }
}

/** Move the view by a screen-space drag of `(dx, dy)` pixels. */
export function panBy(view: View, dx: number, dy: number, viewport: Viewport, bounds: Bounds): View {
  const scale = baseScale(viewport, bounds) * view.k
  return clampView({ ...view, cx: view.cx - dx / scale, cy: view.cy - dy / scale }, bounds)
}
