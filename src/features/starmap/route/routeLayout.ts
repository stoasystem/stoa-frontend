/*
 * A star cluster's learning route (prototype, `src/dev/clusters.html`): the
 * cluster's stars laid out left to right as one main line, with at most
 * `MAX_BRANCH_LANES` side paths beside it in any column.
 *
 * Pure: the same stars and prerequisites always give the same route, whatever
 * the student has lit, so a star never moves because of progress.
 *
 *   - Main line: the longest chain of the cluster's prerequisite DAG; ties go
 *     to the lower `order`, then the lower unit id. `mainline` overrides it
 *     with a hand-made list (checked against the prerequisites).
 *   - Every other star goes in the first column right of all its in-cluster
 *     prerequisites, in a side lane 1..3; when that column's lanes are full it
 *     moves right. Never a fourth side path in a column.
 *   - Prerequisites from other clusters become entrances: a node in a side
 *     lane just before the star that needs them, which leads to the other
 *     cluster. Restrained so they do not drown the route: each outside star
 *     opens one entrance only, at the first star that needs it (later stars
 *     reach it through that one); an outside star that is itself a
 *     prerequisite of another outside star already shown, or of another the
 *     same star needs, is left out (the nearer one says enough); entrances
 *     that land in one column are one node listing their sources, and a star
 *     whose entrance would open within `MERGE_REACH` columns after another
 *     joins that one instead.
 *   - Lines: the main line joins consecutive main stars; the side lines are the
 *     transitive reduction of the in-cluster prerequisites (an edge implied by
 *     a longer path is not drawn).
 */
import type { Prerequisite } from '@/features/starmap/model/starMap'

/** Side paths beside the main line in one column, entrances included. */
export const MAX_BRANCH_LANES = 3

/** How many columns back a star's entrance may sit, to share an entrance already there. */
export const MERGE_REACH = 2

export type RouteStarInput = { unitId: string; order: number }

export type RouteInput = {
  /** The cluster's stars. */
  stars: readonly RouteStarInput[]
  /** Every prerequisite known, those across clusters included. */
  prerequisites: readonly Prerequisite[]
  /** The cluster of any star outside this one; a prerequisite from a star it does not know is ignored. */
  clusterOf: ReadonlyMap<string, string>
  /** A hand-made main line, to override the computed one (in order, left to right). */
  mainline?: readonly string[]
}

export type RouteStarNode = {
  kind: 'star'
  id: string
  unitId: string
  col: number
  /** 0 is the main line, 1..MAX_BRANCH_LANES the side lanes. */
  lane: number
  main: boolean
}

export type EntranceSource = { unitId: string; clusterId: string }

export type RouteEntranceNode = {
  kind: 'entrance'
  id: string
  col: number
  lane: number
  /** The outside stars this entrance leads to, in the order first needed. */
  sources: EntranceSource[]
  /** The stars of this cluster that need them. */
  targets: string[]
}

export type RouteNode = RouteStarNode | RouteEntranceNode

export type RouteEdge = { from: string; to: string; kind: 'main' | 'branch' | 'entrance' }

export type RouteLayout = {
  nodes: RouteNode[]
  edges: RouteEdge[]
  /** Unit ids of the main line, left to right. */
  mainline: string[]
  columns: number
  /** The highest side lane in use (0 when there is only the main line). */
  lanesUsed: number
  /** Nodes placed right of the first column their prerequisites allowed, for want of a free lane. */
  shifted: number
  /** Prerequisites from other clusters, before and after the restraint above. */
  crossPrerequisites: { total: number; shown: number }
  /** In-cluster prerequisites dropped to break a cycle (none in a sound knowledge base). */
  cycleBreaks: Prerequisite[]
}

const byId = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)

