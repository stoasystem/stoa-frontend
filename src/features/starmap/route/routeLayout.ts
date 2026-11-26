/*
 * A star cluster's learning route (#747): the cluster's stars laid out left to right as one main line, with at most
 * `MAX_BRANCH_LANES` side paths beside it in any column.
 *
 * Pure: the same stars and prerequisites always give the same route, whatever
 * the student has lit, so a star never moves because of progress.
 *
 *   - Main line: the longest chain of the cluster's prerequisite DAG; ties go
 *     to the lower `order`, then the lower unit id. `mainline` overrides it
 *     with a hand-made list (checked against the prerequisites).
 *   - Every other star goes in the first column right of all its in-cluster
 *     prerequisites. Its anchor is the prerequisite furthest right (ties: a
 *     main-line star, then the lower lane, then the unit id); it takes the
 *     anchor's own lane when that is free there, else the nearest free lane
 *     on the anchor's side of the main line (`laneRow`), and only then moves
 *     right. Never a fourth side path in a column. Branches read as parallel
 *     tracks forking off the main line.
 *   - Prerequisites from other clusters become entrances, one chip per
 *     outside cluster, stacked in a column of their own left of column 0
 *     (`col` -1). Each lists the outside stars this cluster builds on, less
 *     the ones another listed outside star builds on (the nearer one says
 *     enough).
 *   - Lines, as a metro map: by default the main line and one line into each
 *     side star, from its anchor (`edges`), so a forest of at most N - 1
 *     lines; a side star with no prerequisite in the cluster but one outside
 *     has a short stub instead (`stubs`). Every prerequisite, and the
 *     entrance a star needs, is in `context`, drawn only for the star picked
 *     out (selected, focused or hovered).
 */
import type { Prerequisite } from '@/features/starmap/model/starMap'

/** Side paths beside the main line in one column. */
export const MAX_BRANCH_LANES = 3

/**
 * Where a lane is drawn, in lane steps from the main line (negative above):
 * lane 1 above it, lanes 2 and 3 below. A lane's side of the main line is the
 * sign of its row.
 */
export const LANE_ROW = [0, -1, 1, 2] as const

export function laneRow(lane: number): number {
  return LANE_ROW[lane] ?? 0
}

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
  /**
   * Lay out entrances (default true). Off where a cross-cluster prerequisite
   * is drawn some other way, such as the star map's lines between nebulae:
   * then no column or lane is kept for them.
   */
  entrances?: boolean
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

/** One outside cluster this cluster builds on: a chip in the column left of the route. */
export type RouteEntranceNode = {
  kind: 'entrance'
  id: string
  clusterId: string
  /** Always -1: the chips' own column, before column 0. */
  col: number
  /** Its place in the stack of chips, from 0 at the top. */
  row: number
  /** The outside stars it stands for, in the order first needed. */
  sources: EntranceSource[]
  /** The stars of this cluster that build on that cluster, in route order. */
  targets: string[]
}

export type RouteNode = RouteStarNode | RouteEntranceNode

/**
 * A line: `main` along the main line, `branch` from a side star's anchor,
 * `prerequisite` any other in-cluster prerequisite, `entrance` from a chip to
 * a star that needs that cluster.
 */
export type RouteEdge = { from: string; to: string; kind: 'main' | 'branch' | 'prerequisite' | 'entrance' }

export type RouteLayout = {
  nodes: RouteNode[]
  /** What is drawn by default: the main line and each side star's line from its anchor -- a forest. */
  edges: RouteEdge[]
  /** Every prerequisite into or out of a star, and its entrances: drawn for the star picked out. */
  context: RouteEdge[]
  /** Side stars with no prerequisite in the cluster but one outside: a short stub leads in. */
  stubs: string[]
  /** Unit ids of the main line, left to right. */
  mainline: string[]
  /** Columns of stars (the entrance chips' column not counted). */
  columns: number
  /** The highest side lane in use (0 when there is only the main line). */
  lanesUsed: number
  /** Stars placed right of the first column their prerequisites allowed, for want of a free lane. */
  shifted: number
  /** Prerequisites from other clusters, and the outside stars the chips list. */
  crossPrerequisites: { total: number; shown: number }
  /** In-cluster prerequisites dropped to break a cycle (none in a sound knowledge base). */
  cycleBreaks: Prerequisite[]
}

const byId = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)

