/**
 * The lighting moment over the real read model (#51, stoa-backend#71).
 *
 * Until now the only `LightingEventSource` in the repository was the design
 * preview's, so on production a student's first knowledge point lit nothing:
 * the seam was open and no one filled it. This covers the source that fills
 * it from `GET /practice/knowledge-map`'s `unacknowledgedLit`:
 *
 *   - only observed lightings are ever waiting, never the backfill's;
 *   - `known()` is empty until the sky lands, and the sky brings both;
 *   - the acknowledgement goes out only once the flare has been shown;
 *   - at most ACKNOWLEDGE_LIMIT unit ids per call (over it the backend 422s);
 *   - an acknowledgement that cannot be sent loses nothing: the point stays
 *     waiting and is celebrated again rather than never.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { demoStarMapOverride } from '@/dev/preview/lighting'
import { demoStarMap } from '@/dev/demo/sky/demoStarMap'
import { DEMO_KNOWLEDGE_POINT } from '@/dev/demo/sky/demoSky'
import type { StarOnScreen } from '@/features/starmap/engine/starMapEngine'
import { FLARE_MS, FLARE_PEAK_MS } from '@/features/starmap/lighting/flare'
import { LightingOverlay, SETTLE_MS } from '@/features/starmap/lighting/LightingOverlay'
import {
  emptyLightingEventSource,
  LightingEventSourceContext,
  useLightingEventSource,
  type LightingEventSource,
} from '@/features/starmap/lighting/lightingEvents'
import {
  ACKNOWLEDGE_LIMIT,
  createReadModelLightingSource,
  LightingEventsProvider,
  litEventsOf,
} from '@/features/starmap/lighting/readModelLighting'
import { useLightingStage } from '@/features/starmap/lighting/useLightingStage'
import type { StarMap } from '@/features/starmap/model/starMap'
import { getKnowledgeMap } from '@/services/practice/practiceApi'
import { practiceQueryKeys } from '@/services/practice/practiceQueryKeys'
import { resolveTarget } from '@/features/starmap/view/layers'
import i18n from '@/i18n'
import { useAuthStore } from '@/store/authStore'
import { useLitMomentsStore } from '@/store/litMomentsStore'
import type { KnowledgeMapResponse } from '@/types/practice'
import { fakeClock, type FakeClock } from './starmapHarness'
import { mswServer } from '../mswServer'

const KP = DEMO_KNOWLEDGE_POINT.unitId
const TOPIC = DEMO_KNOWLEDGE_POINT.topicId
const ALL_LESSONS = DEMO_KNOWLEDGE_POINT.lessons.map((lesson) => lesson.lessonId)
const LIT_AT = '2026-10-04T09:00:00.000Z'
const SKY_KEY = practiceQueryKeys.knowledgeMap('')

vi.mock('@/services/practice/practiceApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/practice/practiceApi')>()),
  getKnowledgeMap: vi.fn(),
}))

function star(unitId: string, litAtSource: 'observed' | 'backfilled' | null = null): KnowledgeMapResponse['stars'][number] {
  return {
    unitId,
    name: unitId,
    nebulaId: TOPIC,
    order: 0,
    state: litAtSource ? 'lit' : 'ready',
    progress: litAtSource ? 1 : 0,
    unmetExercises: 0,
    reviewDue: 0,
    recommendation: null,
    x: 0.5,
    y: 0.5,
    skills: [],
    chapter: { lessonCount: 1, lessonsDone: litAtSource ? 1 : 0, nextLesson: null },
    litAt: litAtSource ? LIT_AT : null,
    litAtSource,
  }
}

function sky(overrides: Partial<KnowledgeMapResponse> = {}): KnowledgeMapResponse {
  return {
    subjectId: 'math',
    galaxies: [{ subjectId: 'math', name: 'Mathematik', lit: 1, total: 2, enrolled: true }],
    nebulae: [{ topicId: TOPIC, name: 'Trigonometrie', order: 0, subjectId: 'math' }],
    stars: [star(KP, 'observed')],
    prerequisites: [],
    summary: { lit: 1, total: 2, streakDays: 0, score: 0 },
    unacknowledgedLit: [KP],
    ...overrides,
  }
}

beforeAll(() => mswServer.listen({ onUnhandledRequest: 'error' }))
afterEach(() => mswServer.resetHandlers())
afterAll(() => mswServer.close())

function client() {
  return new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
}

/** The source over a cache that already holds `response`, as the star map's query leaves it. */
function sourceOver(response?: KnowledgeMapResponse) {
  const queryClient = client()
  if (response) queryClient.setQueryData(SKY_KEY, response)
  return { queryClient, source: createReadModelLightingSource(queryClient) }
}

