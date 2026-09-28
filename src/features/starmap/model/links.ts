/*
 * The lines on the star map, derived from unit prerequisites (#72 points 2
 * and 3); nothing is maintained by hand.
 *
 * Between nebulae: nebula B is joined to nebula A when any star in B has a
 * star in A as a prerequisite. The line's thickness and brightness follow how
 * many such prerequisites there are. Direction does not matter for the line,
 * so A -> B and B -> A add to the same one.
 *
 * Inside a nebula: its own prerequisite lines, shown only when the map is
 * zoomed into that nebula.
 */
import type { Prerequisite, StarMap } from '@/features/starmap/model/starMap'

export type NebulaLink = {
  /** The two topics, in id order. */
  a: string
  b: string
  /** How many unit prerequisites cross between them. */
  count: number
}

export function nebulaLinks(map: Pick<StarMap, 'stars' | 'prerequisites'>): NebulaLink[] {
  const nebulaOf = new Map(map.stars.map((star) => [star.unitId, star.nebulaId]))
  const links = new Map<string, NebulaLink>()
  for (const { from, to } of map.prerequisites) {
    const a = nebulaOf.get(from)
    const b = nebulaOf.get(to)
    if (!a || !b || a === b) continue
    const [first, second] = a < b ? [a, b] : [b, a]
    const key = `${first}\u0000${second}`
    const link = links.get(key)
    if (link) link.count += 1
    else links.set(key, { a: first, b: second, count: 1 })
  }
  return [...links.values()].sort((x, y) => (x.a < y.a ? -1 : x.a > y.a ? 1 : x.b < y.b ? -1 : x.b > y.b ? 1 : 0))
}

/** The prerequisites between two stars of the same nebula. */
export function innerLinks(map: Pick<StarMap, 'stars' | 'prerequisites'>, nebulaId: string): Prerequisite[] {
  const nebulaOf = new Map(map.stars.map((star) => [star.unitId, star.nebulaId]))
  return map.prerequisites.filter(
    ({ from, to }) => from !== to && nebulaOf.get(from) === nebulaId && nebulaOf.get(to) === nebulaId,
  )
}

/** Line width (CSS px) and alpha for a link carrying `count` prerequisites. */
export function linkWeight(count: number): { width: number; alpha: number } {
  return {
    width: Math.min(4, 0.8 + 0.6 * Math.sqrt(Math.max(1, count))),
    alpha: Math.min(0.5, 0.14 + 0.06 * Math.max(1, count)),
  }
}
