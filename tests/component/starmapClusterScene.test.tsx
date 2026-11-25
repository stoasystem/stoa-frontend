/*
 * Star clusters in production (#747, ADR 0007): the read model places the
 * sky as a few large clusters, the whole view opens a cluster's learning
 * route scene instead of flying in (zoomed in, stars and nebulae are chosen
 * as before), and the scene's route, cards, entrances, "Start practising"
 * and way back work on the real map route, read through the real source.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { demoClusterMap } from '@/dev/demo/clusters/demoClusterMap'
import { StarMapEngine } from '@/features/starmap/engine/starMapEngine'
import { StarMapRoute } from '@/features/starmap/StarMapRoute'
import { KnowledgeMapSourceProvider, projectStarMap } from '@/features/starmap/readModelSource'
import { resolveTarget, type LayerTarget } from '@/features/starmap/view/layers'
import i18n from '@/i18n'
import { getKnowledgeMap } from '@/services/practice/practiceApi'
import { useAuthStore } from '@/store/authStore'
import type { KnowledgeMapResponse } from '@/types/practice'
import { fakeClock, recordingRenderer, THEME } from './starmapHarness'

vi.mock('@/services/analytics/analyticsClient', () => ({ trackEvent: vi.fn() }))
vi.mock('@/services/practice/practiceApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/practice/practiceApi')>()),
  getKnowledgeMap: vi.fn(),
}))

/** The real mathematics knowledge base as the backend sends it: 98 stars in seven topics. */
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

const CLUSTERS = ['numbers', 'geometry', 'algebra', 'data']

beforeEach(async () => {
  await i18n.changeLanguage('en')
})

afterEach(async () => {
  vi.restoreAllMocks()
  await i18n.changeLanguage('en')
})

describe('the read model places the sky as star clusters', () => {
  it('gathers mathematics into four clusters, every star in one, named in the language on screen', () => {
    const map = projectStarMap(knowledgeBaseSky(), { subjectId: 'math', language: 'en' })
    expect(map.nebulae.map((nebula) => nebula.topicId)).toEqual(CLUSTERS)
    expect(map.stars).toHaveLength(98)
    expect(map.stars.every((star) => CLUSTERS.includes(star.nebulaId))).toBe(true)
    expect(map.nebulae.map((nebula) => nebula.name)).toEqual(['Numbers and operations', 'Geometry', 'Equations and algebra', 'Data and probability'])
    const de = projectStarMap(knowledgeBaseSky(), { subjectId: 'math', language: 'de' })
    expect(de.nebulae[0].name).toBe('Zahlen und Rechnen')
  })

  it('draws the same picture whatever the student has lit', () => {
    const sky = knowledgeBaseSky()
    const fresh = { ...sky, stars: sky.stars.map((star) => ({ ...star, state: 'ready' as const, unlitPrerequisiteIds: [] })) }
    const at = (response: KnowledgeMapResponse) => projectStarMap(response, { subjectId: 'math', language: 'en' }).stars.map((s) => [s.unitId, s.x, s.y])
    expect(at(fresh)).toEqual(at(sky))
  })

  it('finds a star from a link made with its topic, not its cluster (the chapter, Ask, a lighting)', () => {
    const map = projectStarMap(knowledgeBaseSky(), { subjectId: 'math', language: 'en' })
    const unitId = 'brueche-brueche-kuerzen-addieren-und-subtrahieren'
    expect(resolveTarget(map, 'brueche', unitId)).toEqual({ layer: 'star', nebulaId: 'numbers', unitId })
    expect(resolveTarget(map, 'numbers', unitId)).toEqual({ layer: 'star', nebulaId: 'numbers', unitId })
    expect(resolveTarget(map, 'brueche', undefined)).toEqual({ layer: 'nebula', nebulaId: 'numbers' })
    // A topic nobody knows, with a star that is there: that star's cluster.
    expect(resolveTarget(map, 'trigonometry', 'geometrie-trigonometrie')).toEqual({ layer: 'star', nebulaId: 'geometry', unitId: 'geometrie-trigonometrie' })
    expect(resolveTarget(map, 'nowhere', 'nobody')).toEqual({ layer: 'map' })
  })
})

