/**
 * Finding a star, on the map (#489; rules #478, drawing #488).
 *
 * Ask's card asks the map to find a star (`location.state.findStar`). With
 * stars missing on the way, the camera frames the star and every missing
 * star on the galaxy (no card), the path is drawn over the lines, and Murmi
 * beside the star suggests the first missing one with three ways on. With
 * nothing missing it is today's find: the star's card. The path goes with
 * Murmi waved away, another star chosen, and the browser's back; zooming and
 * panning keep it; a reload never brings it back.
 *
 * The missing stars themselves: `findStarPath489.test.ts`.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter, Route, Routes, useLocation, useNavigate, type NavigateFunction } from 'react-router-dom'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import de from '@/i18n/locales/de/starmap.json'
import en from '@/i18n/locales/en/starmap.json'
import fr from '@/i18n/locales/fr/starmap.json'
import it_ from '@/i18n/locales/it/starmap.json'
import { AskTargetCard } from '@/features/ask/AskTargetCard'
import { StarMapView } from '@/features/starmap/components/StarMapView'
import { BUBBLE_EXIT_MS } from '@/features/starmap/components/MurmiBubble'
import { StarMapEngine } from '@/features/starmap/engine/starMapEngine'
import { FindStarBubble } from '@/features/starmap/findStar/FindStarBubble'
import { useFindStar, type FindStar, type FindStarArrival } from '@/features/starmap/findStar/useFindStar'
import { findStarPath, type FindStarPath } from '@/features/starmap/model/missingStars'
import { subjectOfNebula, type StarMap } from '@/features/starmap/model/starMap'
import { ZOOM_MS } from '@/features/starmap/motion/motionPolicy'
import { REVEAL_FLIGHT_MS } from '@/features/starmap/onboarding/useFirstReveal'
import { createCanvas2DRenderer } from '@/features/starmap/render/canvas2d'
import { drawPath, LINE } from '@/features/starmap/render/links'
import { STATE_READY, type SceneData, type SceneFrame, type StarMapRenderer } from '@/features/starmap/render/types'
import { StarMapRoute } from '@/features/starmap/StarMapRoute'
import { StarMapSourceContext, type StarMapSource } from '@/features/starmap/starMapSource'
import { pathForTarget, type LayerTarget } from '@/features/starmap/view/layers'
import { DemoStarMapSource, readDemoStarMap } from '@/dev/demo/sky/source'
import { DEMO_KNOWLEDGE_POINT } from '@/dev/demo/sky/demoSky'
import i18n from '@/i18n'
import { useAuthStore } from '@/store/authStore'
import { fakeCanvas, fakeClock, recordingRenderer, skyMap, THEME, type CanvasCounter } from './starmapHarness'

/** The demo sky as the map route reads it (1000 stars, no edges: the stars name their unlit prerequisites). */
const sky = () => readDemoStarMap({ subjectId: 'math', size: 1000, t: i18n.getFixedT('en', 'starmap'), language: 'en', relations: false, longNames: false })

/** Refraction (physics) needs sine and cosine (maths), not lit: a path across galaxies. */
const REFRACTION = { unitId: 'demo-refraction', name: 'Refraction', route: '/map/physics/optics/demo-refraction' }
const SINE = { unitId: DEMO_KNOWLEDGE_POINT.unitId, name: DEMO_KNOWLEDGE_POINT.name.en }
/** Algebra 64 needs Algebra 61, in its own nebula: a path inside one nebula. */
const ALGEBRA = { unitId: 'algebra-64', missing: 'algebra-61', route: '/map/math/algebra/algebra-64' }
/** A physics star in progress with nothing missing on the way: today's find. */
const MECHANICS = { unitId: 'mechanics-57', name: 'Mechanics 57', route: '/map/physics/mechanics/mechanics-57' }

const findState = (unitId: string): FindStarArrival & { focusStarCard: string } => ({ focusStarCard: unitId, findStar: { unitId } })

