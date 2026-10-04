/**
 * The lighting moment's timing (#140, round two of #123, F1-F3):
 *
 *   F1  the point is drawn in progress until the flare's brightest moment,
 *       and turns lit only then;
 *   F2  coming back to its star's route, the map opens on its nebula seen
 *       whole, at the zoom band of its glyphs; any other star, or the same
 *       one once celebrated, opens as before;
 *   F3  with reduced motion, a still "<name> is lit" label beside the star
 *       for STILL_LABEL_MS, then gone at once, never faded.
 *
 * Acknowledged only once shown, as before (#123 audit #3); production's
 * default source knows nothing, so nothing of this happens there.
 */
import { act, render } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { demoStarMapOverride } from '@/dev/preview/lighting'
import { demoStarMap } from '@/dev/demo/sky/demoStarMap'
import { DEMO_KNOWLEDGE_POINT } from '@/dev/demo/sky/demoSky'
import { StarMapEngine, type StarOnScreen } from '@/features/starmap/engine/starMapEngine'
import { FLARE_MS, FLARE_PEAK_MS } from '@/features/starmap/lighting/flare'
import { LightingOverlay, SETTLE_MS, STILL_LABEL_MS } from '@/features/starmap/lighting/LightingOverlay'
import {
  emptyLightingEventSource,
  LightingEventSourceContext,
  type LightingEventSource,
  type LitEvent,
} from '@/features/starmap/lighting/lightingEvents'
import { presentHeld, useLightingStage } from '@/features/starmap/lighting/useLightingStage'
import type { StarMap } from '@/features/starmap/model/starMap'
import { resolveTarget, wholeNebulaView, type LayerTarget } from '@/features/starmap/view/layers'
import { ZOOM } from '@/features/starmap/view/semanticZoom'
import i18n from '@/i18n'
import { useAuthStore } from '@/store/authStore'
import { useLitMomentsStore } from '@/store/litMomentsStore'
import { fakeClock, recordingRenderer, THEME, type FakeClock } from './starmapHarness'

const KP = DEMO_KNOWLEDGE_POINT.unitId
const TOPIC = DEMO_KNOWLEDGE_POINT.topicId
const ALL_LESSONS = DEMO_KNOWLEDGE_POINT.lessons.map((lesson) => lesson.lessonId)
const observed: LitEvent = { unitId: KP, litAt: '2026-10-04T09:00:00.000Z', litAtSource: 'observed' }

const litMap = (size: 10 | 1000 = 10): StarMap =>
  demoStarMapOverride(demoStarMap('math', size, i18n.getFixedT('en', 'starmap'), { language: 'en' }), size, ALL_LESSONS)

/** A source like the demo backend's: known at once, acknowledged on the server, and says when it changed. */
function knownSource(events: LitEvent[], { known = true } = {}) {
  const acknowledged = new Set<string>()
  const listeners = new Set<() => void>()
  const waiting = () => events.filter((event) => !acknowledged.has(event.unitId))
  const acknowledge = vi.fn(async (unitIds: string[]) => {
    for (const id of unitIds) acknowledged.add(id)
    for (const listener of listeners) listener()
  })
  const source: LightingEventSource = {
    unacknowledged: async () => waiting(),
    acknowledge,
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    ...(known ? { known: waiting } : {}),
  }
  return { source, acknowledge }
}

function setReducedMotion(reduce: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: reduce && query.includes('reduce'),
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
}

const originalMatchMedia = window.matchMedia
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
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(800)
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(600)
  setReducedMotion(false)
  useAuthStore.setState({ user: { id: 'student-a' } as never })
  useLitMomentsStore.setState({ byOwner: {} })
})
afterEach(() => {
  vi.restoreAllMocks()
  window.matchMedia = originalMatchMedia
  useAuthStore.setState({ user: null })
})

