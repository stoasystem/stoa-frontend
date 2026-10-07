/**
 * The lighting moment's details (#145, round three of #142):
 *
 *   C11  the recommendation marker moves on at the flare's brightest moment,
 *        together with the gold -- held on the point until then;
 *   C14  the flare's title and the reduced-motion still label keep clear of
 *        the names at the screen's edge ("↘ Optics · Physics" on a phone);
 *   C6   a star still waiting for its lighting, chosen on the map, lands on
 *        its nebula seen whole, decided before the flight takes off, so the
 *        flight heads there from its first frame and never turns.
 *
 * Production's default source knows nothing, so none of it happens there.
 */
import { act, fireEvent, render, screen } from '@testing-library/react'
import { useEffect } from 'react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { demoStarMapOverride } from '@/dev/preview/lighting'
import { finishDemoKnowledgePoint, unacknowledgedLit } from '@/dev/preview/demoSource'
import { demoStarMap } from '@/dev/demo/sky/demoStarMap'
import { DEMO_KNOWLEDGE_POINT } from '@/dev/demo/sky/demoSky'
import { StarMapView } from '@/features/starmap/components/StarMapView'
import { StarMapEngine, type StarOnScreen } from '@/features/starmap/engine/starMapEngine'
import { flareBase, FLARE_PEAK_MS } from '@/features/starmap/lighting/flare'
import { placeBesideStar, type Rect } from '@/features/starmap/lighting/labelPlace'
import { LightingOverlay, SETTLE_MS } from '@/features/starmap/lighting/LightingOverlay'
import { LightingEventSourceContext, type LightingEventSource, type LitEvent } from '@/features/starmap/lighting/lightingEvents'
import { landingFor, presentHeld, useLightingStage } from '@/features/starmap/lighting/useLightingStage'
import { orderedStars, subjectOfNebula, type StarMap } from '@/features/starmap/model/starMap'
import { createCanvas2DRenderer } from '@/features/starmap/render/canvas2d'
import { pathForTarget, resolveTarget, type LayerTarget } from '@/features/starmap/view/layers'
import { LIGHTING, ZOOM } from '@/features/starmap/view/semanticZoom'
import i18n from '@/i18n'
import { useAuthStore } from '@/store/authStore'
import { useLitMomentsStore } from '@/store/litMomentsStore'
import { fakeCanvas, fakeClock, recordingRenderer, THEME, type CanvasCounter, type FakeClock } from './starmapHarness'

const KP = DEMO_KNOWLEDGE_POINT.unitId
const TOPIC = DEMO_KNOWLEDGE_POINT.topicId
const ALL_LESSONS = DEMO_KNOWLEDGE_POINT.lessons.map((lesson) => lesson.lessonId)
const observed: LitEvent = { unitId: KP, litAt: '2026-10-06T09:00:00.000Z', litAtSource: 'observed', recommended: true }
const WHOLE: LayerTarget = { layer: 'nebula', nebulaId: TOPIC, whole: { star: KP } }

const litMap = (size: 10 | 1000 = 1000, subjectId = 'math'): StarMap =>
  demoStarMapOverride(demoStarMap(subjectId, size, i18n.getFixedT('en', 'starmap'), { language: 'en', relations: true }), size, ALL_LESSONS)

const recommendedIn = (map: StarMap, subjectId: string) =>
  map.stars.filter((star) => star.recommendation && subjectOfNebula(map, star.nebulaId) === subjectId).map((star) => star.unitId)

/** A source like the demo backend's: known at once, acknowledged on the server. */
function knownSource(events: LitEvent[]): LightingEventSource {
  const acknowledged = new Set<string>()
  const listeners = new Set<() => void>()
  const waiting = () => events.filter((event) => !acknowledged.has(event.unitId))
  return {
    unacknowledged: async () => waiting(),
    acknowledge: async (unitIds) => {
      for (const id of unitIds) acknowledged.add(id)
      for (const listener of listeners) listener()
    },
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    known: waiting,
  }
}

beforeEach(async () => {
  await i18n.changeLanguage('en')
  const gradient = { addColorStop: () => {} }
  const ctx = new Proxy({} as Record<string, unknown>, {
    get: (target, key: string) => (key in target ? target[key] : key.startsWith('create') ? () => gradient : () => {}),
    set: (target, key: string, value) => {
      target[key] = value
      return true
    },
  })
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx as never)
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(390)
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(700)
  useAuthStore.setState({ user: { id: 'student-a' } as never })
  useLitMomentsStore.setState({ byOwner: {} })
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  useAuthStore.setState({ user: null })
})