function media(reduce: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: /reduce/.test(query) ? reduce : true,
    media: query,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent: () => false,
  })) as never
}

beforeAll(async () => {
  await import('@/dev/demo/sky/source')
}, 30_000)

beforeEach(async () => {
  await i18n.changeLanguage('en')
  media(false)
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
  useAuthStore.setState({ user: { id: 'student-a', role: 'student' } as never })
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
  sessionStorage.clear()
  useAuthStore.setState({ user: null })
})

// ---------------------------------------------------------------- the visit

type Out = { current: FindStar | null; path: string; state: unknown; go?: NavigateFunction }

function Probe({ map, out }: { map: StarMap; out: Out }) {
  const location = useLocation()
  out.go = useNavigate()
  out.current = useFindStar(map)
  out.path = location.pathname
  out.state = location.state
  return null
}

function visit(entry: { pathname: string; state?: unknown }, map = sky()) {
  const out: Out = { current: null, path: '', state: null }
  render(
    <MemoryRouter initialEntries={['/map/math', entry]} initialIndex={1}>
      <Probe map={map} out={out} />
    </MemoryRouter>,
  )
  return out
}

describe('arriving to find a star', () => {
  it('with stars missing across galaxies: frames the star and every missing one on the galaxy, slowly, Murmi naming the first', () => {
    const out = visit({ pathname: REFRACTION.route, state: findState(REFRACTION.unitId) })
    expect(out.current!.target).toEqual({ layer: 'map', fly: true, frame: [REFRACTION.unitId, SINE.unitId], flightMs: REVEAL_FLIGHT_MS })
    expect(out.current!.path?.missing).toEqual([SINE.unitId])
    expect(out.current!.star?.unitId).toBe(REFRACTION.unitId)
    expect(out.current!.first?.unitId).toBe(SINE.unitId)
    // The galaxy's route, in place of the star's: no card opens.
    expect(out.path).toBe('/map/physics')
  })

  it('frames every missing star, however many: the frame is the star and all of them', () => {
    const map = sky()
    const long = map.stars.map((star) => findStarPath(map, star.unitId)).filter(Boolean).sort((a, b) => b!.missing.length - a!.missing.length)[0]!
    expect(long.missing.length).toBeGreaterThan(2)
    const star = map.stars.find((candidate) => candidate.unitId === long.target)!
    const out = visit({ pathname: pathForTarget(subjectOfNebula(map, star.nebulaId), { layer: 'star', nebulaId: star.nebulaId, unitId: star.unitId }), state: findState(star.unitId) }, map)
    const target = out.current!.target as Extract<LayerTarget, { layer: 'map' }>
    expect(target.frame).toEqual([long.target, ...long.missing])
  })

  it('inside one nebula: a choice’s flight, 420 ms', () => {
    const out = visit({ pathname: ALGEBRA.route, state: findState(ALGEBRA.unitId) })
    expect(out.current!.target).toEqual({ layer: 'map', fly: true, frame: [ALGEBRA.unitId, ALGEBRA.missing], flightMs: ZOOM_MS })
    expect(ZOOM_MS).toBe(420)
    expect(out.path).toBe('/map/math')
  })

  it('with reduced motion: no flight time, the engine crossfades', () => {
    media(true)
    const out = visit({ pathname: REFRACTION.route, state: findState(REFRACTION.unitId) })
    expect(out.current!.target).toEqual({ layer: 'map', fly: true, frame: [REFRACTION.unitId, SINE.unitId], flightMs: undefined })
  })

  it('with nothing missing, or the star lit: no path, no Murmi, the star’s route as today', () => {
    const map = sky()
    const lit = map.stars.find((star) => star.state === 'lit' && subjectOfNebula(map, star.nebulaId) === 'physics')!
    for (const [route, unitId] of [[MECHANICS.route, MECHANICS.unitId], [pathForTarget('physics', { layer: 'star', nebulaId: lit.nebulaId, unitId: lit.unitId }), lit.unitId]]) {
      const out = visit({ pathname: route, state: findState(unitId) }, map)
      expect(out.current!.target).toBeNull()
      expect(out.current!.path).toBeNull()
      expect(out.current!.star).toBeNull()
      expect(out.path).toBe(route)
      expect((out.state as { focusStarCard?: string }).focusStarCard).toBe(unitId)
    }
  })

  it('is not kept: the state is gone from the history entry, so a reload or a way back to it shows no path', () => {
    const out = visit({ pathname: REFRACTION.route, state: findState(REFRACTION.unitId) })
    expect(out.current!.target).not.toBeNull()
    // What a reload reads back.
    expect(out.state).toBeNull()
    // A reload of that entry: the galaxy's route, no state.
    const reloaded = visit({ pathname: out.path, state: out.state })
    expect(reloaded.current!.target).toBeNull()
    expect(reloaded.current!.path).toBeNull()
  })
})