const ON_SCREEN: StarOnScreen = { x: 400, y: 300, size: 24 }
/** The engine's `starOnScreen`, as the map view hands it over: one function for the map's life. */
const locate = (unitId: string) => (unitId === KP ? ON_SCREEN : null)

/** What the route does: the stage over the map, the overlay told when to reveal. Writes what is drawn into the DOM. */
function Stage({ map, routeTarget, clock }: { map: StarMap; routeTarget: LayerTarget; clock: FakeClock }) {
  const stage = useLightingStage(map, routeTarget)
  const location = useLocation()
  const drawn = stage.map.stars.find((star) => star.unitId === KP)
  return (
    <>
      <output data-drawn-state={drawn?.state} data-drawn-lit={stage.map.summary.lit} data-target={JSON.stringify(stage.target)} data-path={location.pathname} />
      <LightingOverlay map={map} locate={locate} onReveal={stage.reveal} scheduler={clock} />
    </>
  )
}

async function showStage(source: LightingEventSource, path = `/map/math/${TOPIC}/${KP}`, map = litMap()) {
  const clock = fakeClock()
  const view = render(
    <I18nextProvider i18n={i18n}>
      <LightingEventSourceContext.Provider value={source}>
        <MemoryRouter initialEntries={[path]}>
          <RoutedStage map={map} clock={clock} />
        </MemoryRouter>
      </LightingEventSourceContext.Provider>
    </I18nextProvider>,
  )
  await act(async () => {})
  const out = () => view.container.querySelector('output')!
  return {
    view,
    clock,
    drawnState: () => out().getAttribute('data-drawn-state'),
    drawnLit: () => Number(out().getAttribute('data-drawn-lit')),
    target: () => JSON.parse(out().getAttribute('data-target')!) as LayerTarget,
    path: () => out().getAttribute('data-path'),
    phase: () => view.container.querySelector('[data-lighting]')?.getAttribute('data-lighting'),
    announced: () => view.container.querySelector('[data-lighting-announcer]')?.textContent ?? '',
    label: () => view.container.querySelector<HTMLElement>('[data-lighting-label]'),
  }
}

/** The route's own target follows the path, as StarMapRoute's `resolveTarget` does. */
function RoutedStage({ map, clock }: { map: StarMap; clock: FakeClock }) {
  const location = useLocation()
  const [, , , topicId, unitId] = location.pathname.split('/')
  return <Stage map={map} clock={clock} routeTarget={resolveTarget(map, topicId, unitId)} />
}

describe('F1: gold only at the brightest moment', () => {
  it('draws the point in progress until the flare peaks, then lit', async () => {
    const { source } = knownSource([observed])
    const shown = await showStage(source)
    const real = litMap().summary.lit
    // From the very first frame: in progress, and not counted lit yet.
    expect(shown.drawnState()).toBe('in_progress')
    expect(shown.drawnLit()).toBe(real - 1)
    act(() => shown.clock.advance(20))
    expect(shown.phase()).toBe('playing')
    act(() => shown.clock.advance(SETTLE_MS + FLARE_PEAK_MS - 60))
    expect(shown.drawnState()).toBe('in_progress') // the sparks gather on a star still in progress
    act(() => shown.clock.advance(80))
    expect(shown.drawnState()).toBe('lit') // under the bloom at its fullest
    expect(shown.drawnLit()).toBe(real)
  })

  it('is still acknowledged only once the flare has been shown', async () => {
    const { source, acknowledge } = knownSource([observed])
    const shown = await showStage(source)
    act(() => shown.clock.advance(SETTLE_MS + FLARE_PEAK_MS + 100))
    expect(shown.drawnState()).toBe('lit')
    expect(acknowledge).not.toHaveBeenCalled()
    await act(async () => shown.clock.advance(FLARE_MS + 1000))
    expect(shown.phase()).toBe('done')
    expect(acknowledge).toHaveBeenCalledTimes(1)
    expect(acknowledge).toHaveBeenCalledWith([KP])
    expect(shown.drawnState()).toBe('lit')
  })

  it('presents a held point in progress and uncounted, and leaves a map with none untouched', () => {
    const map = litMap()
    const held = presentHeld(map, new Set([KP]))
    expect(held.stars.find((star) => star.unitId === KP)?.state).toBe('in_progress')
    expect(held.subjects.find((subject) => subject.subjectId === 'math')?.lit).toBe(map.subjects.find((subject) => subject.subjectId === 'math')!.lit - 1)
    expect(presentHeld(map, new Set())).toBe(map)
  })

  it('never holds a backfilled lighting', async () => {
    const { source } = knownSource([{ ...observed, litAtSource: 'backfilled' }])
    const shown = await showStage(source)
    expect(shown.drawnState()).toBe('lit')
    expect(shown.target()).toMatchObject({ layer: 'star', unitId: KP })
  })
})

