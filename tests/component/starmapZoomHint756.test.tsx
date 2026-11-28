/*
 * The zoom hint (#756): one line by the zoom buttons that says what a tap
 * does at this zoom --
 *
 *   A. which line: far out "tap a cluster" (its route on the whole view of a
 *      sky of clusters, a flight in past it), up close "tap any star"; none
 *      with a star chosen;
 *   B. each line goes for good once its action is done (a cluster gone into
 *      by a tap, a star opened), per account, and storage that throws only
 *      keeps it for the rest of the visit;
 *   C. on the map: line 1 far out, line 2 after flying in, gone after a star
 *      is opened, gone after a reload;
 *   D. never at the same time as the first landing (on a sky of clusters
 *      too, #769), the first reveal, the review reminder's bubble, the
 *      find-star bubble or the clusters' hint;
 *   E. from far out the mouse lights the cluster a click goes into, whole,
 *      under a magnifier; once stars can be picked, only a star answers;
 *   F. the help dialog and the first reveal say a star may be chosen freely,
 *      in all four languages.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import de from '@/i18n/locales/de/starmap.json'
import en from '@/i18n/locales/en/starmap.json'
import fr from '@/i18n/locales/fr/starmap.json'
import it_ from '@/i18n/locales/it/starmap.json'
import { BUBBLE_EXIT_MS } from '@/features/starmap/components/MurmiBubble'
import { StarMapView } from '@/features/starmap/components/StarMapView'
import { StarMapEngine } from '@/features/starmap/engine/starMapEngine'
import { clusterAsDrawn } from '@/features/starmap/render/canvas2d'
import { orderedStars, type StarMap } from '@/features/starmap/model/starMap'
import { markShown, onceKey, shownBefore } from '@/features/starmap/onboarding/shownOnce'
import type { FirstReveal } from '@/features/starmap/onboarding/useFirstReveal'
import { useZoomHint, zoomHintLine } from '@/features/starmap/onboarding/ZoomHint'
import { StarMapRoute } from '@/features/starmap/StarMapRoute'
import { StarMapSourceContext, type StarMapSource } from '@/features/starmap/starMapSource'
import type { LayerTarget } from '@/features/starmap/view/layers'
import { REVEAL } from '@/features/starmap/view/semanticZoom'
import { asNewcomer } from '@/dev/demo/sky/newcomer'
import { readDemoStarMap } from '@/dev/demo/sky/source'
import i18n from '@/i18n'
import { getKnowledgeMap, getReviewSummary } from '@/services/practice/practiceApi'
import { KnowledgeMapSourceProvider } from '@/features/starmap/readModelSource'
import { demoClusterMap } from '@/dev/demo/clusters/demoClusterMap'
import type { KnowledgeMapResponse } from '@/types/practice'
import { useAuthStore } from '@/store/authStore'
import { fakeClock, recordingRenderer, skyMap, THEME } from './starmapHarness'

vi.mock('@/services/practice/practiceApi', async (original) => ({
  ...(await original<typeof import('@/services/practice/practiceApi')>()),
  getReviewSummary: vi.fn(),
  getKnowledgeMap: vi.fn(),
}))

/** The first reveal, stood in for where a test asks: the real one needs a lighting moment on a drawn canvas. */
const reveal = vi.hoisted(() => ({ fake: null as null | ((map: StarMap) => FirstReveal) }))
vi.mock('@/features/starmap/onboarding/useFirstReveal', async (original) => {
  const actual = await original<typeof import('@/features/starmap/onboarding/useFirstReveal')>()
  return {
    ...actual,
    useFirstReveal: (...args: Parameters<typeof actual.useFirstReveal>) => {
      const real = actual.useFirstReveal(...args)
      return reveal.fake ? { ...real, ...reveal.fake(args[0]) } : real
    },
  }
})

const OWNER = 'student-756'
const hintLine = () => document.querySelector<HTMLElement>('[data-zoom-hint]')

