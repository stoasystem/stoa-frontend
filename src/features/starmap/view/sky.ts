/*
 * The sky's galaxies on the camera (#119, ADR 0001). The map is one band
 * with every galaxy on it; the whole-map layer is not the whole band but a
 * window on one galaxy, at a zoom that keeps a galaxy's nebulae readable as
 * clusters: on a wide screen the galaxy in focus with the dark gaps and the
 * edges of its neighbours, on a phone a narrower window of the same layout
 * (never the band turned on its side). The header follows the galaxy at the
 * centre of the view.
 *
 * The band is a ring (#120, #117 B3): x wraps with a circumference of
 * `SKY_WRAP`, and the seam is one more gap between the last galaxy and the
 * first. Each frame every galaxy -- its haze, its nebulae, their stars -- is
 * placed at the one copy nearest the centre of the view (`galaxyTurns`), so
 * hit-testing, the parallel DOM and the lighting overlay all see exactly the
 * copy that is drawn. A galaxy moves to its other copy only when its centre
 * is half a turn from the view's, and `ringSafeZoom` keeps the window narrow
 * enough that this happens off screen: the same galaxy is never seen twice.
 */
import type { StarMap } from '@/features/starmap/model/starMap'
import { CLOUD_REACH, galaxyHazeBox } from '@/features/starmap/render/galaxy'
import { baseScale, turnsToward, usableHeight, wrapX, type Bounds, type View, type Viewport } from '@/features/starmap/view/camera'
import type { NebulaDisc } from '@/features/starmap/view/geometry'
import { PANORAMA } from '@/features/starmap/view/semanticZoom'

/** The ring's circumference in map units: the band runs over x in [0, 1] with half a gap at each end (#119). */
export const SKY_WRAP = 1

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
 * the height between the page's controls, but a landscape screen never gets
 * less than three quarters of the widest galaxy across (more, and the
 * clusters turn to grain). A screen held upright (a phone) starts one zoom
 * step further out, so the whole galaxy in view is on it (#137 A4:
 * `PANORAMA.portraitFit`). Every galaxy is seen at this one zoom, so flying
 * between them keeps their sizes comparable.
 */
export function panoramaZoom(galaxies: readonly SkyGalaxy[], bounds: Bounds, viewport: Viewport): number {
  const base = baseScale(viewport, bounds)
  const tallest = Math.max(1e-6, ...galaxies.map((g) => g.y1 - g.y0))
  const widest = Math.max(1e-6, ...galaxies.map((g) => g.x1 - g.x0))
  const across = viewport.height > viewport.width ? PANORAMA.portraitFit : 1.3
  const scale = Math.min((usableHeight(viewport) * 0.8) / tallest, (viewport.width * across) / widest)
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

/**
 * The galaxy nearest the map point `x` (inside one, or nearer its edge than
 * the next one's). On a ring (`wrap` > 0) `x` may be any turn, and the gap
 * across the seam counts like any other.
 */
export function galaxyAt(galaxies: readonly SkyGalaxy[], x: number, wrap = 0): SkyGalaxy | undefined {
  let best: SkyGalaxy | undefined
  let bestGap = Infinity
  const at = wrapX(x, wrap)
  for (const galaxy of galaxies) {
    const gapTo = (p: number) => (p < galaxy.x0 ? galaxy.x0 - p : p > galaxy.x1 ? p - galaxy.x1 : 0)
    const gap = wrap > 0 ? Math.min(gapTo(at), gapTo(at - wrap), gapTo(at + wrap)) : gapTo(at)
    if (gap < bestGap) {
      best = galaxy
      bestGap = gap
    }
  }
  return best
}

/** A galaxy's middle along the band, map units. */
export function galaxyCentre(galaxy: Pick<SkyGalaxy, 'x0' | 'x1'>): number {
  return (galaxy.x0 + galaxy.x1) / 2
}

/**
 * How many turns of the ring to add to each galaxy's x so it sits at its
 * copy nearest the view's centre `cx` (any turn). One number per galaxy:
 * a galaxy's haze, nebulae and stars always move together.
 */
export function galaxyTurns(galaxies: readonly Pick<SkyGalaxy, 'x0' | 'x1'>[], cx: number, wrap: number, out?: Float64Array): Float64Array {
  const turns = out && out.length === galaxies.length ? out : new Float64Array(galaxies.length)
  for (let g = 0; g < galaxies.length; g += 1) turns[g] = turnsToward(galaxyCentre(galaxies[g]), cx, wrap)
  return turns
}

/**
 * The farthest anything drawn for one galaxy reaches from its middle along
 * the band, map units: its haze, and every nebula's cloud.
 */
export function galaxyReach(galaxy: SkyGalaxy, discs: Iterable<NebulaDisc>): number {
  const centre = galaxyCentre(galaxy)
  const haze = galaxyHazeBox(galaxy)
  let reach = Math.max(centre - haze.x0, haze.x1 - centre)
  for (const disc of discs) reach = Math.max(reach, Math.abs(disc.x - centre) + disc.r * CLOUD_REACH)
  return reach
}

/** Screen pixels kept free beyond a galaxy's reach before it may jump to its other copy (glyphs, a beacon, a name). */
export const RING_PAD_PX = 48

/**
 * The least zoom at which the ring stays seamless: the window reaches no
 * farther from the view's centre than half a turn less the widest galaxy's
 * reach (and a little room), so a galaxy only ever jumps to its other copy
 * while all of it is off screen. `fx` is where the view's centre sits across
 * the viewport. Zero when there is no ring.
 */
export function ringSafeZoom(reach: number, wrap: number, viewport: Viewport, bounds: Bounds, fx = 0.5): number {
  const room = wrap / 2 - reach
  if (!(wrap > 0) || room <= 0 || viewport.width <= 0) return 0
  const scale = (viewport.width * Math.max(fx, 1 - fx) + RING_PAD_PX) / room
  return scale / baseScale(viewport, bounds)
}

/**
 * The next item round the ring from `from`, going right (`+1`) or left
 * (`-1`), by position along the band (`xs`, map units): after the rightmost
 * comes the leftmost, across the seam, so moving by keys never hits an end.
 * Ties keep the given order. Returns `from` when there is nothing else.
 */
export function ringNeighbour(xs: readonly number[], from: number, direction: 1 | -1): number {
  if (xs.length < 2 || from < 0 || from >= xs.length) return from
  const along = xs.map((x, i) => i).sort((a, b) => xs[a] - xs[b] || a - b)
  const at = along.indexOf(from)
  return along[(at + direction + along.length) % along.length]
}