describe('F2: back from a lighting, the nebula seen whole', () => {
  it('opens the star’s route on its nebula seen whole, and puts the route right in place', async () => {
    const { source } = knownSource([observed])
    const shown = await showStage(source)
    expect(shown.target()).toEqual({ layer: 'nebula', nebulaId: TOPIC, whole: { star: KP } })
    expect(shown.path()).toBe(`/map/math/${TOPIC}`)
  })

  it('opens any other star, or this one once celebrated, as before', async () => {
    const other = litMap().stars.find((star) => star.nebulaId === TOPIC && star.unitId !== KP)!
    const { source, acknowledge } = knownSource([observed])
    const elsewhere = await showStage(source, `/map/math/${TOPIC}/${other.unitId}`)
    expect(elsewhere.target()).toEqual({ layer: 'star', nebulaId: TOPIC, unitId: other.unitId })
    expect(elsewhere.path()).toBe(`/map/math/${TOPIC}/${other.unitId}`)
    elsewhere.view.unmount()

    await acknowledge([KP])
    const later = await showStage(source)
    expect(later.target()).toEqual({ layer: 'star', nebulaId: TOPIC, unitId: KP })
    expect(later.drawnState()).toBe('lit')
  })

  it('without a source that knows at once (and in production), the map and route are left as they are', async () => {
    const { source } = knownSource([observed], { known: false })
    const unknown = await showStage(source)
    expect(unknown.target()).toEqual({ layer: 'star', nebulaId: TOPIC, unitId: KP })
    expect(unknown.drawnState()).toBe('lit')
    unknown.view.unmount()
    expect(emptyLightingEventSource.known).toBeUndefined()
    const production = await showStage(emptyLightingEventSource)
    expect(production.target()).toEqual({ layer: 'star', nebulaId: TOPIC, unitId: KP })
    expect(production.phase()).toBe('idle')
  })

  it.each([
    [1440, 900],
    [390, 844],
  ])('lands at %i x %i within the whole-nebula glyph band, its stars in view, the star kept near the middle', (width, height) => {
    const map = litMap(1000)
    const clock = fakeClock()
    const engine = new StarMapEngine({ renderer: recordingRenderer(), theme: THEME, reducedMotion: false, scheduler: clock, now: clock.now, galaxy: true })
    const bands = width >= 768 ? { top: 108, bottom: 164 } : { top: 144, bottom: 72 }
    engine.setViewport(width, height, 1, bands)
    engine.setData(map, { layer: 'nebula', nebulaId: TOPIC, whole: { star: KP } })
    clock.advance(20)
    const { starPx, band } = engine.zoom
    expect(starPx).toBeGreaterThanOrEqual(ZOOM.wholeNebulaGlyph[0] - 0.01)
    expect(starPx).toBeLessThanOrEqual(ZOOM.wholeNebulaGlyph[1] + 0.01)
    expect(band).not.toBe('panorama')
    const spot = engine.starOnScreen(KP)!
    const middle = { x: width / 2, y: bands.top + (height - bands.top - bands.bottom) / 2 }
    expect(Math.abs(spot.x - middle.x)).toBeLessThanOrEqual((ZOOM.wholeNebulaKeep * ZOOM.wholeNebulaFill * width) / 2 + 1)
    expect(spot.y).toBeGreaterThan(bands.top)
    expect(spot.y).toBeLessThan(height - bands.bottom)
    engine.destroy()
  })

  it('fits every star of the nebula when the screen has room for them', () => {
    const map = litMap(1000)
    const own = map.stars.filter((star) => star.nebulaId === TOPIC)
    const viewport = { width: 1440, height: 900, top: 108, bottom: 164 }
    const bounds = { minX: 0, minY: 0, maxX: 1, maxY: 1 }
    const view = wholeNebulaView(TOPIC, KP, map.stars, viewport, bounds, [0, Infinity])!
    const scale = Math.min((viewport.width * 0.9) / 1, ((viewport.height - viewport.top - viewport.bottom) * 0.92) / 1) * view.k
    for (const star of own) {
      const x = viewport.width * view.fx + (star.x - view.cx) * scale
      const y = viewport.height * view.fy + (star.y - view.cy) * scale
      expect(x).toBeGreaterThanOrEqual(0)
      expect(x).toBeLessThanOrEqual(viewport.width)
      expect(y).toBeGreaterThanOrEqual(viewport.top - 0.5)
      expect(y).toBeLessThanOrEqual(viewport.height - viewport.bottom + 0.5)
    }
    expect(wholeNebulaView('no-such-nebula', KP, map.stars, viewport, bounds, [1, 2])).toBeNull()
  })
})