function stageRect(width = 1280, height = 776) {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    x: 0, y: 0, left: 0, top: 0, width, height, right: width, bottom: height, toJSON: () => ({}),
  } as DOMRect)
}

beforeAll(async () => {
  await import('@/dev/demo/sky/source')
}, 30_000)

beforeEach(async () => {
  await i18n.changeLanguage('en')
  localStorage.clear()
  sessionStorage.clear()
  useAuthStore.setState({ user: { id: OWNER, role: 'student' } as never })
  vi.mocked(getReviewSummary).mockReset()
  vi.mocked(getReviewSummary).mockResolvedValue({ dueCount: 0, scheduledCount: 0, nextDueAt: '' })
  reveal.fake = null
})

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
  sessionStorage.clear()
  useAuthStore.setState({ user: null })
  reveal.fake = null
})

// ---------------------------------------------------------------- A. which line

describe('A. which line', () => {
  const both = { far: true, near: true }
  const whole = { pickable: false, wholeView: true }
  const between = { pickable: false, wholeView: false }
  const close = { pickable: true, wholeView: false }

  it('far out: a cluster opens its route on the whole view of a sky of clusters, a flight past it', () => {
    expect(zoomHintLine(whole, 'map', true, both)).toBe('cluster')
    expect(zoomHintLine(between, 'map', true, both)).toBe('far')
    // A map whose clusters open no route: every tap from far out flies in.
    expect(zoomHintLine(whole, 'map', false, both)).toBe('far')
  })

  it('up close, on the whole map or in a nebula: any star', () => {
    expect(zoomHintLine(close, 'map', true, both)).toBe('near')
    expect(zoomHintLine(close, 'nebula', true, both)).toBe('near')
  })

  it('nothing with a star chosen, nor far out of a nebula the student chose, nor once done', () => {
    expect(zoomHintLine(close, 'star', true, both)).toBeNull()
    expect(zoomHintLine(whole, 'star', true, both)).toBeNull()
    expect(zoomHintLine(between, 'nebula', true, both)).toBeNull()
    expect(zoomHintLine(whole, 'map', true, { far: false, near: true })).toBeNull()
    expect(zoomHintLine(close, 'map', true, { far: true, near: false })).toBeNull()
    expect(zoomHintLine(close, 'map', true, null)).toBeNull()
  })
})

// ---------------------------------------------------------------- B. gone once done

describe('B. each line goes once its action is done', () => {
  const map: LayerTarget = { layer: 'map' }
  const nebula: LayerTarget = { layer: 'nebula', nebulaId: 'n-1' }
  const star: LayerTarget = { layer: 'star', nebulaId: 'n-1', unitId: 'u-1' }

  it('a cluster flown into ends the far line, a star opened the near one, each remembered per account', () => {
    const { result } = renderHook(() => useZoomHint(OWNER))
    expect(result.current.guide).toEqual({ far: true, near: true })
    act(() => result.current.chose(nebula, map))
    expect(result.current.guide).toEqual({ far: false, near: true })
    expect(shownBefore('zoomHintFar', OWNER)).toBe(true)
    act(() => result.current.chose(star, nebula))
    expect(result.current.guide).toBeNull()
    expect(localStorage.getItem(onceKey('zoomHintNear', OWNER))).toBe('1')
    // Another account on this browser is told its own.
    expect(renderHook(() => useZoomHint('someone-else')).result.current.guide).toEqual({ far: true, near: true })
  })

  it('a cluster opened from the whole view ends the far line too', () => {
    const { result } = renderHook(() => useZoomHint(OWNER))
    act(() => result.current.wentIn())
    expect(result.current.guide).toEqual({ far: false, near: true })
  })

  it('a card closed back onto its own nebula is no way in', () => {
    const { result } = renderHook(() => useZoomHint(OWNER))
    act(() => result.current.chose(nebula, star))
    act(() => result.current.chose(map, nebula))
    expect(result.current.guide).toEqual({ far: true, near: true })
  })

  it('with storage refused it still goes for the rest of the visit, and comes back on the next', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    const { result } = renderHook(() => useZoomHint(OWNER))
    act(() => result.current.chose(nebula, map))
    act(() => result.current.chose(star, nebula))
    expect(result.current.guide).toBeNull()
    expect(renderHook(() => useZoomHint(OWNER)).result.current.guide).toEqual({ far: true, near: true })
  })
})