export function layoutRoute({ stars, prerequisites, clusterOf, mainline: override }: RouteInput): RouteLayout {
  const order = new Map(stars.map((star) => [star.unitId, star.order]))
  const inCluster = (unitId: string) => order.has(unitId)
  const cmp = (a: string, b: string) => (order.get(a) ?? 0) - (order.get(b) ?? 0) || byId(a, b)

  const preds = new Map<string, string[]>(stars.map((s) => [s.unitId, []]))
  const succs = new Map<string, string[]>(stars.map((s) => [s.unitId, []]))
  const outside = new Map<string, string[]>(stars.map((s) => [s.unitId, []]))
  const seen = new Set<string>()
  let crossTotal = 0
  for (const { from, to } of prerequisites) {
    if (!inCluster(to) || from === to || seen.has(`${from}\n${to}`)) continue
    seen.add(`${from}\n${to}`)
    if (inCluster(from)) {
      preds.get(to)!.push(from)
      succs.get(from)!.push(to)
    } else if (clusterOf.has(from)) {
      outside.get(to)!.push(from)
      crossTotal += 1
    }
  }

  const { topo, cycleBreaks } = topologicalOrder(stars.map((s) => s.unitId), preds, succs, cmp)
  for (const { from, to } of cycleBreaks) {
    preds.set(to, preds.get(to)!.filter((p) => p !== from))
    succs.set(from, succs.get(from)!.filter((s) => s !== to))
  }
  const ancestors = ancestorSets(topo, preds)

  const mainline = override ? checkedMainline(override, inCluster, ancestors) : longestChain(topo, succs, cmp)
  const onMain = new Set(mainline)

  // Outside stars and how they relate, for leaving out the ones a nearer one implies.
  const globalPreds = new Map<string, string[]>()
  for (const { from, to } of prerequisites) {
    if (!globalPreds.has(to)) globalPreds.set(to, [])
    globalPreds.get(to)!.push(from)
  }
  const reaches = (from: string, to: string) => {
    const stack = [...(globalPreds.get(to) ?? [])]
    const visited = new Set<string>()
    while (stack.length) {
      const next = stack.pop()!
      if (next === from) return true
      if (visited.has(next)) continue
      visited.add(next)
      stack.push(...(globalPreds.get(next) ?? []))
    }
    return false
  }

  const col = new Map<string, number>()
  const lane = new Map<string, number>()
  const laneTaken = new Map<number, (string | null)[]>()
  const lanesAt = (c: number) => {
    if (!laneTaken.has(c)) laneTaken.set(c, Array.from({ length: MAX_BRANCH_LANES + 1 }, () => null))
    return laneTaken.get(c)!
  }
  const freeLane = (c: number, preferred?: number) => {
    const lanes = lanesAt(c)
    if (preferred && preferred >= 1 && lanes[preferred] === null) return preferred
    for (let l = 1; l <= MAX_BRANCH_LANES; l += 1) if (lanes[l] === null) return l
    return null
  }
  const entranceAt = new Map<number, RouteEntranceNode>()
  const opened = new Set<string>()
  let shifted = 0
  let shown = 0
  let lastMainCol = -1

  for (const unitId of topo) {
    let min = Math.max(0, ...preds.get(unitId)!.map((p) => col.get(p)! + 1))
    const isMain = onMain.has(unitId)
    const wanted = isMain ? Math.max(min, lastMainCol + 1) : min

    // Entrances for what this star needs from other clusters.
    const needed = outside.get(unitId)!
    const fresh = needed
      .filter((s) => !opened.has(s))
      .filter((s) => ![...needed, ...opened].some((other) => other !== s && reaches(s, other)))
      .sort(byId)
    if (fresh.length > 0) {
      const target = Math.max(0, wanted - 1)
      // Join an entrance up to MERGE_REACH columns back before opening another.
      let c = target
      for (let back = 0; back <= MERGE_REACH && target - back >= 0; back += 1) {
        if (entranceAt.has(target - back)) {
          c = target - back
          break
        }
      }
      for (;;) {
        if (entranceAt.has(c) || freeLane(c) !== null) break
        c += 1
      }
      if (c > target) shifted += 1
      let entrance = entranceAt.get(c)
      if (!entrance) {
        const l = freeLane(c)!
        entrance = { kind: 'entrance', id: `entrance:${c}`, col: c, lane: l, sources: [], targets: [] }
        lanesAt(c)[l] = entrance.id
        entranceAt.set(c, entrance)
      }
      for (const s of fresh) {
        opened.add(s)
        entrance.sources.push({ unitId: s, clusterId: clusterOf.get(s)! })
      }
      entrance.targets.push(unitId)
      shown += fresh.length
      min = Math.max(min, c + 1)
    }

    if (isMain) {
      const c = Math.max(min, lastMainCol + 1)
      lastMainCol = c
      col.set(unitId, c)
      lane.set(unitId, 0)
      continue
    }
    const preferred = preds.get(unitId)!.map((p) => lane.get(p)!).find((l) => l > 0)
    let c = min
    let l = freeLane(c, preferred)
    while (l === null) {
      c += 1
      l = freeLane(c, preferred)
    }
    if (c > min) shifted += 1
    lanesAt(c)[l] = unitId
    col.set(unitId, c)
    lane.set(unitId, l)
  }

  const nodes: RouteNode[] = [
    ...topo.map((unitId): RouteStarNode => ({
      kind: 'star',
      id: unitId,
      unitId,
      col: col.get(unitId)!,
      lane: lane.get(unitId)!,
      main: onMain.has(unitId),
    })),
    ...entranceAt.values(),
  ].sort((a, b) => a.col - b.col || a.lane - b.lane)

  const edges: RouteEdge[] = []
  for (let i = 1; i < mainline.length; i += 1) edges.push({ from: mainline[i - 1], to: mainline[i], kind: 'main' })
  const mainPair = new Set(edges.map((e) => `${e.from}\n${e.to}`))
  for (const to of topo) {
    const ps = preds.get(to)!
    for (const from of ps) {
      if (mainPair.has(`${from}\n${to}`)) continue
      // Implied by a longer path: another prerequisite of `to` already builds on `from`.
      if (ps.some((other) => other !== from && ancestors.get(other)!.has(from))) continue
      edges.push({ from, to, kind: 'branch' })
    }
  }
  for (const entrance of entranceAt.values()) {
    for (const to of entrance.targets) edges.push({ from: entrance.id, to, kind: 'entrance' })
  }

  return {
    nodes,
    edges,
    mainline,
    columns: nodes.reduce((max, n) => Math.max(max, n.col + 1), 0),
    lanesUsed: nodes.reduce((max, n) => Math.max(max, n.lane), 0),
    shifted,
    crossPrerequisites: { total: crossTotal, shown },
    cycleBreaks,
  }
}

