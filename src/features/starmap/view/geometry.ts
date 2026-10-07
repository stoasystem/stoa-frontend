/*
 * Where each nebula is, derived from its stars: the read model places stars
 * and says which nebula each belongs to (#72 point 4); a nebula is the disc
 * around them.
 */
import type { StarMap } from '@/features/starmap/model/starMap'
import type { Bounds } from '@/features/starmap/view/camera'

export type NebulaDisc = { x: number; y: number; r: number }

/** A nebula of one star still gets a small disc. */
const MIN_RADIUS = 0.02

export function nebulaDiscs(map: Pick<StarMap, 'nebulae' | 'stars'>): Map<string, NebulaDisc> {
  const sums = new Map<string, { x: number; y: number; n: number }>()
  for (const star of map.stars) {
    const sum = sums.get(star.nebulaId) ?? { x: 0, y: 0, n: 0 }
    sum.x += star.x
    sum.y += star.y
    sum.n += 1
    sums.set(star.nebulaId, sum)
  }
  const discs = new Map<string, NebulaDisc>()
  for (const [id, sum] of sums) discs.set(id, { x: sum.x / sum.n, y: sum.y / sum.n, r: MIN_RADIUS })
  for (const star of map.stars) {
    const disc = discs.get(star.nebulaId)!
    disc.r = Math.max(disc.r, Math.hypot(star.x - disc.x, star.y - disc.y) * 1.12 + 0.01)
  }
  return discs
}

/** The part of the map that holds anything. */
export function mapBounds(discs: ReadonlyMap<string, NebulaDisc>): Bounds {
  if (discs.size === 0) return { minX: 0, minY: 0, maxX: 1, maxY: 1 }
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const disc of discs.values()) {
    minX = Math.min(minX, disc.x - disc.r)
    minY = Math.min(minY, disc.y - disc.r)
    maxX = Math.max(maxX, disc.x + disc.r)
    maxY = Math.max(maxY, disc.y + disc.r)
  }
  return { minX, minY, maxX, maxY }
}

/**
 * A typical gap between neighbouring stars, in map units: the median over
 * nebulae of the room each star gets. The drawn glyph size follows it.
 */
export function typicalSpacing(map: Pick<StarMap, 'stars'>, discs: ReadonlyMap<string, NebulaDisc>): number {
  const counts = new Map<string, number>()
  for (const star of map.stars) counts.set(star.nebulaId, (counts.get(star.nebulaId) ?? 0) + 1)
  const spacings = [...counts].map(([id, n]) => (discs.get(id)?.r ?? MIN_RADIUS) * Math.sqrt(Math.PI / n))
  if (spacings.length === 0) return 0.05
  spacings.sort((a, b) => a - b)
  return spacings[Math.floor(spacings.length / 2)]
}

/**
 * One sky's clouds are dense at the core and sparse at the rim, so the room
 * a star gets is not its nebula's area over its count: the median distance
 * to the nearest star of the same nebula, scaled to match `typicalSpacing`
 * on an even spread, keeps glyphs in a dense core from piling up.
 */
export function cloudSpacing(map: Pick<StarMap, 'stars'>, discs: ReadonlyMap<string, NebulaDisc>): number {
  const byNebula = new Map<string, { x: number; y: number }[]>()
  for (const star of map.stars) {
    const list = byNebula.get(star.nebulaId) ?? []
    list.push(star)
    byNebula.set(star.nebulaId, list)
  }
  const nearest: number[] = []
  for (const list of byNebula.values()) {
    for (let i = 0; i < list.length; i += 1) {
      let best = Infinity
      for (let j = 0; j < list.length; j += 1) {
        if (i !== j) best = Math.min(best, Math.hypot(list[i].x - list[j].x, list[i].y - list[j].y))
      }
      if (Number.isFinite(best)) nearest.push(best)
    }
  }
  if (nearest.length < 8) return typicalSpacing(map, discs)
  nearest.sort((a, b) => a - b)
  return nearest[Math.floor(nearest.length / 2)] * 1.35
}