describe('C11: the recommendation moves on at the brightest moment', () => {
  it('the demo backend says its point was math’s recommendation, as the demo sky drew it before', () => {
    expect(unacknowledgedLit()).toEqual([])
    finishDemoKnowledgePoint()
    expect(unacknowledgedLit()).toEqual([expect.objectContaining({ unitId: KP, litAtSource: 'observed', recommended: true })])
    const before = demoStarMap('math', 1000, i18n.getFixedT('en', 'starmap'), { language: 'en' })
    expect(recommendedIn(before, 'math')).toEqual([KP])
  })

  it.each([10, 1000] as const)('holds the marker on the waiting point, and only in its own galaxy (%i stars)', (size) => {
    const map = litMap(size)
    const pick = recommendedIn(map, 'math')
    expect(pick).toHaveLength(1)
    expect(pick[0]).not.toBe(KP) // the map recommends the next one already
    const held = presentHeld(map, new Set([KP]), new Set([KP]))
    expect(recommendedIn(held, 'math')).toEqual([KP])
    expect(held.stars.find((star) => star.unitId === KP)).toMatchObject({ state: 'in_progress', recommendation: { source: 'system' } })
    // Another galaxy's recommendation is never touched.
    expect(recommendedIn(held, 'physics')).toEqual(recommendedIn(map, 'physics'))
    // A point that was not the recommendation leaves the marker where the map draws it.
    expect(recommendedIn(presentHeld(map, new Set([KP])), 'math')).toEqual(pick)
    expect(recommendedIn(presentHeld(map, new Set([KP]), new Set()), 'math')).toEqual(pick)
  })

  it('leaves a teacher’s recommendation where it is', () => {
    const map = litMap(10)
    const pick = recommendedIn(map, 'math')[0]
    const byTeacher: StarMap = { ...map, stars: map.stars.map((star) => (star.unitId === pick ? { ...star, recommendation: { source: 'teacher' as const } } : star)) }
    const held = presentHeld(byTeacher, new Set([KP]), new Set([KP]))
    expect(recommendedIn(held, 'math')).toEqual([pick])
  })

  /** The route's stage over the map, the overlay told when to reveal; writes what is drawn. */
  function Drawn({ map, clock }: { map: StarMap; clock: FakeClock }) {
    const stage = useLightingStage(map, { layer: 'nebula', nebulaId: TOPIC })
    const kp = stage.map.stars.find((star) => star.unitId === KP)
    return (
      <>
        <output data-state={kp?.state} data-recommended={recommendedIn(stage.map, 'math').join(',')} />
        <LightingOverlay map={map} locate={(unitId) => (unitId === KP ? { x: 200, y: 300, size: 24 } : null)} onReveal={stage.reveal} scheduler={clock} />
      </>
    )
  }

  it('moves the marker in the same frame as the gold, not before', async () => {
    const map = litMap(1000)
    const pick = recommendedIn(map, 'math')[0]
    const clock = fakeClock()
    const view = render(
      <I18nextProvider i18n={i18n}>
        <LightingEventSourceContext.Provider value={knownSource([observed])}>
          <MemoryRouter initialEntries={[`/map/math/${TOPIC}`]}>
            <Drawn map={map} clock={clock} />
          </MemoryRouter>
        </LightingEventSourceContext.Provider>
      </I18nextProvider>,
    )
    await act(async () => {})
    const out = () => view.container.querySelector('output')!
    const drawn = () => [out().getAttribute('data-state'), out().getAttribute('data-recommended')]
    expect(drawn()).toEqual(['in_progress', KP])
    act(() => clock.advance(20))
    act(() => clock.advance(SETTLE_MS + FLARE_PEAK_MS - 60))
    expect(drawn()).toEqual(['in_progress', KP]) // the sparks gather: still the recommendation
    act(() => clock.advance(80))
    expect(drawn()).toEqual(['lit', pick]) // under the bloom at its fullest: gold, and the marker moved on
  })
})

