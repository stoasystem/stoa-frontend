/*
 * Guiding a student into the star clusters (#747), on the real map route
 * read through the real source:
 *
 *   A. the panorama hint: Murmi beside the cluster of the recommended star,
 *      once per account, "a new look" for a student who knew the old map,
 *      gone on ✕ or the first cluster opened, never over another first-run
 *      screen;
 *   B. a newcomer's first landing (#769) stays on the whole view of the
 *      chosen subject, Murmi beside the recommended star's cluster in place
 *      of the hint; a tap on it opens its scene on that star, Murmi there;
 *      back is the whole view, with neither the landing nor the hint again;
 *   C. the scene's tour on a first visit: main line, chapter, entrance;
 *      Escape, "Got it", replay; not on the newcomer's landing visit;
 *   and storage that throws breaks none of it.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { demoClusterMap } from '@/dev/demo/clusters/demoClusterMap'
import { SURFACES } from '@/dev/preview/surfaces'
import { AskServerProvider } from '@/features/ask/server/askServer'
import { StarMapEngine } from '@/features/starmap/engine/starMapEngine'
import { hintCluster, isClusterSky, useClusterHint } from '@/features/starmap/onboarding/ClusterHint'
import { markShown, onceKey, shownBefore } from '@/features/starmap/onboarding/shownOnce'
import { StarMapRoute } from '@/features/starmap/StarMapRoute'
import { KnowledgeMapSourceProvider, projectStarMap } from '@/features/starmap/readModelSource'
import i18n from '@/i18n'
import { getKnowledgeMap } from '@/services/practice/practiceApi'
import { useAuthStore } from '@/store/authStore'
import type { KnowledgeMapResponse } from '@/types/practice'
import type { StudentProfile } from '@/types/student'
import { createFakeAskServer, type FakeAskServer } from '../fakes/askServer'
import { GRADES } from '../fakes/profileChoices'

vi.mock('@/services/analytics/analyticsClient', () => ({ trackEvent: vi.fn() }))
vi.mock('@/services/practice/practiceApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/practice/practiceApi')>()),
  getKnowledgeMap: vi.fn(),
}))

const OWNER = 'u-1'
/** The newcomer's recommended star: the first of Geometry's main line. */
const START = 'geometrie-ebene-figuren-und-vielecke'

/** The real mathematics knowledge base as the backend sends it (some stars lit: a returning student). */
function knowledgeBaseSky(): KnowledgeMapResponse {
  const map = demoClusterMap('en')
  return {
    subjectId: 'math',
    galaxies: map.subjects,
    nebulae: map.nebulae.map((nebula) => ({ ...nebula, subjectId: 'math' })),
    stars: map.stars as KnowledgeMapResponse['stars'],
    prerequisites: map.prerequisites,
    summary: map.summary,
  }
}

/** The same sky for a student who has not started anything, recommended to start at `START`. */
function newcomerSky(): KnowledgeMapResponse {
  const sky = knowledgeBaseSky()
  return {
    ...sky,
    stars: sky.stars.map((star) => ({
      ...star,
      state: 'ready' as const,
      progress: 0,
      unlitPrerequisiteIds: [],
      recommendation: star.unitId === START ? { source: 'system' as const, reason: 'start' as const, relatedUnitId: null } : null,
    })),
  }
}

/** Physics' recommended star in the two-subject sky. */
function physicsStart() {
  const physics = demoClusterMap('en', 'physics')
  return physics.stars.find((star) => star.recommendation) ?? physics.stars[0]
}

/** Mathematics and physics, a newcomer in both: plan B asks between them. */
function twoSubjectNewcomerSky(): KnowledgeMapResponse {
  const math = newcomerSky()
  const physics = demoClusterMap('en', 'physics')
  const start = physicsStart().unitId
  return {
    ...math,
    galaxies: [...math.galaxies, ...physics.subjects],
    nebulae: [...math.nebulae, ...physics.nebulae.map((nebula) => ({ ...nebula, subjectId: 'physics' }))],
    stars: [
      ...math.stars,
      ...(physics.stars.map((star) => ({
        ...star,
        state: 'ready' as const,
        progress: 0,
        unlitPrerequisiteIds: [],
        recommendation: star.unitId === start ? { source: 'system' as const, reason: 'start' as const, relatedUnitId: null } : null,
      })) as KnowledgeMapResponse['stars']),
    ],
    prerequisites: [...math.prerequisites, ...physics.prerequisites],
  }
}