describe('the path goes, or stays', () => {
  const arrived = () => visit({ pathname: REFRACTION.route, state: findState(REFRACTION.unitId) })

  it('goes once Murmi is waved away', () => {
    const out = arrived()
    act(() => out.current!.dismiss())
    expect(out.current!.target).toBeNull()
    expect(out.current!.path).toBeNull()
  })

  it('goes once another star or nebula is chosen', () => {
    const out = arrived()
    act(() => void out.go!('/map/physics/optics'))
    expect(out.current!.target).toBeNull()
    expect(out.current!.path).toBeNull()
  })

  it('goes on the browser’s back, and does not come back going forward again', () => {
    const out = arrived()
    act(() => void out.go!(-1))
    expect(out.path).toBe('/map/math')
    expect(out.current!.path).toBeNull()
    act(() => void out.go!(1))
    expect(out.path).toBe('/map/physics')
    expect(out.current!.path).toBeNull()
  })

  it('stays while the map pans to another galaxy (the route only replaced)', () => {
    const out = arrived()
    act(() => void out.go!('/map/math', { replace: true }))
    expect(out.current!.path?.target).toBe(REFRACTION.unitId)
    expect(out.current!.target).not.toBeNull()
  })
})

// ---------------------------------------------------------------- on the route

/** A source like the demo's, but not marked demo: every star has its ways in. */
const sourceNotDemo: StarMapSource = { read: readDemoStarMap, demo: false }

function Where() {
  const location = useLocation()
  return <p data-testid="where">{location.pathname}</p>
}

function mountRoute(entry: { pathname: string; state?: unknown }, wrap: (app: ReactNode) => ReactNode = (app) => <StarMapSourceContext.Provider value={sourceNotDemo}>{app}</StarMapSourceContext.Provider>) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        {wrap(
          <MemoryRouter initialEntries={['/map/math', entry]} initialIndex={1}>
            <Routes>
              <Route path="/map/:subjectId" element={<StarMapRoute />} />
              <Route path="/map/:subjectId/:topicId" element={<StarMapRoute />} />
              <Route path="/map/:subjectId/:topicId/:unitId" element={<StarMapRoute />} />
              <Route path="/ask" element={<AskTargetCard unitId={REFRACTION.unitId} />} />
              <Route path="/chapter/:unitId" element={<p>chapter</p>} />
              <Route path="/star-quiz/:unitId" element={<p>quiz</p>} />
            </Routes>
            <Where />
          </MemoryRouter>,
        )}
      </QueryClientProvider>
    </I18nextProvider>,
  )
}

const bubble = () => document.querySelector<HTMLElement>('[data-find-star]')
const way = (name: string) => bubble()?.querySelector<HTMLAnchorElement>(`a[data-find-star-way="${name}"]`) ?? null