describe('C14: the labels keep clear of the names at the screen’s edge', () => {
  const layer = { width: 390, height: 700 }
  const label = { width: 150, height: 30 }
  const spot = { x: 195, y: 300 }
  const gap = 40
  const hits = (place: { x: number; y: number }, box: Rect) =>
    place.x < box.x1 + LIGHTING.edgeLabelClearancePx &&
    place.x + label.width > box.x0 - LIGHTING.edgeLabelClearancePx &&
    place.y < box.y1 + LIGHTING.edgeLabelClearancePx &&
    place.y + label.height > box.y0 - LIGHTING.edgeLabelClearancePx

  it('stays below the star when nothing is in the way', () => {
    expect(placeBesideStar(spot, label, gap, layer)).toEqual({ side: 'below', x: 120, y: 340 })
  })

  it('goes above the star when below covers an edge name, then right, then left', () => {
    const under: Rect = { x0: 200, y0: 345, x1: 382, y1: 365 }
    const above = placeBesideStar(spot, label, gap, layer, [under])
    expect(above.side).toBe('above')
    expect(hits(above, under)).toBe(false)
    const over: Rect = { x0: 100, y0: 225, x1: 300, y1: 245 }
    const right = placeBesideStar(spot, label, gap, layer, [under, over])
    expect(right.side).toBe('right')
    const aside: Rect = { x0: 230, y0: 280, x1: 382, y1: 320 }
    const left = placeBesideStar(spot, label, gap, layer, [under, over, aside])
    expect(left.side).toBe('left')
    for (const box of [under, over, aside]) expect(hits(left, box)).toBe(false)
  })

  it('slides along below or above when no side is clear, and covers the least when nothing is', () => {
    // A star at the left edge: no room on its left; names across the rest.
    const edge = { x: 60, y: 300 }
    const keep: Rect[] = [
      { x0: 0, y0: 222, x1: 60, y1: 250 },
      { x0: 100, y0: 222, x1: 390, y1: 250 },
      { x0: 90, y0: 270, x1: 390, y1: 330 },
      { x0: 100, y0: 340, x1: 390, y1: 380 },
    ]
    const slid = placeBesideStar(edge, { width: 80, height: 30 }, gap, layer, keep)
    expect(slid.side).toBe('below-slid')
    for (const box of keep) expect(hits({ x: slid.x, y: slid.y }, box) && slid.x + 80 > box.x0 && slid.x < box.x1).toBe(false)
    expect(slid.x).toBeLessThanOrEqual(edge.x)
    expect(slid.x + 80).toBeGreaterThanOrEqual(edge.x)
    const everywhere: Rect[] = [{ x0: 0, y0: 0, x1: 390, y1: 700 }]
    expect(placeBesideStar(spot, label, gap, layer, everywhere).side).toBe('below')
  })

  it('keeps the side it had while that stays clear, so it does not hop', () => {
    expect(placeBesideStar(spot, label, gap, layer, [], 'above').side).toBe('above')
    const overAbove: Rect = { x0: 100, y0: 225, x1: 300, y1: 245 }
    expect(placeBesideStar(spot, label, gap, layer, [overAbove], 'above').side).toBe('below')
  })

  it('stays inside the layer and above the docked composer', () => {
    const low = placeBesideStar({ x: 380, y: 690 }, label, gap, layer)
    expect(low.x + label.width).toBeLessThanOrEqual(layer.width - LIGHTING.insetPx)
    expect(low.y).toBeLessThanOrEqual(layer.height - LIGHTING.bottomReservePx)
  })

  /** The real renderer and engine, a phone, the lighting's landing: math's trigonometry seen whole. */
  function phoneLanding() {
    vi.stubGlobal('Path2D', class {})
    const counter: CanvasCounter = { drawImage: 0, filterSets: 0, texts: [] }
    const gradient = { addColorStop() {} }
    const store: Record<string | symbol, unknown> = { globalAlpha: 1 }
    const ctx = new Proxy(store, {
      get: (target, prop) =>
        prop in target ? target[prop] : prop === 'createRadialGradient' || prop === 'createLinearGradient' ? () => gradient : prop === 'measureText' ? (text: string) => ({ width: 7 * String(text).length }) : () => undefined,
      set: (target, prop, value) => {
        target[prop] = value
        return true
      },
      has: (target, prop) => prop in target,
    })
    const main = { width: 1, height: 1, getContext: () => ctx } as unknown as HTMLCanvasElement
    const renderer = createCanvas2DRenderer(main, { createCanvas: (w, h) => fakeCanvas(counter, w, h) })!
    const clock = fakeClock()
    const engine = new StarMapEngine({ renderer, theme: THEME, reducedMotion: true, scheduler: clock, now: clock.now, foveate: false, galaxy: true })
    engine.setViewport(390, 844, 1, { top: 144, bottom: 72 })
    engine.setData(presentHeld(litMap(1000), new Set([KP]), new Set([KP])), WHOLE)
    clock.advance(1000)
    return { engine, renderer, clock }
  }

  it('reads the edge names from the renderer, and the flare’s title keeps clear of them on a phone', () => {
    const { engine, renderer } = phoneLanding()
    const spot: StarOnScreen = engine.starOnScreen(KP)!
    expect(spot.keepClear).toBe(renderer.stats.edgeLabels)
    expect(spot.keepClear!.length).toBeGreaterThan(0) // "↘ Optics · Physics"
    const title = { width: 7 * 'Sine and cosine is lit'.length + 26, height: 30 }
    for (const gap of [flareBase(spot.size) * 1.6 + 12, flareBase(spot.size) * 0.6 + 10]) {
      const place = placeBesideStar(spot, title, gap, { width: 390, height: 844 }, spot.keepClear)
      for (const box of spot.keepClear!) {
        expect(place.x >= box.x1 || place.x + title.width <= box.x0 || place.y >= box.y1 || place.y + title.height <= box.y0).toBe(true)
      }
    }
    engine.destroy()
  })

  it('places the overlay’s title where the renderer’s edge names are not', async () => {
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(150)
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(30)
    const under: Rect = { x0: 150, y0: 340, x1: 380, y1: 362 }
    const clock = fakeClock()
    const map = litMap(1000)
    const view = render(
      <I18nextProvider i18n={i18n}>
        <LightingEventSourceContext.Provider value={knownSource([observed])}>
          <LightingOverlay map={map} locate={(unitId) => (unitId === KP ? { x: 195, y: 300, size: 24, keepClear: [under] } : null)} scheduler={clock} />
        </LightingEventSourceContext.Provider>
      </I18nextProvider>,
    )
    await act(async () => {})
    act(() => clock.advance(20))
    act(() => clock.advance(SETTLE_MS + 700))
    const caption = view.container.querySelector<HTMLElement>('[data-lighting-caption]')!
    expect(caption.dataset.side).toBe('above')
    const [x, y] = caption.style.transform.match(/-?\d+/g)!.map(Number)
    expect(y + 30).toBeLessThanOrEqual(300)
    expect(x).toBe(120)
  })
})

