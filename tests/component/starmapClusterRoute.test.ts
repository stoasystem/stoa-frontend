/*
 * Star clusters and their learning routes (prototype, `starmap-clusters`):
 * the layout's invariants on small hand-made graphs and on the real
 * mathematics knowledge base.
 */
import { describe, expect, it } from 'vitest'
import { demoClusterMap } from '@/dev/demo/clusters/demoClusterMap'
import { MATH_KNOWLEDGE_BASE } from '@/dev/demo/clusters/mathKnowledgeBase'
import { clustersOf, type StarCluster } from '@/features/starmap/route/clusters'
import { layoutRoute, MAX_BRANCH_LANES, type RouteLayout } from '@/features/starmap/route/routeLayout'
import type { Prerequisite } from '@/features/starmap/model/starMap'

const stars = (...ids: string[]) => ids.map((unitId, i) => ({ unitId, order: i + 1 }))
const edges = (...pairs: [string, string][]): Prerequisite[] => pairs.map(([from, to]) => ({ from, to }))
const none = new Map<string, string>()

function expectInvariants(route: RouteLayout, unitIds: readonly string[], prerequisites: readonly Prerequisite[]) {
  const starNodes = route.nodes.filter((n) => n.kind === 'star')
  // Every star of the cluster exactly once.
  expect(starNodes.map((n) => n.unitId).sort()).toEqual([...unitIds].sort())
  const col = new Map(route.nodes.map((n) => [n.id, n.col]))
  // Every in-cluster prerequisite runs left to right.
  const members = new Set(unitIds)
  for (const { from, to } of prerequisites) {
    if (members.has(from) && members.has(to)) expect(col.get(from)!, `${from} -> ${to}`).toBeLessThan(col.get(to)!)
  }
  // At most three side nodes (entrances included) in any column, one per lane; one main star per column.
  const byColumn = new Map<number, number[]>()
  for (const n of route.nodes) byColumn.set(n.col, [...(byColumn.get(n.col) ?? []), n.lane])
  for (const lanes of byColumn.values()) {
    expect(lanes.filter((l) => l > 0).length).toBeLessThanOrEqual(MAX_BRANCH_LANES)
    expect(new Set(lanes).size).toBe(lanes.length)
    expect(lanes.every((l) => l >= 0 && l <= MAX_BRANCH_LANES)).toBe(true)
  }
  // The main line strictly left to right, on lane 0, and only main stars on lane 0.
  const mainCols = route.mainline.map((id) => col.get(id)!)
  mainCols.forEach((c, i) => i > 0 && expect(c).toBeGreaterThan(mainCols[i - 1]))
  for (const n of route.nodes) expect(n.lane === 0).toBe(n.kind === 'star' && route.mainline.includes(n.unitId))
  // Entrances come before every star they lead into.
  for (const n of route.nodes) {
    if (n.kind === 'entrance') for (const t of n.targets) expect(n.col).toBeLessThan(col.get(t)!)
  }
}