export function layoutRoute({ stars, prerequisites, clusterOf, mainline: override, entrances = true }: RouteInput): RouteLayout {
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

  const ids = stars.map((s) => s.unitId)
  const { topo: prerequisiteOrder, cycleBreaks } = topologicalOrder(ids, preds, succs, cmp)
  for (const { from, to } of cycleBreaks) {
    preds.set(to, preds.get(to)!.filter((p) => p !== from))
    succs.set(from, succs.get(from)!.filter((s) => s !== to))
  }
  const ancestors = ancestorSets(prerequisiteOrder, preds)

  const mainline = override ? checkedMainline(override, inCluster, ancestors) : longestChain(prerequisiteOrder, succs, cmp)
  const onMain = new Set(mainline)
  // Stars are placed in this order. A hand-made main line need not follow `order`: placed in its
  // own order (it never puts a star before one of its prerequisites), its columns run left to right.
  const topo = override ? topologicalOrder(ids, withChain(preds, mainline), withChain(succs, mainline, true), cmp).topo : prerequisiteOrder

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
  /** The anchor among placed prerequisites: furthest right, then a main-line star, then `tie`, then the unit id. */
  const anchorOf = (unitId: string, tie: (p: string) => number) => {
    const ps = preds.get(unitId)!
    if (ps.length === 0) return undefined
    const far = Math.max(...ps.map((p) => col.get(p)!))
    return ps
      .filter((p) => col.get(p) === far)
      .sort((a, b) => Number(onMain.has(b)) - Number(onMain.has(a)) || tie(a) - tie(b) || byId(a, b))[0]
  }
  /** Lanes to try, best first: the anchor's own, then the nearest on its side; off the main line, nearest it first. */
  const lanesFor = (anchor: string | undefined) => {
    const all = Array.from({ length: MAX_BRANCH_LANES }, (_, i) => i + 1)
    const own = anchor === undefined ? 0 : lane.get(anchor)!
    if (own === 0) return all.sort((a, b) => Math.abs(laneRow(a)) - Math.abs(laneRow(b)) || a - b)
    const side = Math.sign(laneRow(own))
    return all
      .filter((l) => Math.sign(laneRow(l)) === side)
      .sort((a, b) => Math.abs(laneRow(a) - laneRow(own)) - Math.abs(laneRow(b) - laneRow(own)) || a - b)
  }
  let shifted = 0
  let lastMainCol = -1

  for (const unitId of topo) {
    const min = Math.max(0, ...preds.get(unitId)!.map((p) => col.get(p)! + 1))
    if (onMain.has(unitId)) {
      const c = Math.max(min, lastMainCol + 1)
      lastMainCol = c
      col.set(unitId, c)
      lane.set(unitId, 0)
      continue
    }
    const tryLanes = lanesFor(anchorOf(unitId, (p) => lane.get(p)!))
    let c = min
    let l = tryLanes.find((candidate) => lanesAt(c)[candidate] === null)
    while (l === undefined) {
      c += 1
      l = tryLanes.find((candidate) => lanesAt(c)[candidate] === null)
    }
    if (c > min) shifted += 1
    lanesAt(c)[l] = unitId
    col.set(unitId, c)
    lane.set(unitId, l)
  }

  // Entrances: one chip per outside cluster, listing what this cluster builds on there.
  const routeOrder = new Map(topo.map((id, i) => [id, i]))
  const firstNeed = new Map<string, number>()
  for (const unitId of topo) for (const s of outside.get(unitId)!) if (!firstNeed.has(s)) firstNeed.set(s, routeOrder.get(unitId)!)
  const allSources = [...firstNeed.keys()]
  const kept = entrances ? allSources.filter((s) => !allSources.some((other) => other !== s && reaches(s, other))) : []
  const chips = new Map<string, RouteEntranceNode>()
  for (const s of [...kept].sort((a, b) => firstNeed.get(a)! - firstNeed.get(b)! || byId(a, b))) {
    const clusterId = clusterOf.get(s)!
    if (!chips.has(clusterId)) chips.set(clusterId, { kind: 'entrance', id: `entrance:${clusterId}`, clusterId, col: -1, row: chips.size, sources: [], targets: [] })
    chips.get(clusterId)!.sources.push({ unitId: s, clusterId })
  }
  const chipNeeds = new Map<string, string[]>()
  for (const unitId of topo) {
    const needs = [...new Set(outside.get(unitId)!.map((s) => clusterOf.get(s)!))].filter((id) => chips.has(id))
    chipNeeds.set(unitId, needs)
    for (const id of needs) chips.get(id)!.targets.push(unitId)
  }

  const nodes: RouteNode[] = [
    ...chips.values(),
    ...topo
      .map((unitId): RouteStarNode => ({ kind: 'star', id: unitId, unitId, col: col.get(unitId)!, lane: lane.get(unitId)!, main: onMain.has(unitId) }))
      .sort((a, b) => a.col - b.col || a.lane - b.lane),
  ]

  // By default: the main line, and each side star's one line from its anchor (ties now to the same lane).
  const edges: RouteEdge[] = []
  for (let i = 1; i < mainline.length; i += 1) edges.push({ from: mainline[i - 1], to: mainline[i], kind: 'main' })
  for (const to of topo) {
    if (onMain.has(to)) continue
    const own = lane.get(to)!
    const anchor = anchorOf(to, (p) => (lane.get(p) === own ? 0 : 1))
    if (anchor !== undefined) edges.push({ from: anchor, to, kind: 'branch' })
  }
  const drawn = new Set(edges.map((e) => `${e.from}\n${e.to}`))
  const context: RouteEdge[] = [...edges]
  for (const to of topo) {
    for (const from of preds.get(to)!) if (!drawn.has(`${from}\n${to}`)) context.push({ from, to, kind: 'prerequisite' })
    for (const id of chipNeeds.get(to)!) context.push({ from: `entrance:${id}`, to, kind: 'entrance' })
  }
  const stubs = topo.filter((unitId) => !onMain.has(unitId) && preds.get(unitId)!.length === 0 && chipNeeds.get(unitId)!.length > 0)

  return {
    nodes,
    edges,
    context,
    stubs,
    mainline,
    columns: topo.reduce((max, unitId) => Math.max(max, col.get(unitId)! + 1), 0),
    lanesUsed: topo.reduce((max, unitId) => Math.max(max, lane.get(unitId)!), 0),
    shifted,
    crossPrerequisites: { total: crossTotal, shown: kept.length },
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

/** `links` with each star of `chain` also linked to the one after it (`forward`) or before it. */
function withChain(links: ReadonlyMap<string, string[]>, chain: readonly string[], forward = false) {
  const out = new Map([...links].map(([id, list]) => [id, [...list]]))
  for (let i = 1; i < chain.length; i += 1) {
    const [at, other] = forward ? [chain[i - 1], chain[i]] : [chain[i], chain[i - 1]]
    if (!out.get(at)!.includes(other)) out.get(at)!.push(other)
  }
  return out
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