describe('C6: a waiting star chosen on the map lands on its nebula seen whole, decided before take-off', () => {
  it('a waiting point’s star lands on its nebula seen whole; anything else as itself', () => {
    const map = litMap(1000)
    const star: LayerTarget = { layer: 'star', nebulaId: TOPIC, unitId: KP }
    expect(landingFor(map, new Set([KP]), star)).toEqual(WHOLE)
    expect(landingFor(map, new Set(), star)).toBeNull()
    const other = map.stars.find((s) => s.nebulaId === TOPIC && s.unitId !== KP)!
    expect(landingFor(map, new Set([KP]), { layer: 'star', nebulaId: TOPIC, unitId: other.unitId })).toBeNull()
    expect(landingFor(map, new Set([KP]), { layer: 'nebula', nebulaId: TOPIC })).toBeNull()
  })

  /** The route's part: the stage over the route's target, `land` asked as the map would, the route following later. */
  function Routed({ map, onStage }: { map: StarMap; onStage: (stage: ReturnType<typeof useLightingStage>, go: (next: LayerTarget) => void) => void }) {
    const location = useLocation()
    const navigate = useNavigate()
    const [, , , topicId, unitId] = location.pathname.split('/')
    const stage = useLightingStage(map, resolveTarget(map, topicId, unitId))
    useEffect(() => {
      onStage(stage, (next) => navigate(pathForTarget(next.layer === 'map' ? map.subject.subjectId : subjectOfNebula(map, next.nebulaId), next)))
    })
    return <output data-target={JSON.stringify(stage.target)} data-path={location.pathname} data-kp={stage.map.stars.find((star) => star.unitId === KP)?.state} />
  }

  async function routed(path: string, source: LightingEventSource = knownSource([observed])) {
    let current: { stage: ReturnType<typeof useLightingStage>; go: (next: LayerTarget) => void } | null = null
    const view = render(
      <LightingEventSourceContext.Provider value={source}>
        <MemoryRouter initialEntries={[path]}>
          <Routed map={litMap(1000)} onStage={(stage, go) => (current = { stage, go })} />
        </MemoryRouter>
      </LightingEventSourceContext.Provider>,
    )
    await act(async () => {})
    const out = () => view.container.querySelector('output')!
    return {
      view,
      stage: () => current!.stage,
      go: (next: LayerTarget) => act(() => current!.go(next)),
      target: () => JSON.parse(out().getAttribute('data-target')!) as LayerTarget,
      path: () => out().getAttribute('data-path'),
      kp: () => out().getAttribute('data-kp'),
    }
  }

  it('a tap on the waiting star from the galaxy: the landing at once, the route the nebula’s once it follows', async () => {
    const shown = await routed('/map/math')
    let landing: LayerTarget | null = null
    act(() => {
      landing = shown.stage().land({ layer: 'star', nebulaId: TOPIC, unitId: KP })
    })
    expect(landing).toEqual(WHOLE)
    // Until the route follows (#139, a few frames later), the route's own target stands: nothing turns back.
    expect(shown.target()).toEqual({ layer: 'map' })
    shown.go(landing!)
    expect(shown.path()).toBe(`/map/math/${TOPIC}`)
    expect(shown.target()).toEqual(WHOLE)
    expect(shown.kp()).toBe('in_progress')
    // Moving on ends the landing.
    shown.go({ layer: 'map' })
    expect(shown.target()).toEqual({ layer: 'map' })
    shown.go({ layer: 'nebula', nebulaId: TOPIC })
    expect(shown.target()).toEqual({ layer: 'nebula', nebulaId: TOPIC })
  })

  it('once the star is gold, or for any other star, a tap opens the star as before', async () => {
    const shown = await routed('/map/math')
    act(() => shown.stage().reveal(KP))
    const star: LayerTarget = { layer: 'star', nebulaId: TOPIC, unitId: KP }
    expect(shown.stage().land(star)).toBe(star)
    const other: LayerTarget = { layer: 'star', nebulaId: TOPIC, unitId: litMap(1000).stars.find((s) => s.nebulaId === TOPIC && s.unitId !== KP)!.unitId }
    expect(shown.stage().land(other)).toBe(other)
    shown.view.unmount()
    // Production's default source knows nothing: every star opens as itself.
    const production = await routed('/map/math', { unacknowledged: async () => [], acknowledge: async () => {} })
    expect(production.stage().land(star)).toBe(star)
  })

  it('the map asks before it flies: the flight heads for the whole nebula from its first frame and never turns', async () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      x: 0, y: 0, left: 0, top: 0, width: 1280, height: 776, right: 1280, bottom: 776, toJSON: () => ({}),
    } as DOMRect)
    const map = presentHeld(litMap(1000), new Set([KP]), new Set([KP]))
    const clock = fakeClock()
    const renderer = recordingRenderer()
    const onNavigate = vi.fn()
    const land = vi.fn((next: LayerTarget) => (next.layer === 'star' && next.unitId === KP ? WHOLE : next))
    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <div data-surface="sky" className="flex">
            <StarMapView map={map} target={{ layer: 'map' }} onNavigate={onNavigate} land={land} scheduler={clock} createRendererFor={() => renderer} />
          </div>
        </MemoryRouter>
      </I18nextProvider>,
    )
    act(() => clock.advance(20))
    const index = orderedStars(map).findIndex((star) => star.unitId === KP)
    const from = renderer.frames.length
    fireEvent.click(screen.getByRole('link', { name: /^Sine and cosine,/ }))
    expect(land).toHaveBeenCalledWith({ layer: 'star', nebulaId: TOPIC, unitId: KP })
    for (let t = 0; t < ZOOM.flightMs + 200; t += 1000 / 60) act(() => clock.advance(1000 / 60))
    expect(onNavigate).toHaveBeenCalledTimes(1)
    expect(onNavigate).toHaveBeenCalledWith(WHOLE)
    // The star's path on screen: straight on to where it rests, every frame closer than the last.
    const path = renderer.frames.slice(from).map((frame) => ({ x: frame.x[index], y: frame.y[index], px: frame.starPx ?? 0 }))
    const end = path[path.length - 1]
    const distances = path.map((p) => Math.hypot(p.x - end.x, p.y - end.y))
    for (let i = 1; i < distances.length; i += 1) expect(distances[i]).toBeLessThanOrEqual(distances[i - 1] + 0.5)
    // It rests at the whole nebula's zoom, not the star's.
    expect(end.px).toBeGreaterThanOrEqual(ZOOM.wholeNebulaGlyph[0] - 0.5)
    expect(end.px).toBeLessThanOrEqual(ZOOM.wholeNebulaGlyph[1] + 0.5)
  })
})