function Where() {
  const location = useLocation()
  return <output data-testid="where">{location.pathname + location.search}</output>
}
const where = () => screen.getByTestId('where').textContent

async function openAt(path: string, sky: KnowledgeMapResponse = knowledgeBaseSky(), server?: FakeAskServer) {
  vi.mocked(getKnowledgeMap).mockResolvedValue(sky)
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  const routes = (
    <KnowledgeMapSourceProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/map/:subjectId" element={<StarMapRoute />} />
          <Route path="/map/:subjectId/:topicId" element={<StarMapRoute />} />
          <Route path="/map/:subjectId/cluster/:clusterId" element={<StarMapRoute />} />
          <Route path="*" element={null} />
        </Routes>
        <Where />
      </MemoryRouter>
    </KnowledgeMapSourceProvider>
  )
  const view = render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>{server ? <AskServerProvider value={server}>{routes}</AskServerProvider> : routes}</QueryClientProvider>
    </I18nextProvider>,
  )
  await waitFor(() => expect(view.container.querySelector('[data-starmap-stage], [data-cluster-route]')).not.toBeNull())
  return view
}

beforeEach(async () => {
  await i18n.changeLanguage('en')
  localStorage.clear()
  sessionStorage.clear()
  // Plan B's question answered in this tab: mathematics.
  sessionStorage.setItem(`stoa.starmap.firstLanding.subject.${OWNER}`, 'math')
  vi.mocked(getKnowledgeMap).mockReset()
  useAuthStore.setState({
    user: { id: OWNER, name: 'Ada', email: 'ada@example.com', role: 'student', mustChangePassword: false } as never,
    accessToken: 'token',
    isAuthenticated: true,
  })
})

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
  sessionStorage.clear()
})

describe('shown once, per account', () => {
  it('remembers a hint per account, and treats storage that throws as not shown yet', () => {
    expect(shownBefore('clusterHint', OWNER)).toBe(false)
    markShown('clusterHint', OWNER)
    expect(localStorage.getItem(onceKey('clusterHint', OWNER))).toBe('1')
    expect(shownBefore('clusterHint', OWNER)).toBe(true)
    expect(shownBefore('clusterHint', 'someone-else')).toBe(false)
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(shownBefore('routeTour', OWNER)).toBe(false)
    expect(() => markShown('routeTour', OWNER)).not.toThrow()
  })
})