// ---------------------------------------------------------------- C. on the map

describe('C. on the map: far out, flown in, a star opened, a reload', () => {
  beforeEach(() => stageRect())

  function Flow({ map, clock, renderer }: { map: StarMap; clock: ReturnType<typeof fakeClock>; renderer: ReturnType<typeof recordingRenderer> }) {
    const [target, setTarget] = useState<LayerTarget>({ layer: 'map' })
    const hint = useZoomHint(OWNER)
    return (
      <StarMapView
        map={map}
        target={target}
        onNavigate={(next) => {
          hint.chose(next, target)
          setTarget(next)
        }}
        guide={hint.guide}
        scheduler={clock}
        createRendererFor={() => renderer}
      />
    )
  }

  function show() {
    const clock = fakeClock()
    const renderer = recordingRenderer()
    const map = skyMap(1000)
    const view = render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <div data-surface="sky" className="flex">
            <Flow map={map} clock={clock} renderer={renderer} />
          </div>
        </MemoryRouter>
      </I18nextProvider>,
    )
    act(() => clock.advance(20))
    const stage = view.container.querySelector<HTMLElement>('[data-starmap-stage]')!
    return { clock, renderer, map, stage, ...view }
  }

  /** A point a mouse click would go into a cluster from, by the cursor the stage shows there. */
  function intoCluster(stage: HTMLElement, renderer: ReturnType<typeof recordingRenderer>, map: StarMap) {
    const frame = renderer.last()
    const stars = orderedStars(map)
    for (let i = 0; i < frame.x.length; i += 7) {
      for (const [dx, dy] of [[10, 0], [0, 10], [-10, 0], [0, -10], [16, 16]]) {
        const x = frame.x[i] + dx
        const y = frame.y[i] + dy
        if (x < 40 || y < 140 || x > 1240 || y > 660) continue
        fireEvent.pointerMove(stage, { pointerId: 1, clientX: x, clientY: y, buttons: 0, pointerType: 'mouse' })
        if (stage.style.cursor === 'zoom-in') return { x, y, nebulaId: stars[i]?.nebulaId }
      }
    }
    return null
  }

  it('says "tap a cluster" far out, "tap any star" once flown in, nothing once a star is open, nor after a reload', () => {
    const { clock, renderer, map, stage, container, unmount } = show()
    expect(hintLine()?.dataset.zoomHint).toBe('far')
    expect(hintLine()).toHaveTextContent('Click a cluster to fly into it')

    const spot = intoCluster(stage, renderer, map)
    expect(spot, 'no point on the panorama goes into a cluster').not.toBeNull()
    act(() => {
      fireEvent.pointerDown(stage, { pointerId: 1, clientX: spot!.x, clientY: spot!.y, button: 0, pointerType: 'mouse' })
      fireEvent.pointerUp(stage, { pointerId: 1, clientX: spot!.x, clientY: spot!.y, button: 0, pointerType: 'mouse' })
      clock.advance(2000)
    })
    expect(stage).toHaveAttribute('data-layer', 'nebula')
    expect(shownBefore('zoomHintFar', OWNER)).toBe(true)
    // Flown in, the stars are big enough to pick: the second line.
    expect(renderer.last().starPx).toBeGreaterThanOrEqual(REVEAL.starsPickableFrom)
    expect(hintLine()?.dataset.zoomHint).toBe('near')
    expect(hintLine()).toHaveTextContent('Click any star to open it')

    const link = container.querySelector<HTMLAnchorElement>(`li[data-nebula="${spot!.nebulaId}"] a[data-unit]`) ?? container.querySelector<HTMLAnchorElement>('a[data-unit]')!
    act(() => {
      fireEvent.click(link)
      clock.advance(2000)
    })
    expect(stage).toHaveAttribute('data-layer', 'star')
    expect(hintLine()).toBeNull()
    expect(shownBefore('zoomHintNear', OWNER)).toBe(true)

    unmount()
    const again = show()
    act(() => again.clock.advance(500))
    expect(hintLine()).toBeNull()
  })

  it('fades without moving, in 200 ms under reduced motion', () => {
    window.matchMedia = ((query: string) => ({
      matches: /reduce/.test(query),
      media: query,
      onchange: null,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      dispatchEvent: () => false,
    })) as never
    show()
    const line = hintLine()!
    expect(line.className).toContain('transition-opacity')
    expect(line.className).toContain('duration-200')
    expect(line.className).not.toMatch(/translate|transition-transform|transition-all/)
  })
})

