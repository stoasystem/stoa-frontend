/*
 * Chapters of a star cluster's route (#747): a column range each, cut from
 * the route as laid out, so no star moves. The mathematics table on the real
 * knowledge base, the automatic cut for a cluster without an entry, and the
 * fallback when an entry does not fit its route.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { demoClusterMap } from '@/dev/demo/clusters/demoClusterMap'
import { AUTO_CHAPTER_MAIN_STARS, CHAPTER_TABLE, chaptersOf, type RouteChapter } from '@/features/starmap/route/chapters'
import { clustersOf } from '@/features/starmap/route/clusters'
import { layoutRoute, type RouteLayout } from '@/features/starmap/route/routeLayout'

afterEach(() => {
  vi.restoreAllMocks()
})

function expectCover(chapters: RouteChapter[], route: RouteLayout) {
  const stars = route.nodes.filter((n) => n.kind === 'star')
  // Every star in exactly one chapter.
  const all = chapters.flatMap((c) => c.stars)
  expect([...all].sort()).toEqual(stars.map((n) => n.unitId).sort())
  // Contiguous, from the first column to the last.
  expect(chapters[0].fromCol).toBe(0)
  chapters.forEach((c, i) => {
    expect(c.number).toBe(i + 1)
    expect(c.toCol).toBeGreaterThanOrEqual(c.fromCol)
    if (i > 0) expect(c.fromCol).toBe(chapters[i - 1].toCol + 1)
  })
  expect(chapters[chapters.length - 1].toCol).toBe(route.columns - 1)
  // A star's chapter is the one whose columns hold it.
  for (const n of stars) {
    const c = chapters.find((chapter) => chapter.stars.includes(n.id))!
    expect(n.col).toBeGreaterThanOrEqual(c.fromCol)
    expect(n.col).toBeLessThanOrEqual(c.toCol)
  }
}

describe('the chapters of mathematics', () => {
  const clusters = clustersOf(demoClusterMap('en'), 'en')

  it.each(['numbers', 'geometry', 'algebra', 'data'])('cut %s by the table: three to five chapters, every star in one', (clusterId) => {
    const cluster = clusters.find((c) => c.clusterId === clusterId)!
    const chapters = chaptersOf(cluster.route, clusterId, 'en')
    expect(chapters.map((c) => c.chapterId)).toEqual(CHAPTER_TABLE[clusterId].map((d) => d.chapterId))
    expect(chapters.length).toBeGreaterThanOrEqual(3)
    expect(chapters.length).toBeLessThanOrEqual(5)
    expect(chapters.every((c) => c.name !== null)).toBe(true)
    // Each table start is on the main line, where its chapter begins.
    for (const d of CHAPTER_TABLE[clusterId]) expect(cluster.route.mainline).toContain(d.start)
    expectCover(chapters, cluster.route)
  })

  it('names chapters in the language asked for', () => {
    const geometry = clusters.find((c) => c.clusterId === 'geometry')!
    expect(chaptersOf(geometry.route, 'geometry', 'en').map((c) => c.name)).toEqual([
      'Shapes and measures',
      'Lines and angles',
      'Triangles',
      'Trigonometry and circles',
      'Vectors',
    ])
    expect(chaptersOf(geometry.route, 'geometry', 'de')[2].name).toBe('Dreiecke')
  })

  it('has every name in four languages', () => {
    for (const chapters of Object.values(CHAPTER_TABLE)) {
      for (const d of chapters) for (const name of Object.values(d.names)) expect(name.length).toBeGreaterThan(0)
      for (const d of chapters) expect(Object.keys(d.names).sort()).toEqual(['de', 'en', 'fr', 'it'])
    }
  })
})

describe('a cluster the table does not cut', () => {
  // A main line of ten, with a side star beside every other one.
  const ids = Array.from({ length: 10 }, (_, i) => `m${i}`)
  const sides = ids.filter((_, i) => i % 2 === 0).map((id) => `${id}-side`)
  const route = layoutRoute({
    stars: [...ids, ...sides].map((unitId, i) => ({ unitId, order: i })),
    prerequisites: [...ids.slice(1).map((to, i) => ({ from: ids[i], to })), ...sides.map((to) => ({ from: to.replace('-side', ''), to }))],
    clusterOf: new Map(),
  })

  it(`is cut every ${AUTO_CHAPTER_MAIN_STARS} main-line stars, the names left to the caller`, () => {
    const chapters = chaptersOf(route, 'logik', 'en')
    expect(chapters.map((c) => c.name)).toEqual([null, null, null])
    expect(chapters.map((c) => [c.fromCol, c.toCol])).toEqual([
      [0, 3],
      [4, 7],
      [8, route.columns - 1],
    ])
    expectCover(chapters, route)
  })

  it('folds a last chapter of one main-line star into the one before', () => {
    const nine = layoutRoute({ stars: ids.slice(0, 9).map((unitId, i) => ({ unitId, order: i })), prerequisites: ids.slice(1, 9).map((to, i) => ({ from: ids[i], to })), clusterOf: new Map() })
    expect(chaptersOf(nine, 'logik', 'en').map((c) => [c.fromCol, c.toCol])).toEqual([
      [0, 3],
      [4, 8],
    ])
  })

  it('is cut automatically, with a warning, when its entry starts a chapter off the main line', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const bad = { logik: [{ chapterId: 'x', start: 'm0-side', names: { de: 'X', en: 'X', fr: 'X', it: 'X' } }] }
    const chapters = chaptersOf(route, 'logik', 'en', bad)
    expect(chapters.map((c) => c.name)).toEqual([null, null, null])
    expect(warn).toHaveBeenCalled()
    expectCover(chapters, route)
  })
})