describe('on the map route', () => {
  it('shows Murmi beside the star, no card, with its three ways in', async () => {
    mountRoute({ pathname: REFRACTION.route, state: findState(REFRACTION.unitId) })
    await waitFor(() => expect(bubble()).not.toBeNull())
    expect(bubble()!.dataset.findStar).toBe(REFRACTION.unitId)
    expect(screen.getByTestId('where')).toHaveTextContent(/^\/map\/physics$/)
    expect(screen.queryByRole('article', { name: REFRACTION.name })).toBeNull()
    expect(bubble()!.querySelector('h2')!.textContent).toBe(`I suggest you learn ${SINE.name} first.`)
    expect(way('start')!.getAttribute('href')).toBe(`/chapter/${SINE.unitId}`)
    expect(way('quiz')!.getAttribute('href')).toBe(`/star-quiz/${SINE.unitId}`)
    expect(way('direct')!.getAttribute('href')).toBe(`/chapter/${REFRACTION.unitId}`)
  })

  it.each([
    ['start', `/chapter/${SINE.unitId}`],
    ['quiz', `/star-quiz/${SINE.unitId}`],
    ['direct', `/chapter/${REFRACTION.unitId}`],
  ])('“%s” goes where it says, and the path goes with the map', async (name, to) => {
    mountRoute({ pathname: REFRACTION.route, state: findState(REFRACTION.unitId) })
    await waitFor(() => expect(way(name)).not.toBeNull())
    fireEvent.click(way(name)!)
    expect(screen.getByTestId('where')).toHaveTextContent(to)
    expect(bubble()).toBeNull()
  })

  it('with nothing missing: no Murmi, and the star’s card opens as today', async () => {
    mountRoute({ pathname: MECHANICS.route, state: findState(MECHANICS.unitId) })
    await screen.findByRole('article', { name: MECHANICS.name }, { timeout: 5_000 })
    expect(bubble()).toBeNull()
    expect(screen.getByTestId('where')).toHaveTextContent(MECHANICS.route)
  })

  it('without the state (a reload): no Murmi', async () => {
    mountRoute({ pathname: '/map/physics' })
    await waitFor(() => expect(document.querySelector('[data-starmap-stage]')).not.toBeNull())
    expect(bubble()).toBeNull()
  })

  it('in the design preview, offers no way into a placeholder star without a chapter (as its card)', async () => {
    mountRoute({ pathname: REFRACTION.route, state: findState(REFRACTION.unitId) }, (app) => <DemoStarMapSource>{app}</DemoStarMapSource>)
    await waitFor(() => expect(bubble()).not.toBeNull())
    expect(way('start')).not.toBeNull()
    expect(way('direct')).toBeNull()
  })

  it('is what Ask’s card asks for: the card’s link carries the star to find', async () => {
    mountRoute({ pathname: '/ask' })
    const link = await screen.findByRole('link', { name: i18n.t('chat:ask.target.show') })
    await act(async () => {
      await userEvent.click(link)
    })
    await waitFor(() => expect(bubble()).not.toBeNull())
    expect(screen.getByTestId('where')).toHaveTextContent(/^\/map\/physics$/)
  })
})

// ---------------------------------------------------------------- Murmi

function mountBubble(width: number, onDismiss: () => void) {
  const map = sky()
  const star = map.stars.find((candidate) => candidate.unitId === REFRACTION.unitId)!
  const first = map.stars.find((candidate) => candidate.unitId === SINE.unitId)!
  const clock = fakeClock()
  render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <div data-stage>
          <FindStarBubble star={star} first={first} locate={() => ({ x: 200, y: 200, size: 20 })} onDismiss={onDismiss} scheduler={clock} />
        </div>
      </MemoryRouter>
    </I18nextProvider>,
  )
  const layer = bubble()!
  Object.defineProperty(layer, 'clientWidth', { value: width })
  Object.defineProperty(layer, 'clientHeight', { value: 700 })
  act(() => clock.advance(500))
  return { layer, stage: document.querySelector<HTMLElement>('[data-stage]')! }
}