// ---------------------------------------------------------------- D. one thing at a time

describe('D. never with another bubble', () => {
  const source: StarMapSource = { read: readDemoStarMap, demo: false }
  const newcomer: StarMapSource = { read: (options) => asNewcomer(readDemoStarMap(options) as StarMap), demo: false }

  beforeEach(() => {
    stageRect()
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    // The clusters' panorama hint seen: each test brings the bubble it is about.
    markShown('clusterHint', OWNER)
  })

  function mountRoute(entry: string | { pathname: string; state?: unknown } = '/map/math', from: StarMapSource = source) {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    return render(
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={client}>
          <StarMapSourceContext.Provider value={from}>
            <MemoryRouter initialEntries={['/map/math', entry]} initialIndex={1}>
              <Routes>
                <Route path="/map/:subjectId" element={<StarMapRoute />} />
                <Route path="/map/:subjectId/:topicId" element={<StarMapRoute />} />
                <Route path="/map/:subjectId/:topicId/:unitId" element={<StarMapRoute />} />
                <Route path="/map/:subjectId/cluster/:clusterId" element={<StarMapRoute />} />
              </Routes>
            </MemoryRouter>
          </StarMapSourceContext.Provider>
        </QueryClientProvider>
      </I18nextProvider>,
    )
  }

  it('shows on its own on the whole view', async () => {
    mountRoute()
    await waitFor(() => expect(hintLine()).not.toBeNull())
  })

  it('waits for the sky to be confirmed: nothing on a provisional one (#757)', async () => {
    const confirm: { current: (provisional: boolean) => void } = { current: () => {} }
    function Switchable() {
      const [provisional, setProvisional] = useState(true)
      confirm.current = setProvisional
      return (
        <StarMapSourceContext.Provider value={{ ...source, provisional }}>
          <MemoryRouter initialEntries={['/map/math']}>
            <Routes>
              <Route path="/map/:subjectId" element={<StarMapRoute />} />
            </Routes>
          </MemoryRouter>
        </StarMapSourceContext.Provider>
      )
    }
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={client}>
          <Switchable />
        </QueryClientProvider>
      </I18nextProvider>,
    )
    await waitFor(() => expect(document.querySelector('[data-starmap-stage]')).not.toBeNull())
    await act(async () => {})
    expect(hintLine()).toBeNull()
    act(() => confirm.current(false))
    await waitFor(() => expect(hintLine()).not.toBeNull())
  })

  it('waits for the first landing’s bubble', async () => {
    sessionStorage.setItem(`stoa.starmap.firstLanding.subject.${OWNER}`, 'math')
    mountRoute('/map/math', newcomer)
    await waitFor(() => expect(document.querySelector('[data-first-landing]')).not.toBeNull())
    // Landed in a nebula, its stars big enough to pick: the second line would show, but Murmi has the map.
    await waitFor(() => expect(document.querySelector('[data-starmap-stage]')).toHaveAttribute('data-zoom-band', 'star'), { timeout: 3000 })
    expect(hintLine()).toBeNull()
    // "Look around first" (the bubble is laid out but kept hidden in jsdom, which places nothing).
    const later = [...document.querySelectorAll<HTMLButtonElement>('[data-first-landing] button')].find((button) => button.textContent === en.firstLanding.later)!
    fireEvent.click(later)
    await waitFor(() => expect(document.querySelector('[data-first-landing]')).toBeNull(), { timeout: BUBBLE_EXIT_MS + 1000 })
    await waitFor(() => expect(hintLine()?.dataset.zoomHint).toBe('near'))
  })

  it('waits for the first reveal: its flight out and Murmi beside the next star', async () => {
    const real = readDemoStarMap({ subjectId: 'math', size: 1000, t: i18n.getFixedT('en', 'starmap'), language: 'en', relations: false, longNames: false }) as StarMap
    const next = real.stars.find((star) => star.recommendation && star.state !== 'lit') ?? real.stars[0]
    let open = true
    reveal.fake = () => ({
      target: open ? { layer: 'map', fly: true, frame: [next.unitId] } : null,
      star: open ? next : null,
      next: open ? `/map/math/${next.nebulaId}/${next.unitId}` : null,
      lit: null,
      onReveal: () => {},
      dismiss: () => {
        open = false
      },
    })
    mountRoute()
    await waitFor(() => expect(document.querySelector('[data-first-landing]')).not.toBeNull())
    expect(hintLine()).toBeNull()
  })

  it('waits for the review reminder’s bubble, and stays beside its corner Murmi', async () => {
    vi.mocked(getReviewSummary).mockResolvedValue({ dueCount: 3, scheduledCount: 7, nextDueAt: new Date().toISOString() })
    mountRoute()
    const corner = await screen.findByRole('button', { name: '3 cards due for review' })
    // The corner Murmi sits above the zoom buttons, the line beside them: both may be there.
    expect(hintLine()).not.toBeNull()
    fireEvent.click(corner)
    await waitFor(() => expect(document.querySelector('[data-review-reminder-bubble]')).not.toBeNull())
    expect(hintLine()).toBeNull()
    fireEvent.click(document.querySelector('[data-review-reminder-bubble] button[aria-label="Close"]')!)
    await waitFor(() => expect(document.querySelector('[data-review-reminder-bubble]')).toBeNull(), { timeout: BUBBLE_EXIT_MS + 1000 })
    await waitFor(() => expect(hintLine()).not.toBeNull())
  })

  it('waits for the find-star bubble, and comes once it goes', async () => {
    mountRoute({ pathname: '/map/physics/optics/demo-refraction', state: { findStar: { unitId: 'demo-refraction' } } })
    await waitFor(() => expect(document.querySelector('[data-find-star]')).not.toBeNull())
    expect(hintLine()).toBeNull()
    fireEvent.click(document.querySelector('[data-find-star] button[aria-label="Close"]')!)
    await waitFor(() => expect(document.querySelector('[data-find-star]')).toBeNull(), { timeout: BUBBLE_EXIT_MS + 1000 })
    await waitFor(() => expect(hintLine()).not.toBeNull())
  })

  /** The real mathematics knowledge base, laid out as star clusters (#747), through the read model; `newcomer`: nothing started. */
  function mountClusters({ newcomer = false } = {}) {
    const map = demoClusterMap('en')
    vi.mocked(getKnowledgeMap).mockResolvedValue({
      subjectId: 'math',
      galaxies: map.subjects,
      nebulae: map.nebulae.map((nebula) => ({ ...nebula, subjectId: 'math' })),
      stars: (newcomer ? map.stars.map((star) => ({ ...star, state: 'ready' as const, progress: 0, unlitPrerequisiteIds: [] })) : map.stars) as KnowledgeMapResponse['stars'],
      prerequisites: map.prerequisites,
      summary: map.summary,
    })
    localStorage.removeItem(onceKey('clusterHint', OWNER))
    // The read model is read for a signed-in account.
    useAuthStore.setState({ user: { id: OWNER, name: 'Ada', email: 'ada@example.com', role: 'student', mustChangePassword: false } as never, accessToken: 'token', isAuthenticated: true })
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
    return render(
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={client}>
          <KnowledgeMapSourceProvider>
            <MemoryRouter initialEntries={['/map/math']}>
              <Routes>
                <Route path="/map/:subjectId" element={<StarMapRoute />} />
                <Route path="/map/:subjectId/cluster/:clusterId" element={<StarMapRoute />} />
              </Routes>
            </MemoryRouter>
          </KnowledgeMapSourceProvider>
        </QueryClientProvider>
      </I18nextProvider>,
    )
  }

  it('waits for the clusters’ panorama hint', async () => {
    const view = mountClusters()
    await waitFor(() => expect(view.container.querySelector('[data-cluster-hint]')).not.toBeNull())
    expect(hintLine()).toBeNull()
    fireEvent.click([...document.querySelectorAll<HTMLButtonElement>('[data-cluster-hint] button')].find((button) => button.textContent === en.clusterGuide.gotIt)!)
    await waitFor(() => expect(hintLine()).not.toBeNull(), { timeout: BUBBLE_EXIT_MS + 1000 })
  })

  it('waits for a newcomer’s landing on a sky of clusters (#769), and comes once it goes, with no hint between', async () => {
    const view = mountClusters({ newcomer: true })
    await waitFor(() => expect(view.container.querySelector('[data-cluster-landing]')).not.toBeNull())
    expect(hintLine()).toBeNull()
    fireEvent.click([...document.querySelectorAll<HTMLButtonElement>('[data-cluster-landing] button')].find((button) => button.textContent === en.firstLanding.later)!)
    await waitFor(() => expect(view.container.querySelector('[data-cluster-landing]')).toBeNull(), { timeout: BUBBLE_EXIT_MS + 1000 })
    await waitFor(() => expect(hintLine()?.dataset.zoomHint).toBe('cluster'))
    expect(view.container.querySelector('[data-cluster-hint]')).toBeNull()
  })
})

