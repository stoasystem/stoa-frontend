/*
 * Finding a star (#489, CONTEXT.md「找星」): the stars the student is missing
 * on the way to the star they asked for, and the one to learn first.
 *
 * The missing stars (缺的星, #478): from the target star back along its
 * prerequisites, every star not lit yet -- forks too, prerequisites in other
 * subjects too. The walk stops at a lit star: what lies behind it is already
 * covered by it. A star's prerequisites are the sky's edges and the unlit
 * ones it names itself (`unlitPrerequisiteIds`). The first missing star is the one of them on the outer edge
 * (外缘: its own prerequisites all lit, or none), first in course order
 * (`compareStars`: galaxy and nebula order, then unit order). Pure: no
 * screen, no route; the map route draws the path (#488) and Murmi names the
 * first star.
 *
 * A lit target, or one whose prerequisites are all lit, has no path: finding
 * it is what it was before (#487).
 */
import { compareStars, nebulaOrderOf, type Prerequisite, type StarMap } from '@/features/starmap/model/starMap'

export type FindStarPath = {
  /** The star asked for. */
  target: string
  /** Every missing star, in course order. Never empty. */
  missing: string[]
  /** The missing star to learn first: on the outer edge, first in course order. */
  first: string
  /** The prerequisites along the path: from a missing star into another one or into the target. */
  edges: Prerequisite[]
}

/**
 * The missing stars on the way to `targetId`, in course order: every star not
 * lit reached from it back along `prerequisites`, each once, the target
 * itself never (a loop back to it included). Empty for a lit target, for one
 * whose prerequisites are all lit, and for a star the map does not hold.
 */
export function missingStars(map: Pick<StarMap, 'stars' | 'nebulae' | 'prerequisites'>, targetId: string): string[] {
  const byId = new Map(map.stars.map((star) => [star.unitId, star]))
  const target = byId.get(targetId)
  if (!target || target.state === 'lit') return []
  const before = prerequisitesByStar(map)
  const seen = new Set([targetId])
  const missing: string[] = []
  const queue = [targetId]
  while (queue.length > 0) {
    const at = queue.shift()!
    for (const from of before.get(at) ?? []) {
      const star = byId.get(from)
      // Not on the map, or lit: nothing to learn there, and the walk does not go past it.
      if (!star || star.state === 'lit' || seen.has(from)) continue
      seen.add(from)
      missing.push(from)
      queue.push(from)
    }
  }
  const order = compareStars(nebulaOrderOf(map))
  return missing.map((id) => byId.get(id)!).sort(order).map((star) => star.unitId)
}

/** The path to `targetId` (#489): its missing stars, the first of them, and the prerequisites between them. Null when nothing is missing. */
export function findStarPath(map: Pick<StarMap, 'stars' | 'nebulae' | 'prerequisites'>, targetId: string): FindStarPath | null {
  const missing = missingStars(map, targetId)
  if (missing.length === 0) return null
  const lit = new Set(map.stars.filter((star) => star.state === 'lit').map((star) => star.unitId))
  const known = new Set(map.stars.map((star) => star.unitId))
  const before = prerequisitesByStar(map)
  // On the outer edge: every prerequisite it has on the map is lit. Course order already holds.
  const outer = missing.filter((id) => (before.get(id) ?? []).every((from) => !known.has(from) || lit.has(from)))
  // Only a loop with no way in leaves no star on the edge: then the first in course order.
  const first = outer[0] ?? missing[0]
  const onPath = new Set(missing)
  const edges: Prerequisite[] = []
  for (const to of [...missing, targetId]) {
    for (const from of before.get(to) ?? []) if (onPath.has(from)) edges.push({ from, to })
  }
  return { target: targetId, missing, first, edges }
}

/**
 * Each star's prerequisites, once each, self-loops left out: the sky's
 * edges, and the unlit ones a star names itself (`unlitPrerequisiteIds`,
 * stoa-backend#125) -- the same prerequisites, but a sky read without its
 * edges (the design preview's, unless asked for) still names them there.
 */
function prerequisitesByStar(map: Pick<StarMap, 'stars' | 'prerequisites'>): Map<string, string[]> {
  const before = new Map<string, string[]>()
  const add = (from: string, to: string) => {
    if (from === to) return
    const list = before.get(to)
    if (!list) before.set(to, [from])
    else if (!list.includes(from)) list.push(from)
  }
  for (const { from, to } of map.prerequisites) add(from, to)
  for (const star of map.stars) for (const from of star.unlitPrerequisiteIds) add(from, star.unitId)
  return before
}