describe('Murmi beside the star', () => {
  it('arrives once the camera rests, the ways in a row beside the star on a wide map, stacked on a phone', () => {
    const wide = mountBubble(1024, () => {})
    expect(wide.layer.querySelector('[data-shown]')).not.toBeNull()
    expect(wide.layer.querySelector('[data-bubble-ways]')!.getAttribute('data-bubble-ways')).toBe('row')
    document.body.innerHTML = ''
    const phone = mountBubble(375, () => {})
    expect(phone.layer.querySelector('[data-bubble-ways]')!.getAttribute('data-bubble-ways')).toBe('stacked')
  })

  it('goes on its ✕', () => {
    let dismissed = 0
    const { layer } = mountBubble(1024, () => (dismissed += 1))
    vi.useFakeTimers()
    fireEvent.click(screen.getByRole('button', { name: i18n.t('starmap:help.close') }))
    expect(layer.querySelector('[data-leaving]')).not.toBeNull()
    act(() => vi.advanceTimersByTime(BUBBLE_EXIT_MS))
    expect(dismissed).toBe(1)
  })

  it('goes on Escape', () => {
    let dismissed = 0
    mountBubble(1024, () => (dismissed += 1))
    vi.useFakeTimers()
    fireEvent.keyDown(document.body, { key: 'Escape' })
    act(() => vi.advanceTimersByTime(BUBBLE_EXIT_MS))
    expect(dismissed).toBe(1)
  })

  it('goes on a tap on the map, not on a drag of it', () => {
    let dismissed = 0
    const { stage } = mountBubble(1024, () => (dismissed += 1))
    vi.useFakeTimers()
    fireEvent.pointerDown(stage, { pointerId: 1, clientX: 500, clientY: 300 })
    fireEvent.pointerUp(stage, { pointerId: 1, clientX: 560, clientY: 340 })
    act(() => vi.advanceTimersByTime(BUBBLE_EXIT_MS))
    expect(dismissed).toBe(0)
    fireEvent.pointerDown(stage, { pointerId: 2, clientX: 500, clientY: 300 })
    fireEvent.pointerUp(stage, { pointerId: 2, clientX: 501, clientY: 301 })
    act(() => vi.advanceTimersByTime(BUBBLE_EXIT_MS))
    expect(dismissed).toBe(1)
  })
})

// ---------------------------------------------------------------- the path drawn

/** The maths galaxy with its edges, and a star in it with stars missing. */
function withPath() {
  const map = skyMap(1000, 'math', { relations: true })
  const path = map.stars
    .filter((star) => subjectOfNebula(map, star.nebulaId) === 'math')
    .map((star) => findStarPath(map, star.unitId))
    .find((found): found is FindStarPath => found !== null && found.edges.length >= 2)!
  return { map, path }
}

function drawnSky() {
  const counter: CanvasCounter = { drawImage: 0, filterSets: 0, texts: [] }
  const real = createCanvas2DRenderer(fakeCanvas(counter), { createCanvas: (w, h) => fakeCanvas(counter, w, h) })!
  let frame: SceneFrame | null = null
  const renderer: StarMapRenderer = { ...real, draw: (next) => { frame = next; real.draw(next) } }
  const clock = fakeClock()
  const engine = new StarMapEngine({ renderer, theme: THEME, reducedMotion: true, scheduler: clock, now: clock.now, foveate: false, galaxy: true })
  const { map, path } = withPath()
  engine.setViewport(1440, 900, 1)
  engine.setData(map, { layer: 'map' })
  clock.advance(20)
  return { real, engine, clock, map, path, frame: () => frame! }
}

