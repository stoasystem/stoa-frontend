/*
 * The design preview draws the production star map (#747): the demo
 * backend's `GET /practice/knowledge-map` has the real mathematics knowledge
 * base, which the production read model gathers into four star clusters, and
 * the demo knowledge point -- the one star with a chapter -- is in Geometry,
 * mathematics' recommendation, so Geometry's route opens on a star whose
 * "Start practising" opens a real chapter.
 */
import { describe, expect, it } from 'vitest'
import { DEMO_KNOWLEDGE_POINT } from '@/dev/demo/sky/demoSky'
import { demoKnowledgeMap } from '@/dev/preview/lighting'
import { SURFACES } from '@/dev/preview/surfaces'
import { projectStarMap } from '@/features/starmap/readModelSource'
import { clustersOf } from '@/features/starmap/route/clusters'
import { resolveTarget } from '@/features/starmap/view/layers'

describe('the design preview star map (#747)', () => {
  const map = projectStarMap(demoKnowledgeMap(1000), { subjectId: 'math', language: 'en' })
  const clusters = clustersOf(map, 'en')

  it('is mathematics in four star clusters', () => {
    expect(clusters.map((cluster) => cluster.clusterId)).toEqual(['numbers', 'geometry', 'algebra', 'data'])
    expect(clusters.reduce((sum, cluster) => sum + cluster.total, 0)).toBe(99)
  })

  it('opens Geometry on the demo knowledge point, which has a chapter', () => {
    const geometry = clusters.find((cluster) => cluster.clusterId === 'geometry')!
    expect(geometry.next?.unitId).toBe(DEMO_KNOWLEDGE_POINT.unitId)
    expect(geometry.next?.chapter.lessonCount).toBeGreaterThan(0)
  })

  it('keeps the other subjects, each topic a cluster of its own', () => {
    const physics = projectStarMap(demoKnowledgeMap(1000), { subjectId: 'physics', language: 'en' })
    expect(clustersOf(physics, 'en').map((cluster) => cluster.clusterId)).toContain('optics')
  })

  it('opens every star map surface on what it names', () => {
    for (const surface of SURFACES.filter((s) => s.id.startsWith('map-') && !s.demo)) {
      const [pathname] = surface.path(1000).split('?')
      const [, , subjectId, topicId, unitId] = pathname.split('/')
      if (topicId === 'cluster' || !topicId) continue
      const projected = projectStarMap(demoKnowledgeMap(1000), { subjectId, language: 'en' })
      expect(resolveTarget(projected, topicId, unitId).layer, surface.id).toBe(unitId ? 'star' : 'nebula')
    }
  })
})