describe('A. the panorama hint', () => {
  const sky = () => projectStarMap(knowledgeBaseSky(), { subjectId: 'math', language: 'en' })

  it('stands by the cluster of the recommended star, on a sky of clusters only', () => {
    const map = sky()
    expect(isClusterSky(map)).toBe(true)
    const recommended = map.stars.find((star) => star.recommendation)!
    expect(hintCluster(map)).toBe(recommended.nebulaId)
    expect(isClusterSky({ stars: map.stars.map((star) => ({ ...star, routeChapterId: undefined })) })).toBe(false)
  })

  it('never shows while another first-run screen or Murmi is up, nor once shown', () => {
    const map = sky()
    const blocked = renderHook(() => useClusterHint(map, OWNER, { blocked: true }))
    expect(blocked.result.current.clusterId).toBeNull()
    const free = renderHook(() => useClusterHint(map, OWNER, { blocked: false }))
    expect(free.result.current.clusterId).toBe(hintCluster(map))
    expect(free.result.current.changed).toBe(true)
    act(() => free.result.current.dismiss())
    expect(free.result.current.clusterId).toBeNull()
    expect(renderHook(() => useClusterHint(map, OWNER, { blocked: false })).result.current.clusterId).toBeNull()
  })

  it('tells a returning student the map has a new look; ✕ sends it away for good', async () => {
    const first = await openAt('/map/math')
    const hint = await waitFor(() => {
      const found = first.container.querySelector('[data-cluster-hint]')
      expect(found).not.toBeNull()
      return found!
    })
    expect(hint.textContent).toContain('The star map has a new look')
    fireEvent.click(first.container.querySelector('[data-cluster-hint] button[aria-label="Close"]')!)
    await waitFor(() => expect(first.container.querySelector('[data-cluster-hint]')).toBeNull())
    expect(shownBefore('clusterHint', OWNER)).toBe(true)
    first.unmount()
    const again = await openAt('/map/math')
    expect(again.container.querySelector('[data-cluster-hint]')).toBeNull()
  })

  it('waits for "About you" on the real route, and comes once it is put off', async () => {
    // A profile with no year group: "About you" asks first (#591), through the real hooks.
    const server = createFakeAskServer()
    server.profile = {
      id: 'p-1', userId: OWNER, name: 'Ada', email: 'ada@example.com', grade: '', primarySubjects: [], preferredAnswerLanguage: 'en',
      guardianStatus: 'not_linked', createdAt: '2026-09-01T09:00:00Z', updatedAt: '2026-09-01T09:00:00Z', choices: { grade: GRADES },
    } as StudentProfile
    const user = userEvent.setup()
    const { container } = await openAt('/map/math', knowledgeBaseSky(), server)
    await waitFor(() => expect(container.querySelector('[data-about-you]')).not.toBeNull())
    expect(container.querySelector('[data-cluster-hint]')).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Later' }))
    await waitFor(() => expect(container.querySelector('[data-about-you]')).toBeNull())
    await waitFor(() => expect(container.querySelector('[data-cluster-hint]')).not.toBeNull())
  })

  it("the preview's surfaces for it start from nothing that goes first", () => {
    for (const id of ['map-cluster-hint', 'map-cluster-tour']) {
      const surface = SURFACES.find((candidate) => candidate.id === id)!
      expect(surface, id).toMatchObject({ guide: 'fresh', aboutYou: 'later', fresh: true, signedIn: true })
      expect(surface.demo, id).toBeUndefined()
    }
  })

  it('goes, remembered, with the first cluster opened', async () => {
    markShown('routeTour', OWNER)
    const { container } = await openAt('/map/math')
    await waitFor(() => expect(container.querySelector('[data-cluster-hint]')).not.toBeNull())
    fireEvent.click(container.querySelector('[data-nebula-link="algebra"]')!)
    expect(where()).toBe('/map/math/cluster/algebra')
    expect(shownBefore('clusterHint', OWNER)).toBe(true)
  })

  it('still shows, and goes, when storage throws', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    const { container } = await openAt('/map/math')
    await waitFor(() => expect(container.querySelector('[data-cluster-hint]')).not.toBeNull())
    fireEvent.click(container.querySelector('[data-cluster-hint] button[aria-label="Close"]')!)
    await waitFor(() => expect(container.querySelector('[data-cluster-hint]')).toBeNull())
  })
})