describe('the path drawn (#488 point 2)', () => {
  beforeEach(() => vi.stubGlobal('Path2D', class {}))
  afterEach(() => vi.unstubAllGlobals())

  it('is drawn over the panorama, where no line between stars is: every line of it, a glow round each missing star', () => {
    const s = drawnSky()
    s.engine.setTarget({ layer: 'map', fly: true, frame: [s.path.target, ...s.path.missing] })
    s.clock.advance(400)
    expect(s.real.stats.path).toEqual({ lines: 0, glows: 0 })
    s.engine.setPath(s.path)
    s.clock.advance(400)
    expect(s.real.stats.path!.lines).toBe(s.path.edges.length)
    expect(s.real.stats.path!.glows).toBe(s.path.missing.length)
    s.engine.destroy()
  })

  it('lets every other line step back, as around a chosen star', () => {
    const s = drawnSky()
    const nebulaId = s.map.stars.find((star) => star.unitId === s.path.target)!.nebulaId
    s.engine.setTarget({ layer: 'nebula', nebulaId })
    s.clock.advance(400)
    const before = s.real.stats.links!.lines
    expect(before).toBeGreaterThan(0)
    s.engine.setPath(s.path)
    s.clock.advance(400)
    expect(s.real.stats.links!.lines).toBe(0)
    expect(s.real.stats.path!.lines).toBe(s.path.edges.length)
    s.engine.destroy()
  })

  it('stays through a zoom, and goes once it is taken away', () => {
    const s = drawnSky()
    s.engine.setTarget({ layer: 'map', fly: true, frame: [s.path.target, ...s.path.missing] })
    s.engine.setPath(s.path)
    s.clock.advance(400)
    s.engine.step('in')
    s.clock.advance(400)
    s.engine.wheelBy(200, 700, 450)
    s.clock.advance(400)
    expect(s.frame().path?.amount).toBe(1)
    expect(s.real.stats.path!.lines).toBeGreaterThan(0)
    s.engine.setPath(null)
    s.clock.advance(400)
    expect(s.frame().path).toBeUndefined()
    expect(s.real.stats.path).toEqual({ lines: 0, glows: 0 })
    s.engine.destroy()
  })

  it('runs every line from star to star, in the recommended gold, however far apart they are', () => {
    // Two stars in two nebulae 400 px apart: a line leaving a nebula is otherwise faded out near its star.
    const scene = {
      mapKey: 'path',
      count: 2,
      mapX: Float32Array.from([0.3, 0.7]),
      mapY: Float32Array.from([0.5, 0.5]),
      state: Uint8Array.from([STATE_READY, STATE_READY]),
      progress: new Float32Array(2),
      reviewDue: new Uint8Array(2),
      recommended: -1,
      nebula: Uint16Array.from([0, 1]),
      names: ['a', 'b'],
      skills: [[], []],
      nebulae: [
        { topicId: 'n0', name: 'Zero', x: 0.3, y: 0.5, r: 0.05, lit: 0, total: 1 },
        { topicId: 'n1', name: 'One', x: 0.7, y: 0.5, r: 0.05, lit: 0, total: 1 },
      ],
      links: [{ a: 0, b: 1, count: 1 }],
      starLinks: [{ from: 0, to: 1 }],
    } satisfies SceneData
    const frame = {
      viewport: { width: 1000, height: 600 },
      scale: 1000,
      ox: 0,
      oy: -200,
      x: Float32Array.from([300, 700]),
      y: Float32Array.from([300, 300]),
      glyphSize: 10,
      dotRadius: 2,
      path: { target: 1, missing: [0], edges: [{ from: 0, to: 1 }], amount: 1 },
    } as unknown as SceneFrame
    const strokes: { from: [number, number]; to: [number, number]; style: unknown; width: number }[] = []
    let at: number[] = []
    const store: Record<string | symbol, unknown> = {}
    const ctx = new Proxy(store, {
      get(target, prop) {
        if (prop in target) return target[prop]
        if (prop === 'createRadialGradient' || prop === 'createLinearGradient') return () => ({ addColorStop() {} })
        if (prop === 'beginPath') return () => (at = [])
        if (prop === 'moveTo' || prop === 'lineTo') return (x: number, y: number) => at.push(x, y)
        if (prop === 'stroke') return () => strokes.push({ from: [at[0], at[1]], to: [at[2], at[3]], style: store.strokeStyle, width: store.lineWidth as number })
        return () => undefined
      },
      set(target, prop, value) {
        target[prop] = value
        return true
      },
    }) as unknown as CanvasRenderingContext2D
    const drawn = drawPath(ctx, scene, frame, THEME, { segments: [] })
    expect(drawn).toEqual({ lines: 1, glows: 1 })
    const line = strokes.find((stroke) => stroke.width === LINE.width[1])!
    // From just off the target (x 700) to just off the missing star (x 300): the whole way.
    expect(line.from[0]).toBeGreaterThan(680)
    expect(line.from[0]).toBeLessThan(700)
    expect(line.to[0]).toBeGreaterThan(300)
    expect(line.to[0]).toBeLessThan(320)
    expect(line.style).toBe('rgba(242, 197, 114, 0.95)')
  })
})

