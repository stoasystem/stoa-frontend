/*
 * Star clusters and their learning routes (#747): the layout's invariants on
 * small hand-made graphs and on the real mathematics knowledge base, and the
 * metro map drawn by default -- one line into each side star, from its anchor
 * -- with one entrance chip per outside cluster.
 */
import { describe, expect, it } from 'vitest'
import { demoClusterMap, knowledgeBaseOf } from '@/dev/demo/clusters/demoClusterMap'
import { clustersOf, type StarCluster } from '@/features/starmap/route/clusters'
import { COMPACT, NAME_LINES, NARROW_NAME, nameWidth, routeGeometry, WIDE, type Point } from '@/features/starmap/route/routeGeometry'
import { layoutRoute, laneRow, MAX_BRANCH_LANES, type RouteLayout, type RouteStarNode } from '@/features/starmap/route/routeLayout'
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
  // At most three side stars in any column, one per lane; one main star per column.
  const byColumn = new Map<number, number[]>()
  for (const n of route.nodes) if (n.kind === 'star') byColumn.set(n.col, [...(byColumn.get(n.col) ?? []), n.lane])
  for (const lanes of byColumn.values()) {
    expect(lanes.filter((l) => l > 0).length).toBeLessThanOrEqual(MAX_BRANCH_LANES)
    expect(new Set(lanes).size).toBe(lanes.length)
    expect(lanes.every((l) => l >= 0 && l <= MAX_BRANCH_LANES)).toBe(true)
  }
  // The main line strictly left to right, on lane 0, and only main stars on lane 0.
  const mainCols = route.mainline.map((id) => col.get(id)!)
  mainCols.forEach((c, i) => i > 0 && expect(c).toBeGreaterThan(mainCols[i - 1]))
  for (const n of route.nodes) if (n.kind === 'star') expect(n.lane === 0).toBe(route.mainline.includes(n.unitId))
  // Entrances sit in their own column, before every star.
  for (const n of route.nodes) if (n.kind === 'entrance') expect(n.col).toBe(-1)
  // A forest by default: the main line, and at most one line into each side star, from a prerequisite left of it.
  const stars = route.nodes.filter((n): n is RouteStarNode => n.kind === 'star')
  expect(route.edges.length).toBeLessThanOrEqual(Math.max(0, stars.length - 1))
  const into = new Map<string, number>()
  for (const e of route.edges) into.set(e.to, (into.get(e.to) ?? 0) + 1)
  for (const n of stars) expect(into.get(n.id) ?? 0, n.id).toBeLessThanOrEqual(1)
  for (const e of route.edges) {
    expect(e.kind === 'main' || e.kind === 'branch').toBe(true)
    if (e.kind === 'branch') expect(prerequisites.some((p) => p.from === e.from && p.to === e.to), `${e.from} -> ${e.to}`).toBe(true)
  }
  // The context holds every in-cluster prerequisite.
  for (const { from, to } of prerequisites) {
    if (members.has(from) && members.has(to)) expect(route.context.some((e) => e.from === from && e.to === to), `${from} -> ${to}`).toBe(true)
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

  it('never opens a fourth side path in a column: the fourth and fifth parallel stars move right', () => {
    // root -> s1..s5 and root -> m1 -> m2: five side stars all wanting column 1.
    const ids = ['root', 'm1', 'm2', 's1', 's2', 's3', 's4', 's5']
    const prereqs = edges(['root', 'm1'], ['m1', 'm2'], ...['s1', 's2', 's3', 's4', 's5'].map((s): [string, string] => ['root', s]))
    const route = layoutRoute({ stars: stars(...ids), prerequisites: prereqs, clusterOf: none })
    expect(route.mainline).toEqual(['root', 'm1', 'm2'])
    expect(route.shifted).toBe(2)
    expect(route.lanesUsed).toBe(3)
    expectInvariants(route, ids, prereqs)
  })

  it('gives each outside cluster one entrance chip, stacked left of the route, with every star it stands for', () => {
    const clusterOf = new Map([['x1', 'other'], ['x2', 'other'], ['y1', 'third']])
    // a and b both start the cluster and need outside stars; c needs x1 again, far to the right.
    const prereqs = edges(['x1', 'a'], ['x2', 'b'], ['y1', 'b'], ['a', 'c'], ['x1', 'c'], ['b', 'c'])
    const route = layoutRoute({ stars: stars('a', 'b', 'c'), prerequisites: prereqs, clusterOf })
    const chips = route.nodes.filter((n) => n.kind === 'entrance')
    expect(chips.map((n) => n.kind === 'entrance' && [n.clusterId, n.col, n.row, n.sources.map((s) => s.unitId), n.targets])).toEqual([
      ['other', -1, 0, ['x1', 'x2'], ['a', 'b', 'c']],
      ['third', -1, 1, ['y1'], ['b']],
    ])
    expect(route.crossPrerequisites).toEqual({ total: 4, shown: 3 })
    // No dashed line by default; the context has one from each chip a star needs.
    expect(route.edges.some((e) => e.kind === 'entrance')).toBe(false)
    expect(route.context.filter((e) => e.kind === 'entrance').map((e) => `${e.from}>${e.to}`)).toEqual([
      'entrance:other>a',
      'entrance:other>b',
      'entrance:third>b',
      'entrance:other>c',
    ])
    expectInvariants(route, ['a', 'b', 'c'], prereqs)
  })

  it('leads a side star with nothing before it in the cluster in by a stub from its entrance', () => {
    const clusterOf = new Map([['x1', 'other']])
    // a -> b -> c is the main line; s starts a side path from outside.
    const prereqs = edges(['a', 'b'], ['b', 'c'], ['x1', 's'])
    const route = layoutRoute({ stars: stars('a', 'b', 'c', 's'), prerequisites: prereqs, clusterOf })
    expect(route.stubs).toEqual(['s'])
    expect(route.edges.some((e) => e.to === 's')).toBe(false)
  })

  it('leaves out an outside star that another outside star the same star needs builds on', () => {
    const clusterOf = new Map([['x1', 'other'], ['x2', 'other']])
    const prereqs = edges(['x1', 'x2'], ['x1', 'a'], ['x2', 'a'])
    const route = layoutRoute({ stars: stars('a'), prerequisites: prereqs, clusterOf })
    const entrance = route.nodes.find((n) => n.kind === 'entrance')
    expect(entrance?.kind === 'entrance' && entrance.sources.map((s) => s.unitId)).toEqual(['x2'])
  })

  it('draws one line into each side star, from its anchor; the rest only in its context', () => {
    // a -> b -> c -> e main; d needs a and b (anchor b, the one further right); e also needs d.
    const prereqs = edges(['a', 'b'], ['b', 'c'], ['c', 'e'], ['a', 'd'], ['b', 'd'], ['d', 'e'])
    const route = layoutRoute({ stars: stars('a', 'b', 'c', 'd', 'e'), prerequisites: prereqs, clusterOf: none })
    expect(route.mainline).toEqual(['a', 'b', 'c', 'e'])
    expect(route.edges.map((e) => `${e.from}>${e.to}:${e.kind}`)).toEqual(['a>b:main', 'b>c:main', 'c>e:main', 'b>d:branch'])
    expect(route.context.filter((e) => e.kind === 'prerequisite').map((e) => `${e.from}>${e.to}`).sort()).toEqual(['a>d', 'd>e'])
  })

  it('puts a side star in its anchor lane when it is free, else on the same side, and only then further right', () => {
    // m0 -> m1 -> m2 -> m3 main. s1 forks off m0 (lane 1), t1 follows s1: it takes lane 1 too.
    // u1 and u2 also follow s1 in the same column: lane 1 is t1's, and lane 1 is the only lane above,
    // so they move right rather than cross to the other side.
    const ids = ['m0', 'm1', 'm2', 'm3', 's1', 't1', 'u1']
    const prereqs = edges(['m0', 'm1'], ['m1', 'm2'], ['m2', 'm3'], ['m0', 's1'], ['s1', 't1'], ['s1', 'u1'])
    const route = layoutRoute({ stars: stars(...ids), prerequisites: prereqs, clusterOf: none })
    const at = (id: string) => route.nodes.find((n) => n.id === id) as RouteStarNode
    expect([at('s1').col, at('s1').lane]).toEqual([1, 1])
    expect([at('t1').col, at('t1').lane]).toEqual([2, 1])
    expect([at('u1').col, at('u1').lane]).toEqual([3, 1])
    expect(route.shifted).toBe(1)
    // Below the main line the same: lane 2's follower takes lane 2, then lane 3 next to it.
    const below = layoutRoute({
      stars: stars('m0', 'm1', 'm2', 'm3', 'up', 'down', 'd1', 'd2'),
      prerequisites: edges(['m0', 'm1'], ['m1', 'm2'], ['m2', 'm3'], ['m0', 'up'], ['m0', 'down'], ['down', 'd1'], ['down', 'd2']),
      clusterOf: none,
    })
    const b = (id: string) => below.nodes.find((n) => n.id === id) as RouteStarNode
    expect([b('up').lane, b('down').lane]).toEqual([1, 2])
    expect([b('d1').col, b('d1').lane, b('d2').col, b('d2').lane]).toEqual([2, 2, 2, 3])
    expectInvariants(route, ids, prereqs)
  })

  it('takes a hand-made main line, and refuses one against the prerequisites', () => {
    const prereqs = edges(['a', 'b'], ['b', 'c'], ['a', 'd'])
    const route = layoutRoute({ stars: stars('a', 'b', 'c', 'd'), prerequisites: prereqs, clusterOf: none, mainline: ['a', 'd'] })
    expect(route.mainline).toEqual(['a', 'd'])
    expectInvariants(route, ['a', 'b', 'c', 'd'], prereqs)
    expect(() => layoutRoute({ stars: stars('a', 'b'), prerequisites: prereqs, clusterOf: none, mainline: ['b', 'a'] })).toThrow(/prerequisite/)
    expect(() => layoutRoute({ stars: stars('a', 'b'), prerequisites: prereqs, clusterOf: none, mainline: ['a', 'zz'] })).toThrow(/not in this cluster/)
  })

  it('places a hand-made main line in its own order, not the stars’ order', () => {
    // Two topics of unrelated stars, each numbered from 1: by `order` they would interleave.
    const ids = ['x1', 'x2', 'x3', 'y1', 'y2']
    const route = layoutRoute({
      stars: [...ids.map((unitId) => ({ unitId, order: Number(unitId.slice(1)) })), { unitId: 'x2-side', order: 1 }],
      prerequisites: edges(['y1', 'y2'], ['x2', 'x2-side']),
      clusterOf: none,
      mainline: ids,
    })
    const col = new Map(route.nodes.map((n) => [n.id, n.col]))
    expect(ids.map((id) => col.get(id))).toEqual([0, 1, 2, 3, 4])
    expect(col.get('x2-side')).toBe(2)
    expectInvariants(route, [...ids, 'x2-side'], edges(['y1', 'y2'], ['x2', 'x2-side']))
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
    expect(knowledgeBaseOf('math')).toHaveLength(98)
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

  it.each(['numbers', 'geometry', 'algebra', 'data'])('gives %s one entrance chip per outside cluster', (clusterId) => {
    const route = byId.get(clusterId)!.route
    const chips = route.nodes.filter((n) => n.kind === 'entrance')
    const outside = chips.map((n) => n.kind === 'entrance' && n.clusterId)
    expect(new Set(outside).size).toBe(outside.length)
    expect(outside).not.toContain(clusterId)
    for (const n of chips) if (n.kind === 'entrance') expect(n.sources.every((s) => s.clusterId === n.clusterId)).toBe(true)
  })

  it('keeps the entrances of Equations and algebra few', () => {
    const route = byId.get('algebra')!.route
    expect(route.crossPrerequisites.total).toBeGreaterThan(20)
    expect(route.crossPrerequisites.shown).toBeLessThan(route.crossPrerequisites.total)
    expect(route.nodes.filter((n) => n.kind === 'entrance').length).toBeLessThanOrEqual(3)
  })

  it.each(['numbers', 'geometry', 'algebra', 'data'])('draws %s as a forest by default, its side stars in their anchor lanes where free', (clusterId) => {
    const cluster = byId.get(clusterId)!
    const route = cluster.route
    const stars = route.nodes.filter((n): n is RouteStarNode => n.kind === 'star')
    expect(route.edges.length).toBeLessThanOrEqual(stars.length - 1)
    const lane = new Map(stars.map((n) => [n.id, n.lane]))
    // A side star off a side star sits on its anchor's side of the main line.
    for (const e of route.edges) {
      if (e.kind !== 'branch' || lane.get(e.from) === 0) continue
      expect(Math.sign(laneRow(lane.get(e.to)!)), `${e.from} -> ${e.to}`).toBe(Math.sign(laneRow(lane.get(e.from)!)))
    }
  })

  it.each(['numbers', 'geometry', 'algebra', 'data'])('puts no name of %s on a line drawn by default', (clusterId) => {
    const cluster = byId.get(clusterId)!
    const route = cluster.route
    const names = new Map(cluster.stars.map((s) => [s.unitId, s.name]))
    const geometry = routeGeometry(route, WIDE, (unitId) => names.get(unitId) ?? '')
    // Each name's box: as wide as its text (13 px type, two lines at most), on its side of the glyph.
    const boxes = route.nodes.flatMap((n) => {
      if (n.kind !== 'star') return []
      const p = geometry.position.get(n.id)!
      const half = geometry.glyph(n) / 2
      const text = names.get(n.unitId) ?? ''
      const align = geometry.labelAlign.get(n.id)
      const max = align === 'narrow' ? (WIDE.colW - 12) * NARROW_NAME.share : WIDE.colW - 12
      const w = Math.min(max, text.length * 7) / 2
      const lines = Math.min(align === 'narrow' ? NARROW_NAME.lines : 2, Math.ceil((text.length * 7) / max))
      const h = lines * 16
      const above = geometry.labelSide.get(n.id) === 'above'
      const [x0, x1] = align === 'end' ? [p.x + half - 2 * w, p.x + half] : align === 'start' ? [p.x - half, p.x - half + 2 * w] : [p.x - w, p.x + w]
      return [{ id: n.id, x0, x1, y0: above ? p.y - half - 6 - h : p.y + half + 6, y1: above ? p.y - half - 6 : p.y + half + 6 + h }]
    })
    const inside = (q: Point, b: (typeof boxes)[number]) => q.x > b.x0 && q.x < b.x1 && q.y > b.y0 && q.y < b.y1
    const hits: string[] = []
    for (const e of route.edges) {
      const points = geometry.line(e.from, e.to).points
      for (const b of boxes) if (points.some((q) => inside(q, b))) hits.push(`${e.from} -> ${e.to} over ${b.id}`)
    }
    expect(hits).toEqual([])
    // Nor on another name.
    const covered = boxes.flatMap((a, i) => boxes.slice(i + 1).filter((b) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1).map((b) => `${a.id} / ${b.id}`))
    expect(covered).toEqual([])
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

describe('names on the route, on a phone and a wide screen (#747)', () => {
  const map = demoClusterMap('en')
  const nameOf = new Map(map.stars.map((s) => [s.unitId, s.name]))

  it.each([
    ['phone', COMPACT],
    ['wide', WIDE],
  ] as const)('keeps every name inside the scene, clear of the chapter headers above it: %s', (_size, g) => {
    for (const cluster of clustersOf(map, 'en')) {
      const geometry = routeGeometry(cluster.route, g, (id) => nameOf.get(id) ?? '')
      for (const [id, box] of geometry.labelBox) {
        // Not past the left or right edge, where it would be cut off unseen.
        expect(box.x0, `${cluster.clusterId} ${id}`).toBeGreaterThanOrEqual(0)
        expect(box.x1, `${cluster.clusterId} ${id}`).toBeLessThanOrEqual(geometry.width)
        // Not up into the headers' band, which ends where the route's own area begins.
        expect(box.y0, `${cluster.clusterId} ${id}`).toBeGreaterThanOrEqual(0)
      }
    }
  })

  it('wraps a long name to at most three lines, then an ellipsis', () => {
    expect(NAME_LINES).toBe(3)
    expect(nameWidth('Organising data and showing it in charts', COMPACT).lines).toBe(3)
    expect(nameWidth('A name far, far too long to ever fit in three narrow lines of a phone', COMPACT).lines).toBe(3)
    expect(nameWidth('Angles', COMPACT).lines).toBe(1)
  })
})