/** Kahn's order, lowest `(order, id)` first among the stars free to go; a cycle is broken at its lowest star. */
function topologicalOrder(
  ids: string[],
  preds: ReadonlyMap<string, string[]>,
  succs: ReadonlyMap<string, string[]>,
  cmp: (a: string, b: string) => number,
) {
  const waiting = new Map(ids.map((id) => [id, new Set(preds.get(id))]))
  const topo: string[] = []
  const cycleBreaks: Prerequisite[] = []
  const done = new Set<string>()
  while (topo.length < ids.length) {
    const free = ids.filter((id) => !done.has(id) && waiting.get(id)!.size === 0).sort(cmp)
    let next = free[0]
    if (next === undefined) {
      next = ids.filter((id) => !done.has(id)).sort(cmp)[0]
      for (const from of waiting.get(next)!) cycleBreaks.push({ from, to: next })
      waiting.get(next)!.clear()
    }
    done.add(next)
    topo.push(next)
    for (const s of succs.get(next) ?? []) waiting.get(s)?.delete(next)
  }
  return { topo, cycleBreaks }
}

function ancestorSets(topo: readonly string[], preds: ReadonlyMap<string, string[]>) {
  const ancestors = new Map<string, Set<string>>()
  for (const id of topo) {
    const set = new Set<string>()
    for (const p of preds.get(id)!) {
      set.add(p)
      for (const a of ancestors.get(p)!) set.add(a)
    }
    ancestors.set(id, set)
  }
  return ancestors
}

/** The longest chain, starting from the longest-reaching star; ties to the lower `(order, id)`. */
function longestChain(topo: readonly string[], succs: ReadonlyMap<string, string[]>, cmp: (a: string, b: string) => number) {
  const reach = new Map<string, number>()
  for (const id of [...topo].reverse()) {
    reach.set(id, 1 + Math.max(0, ...succs.get(id)!.map((s) => reach.get(s)!)))
  }
  const best = (ids: readonly string[]) =>
    [...ids].sort((a, b) => reach.get(b)! - reach.get(a)! || cmp(a, b))[0] as string | undefined
  const chain: string[] = []
  let at = best(topo)
  while (at !== undefined) {
    chain.push(at)
    const want = reach.get(at)! - 1
    at = best(succs.get(at)!.filter((s) => reach.get(s) === want))
  }
  return chain
}

function checkedMainline(
  mainline: readonly string[],
  inCluster: (unitId: string) => boolean,
  ancestors: ReadonlyMap<string, Set<string>>,
) {
  const seen = new Set<string>()
  mainline.forEach((unitId, i) => {
    if (!inCluster(unitId)) throw new Error(`Main line override: ${unitId} is not in this cluster`)
    if (seen.has(unitId)) throw new Error(`Main line override: ${unitId} is listed twice`)
    seen.add(unitId)
    for (const later of mainline.slice(i + 1)) {
      if (ancestors.get(unitId)!.has(later)) {
        throw new Error(`Main line override: ${later} is a prerequisite of ${unitId}, so it cannot come after it`)
      }
    }
  })
  return [...mainline]
}