// ---------------------------------------------------------------- E. the mouse from far out

describe('C2. the keyboard way in', () => {
  beforeEach(() => stageRect())

  it("a nebula entered by its own link counts as gone in, as a tap does", () => {
    const onEnterNebula = vi.fn()
    const view = render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <div data-surface="sky" className="flex">
            <StarMapView map={skyMap(1000)} target={{ layer: 'map' }} onNavigate={() => {}} onEnterNebula={onEnterNebula} scheduler={fakeClock()} createRendererFor={() => recordingRenderer()} />
          </div>
        </MemoryRouter>
      </I18nextProvider>,
    )
    const link = view.container.querySelector<HTMLAnchorElement>('a[data-nebula-link]')!
    fireEvent.click(link)
    expect(onEnterNebula).toHaveBeenCalledWith(link.dataset.nebulaLink)
  })
})

describe('E. the mouse from far out', () => {
  it('rings the cluster as drawn: round its stars, not round the cloud', () => {
    // Three stars of nebula 1 in a 40 x 30 box, one of nebula 0 far away, one of nebula 1 not drawn.
    const of = [1, 1, 1, 0, 1]
    const x = [100, 140, 120, 900, 500]
    const y = [200, 200, 230, 900, 500]
    const alpha = [1, 1, 1, 1, 0]
    const around = clusterAsDrawn(1, of, x, y, alpha, 5)!
    expect(around.x).toBe(120)
    expect(around.y).toBe(215)
    expect(around.r).toBeCloseTo(Math.hypot(20, 15), 5)
    expect(clusterAsDrawn(2, of, x, y, alpha, 5)).toBeNull()
  })

  function engineOn() {
    const clock = fakeClock()
    const renderer = recordingRenderer()
    const engine = new StarMapEngine({ renderer, theme: THEME, reducedMotion: true, scheduler: clock, now: clock.now, galaxy: true, onRequestTarget: () => {} })
    engine.setViewport(1280, 776, 1, { top: 120, bottom: 90 })
    engine.setData(skyMap(1000), { layer: 'map' })
    clock.advance(20)
    return { clock, renderer, engine }
  }

  it('lights the whole cluster a click goes into, under a magnifier, and only a star once stars can be picked', () => {
    const { clock, renderer, engine } = engineOn()
    expect(engine.zoom.pickable).toBe(false)
    const frame = renderer.last()
    let spot: { x: number; y: number } | null = null
    for (let i = 0; i < frame.x.length && !spot; i += 5) {
      const x = frame.x[i] + 10
      const y = frame.y[i]
      if (engine.cursorAt(x, y) === 'zoom-in') spot = { x, y }
    }
    expect(spot, 'nowhere on the panorama a click goes into a cluster').not.toBeNull()
    engine.hoverAt(spot!.x, spot!.y)
    clock.advance(20)
    expect(renderer.last().hoverRing).toBeGreaterThanOrEqual(0)

    // Zoomed in until stars can be picked: no cluster ring, no magnifier.
    for (let i = 0; i < 6; i += 1) {
      engine.step('in')
      clock.advance(1000)
    }
    expect(engine.zoom.pickable).toBe(true)
    engine.hoverAt(spot!.x, spot!.y)
    clock.advance(20)
    expect(renderer.last().hoverRing).toBe(-1)
    expect(engine.cursorAt(spot!.x, spot!.y)).not.toBe('zoom-in')
    engine.hoverAt(null)
    clock.advance(20)
    expect(renderer.last().hoverRing).toBe(-1)
    engine.destroy()
  })
})

