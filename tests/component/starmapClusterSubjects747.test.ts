/*
 * Star clusters for every subject of the knowledge base (#747): physics,
 * German and English in clusters like mathematics. The tables cover the
 * knowledge base, each cluster's chapters fit its route, and a cluster of
 * themes runs as one main line, topic by topic.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { demoClusterMap, knowledgeBaseOf, type DemoClusterSubject } from '@/dev/demo/clusters/demoClusterMap'
import { KNOWLEDGE_BASE, KNOWLEDGE_BASE_TOPICS } from '@/dev/demo/clusters/knowledgeBase'
import { CHAPTER_TABLE, chaptersOf } from '@/features/starmap/route/chapters'
import { CLUSTER_TABLE, clustersOf } from '@/features/starmap/route/clusters'
import type { RouteStarNode } from '@/features/starmap/route/routeLayout'

afterEach(() => {
  vi.restoreAllMocks()
})

const SUBJECTS: readonly DemoClusterSubject[] = ['math', 'physics', 'german', 'english']
const CLUSTERS: Record<DemoClusterSubject, string[]> = {
  math: ['numbers', 'geometry', 'algebra', 'data'],
  physics: ['physics-mechanics', 'physics-electricity', 'physics-waves'],
  german: ['german-words', 'german-sentences', 'german-reading', 'german-language'],
  english: ['english-grammar', 'english-me', 'english-out', 'english-world'],
}
/** Clusters whose main line is hand-made, every star on it: topic by topic. */
const ONE_LINE = ['english-me', 'english-out', 'english-world', 'german-sentences', 'german-reading', 'german-language']

describe('the cluster table', () => {
  it('puts every topic of the knowledge base in exactly one cluster', () => {
    const topics = [...new Set(KNOWLEDGE_BASE.map((star) => star.topicId))]
    expect(topics).toHaveLength(7 + 6 + 8 + 14)
    for (const topicId of topics) expect(CLUSTER_TABLE.filter((d) => d.topicIds.includes(topicId)), topicId).toHaveLength(1)
    // And names no topic the knowledge base does not have.
    for (const d of CLUSTER_TABLE) for (const topicId of d.topicIds) expect(topics, d.clusterId).toContain(topicId)
  })

  it('has cluster ids unique across subjects, none of them a topic id', () => {
    const ids = CLUSTER_TABLE.map((d) => d.clusterId)
    expect(new Set(ids).size).toBe(ids.length)
    const topics = new Set(KNOWLEDGE_BASE.map((star) => star.topicId))
    for (const id of ids) expect(topics.has(id), id).toBe(false)
  })

  it('names every cluster in four languages', () => {
    for (const d of CLUSTER_TABLE) {
      expect(Object.keys(d.names).sort()).toEqual(['de', 'en', 'fr', 'it'])
      for (const name of Object.values(d.names)) expect(name.length, d.clusterId).toBeGreaterThan(0)
    }
  })

  it('knows the topics of physics, German and English by the backend’s names', () => {
    expect(KNOWLEDGE_BASE_TOPICS.map((t) => t.subjectId).filter((s, i, all) => all.indexOf(s) === i)).toEqual(['english', 'physics', 'german'])
    expect(SUBJECTS.map((s) => knowledgeBaseOf(s).length)).toEqual([98, 35, 52, 83])
  })
})

describe.each(SUBJECTS)('the clusters of %s', (subject) => {
  const map = demoClusterMap('en', subject)
  const clusters = clustersOf(map, 'en')

  it('come in the table’s order, every star in one', () => {
    expect(clusters.map((c) => c.clusterId)).toEqual(CLUSTERS[subject])
    expect(clusters.reduce((sum, c) => sum + c.total, 0)).toBe(map.stars.length)
    for (const c of clusters) expect(c.route.cycleBreaks).toEqual([])
  })

  it('are each cut into the table’s chapters, with no fallback, none empty', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    for (const cluster of clusters) {
      const chapters = chaptersOf(cluster.route, cluster.clusterId, 'en')
      expect(chapters.map((c) => c.chapterId), cluster.clusterId).toEqual(CHAPTER_TABLE[cluster.clusterId].map((d) => d.chapterId))
      expect(chapters.every((c) => c.name !== null && c.stars.length > 0), cluster.clusterId).toBe(true)
      expect(chapters.flatMap((c) => c.stars).sort()).toEqual(cluster.stars.map((s) => s.unitId).sort())
      for (const d of CHAPTER_TABLE[cluster.clusterId]) expect(cluster.route.mainline, d.start).toContain(d.start)
      expect(chapters.length).toBeLessThanOrEqual(5)
    }
    expect(warn).not.toHaveBeenCalled()
  })

  it('lay their routes out without a fourth lane or a second star in a lane', () => {
    for (const cluster of clusters) {
      const stars = cluster.route.nodes.filter((n): n is RouteStarNode => n.kind === 'star')
      const taken = new Set(stars.map((n) => `${n.col}:${n.lane}`))
      expect(taken.size, cluster.clusterId).toBe(stars.length)
      const col = new Map(stars.map((n) => [n.unitId, n.col]))
      for (const { from, to } of map.prerequisites) if (col.has(from) && col.has(to)) expect(col.get(from)!, `${from} -> ${to}`).toBeLessThan(col.get(to)!)
    }
  })
})

describe('a cluster of themes', () => {
  const all = SUBJECTS.flatMap((subject) => clustersOf(demoClusterMap('en', subject), 'en'))

  it.each(ONE_LINE)('%s runs as one main line holding every star, topic by topic in the table’s order', (clusterId) => {
    const cluster = all.find((c) => c.clusterId === clusterId)!
    const route = cluster.route
    expect([...route.mainline].sort()).toEqual(cluster.stars.map((s) => s.unitId).sort())
    expect(route.lanesUsed).toBe(0)
    expect(route.columns).toBe(cluster.total)
    // Topic by topic, each topic's stars in their order.
    const definition = CLUSTER_TABLE.find((d) => d.clusterId === clusterId)!
    const star = new Map(cluster.stars.map((s) => [s.unitId, s]))
    const keys = route.mainline.map((id) => [definition.topicIds.indexOf(star.get(id)!.nebulaId), star.get(id)!.order])
    expect(keys).toEqual([...keys].sort((a, b) => a[0] - b[0] || a[1] - b[1]))
  })

  it('has a chapter a topic, the one-star topic of Communicating last in the chapter before it', () => {
    const world = all.find((c) => c.clusterId === 'english-world')!
    const chapters = chaptersOf(world.route, 'english-world', 'en')
    expect(chapters.map((c) => c.name)).toEqual(['Nature and the environment', 'Society and knowledge'])
    expect(chapters[1].stars[chapters[1].stars.length - 1]).toBe('englisch-kommunizieren-texte-verstehen-und-im-alltag-kommunizieren')
    const me = all.find((c) => c.clusterId === 'english-me')!
    expect(chaptersOf(me.route, 'english-me', 'de').map((c) => c.stars.length)).toEqual([6, 7, 5, 2])
  })
})