describe("B. a newcomer's first landing (#769)", () => {
  const landing = (container: HTMLElement) => container.querySelector<HTMLElement>('[data-cluster-landing]')

  it('lands on the whole view, Murmi beside the cluster of the recommended star, saying a tap opens its route; no clusters’ hint', async () => {
    const { container } = await openAt('/map/math', newcomerSky())
    await waitFor(() => expect(landing(container)).not.toBeNull())
    expect(where()).toBe('/map/math')
    expect(landing(container)!.getAttribute('data-cluster-landing')).toBe('geometry')
    expect(landing(container)!.textContent).toContain('Start in this cluster')
    expect(landing(container)!.textContent).toContain('Your first star, Plane shapes and polygons, is here. Tap the cluster to open its learning route.')
    // One bubble: neither the clusters' hint nor a scene.
    expect(container.querySelector('[data-cluster-hint]')).toBeNull()
    expect(container.querySelector('[data-cluster-scene]')).toBeNull()
    expect(container.querySelector('[data-first-landing]')).toBeNull()
  })

  it('a tap on that cluster opens its scene on the recommended star, its card open, Murmi there; no tour on that visit', async () => {
    const { container } = await openAt('/map/math', newcomerSky())
    await waitFor(() => expect(landing(container)).not.toBeNull())
    fireEvent.click(container.querySelector('[data-nebula-link="geometry"]')!)
    await waitFor(() => expect(where()).toBe(`/map/math/cluster/geometry?star=${START}`))
    await waitFor(() => expect(container.querySelector('[data-scene-landing]')).not.toBeNull())
    expect(container.querySelector('[data-scene-landing]')!.textContent).toContain('Start here: Plane shapes and polygons')
    expect(container.querySelector('[data-route-card]')).not.toBeNull()
    expect(container.querySelector('[data-route-tour]')).toBeNull()
    expect(container.querySelector('[data-cluster-hint]')).toBeNull()
    expect(landing(container)).toBeNull()
  })

  it('back from the scene is the whole view: no landing decided again, and the clusters’ hint not shown a second time', async () => {
    const user = userEvent.setup()
    const { container, unmount } = await openAt('/map/math', newcomerSky())
    await waitFor(() => expect(landing(container)).not.toBeNull())
    fireEvent.click(container.querySelector('[data-nebula-link="geometry"]')!)
    await waitFor(() => expect(container.querySelector('[data-scene-landing]')).not.toBeNull())
    await user.click(screen.getByRole('button', { name: 'Back to the star map' }))
    await waitFor(() => expect(where()).toBe('/map/math'))
    await waitFor(() => expect(container.querySelector('[data-cluster-scene]')).toBeNull())
    await act(async () => {})
    expect(landing(container)).toBeNull()
    expect(container.querySelector('[data-cluster-hint]')).toBeNull()
    expect(where()).toBe('/map/math')
    // The landing stood in for the hint: remembered for this account, in another tab too.
    expect(shownBefore('clusterHint', OWNER)).toBe(true)
    unmount()
    sessionStorage.clear()
    const elsewhere = await openAt('/map/math', newcomerSky())
    await waitFor(() => expect(landing(elsewhere.container)).not.toBeNull())
    expect(elsewhere.container.querySelector('[data-cluster-hint]')).toBeNull()
  })

  it('another cluster tapped opens as any cluster does, and ends the landing', async () => {
    const user = userEvent.setup()
    const { container } = await openAt('/map/math', newcomerSky())
    await waitFor(() => expect(landing(container)).not.toBeNull())
    fireEvent.click(container.querySelector('[data-nebula-link="algebra"]')!)
    await waitFor(() => expect(where()).toBe('/map/math/cluster/algebra'))
    expect(container.querySelector('[data-scene-landing]')).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Back to the star map' }))
    await waitFor(() => expect(where()).toBe('/map/math'))
    await act(async () => {})
    expect(landing(container)).toBeNull()
    expect(container.querySelector('[data-cluster-hint]')).toBeNull()
  })

  it('"Look around first" sends Murmi away for this tab, the whole view staying, and no hint follows it', async () => {
    const { container, unmount } = await openAt('/map/math', newcomerSky())
    await waitFor(() => expect(landing(container)).not.toBeNull())
    // The bubble is laid out but kept hidden in jsdom, which places nothing.
    fireEvent.click([...landing(container)!.querySelectorAll('button')].find((button) => button.textContent === 'Look around first')!)
    await waitFor(() => expect(landing(container)).toBeNull())
    await act(async () => {})
    expect(where()).toBe('/map/math')
    expect(container.querySelector('[data-cluster-hint]')).toBeNull()
    expect(sessionStorage.getItem(`stoa.starmap.firstLanding.dismissed.${OWNER}`)).toBe('1')
    // The recommended cluster now opens as any other.
    fireEvent.click(container.querySelector('[data-nebula-link="geometry"]')!)
    await waitFor(() => expect(where()).toBe('/map/math/cluster/geometry'))
    unmount()
    const again = await openAt('/map/math', newcomerSky())
    await act(async () => {})
    expect(landing(again.container)).toBeNull()
  })

  it("frames the chosen subject's galaxy: plan B's answer in another subject moves the whole view there", async () => {
    sessionStorage.setItem(`stoa.starmap.firstLanding.subject.${OWNER}`, 'physics')
    const { container } = await openAt('/map/math', twoSubjectNewcomerSky())
    await waitFor(() => expect(where()).toBe('/map/physics'))
    await waitFor(() => expect(landing(container)).not.toBeNull())
    const projected = projectStarMap(twoSubjectNewcomerSky(), { subjectId: 'physics', language: 'en' })
    const cluster = projected.stars.find((star) => star.unitId === physicsStart().unitId)!.nebulaId
    expect(landing(container)!.getAttribute('data-cluster-landing')).toBe(cluster)
    expect(landing(container)!.textContent).toContain(`Your first star, ${physicsStart().name}, is here.`)
  })

  it('rings the recommended cluster on the canvas only while Murmi’s bubble is up', async () => {
    const mark = vi.spyOn(StarMapEngine.prototype, 'setMarkedCluster')
    const last = () => mark.mock.lastCall?.[0] ?? null
    const { container, unmount } = await openAt('/map/math', newcomerSky())
    await waitFor(() => expect(landing(container)).not.toBeNull())
    expect(last()).toBe('geometry')
    fireEvent.click([...landing(container)!.querySelectorAll('button')].find((button) => button.textContent === 'Look around first')!)
    await waitFor(() => expect(landing(container)).toBeNull())
    expect(last()).toBeNull()
    unmount()
    // Opened from the bubble: the ring goes with it.
    sessionStorage.removeItem(`stoa.starmap.firstLanding.dismissed.${OWNER}`)
    mark.mockClear()
    const again = await openAt('/map/math', newcomerSky())
    await waitFor(() => expect(last()).toBe('geometry'))
    fireEvent.click(again.container.querySelector('[data-nebula-link="geometry"]')!)
    await waitFor(() => expect(again.container.querySelector('[data-scene-landing]')).not.toBeNull())
    expect(last()).toBeNull()
    again.unmount()
    // A returning student: never a ring.
    mark.mockClear()
    await openAt('/map/math')
    await act(async () => {})
    expect(mark.mock.calls.filter(([id]) => id !== null)).toEqual([])
  })

  it('a student who has started something opens on the whole view as before, with the hint', async () => {
    const { container } = await openAt('/map/math')
    expect(where()).toBe('/map/math')
    await waitFor(() => expect(container.querySelector('[data-cluster-hint]')).not.toBeNull())
    expect(landing(container)).toBeNull()
  })
})