// ---------------------------------------------------------------- F. the words

describe('F. the words, in four languages', () => {
  const locales = { de, en, fr, it: it_ } as const

  it.each(Object.entries(locales))('%s: both lines for a mouse and for touch, the help dialog and the first reveal say a star may be chosen freely', (_, locale) => {
    const lines = locale.zoomHint
    for (const key of ['cluster', 'clusterTouch', 'far', 'farTouch', 'near', 'nearTouch'] as const) {
      expect(lines[key], key).toBeTruthy()
      // Two lines at most between the help star and the zoom buttons of a 375 px phone (measured: 80 characters fit).
      expect(lines[key].length, key).toBeLessThanOrEqual(80)
    }
    expect(locale.legend.choose.length).toBeGreaterThan(40)
    // The half sentence after the next star's name.
    expect(locale.firstReveal.body).toMatch(/\{\{name\}\} – .+/)
  })

  it('every language says each line in its own words', () => {
    for (const lang of ['de', 'fr', 'it'] as const) {
      expect(locales[lang].legend.choose).not.toBe(en.legend.choose)
      for (const key of Object.keys(en.zoomHint) as (keyof typeof en.zoomHint)[]) expect(locales[lang].zoomHint[key], `${lang} ${key}`).not.toBe(en.zoomHint[key])
    }
  })

  it('the help dialog says it after how to move', async () => {
    stageRect()
    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <div data-surface="sky" className="flex">
            <StarMapView map={skyMap(1000)} target={{ layer: 'map' }} onNavigate={() => {}} scheduler={fakeClock()} createRendererFor={() => recordingRenderer()} />
          </div>
        </MemoryRouter>
      </I18nextProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: en.help.open }))
    const dialog = await screen.findByRole('dialog')
    const pointer = dialog.querySelector('[data-legend-pointer]')!
    const choose = dialog.querySelector('[data-legend-choose]')!
    expect(choose.textContent).toBe(en.legend.choose)
    expect(pointer.compareDocumentPosition(choose) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
})