describe('a tap on the whole view', () => {
  function engineOn(onOpenCluster?: (id: string) => boolean) {
    const clock = fakeClock()
    const asked: LayerTarget[] = []
    const engine = new StarMapEngine({
      renderer: recordingRenderer(),
      theme: THEME,
      reducedMotion: true,
      scheduler: clock,
      now: clock.now,
      galaxy: true,
      onRequestTarget: (target) => asked.push(target),
      onOpenCluster,
    })
    engine.setViewport(1440, 900, 1, { top: 120, bottom: 90 })
    engine.setData(projectStarMap(knowledgeBaseSky(), { subjectId: 'math', language: 'en' }), { layer: 'map' })
    clock.advance(20)
    const tapStar = (unitId: string) => {
      const at = engine.starOnScreen(unitId)!
      engine.pointerDown(1, at.x, at.y)
      engine.pointerUp(1, at.x, at.y)
      clock.advance(600)
    }
    return { engine, clock, asked, tapStar }
  }
  const star = 'gleichungen-lineare-gleichungen-loesen'

  it('opens the cluster under it, with no flight and no card', () => {
    const opened = vi.fn(() => true)
    const { engine, asked, tapStar } = engineOn(opened)
    expect(engine.zoom.wholeView).toBe(true)
    tapStar(star)
    expect(opened).toHaveBeenCalledWith('algebra')
    expect(asked).toEqual([])
  })

  it('zoomed in past the whole view, chooses as before', () => {
    const opened = vi.fn(() => true)
    const { engine, clock, asked, tapStar } = engineOn(opened)
    for (let i = 0; i < 6; i += 1) {
      engine.step('in')
      clock.advance(1000)
    }
    expect(engine.zoom.wholeView).toBe(false)
    const target = engine.starOnScreen(star)
    expect(target).not.toBeNull()
    tapStar(star)
    expect(opened).not.toHaveBeenCalled()
    expect(asked.length).toBeGreaterThan(0)
  })

  it('flies in as before on a page that opens no cluster', () => {
    const { asked, tapStar } = engineOn()
    tapStar(star)
    expect(asked[0]).toMatchObject({ nebulaId: 'algebra' })
  })
})

function Where() {
  const location = useLocation()
  return <output data-testid="where">{location.pathname + location.search}</output>
}

