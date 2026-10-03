/*
 * The sky's galaxies on the camera (#119, ADR 0001). The map is one band
 * with every galaxy on it; the whole-map layer is not the whole band but a
 * window on one galaxy, at a zoom that keeps a galaxy's nebulae readable as
 * clusters: on a wide screen the galaxy in focus with the dark gaps and the
 * edges of its neighbours, on a phone a narrower window of the same layout
 * (never the band turned on its side). The header follows the galaxy at the
 * centre of the view.
 */
import type { StarMap } from '@/features/starmap/model/starMap'
import { baseScale, usableHeight, type Bounds, type View, type Viewport } from '@/features/starmap/view/camera'

export type SkyGalaxy = {
  subjectId: string
  name: string
  enrolled: boolean
  /** The box around its stars, map units. */
  x0: number
  x1: number
  y0: number
  y1: number
  /** Its nebula indices are found by `subjectId`; its base tint, 0 (blue-violet) .. 1 (warm gold). */
  tint: number
}

/** A galaxy the student does not take is drawn at this share of its brightness (#117 C4). */
export const NOT_ENROLLED_DIM = 0.4

/**
 * Base tints along the band, between blue-violet and warm gold (#117 B2:
 * no rainbow). Spread over however many galaxies there are.
 */
export function galaxyTint(index: number, count: number): number {
  return count <= 1 ? 0.3 : 0.12 + (0.66 * index) / (count - 1)
}

/** The galaxies of a sky map, left to right, each boxed round its own stars. */
export function skyGalaxies(map: Pick<StarMap, 'nebulae' | 'stars' | 'subjects'>): SkyGalaxy[] {
  const subjectOf = new Map(map.nebulae.map((nebula) => [nebula.topicId, nebula.subjectId]))
  const boxes = new Map<string, { x0: number; x1: number; y0: number; y1: number }>()
  for (const star of map.stars) {
    const id = subjectOf.get(star.nebulaId)
    if (!id) continue
    const box = boxes.get(id) ?? { x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity }
    box.x0 = Math.min(box.x0, star.x)
    box.x1 = Math.max(box.x1, star.x)
    box.y0 = Math.min(box.y0, star.y)
    box.y1 = Math.max(box.y1, star.y)
    boxes.set(id, box)
  }
  const along = [...boxes].sort(([, a], [, b]) => a.x0 - b.x0)
  return along.map(([subjectId, box], index) => {
    const galaxy = map.subjects.find((subject) => subject.subjectId === subjectId)
    return {
      subjectId,
      name: galaxy?.name ?? subjectId,
      enrolled: galaxy?.enrolled ?? true,
      ...box,
      tint: galaxyTint(index, along.length),
    }
  })
}

/** The band: every galaxy, with room above and below for their haze to fade. */
export function skyBounds(galaxies: readonly SkyGalaxy[]): Bounds {
  if (galaxies.length === 0) return { minX: 0, minY: 0, maxX: 1, maxY: 1 }
  const minY = Math.min(...galaxies.map((g) => g.y0))
  const maxY = Math.max(...galaxies.map((g) => g.y1))
  const pad = (maxY - minY) * 0.08
  return {
    minX: Math.min(...galaxies.map((g) => g.x0)) - pad,
    maxX: Math.max(...galaxies.map((g) => g.x1)) + pad,
    minY: minY - pad,
    maxY: maxY + pad,
  }
}

/**
 * The whole-map layer's zoom over the band: the tallest galaxy fills 80% of
 * the height between the page's controls, but a phone never gets less than
 * three quarters of the widest galaxy across (more, and the clusters turn
 * to grain). Every galaxy is seen at this one zoom, so flying between them
 * keeps their sizes comparable.
 */
export function panoramaZoom(galaxies: readonly SkyGalaxy[], bounds: Bounds, viewport: Viewport): number {
  const base = baseScale(viewport, bounds)
  const tallest = Math.max(1e-6, ...galaxies.map((g) => g.y1 - g.y0))
  const widest = Math.max(1e-6, ...galaxies.map((g) => g.x1 - g.x0))
  const scale = Math.min((usableHeight(viewport) * 0.8) / tallest, (viewport.width * 1.3) / widest)
  return Math.max(1, scale / base)
}

/** The whole-map view of one galaxy, centred between the page's controls. */
export function galaxyView(galaxy: SkyGalaxy, galaxies: readonly SkyGalaxy[], bounds: Bounds, viewport: Viewport): View {
  const fy = viewport.height > 0 ? ((viewport.top ?? 0) + usableHeight(viewport) / 2) / viewport.height : 0.5
  return {
    cx: (galaxy.x0 + galaxy.x1) / 2,
    cy: (bounds.minY + bounds.maxY) / 2,
    k: panoramaZoom(galaxies, bounds, viewport),
    fx: 0.5,
    fy,
  }
}

/** The galaxy nearest the map point `x` (inside one, or nearer its edge than the next one's). */
export function galaxyAt(galaxies: readonly SkyGalaxy[], x: number): SkyGalaxy | undefined {
  let best: SkyGalaxy | undefined
  let bestGap = Infinity
  for (const galaxy of galaxies) {
    const gap = x < galaxy.x0 ? galaxy.x0 - x : x > galaxy.x1 ? x - galaxy.x1 : 0
    if (gap < bestGap) {
      best = galaxy
      bestGap = gap
    }
  }
  return best
}