describe("C. the scene's tour", () => {
  beforeEach(() => markShown('clusterHint', OWNER))

  it('walks the main line, a chapter and an entrance on a first visit; "Got it" ends it, for good', async () => {
    const user = userEvent.setup()
    const { container, unmount } = await openAt('/map/math/cluster/algebra')
    const tour = () => container.querySelector<HTMLElement>('[data-route-tour]')
    await waitFor(() => expect(tour()?.dataset.routeTour).toBe('main'))
    expect(screen.getByText('Follow the main route')).toHaveFocus()
    expect(screen.getByText('1 of 3')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(tour()?.dataset.routeTour).toBe('chapter')
    expect(screen.getByText('Chapters')).toHaveFocus()
    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(tour()?.dataset.routeTour).toBe('entrance')
    await user.click(screen.getByRole('button', { name: 'Got it' }))
    expect(tour()).toBeNull()
    expect(shownBefore('routeTour', OWNER)).toBe(true)
    unmount()
    const again = await openAt('/map/math/cluster/data')
    expect(again.container.querySelector('[data-route-tour]')).toBeNull()
  })

  it('closes on Escape, focus back where it was, and the header replays it from the start', async () => {
    const user = userEvent.setup()
    const { container } = await openAt('/map/math/cluster/algebra')
    await waitFor(() => expect(container.querySelector('[data-route-tour]')).not.toBeNull())
    await user.keyboard('{Escape}')
    expect(container.querySelector('[data-route-tour]')).toBeNull()
    expect(screen.getByRole('heading', { level: 1, name: 'Equations and algebra' })).toHaveFocus()
    await user.click(screen.getByRole('button', { name: 'How to read this map' }))
    expect(container.querySelector<HTMLElement>('[data-route-tour]')?.dataset.routeTour).toBe('main')
  })

  it('leaves out the entrance step on a route with none', async () => {
    const { container } = await openAt('/map/math/cluster/numbers')
    await waitFor(() => expect(container.querySelector('[data-route-tour]')).not.toBeNull())
    const hasEntrance = container.querySelector('[data-route-entrance]') !== null
    expect(screen.getByText(hasEntrance ? '1 of 3' : '1 of 2')).toBeInTheDocument()
  })

  it('works with storage that throws: shown, and closed', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    const user = userEvent.setup()
    const { container } = await openAt('/map/math/cluster/algebra')
    await waitFor(() => expect(container.querySelector('[data-route-tour]')).not.toBeNull())
    await user.keyboard('{Escape}')
    expect(container.querySelector('[data-route-tour]')).toBeNull()
  })
})