describe('the cluster route scene, on the map route', () => {
  beforeEach(() => {
    vi.mocked(getKnowledgeMap).mockReset()
    vi.mocked(getKnowledgeMap).mockResolvedValue(knowledgeBaseSky())
    useAuthStore.setState({
      user: { id: 'u-1', name: 'Ada', email: 'ada@example.com', role: 'student', mustChangePassword: false } as never,
      accessToken: 'token',
      isAuthenticated: true,
    })
  })

  async function openAt(path: string) {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
    const view = render(
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={client}>
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
        </QueryClientProvider>
      </I18nextProvider>,
    )
    await waitFor(() => expect(view.container.querySelector('[data-starmap-stage]')).not.toBeNull())
    return view
  }
  const where = () => screen.getByTestId('where').textContent

  it('names every cluster on the whole view, and a cluster chosen there opens its scene with no star and no card', async () => {
    const { container } = await openAt('/map/math')
    expect(container.querySelector('[data-starmap-stage]')).toHaveAttribute('data-whole-view', 'true')
    const links = [...container.querySelectorAll<HTMLAnchorElement>('[data-nebula-link]')].map((link) => link.dataset.nebulaLink)
    expect(links).toEqual(CLUSTERS)

    fireEvent.click(container.querySelector('[data-nebula-link="algebra"]')!)
    expect(where()).toBe('/map/math/cluster/algebra')
    expect(container.querySelector('[data-cluster-route="algebra"]')).not.toBeNull()
    expect(screen.queryByRole('dialog')).toBeNull()
    // The map stays under it, out of reach.
    expect(container.querySelector('[data-starmap-stage]')!.closest('[inert]')).not.toBeNull()
    // Focus comes along to the cluster's name, so Tab walks the route from the start.
    expect(screen.getByRole('heading', { level: 1, name: 'Equations and algebra' })).toHaveFocus()
  })

  it('goes back to the map it came from, where it was left', async () => {
    const user = userEvent.setup()
    const { container } = await openAt('/map/math')
    fireEvent.click(container.querySelector('[data-nebula-link="data"]')!)
    await user.click(screen.getByRole('button', { name: 'Back to the star map' }))
    await waitFor(() => expect(where()).toBe('/map/math'))
    expect(container.querySelector('[data-cluster-route]')).toBeNull()
    expect(container.querySelector('[data-starmap-stage]')!.closest('[inert]')).toBeNull()
    // Back on the cluster it opened.
    await waitFor(() => expect(container.querySelector('[data-nebula-link="data"]')).toHaveFocus())
  })

  it('opened from a link, goes back to the subject seen whole; at once under reduced motion', async () => {
    vi.spyOn(window, 'matchMedia').mockImplementation(
      (query: string) => ({ matches: query.includes('reduce'), media: query, addEventListener: () => {}, removeEventListener: () => {} }) as unknown as MediaQueryList,
    )
    const user = userEvent.setup()
    await openAt('/map/math/cluster/data')
    await user.click(screen.getByRole('button', { name: 'Back to the star map' }))
    expect(where()).toBe('/map/math')
  })

  it('lists the route as buttons in route order; Enter opens a card, Escape closes it', async () => {
    const user = userEvent.setup()
    const { container } = await openAt('/map/math/cluster/algebra')
    const scene = container.querySelector<HTMLElement>('[data-cluster-route]')!
    const nodes = [...scene.querySelectorAll<HTMLButtonElement>('[data-unit], [data-route-entrance]')]
    expect(nodes.filter((n) => n.dataset.unit)).toHaveLength(23)
    const lefts = nodes.map((n) => parseFloat(n.style.left))
    expect(lefts).toEqual([...lefts].sort((a, b) => a - b))

    const next = scene.querySelector<HTMLButtonElement>('[data-next]')!
    next.focus()
    await user.keyboard('{Enter}')
    const card = screen.getByRole('dialog')
    expect(within(card).getByText('Next on your route')).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(next).toHaveFocus()
  })

  it('leads from an entrance to the star in the other cluster, with its card', async () => {
    const user = userEvent.setup()
    const { container } = await openAt('/map/math/cluster/algebra')
    await user.click(container.querySelector<HTMLButtonElement>('[data-route-entrance]')!)
    const source = screen.getByRole('dialog').querySelector<HTMLButtonElement>('[data-entrance-source]')!
    const unitId = source.dataset.entranceSource!
    await user.click(source)
    expect(where()).toMatch(new RegExp(`^/map/math/cluster/(numbers|geometry)\\?star=${unitId}$`))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(container.querySelector(`[data-unit="${unitId}"]`)).toHaveAttribute('data-selected')
  })

  it('starts practising in the chapter', async () => {
    const user = userEvent.setup()
    const { container } = await openAt('/map/math/cluster/data')
    await user.click(container.querySelector<HTMLButtonElement>('[data-next]')!)
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(where()).toMatch(/^\/chapter\/daten-/)
  })

  it('sends a cluster the sky does not have to the subject seen whole', async () => {
    await openAt('/map/math/cluster/nowhere')
    await act(async () => {})
    expect(where()).toBe('/map/math')
  })
})