describe('layoutRoute', () => {
  it('takes the longest chain as the main line, ties by order then id', () => {
    // a -> b -> d, a -> c -> d, d -> e: two chains of four; b has the lower order.
    const prereqs = edges(['a', 'b'], ['a', 'c'], ['b', 'd'], ['c', 'd'], ['d', 'e'])
    const route = layoutRoute({ stars: stars('a', 'b', 'c', 'd', 'e'), prerequisites: prereqs, clusterOf: none })
    expect(route.mainline).toEqual(['a', 'b', 'd', 'e'])
    expect(route.nodes.find((n) => n.id === 'c')).toMatchObject({ col: 1, lane: 1 })
    expectInvariants(route, ['a', 'b', 'c', 'd', 'e'], prereqs)
  })

  it('does not trust order over the prerequisites', () => {
    // Order says z first, the prerequisites say z comes last.
    const prereqs = edges(['a', 'b'], ['b', 'z'])
    const route = layoutRoute({ stars: [{ unitId: 'z', order: 1 }, { unitId: 'a', order: 2 }, { unitId: 'b', order: 3 }], prerequisites: prereqs, clusterOf: none })
    expect(route.mainline).toEqual(['a', 'b', 'z'])
  })

  it('never opens a fourth side path in a column: the fifth parallel star moves right', () => {
    // root -> s1..s5 and root -> m1 -> m2: five side stars all wanting column 1.
    const ids = ['root', 'm1', 'm2', 's1', 's2', 's3', 's4', 's5']
    const prereqs = edges(['root', 'm1'], ['m1', 'm2'], ...['s1', 's2', 's3', 's4', 's5'].map((s): [string, string] => ['root', s]))
    const route = layoutRoute({ stars: stars(...ids), prerequisites: prereqs, clusterOf: none })
    expect(route.mainline).toEqual(['root', 'm1', 'm2'])
    expect(route.shifted).toBe(2)
    expect(route.lanesUsed).toBe(3)
    expectInvariants(route, ids, prereqs)
  })

  it('merges entrances in one column and opens each outside star once', () => {
    const clusterOf = new Map([['x1', 'other'], ['x2', 'other'], ['y1', 'third']])
    // a and b both start the cluster and need outside stars; c needs x1 again.
    const prereqs = edges(['x1', 'a'], ['x2', 'b'], ['y1', 'b'], ['a', 'c'], ['x1', 'c'], ['b', 'c'])
    const route = layoutRoute({ stars: stars('a', 'b', 'c'), prerequisites: prereqs, clusterOf })
    const entrances = route.nodes.filter((n) => n.kind === 'entrance')
    expect(entrances).toHaveLength(1)
    expect(entrances[0]).toMatchObject({ col: 0, targets: ['a', 'b'] })
    expect(entrances[0].kind === 'entrance' && entrances[0].sources.map((s) => s.unitId)).toEqual(['x1', 'x2', 'y1'])
    expect(route.crossPrerequisites).toEqual({ total: 4, shown: 3 })
    expectInvariants(route, ['a', 'b', 'c'], prereqs)
  })

  it('leaves out an outside star that another outside star the same star needs builds on', () => {
    const clusterOf = new Map([['x1', 'other'], ['x2', 'other']])
    const prereqs = edges(['x1', 'x2'], ['x1', 'a'], ['x2', 'a'])
    const route = layoutRoute({ stars: stars('a'), prerequisites: prereqs, clusterOf })
    const entrance = route.nodes.find((n) => n.kind === 'entrance')
    expect(entrance?.kind === 'entrance' && entrance.sources.map((s) => s.unitId)).toEqual(['x2'])
  })

  it('draws only the edges no longer path implies', () => {
    const prereqs = edges(['a', 'b'], ['b', 'c'], ['a', 'c'], ['a', 'd'], ['d', 'c'])
    const route = layoutRoute({ stars: stars('a', 'b', 'c', 'd'), prerequisites: prereqs, clusterOf: none })
    const drawn = route.edges.map((e) => `${e.from}>${e.to}:${e.kind}`).sort()
    expect(drawn).toEqual(['a>b:main', 'a>d:branch', 'b>c:main', 'd>c:branch'])
  })

  it('takes a hand-made main line, and refuses one against the prerequisites', () => {
    const prereqs = edges(['a', 'b'], ['b', 'c'], ['a', 'd'])
    const route = layoutRoute({ stars: stars('a', 'b', 'c', 'd'), prerequisites: prereqs, clusterOf: none, mainline: ['a', 'd'] })
    expect(route.mainline).toEqual(['a', 'd'])
    expectInvariants(route, ['a', 'b', 'c', 'd'], prereqs)
    expect(() => layoutRoute({ stars: stars('a', 'b'), prerequisites: prereqs, clusterOf: none, mainline: ['b', 'a'] })).toThrow(/prerequisite/)
    expect(() => layoutRoute({ stars: stars('a', 'b'), prerequisites: prereqs, clusterOf: none, mainline: ['a', 'zz'] })).toThrow(/not in this cluster/)
  })

  it('breaks a cycle instead of hanging', () => {
    const prereqs = edges(['a', 'b'], ['b', 'a'])
    const route = layoutRoute({ stars: stars('a', 'b'), prerequisites: prereqs, clusterOf: none })
    expect(route.cycleBreaks).toHaveLength(1)
    expect(route.nodes).toHaveLength(2)
  })
})

describe('the real mathematics knowledge base', () => {
  const map = demoClusterMap('en')
  const clusters = clustersOf(map, 'en')
  const byId = new Map(clusters.map((c) => [c.clusterId, c]))

  it('has 98 stars in the four clusters of the table', () => {
    expect(MATH_KNOWLEDGE_BASE).toHaveLength(98)
    expect(clusters.map((c) => [c.clusterId, c.total])).toEqual([
      ['numbers', 29],
      ['geometry', 32],
      ['algebra', 23],
      ['data', 14],
    ])
  })

  it.each(['numbers', 'geometry', 'algebra', 'data'])('lays out %s within the invariants', (clusterId) => {
    const cluster = byId.get(clusterId) as StarCluster
    expectInvariants(cluster.route, cluster.stars.map((s) => s.unitId), map.prerequisites)
    expect(cluster.route.cycleBreaks).toEqual([])
  })

  it('keeps the entrances of Equations and algebra few', () => {
    const route = byId.get('algebra')!.route
    const entrances = route.nodes.filter((n) => n.kind === 'entrance')
    expect(route.crossPrerequisites.total).toBeGreaterThan(20)
    expect(route.crossPrerequisites.shown).toBeLessThan(route.crossPrerequisites.total)
    expect(entrances.length).toBeLessThanOrEqual(4)
  })

  it('lays out the same route whatever is lit', () => {
    const bare = { ...map, stars: map.stars.map((s) => ({ ...s, state: 'ready' as const })) }
    expect(clustersOf(bare, 'en').map((c) => c.route)).toEqual(clusters.map((c) => c.route))
  })

  it('suggests the recommended star in its cluster, and a star to go on with in every other', () => {
    expect(byId.get('numbers')!.next?.recommendation).not.toBeNull()
    for (const cluster of clusters) expect(cluster.next?.state).toBe('in_progress')
  })

  it('gives a topic missing from the table a cluster of its own', () => {
    const extra = {
      ...map,
      nebulae: [...map.nebulae, { topicId: 'logik', name: 'Logic', order: 99, subjectId: map.subject.subjectId }],
      stars: [...map.stars, { ...map.stars[0], unitId: 'logik-1', nebulaId: 'logik', name: 'Truth tables' }],
    }
    const all = clustersOf(extra, 'en')
    const own = all[all.length - 1]
    expect(own).toMatchObject({ clusterId: 'logik', name: 'Logic', total: 1 })
  })
})