describe('F3: with reduced motion, a still label', () => {
  it('says “<name> is lit” beside the star for a few seconds, then is gone at once, never faded', async () => {
    setReducedMotion(true)
    const { source, acknowledge } = knownSource([observed])
    const shown = await showStage(source)
    expect(shown.label()).toBeNull()
    act(() => shown.clock.advance(20))
    // At the moment it is shown: the star lit at once, announced, acknowledged, and the label.
    expect(shown.drawnState()).toBe('lit')
    expect(shown.announced()).toBe('Sine and cosine is lit')
    expect(acknowledge).toHaveBeenCalledWith([KP])
    expect(shown.view.container.querySelector('[data-lighting-caption]')).toBeNull()
    const label = shown.label()!
    expect(label).toHaveTextContent('Sine and cosine is lit')
    expect(label).toHaveAttribute('aria-hidden', 'true')
    act(() => shown.clock.advance(50))
    expect(label.style.visibility).toBe('visible')
    expect(label.style.transform).toContain('translate(400px')

    const opacities = new Set<string>()
    for (let at = 100; at < STILL_LABEL_MS - 100; at += 100) {
      act(() => shown.clock.advance(100))
      opacities.add(shown.label()?.style.opacity ?? 'gone')
      expect(shown.label()?.style.transition ?? '').toBe('')
    }
    expect([...opacities]).toEqual(['']) // never faded: no opacity was ever set
    expect(shown.label()).not.toBeNull()
    act(() => shown.clock.advance(300))
    expect(shown.label()).toBeNull()
    // The announcement stays as it was.
    expect(shown.announced()).toBe('Sine and cosine is lit')
    expect(shown.phase()).toBe('done')
  })

  it('reads in each language as the announcement does', async () => {
    setReducedMotion(true)
    for (const language of ['de', 'en', 'fr', 'it'] as const) {
      await i18n.changeLanguage(language)
      const { source } = knownSource([observed])
      const shown = await showStage(source)
      act(() => shown.clock.advance(20))
      expect(shown.label()?.textContent).toBe(i18n.t('starmap:lighting.announce', { name: 'Sine and cosine' }))
      expect(shown.label()?.textContent).toBe(shown.announced())
      shown.view.unmount()
    }
  })
})
