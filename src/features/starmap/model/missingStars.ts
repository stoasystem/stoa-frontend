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
  /**
   * The prerequisites along the path, from a missing star into another one or
   * into the target, each only where no longer way along the path already
   * leads (`reducePathEdges`). `main` marks the one chain drawn brightest:
   * from `first` to the target (`mainChain`).
   */
  edges: PathEdge[]
}

/** A prerequisite on the path; `main` when it is on the chain from the first missing star to the target. */
export type PathEdge = Prerequisite & { main: boolean }

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
  const all: Prerequisite[] = []
  for (const to of [...missing, targetId]) {
    for (const from of before.get(to) ?? []) if (onPath.has(from)) all.push({ from, to })
  }
  const reduced = reducePathEdges(all)
  const chain = mainChain(reduced, first, targetId, [...missing, targetId])
  const edges = reduced.map(({ from, to }) => ({ from, to, main: chain.has(`${from}:${to}`) }))
  return { target: targetId, missing, first, edges }
}

/**
 * The path's prerequisites without the long jumps: `a -> c` goes where `c` is
 * still reached from `a` along the others (`a -> b -> c`). Every star reaches
 * just what it reached before -- so every missing star still leads into the
 * target -- by fewer lines: the whole web of prerequisites behind a far star
 * drew dozens of them over each other. Taken out one at a time in the order
 * given, each against what is left, so a loop keeps one way round; each test
 * is a walk that visits a star once, so a loop never hangs it. Only a star
 * with more than one line out can have one to spare.
 */
export function reducePathEdges<E extends Prerequisite>(edges: readonly E[]): E[] {
  const kept = [...edges]
  const out = new Map<string, E[]>()
  for (const edge of kept) out.set(edge.from, [...(out.get(edge.from) ?? []), edge])
  for (const edge of edges) {
    const fromHere = out.get(edge.from)!
    if (fromHere.length < 2) continue
    // Is `to` reached from `from` without this line?
    const seen = new Set([edge.from])
    const queue = fromHere.filter((other) => other !== edge).map((other) => other.to)
    let reached = false
    while (queue.length > 0 && !reached) {
      const at = queue.shift()!
      if (at === edge.to) reached = true
      else if (!seen.has(at)) {
        seen.add(at)
        for (const next of out.get(at) ?? []) queue.push(next.to)
      }
    }
    if (!reached) continue
    out.set(edge.from, fromHere.filter((other) => other !== edge))
    kept.splice(kept.indexOf(edge), 1)
  }
  return kept
}

/**
 * The chain drawn brightest (#489): the fewest lines from `first` to
 * `target`, as `from:to` keys; where two are as short, the one through the
 * star first in `order` (course order, the target last). Empty when no way
 * leads there.
 */
function mainChain(edges: readonly Prerequisite[], first: string, target: string, order: readonly string[]): Set<string> {
  const rank = new Map(order.map((id, i) => [id, i]))
  const out = new Map<string, string[]>()
  for (const { from, to } of edges) out.set(from, [...(out.get(from) ?? []), to])
  for (const list of out.values()) list.sort((a, b) => (rank.get(a) ?? Infinity) - (rank.get(b) ?? Infinity))
  const came = new Map<string, string>()
  const seen = new Set([first])
  const queue = [first]
  while (queue.length > 0 && !seen.has(target)) {
    const at = queue.shift()!
    for (const next of out.get(at) ?? []) {
      if (seen.has(next)) continue
      seen.add(next)
      came.set(next, at)
      queue.push(next)
    }
  }
  const chain = new Set<string>()
  for (let at = target; came.has(at); at = came.get(at)!) chain.add(`${came.get(at)}:${at}`)
  return chain
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
