/*
 * The design preview draws the production star map (#747): the demo
 * backend's `GET /practice/knowledge-map` has the real mathematics knowledge
 * base, which the production read model gathers into four star clusters, and
 * the demo knowledge point -- the one star with a chapter -- is in Geometry,
 * mathematics' recommendation, so Geometry's route opens on a star whose
 * "Start practising" opens a real chapter.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, waitFor } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { PreviewLighting } from '@/dev/preview/lighting'
import { StarMapRoute } from '@/features/starmap/StarMapRoute'
import { KnowledgeMapSourceProvider } from '@/features/starmap/readModelSource'
import i18n from '@/i18n'
import { getKnowledgeMap } from '@/services/practice/practiceApi'
import { useAuthStore } from '@/store/authStore'
import { DEMO_KNOWLEDGE_POINT } from '@/dev/demo/sky/demoSky'
import { demoKnowledgeMap } from '@/dev/preview/lighting'
import { SURFACES } from '@/dev/preview/surfaces'
import { projectStarMap } from '@/features/starmap/readModelSource'
import { clustersOf } from '@/features/starmap/route/clusters'
import { resolveTarget } from '@/features/starmap/view/layers'

vi.mock('@/services/analytics/analyticsClient', () => ({ trackEvent: vi.fn() }))
vi.mock('@/services/practice/practiceApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/practice/practiceApi')>()),
  getKnowledgeMap: vi.fn(),
}))

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

/*
 * The preview builds its own tree around AppRoutes (`src/dev/preview/main.tsx`),
 * not AppRouter, so the production source has to be mounted there too: with
 * PreviewLighting giving no sky of its own, the map otherwise fell back to the
 * empty sky and said "Your star map is on its way".
 */
describe('the design preview mounts the production star map source (#747)', () => {
  it('in main.tsx, inside the router and inside PreviewLighting, around AppRoutes', () => {
    const main = readFileSync('src/dev/preview/main.tsx', 'utf8')
    const at = (text: string) => main.indexOf(text)
    expect(at('<KnowledgeMapSourceProvider>')).toBeGreaterThan(at('<MemoryRouter'))
    expect(at('<MemoryRouter')).toBeGreaterThan(at('<PreviewLighting'))
    expect(at('<AppRoutes />')).toBeGreaterThan(at('<KnowledgeMapSourceProvider>'))
    expect(at('</KnowledgeMapSourceProvider>')).toBeGreaterThan(at('<AppRoutes />'))
  })

  it('so the map surface draws the demo backend sky, not the empty one', async () => {
    vi.mocked(getKnowledgeMap).mockResolvedValue(demoKnowledgeMap(1000))
    useAuthStore.setState({
      user: { id: 'demo-student', name: 'Demo', email: 'demo@example.com', role: 'student', mustChangePassword: false } as never,
      accessToken: 'design-preview',
      isAuthenticated: true,
    })
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={client}>
          <PreviewLighting>
            <MemoryRouter initialEntries={['/map/math']}>
              <KnowledgeMapSourceProvider>
                <Routes>
                  <Route path="/map/:subjectId" element={<StarMapRoute />} />
                </Routes>
              </KnowledgeMapSourceProvider>
            </MemoryRouter>
          </PreviewLighting>
        </QueryClientProvider>
      </I18nextProvider>,
    )
    await waitFor(() => expect(container.querySelector('[data-starmap-stage]')).not.toBeNull())
    expect(container.querySelector('[data-starmap-empty]')).toBeNull()
    const clusters = [...container.querySelectorAll<HTMLElement>('[data-nebula-link]')].map((link) => link.dataset.nebulaLink)
    expect(clusters).toEqual(expect.arrayContaining(['numbers', 'geometry', 'algebra', 'data']))
  })
})