describe('what the sky says is waiting', () => {
  it('lists the unacknowledged observed points, in the order the backend sent them', () => {
    const response = sky({
      stars: [star('u1', 'observed'), star('u2', 'observed')],
      unacknowledgedLit: ['u2', 'u1'],
    })
    expect(litEventsOf(response)).toEqual([
      { unitId: 'u2', litAt: LIT_AT, litAtSource: 'observed' },
      { unitId: 'u1', litAt: LIT_AT, litAtSource: 'observed' },
    ])
  })

  it('never lets a backfilled lighting through, whatever the response lists', () => {
    const response = sky({
      stars: [star('old', 'backfilled'), star('new', 'observed')],
      unacknowledgedLit: ['old', 'new'],
    })
    expect(litEventsOf(response)).toEqual([{ unitId: 'new', litAt: LIT_AT, litAtSource: 'observed' }])
  })

  it('drops an id with no star and one with no lighting time, and reads nothing from an empty sky', () => {
    const response = sky({ stars: [star('known', null)], unacknowledgedLit: ['known', 'gone'] })
    expect(litEventsOf(response)).toEqual([])
    expect(litEventsOf(sky({ unacknowledgedLit: [] }))).toEqual([])
    expect(litEventsOf(undefined)).toEqual([])
  })
})

describe('the read model source', () => {
  beforeEach(() => {
    vi.mocked(getKnowledgeMap).mockReset()
  })

  it('knows nothing before the sky lands, and the waiting point as soon as it does', async () => {
    const { queryClient, source } = sourceOver()
    expect(source.known?.()).toEqual([])
    await expect(source.unacknowledged()).resolves.toEqual([])

    queryClient.setQueryData(SKY_KEY, sky())
    expect(source.known?.()).toEqual([{ unitId: KP, litAt: LIT_AT, litAtSource: 'observed' }])
    await expect(source.unacknowledged()).resolves.toEqual([{ unitId: KP, litAt: LIT_AT, litAtSource: 'observed' }])
  })

  it('says it changed when the sky does, and never asks for a sky of its own', async () => {
    const { queryClient, source } = sourceOver()
    const changed = vi.fn()
    const stop = source.subscribe!(changed)
    queryClient.setQueryData(SKY_KEY, sky())
    expect(changed).toHaveBeenCalled()
    stop()
    const before = changed.mock.calls.length
    queryClient.setQueryData(SKY_KEY, sky({ unacknowledgedLit: [] }))
    expect(changed.mock.calls.length).toBe(before)
    expect(getKnowledgeMap).not.toHaveBeenCalled()
  })
})

describe('acknowledging over the real endpoint', () => {
  /**
   * The backend's own limit, written out rather than read from the source:
   * a test measured against `ACKNOWLEDGE_LIMIT` moves with it and would let a
   * raised limit through to a 422 in production.
   */
  const BACKEND_LIMIT = 50

  /** The route as production answers it: over the limit, 422. */
  function endpoint({ fail = false } = {}) {
    const batches: string[][] = []
    const refused: string[][] = []
    mswServer.use(
      http.post('https://api.test/practice/knowledge-map/acknowledged-lit', async ({ request }) => {
        const { unitIds } = (await request.json()) as { unitIds: string[] }
        batches.push(unitIds)
        if (fail) return HttpResponse.json({ detail: 'nope' }, { status: 503 })
        if (unitIds.length > BACKEND_LIMIT) {
          refused.push(unitIds)
          return HttpResponse.json({ detail: 'too many' }, { status: 422 })
        }
        return HttpResponse.json({ acknowledged: unitIds })
      }),
    )
    return { batches, refused }
  }

  it('sends the unit ids and stops holding the point once the server has them', async () => {
    const { batches } = endpoint()
    const { source } = sourceOver(sky())
    await source.acknowledge([KP])
    expect(batches).toEqual([[KP]])
    expect(source.known?.()).toEqual([])
  })

  it('never puts more than the backend takes in one call', async () => {
    expect(ACKNOWLEDGE_LIMIT).toBe(BACKEND_LIMIT)
    const { batches, refused } = endpoint()
    const many = Array.from({ length: BACKEND_LIMIT * 2 + 3 }, (_, index) => `u${index}`)
    await sourceOver(sky()).source.acknowledge(many)
    expect(refused).toEqual([]) // nothing was answered with a 422
    expect(batches.flat()).toEqual(many)
    expect(Math.max(...batches.map((batch) => batch.length))).toBeLessThanOrEqual(BACKEND_LIMIT)
  })

  it('an acknowledgement that cannot be sent throws nothing and leaves the point waiting', async () => {
    endpoint({ fail: true })

    const { source } = sourceOver(sky())
    await expect(source.acknowledge([KP])).resolves.toBeUndefined()
    // Better celebrated twice than never: the next sky still lists it.
    expect(source.known?.()).toEqual([{ unitId: KP, litAt: LIT_AT, litAtSource: 'observed' }])
  })
})