describe('the camera (#488 point 1)', () => {
  it('flies from the galaxy to the framing, and stays where it is once the framing is let go', () => {
    const clock = fakeClock()
    const renderer = recordingRenderer()
    const engine = new StarMapEngine({ renderer, theme: THEME, reducedMotion: false, scheduler: clock, now: clock.now, galaxy: true })
    const { map, path } = withPath()
    engine.setViewport(1280, 800, 1)
    engine.setData(map, { layer: 'map' })
    clock.advance(20)
    const galaxy = renderer.last().scale
    const framing: LayerTarget = { layer: 'map', fly: true, frame: [path.target, ...path.missing], flightMs: ZOOM_MS }
    engine.expectTarget(framing, 'fly')
    engine.setTarget(framing)
    clock.advance(ZOOM_MS + 100)
    const framed = renderer.last()
    expect(framed.scale).toBeGreaterThan(galaxy)
    for (const unitId of [path.target, ...path.missing]) {
      const spot = engine.starOnScreen(unitId)!
      expect(spot.x).toBeGreaterThan(0)
      expect(spot.x).toBeLessThan(1280)
    }
    // Waved away: the galaxy's own route again, the camera where it was.
    engine.setTarget({ layer: 'map' })
    clock.advance(1000)
    expect(renderer.last().scale).toBeCloseTo(framed.scale)
    expect(renderer.last().ox).toBeCloseTo(framed.ox)
    engine.destroy()
  })

  it('takes the path from the route to the engine', () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      x: 0, y: 0, left: 0, top: 0, width: 1280, height: 776, right: 1280, bottom: 776, toJSON: () => ({}),
    } as DOMRect)
    const clock = fakeClock()
    const renderer = recordingRenderer()
    const { map, path } = withPath()
    const view = (found: FindStarPath | null) => (
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <StarMapView map={map} target={{ layer: 'map' }} path={found} onNavigate={() => {}} scheduler={clock} createRendererFor={() => renderer} />
        </MemoryRouter>
      </I18nextProvider>
    )
    const { rerender } = render(view(path))
    act(() => clock.advance(400))
    expect(renderer.last().path?.missing.length).toBe(path.missing.length)
    rerender(view(null))
    act(() => clock.advance(1000))
    expect(renderer.last().path).toBeUndefined()
  })
})

// ---------------------------------------------------------------- the words

describe('the words, in four languages', () => {
  const bundles = { en, de, fr, it: it_ } as Record<string, { findStar?: Record<string, string> }>

  it('has Murmi’s line and the three ways in every language, each naming its star', () => {
    for (const [language, bundle] of Object.entries(bundles)) {
      for (const key of ['suggest', 'start', 'quiz', 'direct']) {
        expect(bundle.findStar?.[key], `${language} findStar.${key}`).toMatch(/\{\{name\}\}/)
      }
    }
  })

  it('speaks to the student informally, and German writes ss', () => {
    const german = Object.values(de.findStar).join(' ')
    expect(german).not.toMatch(/ß/)
    expect(german).not.toMatch(/\b(Sie|Ihnen|Ihr)\b/)
    expect(german).toMatch(/\bdu\b|\bmich\b/)
    expect(Object.values(fr.findStar).join(' ')).not.toMatch(/\bvous\b/i)
    expect(Object.values(it_.findStar).join(' ')).not.toMatch(/\b(Lei|La)\b/)
  })
})