describe('the provider', () => {
  function Seen() {
    const source = useLightingEventSource()
    return <output data-source={source === emptyLightingEventSource ? 'none' : 'some'} data-known={JSON.stringify(source.known?.() ?? null)} />
  }

  function mount(children: ReactNode) {
    const view = render(<QueryClientProvider client={client()}>{children}</QueryClientProvider>)
    return view.container.querySelector('output')!
  }

  it('puts the read model behind the lighting moment', () => {
    const out = mount(
      <LightingEventsProvider>
        <Seen />
      </LightingEventsProvider>,
    )
    expect(out.getAttribute('data-source')).toBe('some')
    expect(out.getAttribute('data-known')).toBe('[]')
  })

  it('yields to a source supplied above it, so the design preview keeps its own', () => {
    const waiting = [{ unitId: 'preview-point', litAt: LIT_AT, litAtSource: 'observed' as const }]
    const preview: LightingEventSource = { unacknowledged: async () => waiting, acknowledge: async () => {}, known: () => waiting }
    const out = mount(
      <LightingEventSourceContext.Provider value={preview}>
        <LightingEventsProvider>
          <Seen />
        </LightingEventsProvider>
      </LightingEventSourceContext.Provider>,
    )
    expect(JSON.parse(out.getAttribute('data-known')!)).toEqual(waiting)
  })
})

describe('a sky that really has a point waiting', () => {
  const ON_SCREEN: StarOnScreen = { x: 400, y: 300, size: 24 }
  const locate = (unitId: string) => (unitId === KP ? ON_SCREEN : null)
  const litMap = (): StarMap =>
    demoStarMapOverride(demoStarMap('math', 10, i18n.getFixedT('en', 'starmap'), { language: 'en' }), 10, ALL_LESSONS)

  let restoreMatchMedia: typeof window.matchMedia
  beforeEach(async () => {
    await i18n.changeLanguage('en')
    restoreMatchMedia = window.matchMedia
    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia
    const gradient = { addColorStop: () => {} }
    const ctx = new Proxy({} as Record<string, unknown>, {
      get: (target, key: string) => (key in target ? target[key] : key.startsWith('create') ? () => gradient : () => {}),
      set: (target, key: string, value) => {
        target[key] = value
        return true
      },
    })
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx as never)
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(800)
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(600)
    useAuthStore.setState({ user: { id: 'student-a' } as never })
    useLitMomentsStore.setState({ byOwner: {} })
  })
  afterEach(() => {
    vi.restoreAllMocks()
    window.matchMedia = restoreMatchMedia
    useAuthStore.setState({ user: null })
  })

  // The route's own target follows the path, as StarMapRoute's `resolveTarget` does.
  function Stage({ map, clock }: { map: StarMap; clock: FakeClock }) {
    const { pathname } = useLocation()
    const [, , , topicId, unitId] = pathname.split('/')
    const stage = useLightingStage(map, resolveTarget(map, topicId, unitId))
    const drawn = stage.map.stars.find((point) => point.unitId === KP)
    return (
      <>
        <output data-drawn-state={drawn?.state} />
        <LightingOverlay map={map} locate={locate} onReveal={stage.reveal} scheduler={clock} />
      </>
    )
  }

  it('draws it in progress, plays the flare, and acknowledges only once it has been shown', async () => {
    const acknowledged: string[][] = []
    mswServer.use(
      http.post('https://api.test/practice/knowledge-map/acknowledged-lit', async ({ request }) => {
        const { unitIds } = (await request.json()) as { unitIds: string[] }
        acknowledged.push(unitIds)
        return HttpResponse.json({ acknowledged: unitIds })
      }),
    )
    const { queryClient, source } = sourceOver(sky())
    const clock = fakeClock()
    const map = litMap()
    const view = render(
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <LightingEventSourceContext.Provider value={source}>
            <MemoryRouter initialEntries={[`/map/math/${TOPIC}/${KP}`]}>
              <Stage map={map} clock={clock} />
            </MemoryRouter>
          </LightingEventSourceContext.Provider>
        </I18nextProvider>
      </QueryClientProvider>,
    )
    await act(async () => {})
    const drawnState = () => view.container.querySelector('output')!.getAttribute('data-drawn-state')
    const phase = () => view.container.querySelector('[data-lighting]')?.getAttribute('data-lighting')

    // From the first frame the point is held back, though the sky says it is lit.
    expect(drawnState()).toBe('in_progress')
    await act(async () => clock.advance(20))
    expect(phase()).toBe('playing')
    await act(async () => clock.advance(SETTLE_MS + FLARE_PEAK_MS + 60))
    expect(drawnState()).toBe('lit')
    expect(acknowledged).toEqual([])

    await act(async () => clock.advance(FLARE_MS + 1000))
    expect(phase()).toBe('done')
    expect(acknowledged).toEqual([[KP]])
    expect(source.known?.()).toEqual([])
    expect(useLitMomentsStore.getState().byOwner['student-a']).toHaveLength(1)
  })
})
