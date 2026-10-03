/**
 * The lighting moment (#51): a knowledge point lit for the first time is
 * celebrated once on the star map -- a Canvas flare, or with reduced motion
 * none -- announced in an `aria-live` region either way, acknowledged to the
 * lighting event source so it never comes back, and handed to Ask as a card.
 * The backfill's lightings are never celebrated, and production's default
 * source never emits.
 */
import { act, render, screen } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { demoStarMapOverride } from '@/dev/preview/lighting'
import { AskLitCard } from '@/features/ask/AskLitCard'
import { threadEntries } from '@/features/ask/AskPanel'
import { demoStarMap } from '@/features/starmap/fixtures/demoStarMap'
import { DEMO_BRIDGE_STAR, DEMO_KNOWLEDGE_POINT } from '@/features/starmap/fixtures/demoSky'
import { drawFlare, FLARE_MS } from '@/features/starmap/lighting/flare'
import { LightingOverlay } from '@/features/starmap/lighting/LightingOverlay'
import {
  emptyLightingEventSource,
  LightingEventSourceContext,
  type LightingEventSource,
  type LitEvent,
} from '@/features/starmap/lighting/lightingEvents'
import { identityStarMapOverride } from '@/features/starmap/lighting/starMapOverride'
import type { StarMap } from '@/features/starmap/model/starMap'
import i18n from '@/i18n'
import { useAuthStore } from '@/store/authStore'
import { useLitMomentsStore, type LitMoment } from '@/store/litMomentsStore'
import type { ChatMessage } from '@/types/chat'
import { fakeClock } from './starmapHarness'

const KP = DEMO_KNOWLEDGE_POINT.unitId
const ALL_LESSONS = DEMO_KNOWLEDGE_POINT.lessons.map((lesson) => lesson.lessonId)
const OPENING = DEMO_KNOWLEDGE_POINT.lessons.slice(0, DEMO_KNOWLEDGE_POINT.lessonsDone).map((lesson) => lesson.lessonId)

const mapOf = (subjectId: string, completed: readonly string[]): StarMap =>
  demoStarMapOverride(demoStarMap(subjectId, 10, i18n.getFixedT('en', 'starmap'), { language: 'en' }), 10, completed)

/** A 2D context that counts what is drawn. */
function countingContext() {
  const calls = { fill: 0, stroke: 0, clearRect: 0 }
  const gradient = { addColorStop: () => {} }
  const ctx = new Proxy({} as Record<string, unknown>, {
    get(target, key: string) {
      if (key in target) return target[key]
      if (key === 'createRadialGradient' || key === 'createLinearGradient') return () => gradient
      return (..._args: unknown[]) => {
        if (key in calls) calls[key as keyof typeof calls] += 1
      }
    },
    set(target, key: string, value) {
      target[key] = value
      return true
    },
  })
  return { ctx: ctx as unknown as CanvasRenderingContext2D, calls }
}

/** A lighting event source with a server-side acknowledgement, as stoa-backend#71 plans it. */
function serverSource(events: LitEvent[]) {
  const acknowledged = new Set<string>()
  const acknowledge = vi.fn(async (unitIds: string[]) => {
    for (const id of unitIds) acknowledged.add(id)
  })
  const source: LightingEventSource = {
    unacknowledged: async () => events.filter((event) => !acknowledged.has(event.unitId)),
    acknowledge,
  }
  return { source, acknowledge }
}

const observed: LitEvent = { unitId: KP, litAt: '2026-10-02T09:00:00.000Z', litAtSource: 'observed' }

let calls: ReturnType<typeof countingContext>['calls']

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
  const counting = countingContext()
  calls = counting.calls
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(counting.ctx as never)
  setReducedMotion(false)
  useAuthStore.setState({ user: { id: 'student-a' } as never })
  useLitMomentsStore.setState({ byOwner: {} })
})
afterEach(() => {
  vi.restoreAllMocks()
  window.matchMedia = originalMatchMedia
  useAuthStore.setState({ user: null })
})

async function showMap(map: StarMap, source?: LightingEventSource) {
  const clock = fakeClock()
  const locate = vi.fn((unitId: string) => (unitId === KP ? { x: 400, y: 300, size: 16 } : null))
  const overlay = <LightingOverlay map={map} locate={locate} scheduler={clock} />
  const view = render(
    <I18nextProvider i18n={i18n}>
      {source ? <LightingEventSourceContext.Provider value={source}>{overlay}</LightingEventSourceContext.Provider> : overlay}
    </I18nextProvider>,
  )
  // The source answers asynchronously.
  await act(async () => {})
  const phase = () => view.container.querySelector('[data-lighting]')?.getAttribute('data-lighting')
  const announced = () => view.container.querySelector('[data-lighting-announcer]')?.textContent ?? ''
  return { view, clock, phase, announced }
}

describe('the lighting moment', () => {
  it('plays once, is announced, and is acknowledged so a reload does not replay it', async () => {
    const { source, acknowledge } = serverSource([observed])
    const lit = mapOf('math', ALL_LESSONS)
    const first = await showMap(lit, source)
    expect(first.phase()).toBe('playing')
    expect(first.announced()).toBe('Sine and cosine is lit')
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite')
    expect(acknowledge).toHaveBeenCalledTimes(1)
    expect(acknowledge).toHaveBeenCalledWith([KP])

    act(() => first.clock.advance(1500))
    expect(calls.fill).toBeGreaterThan(0) // the flare is drawn on its own canvas
    act(() => first.clock.advance(FLARE_MS + 1000))
    expect(first.phase()).toBe('done')
    first.view.unmount()

    // A reload: the same account, the same server.
    calls.fill = 0
    const again = await showMap(lit, source)
    act(() => again.clock.advance(4000))
    expect(again.phase()).toBe('idle')
    expect(again.announced()).toBe('')
    expect(calls.fill).toBe(0)
    expect(acknowledge).toHaveBeenCalledTimes(1)
  })

  it('with reduced motion: no animation, only the state, and still the announcement', async () => {
    setReducedMotion(true)
    const { source, acknowledge } = serverSource([observed])
    const shown = await showMap(mapOf('math', ALL_LESSONS), source)
    expect(shown.phase()).toBe('done')
    act(() => shown.clock.advance(4000))
    expect(calls.fill).toBe(0)
    expect(shown.view.container.querySelector('[data-lighting-caption]')).toBeNull()
    expect(shown.announced()).toBe('Sine and cosine is lit')
    expect(acknowledge).toHaveBeenCalledWith([KP])
  })

  it('never celebrates a backfilled lighting', async () => {
    const { source, acknowledge } = serverSource([{ ...observed, litAtSource: 'backfilled' }])
    const shown = await showMap(mapOf('math', ALL_LESSONS), source)
    act(() => shown.clock.advance(4000))
    expect(shown.phase()).toBe('idle')
    expect(shown.announced()).toBe('')
    expect(acknowledge).not.toHaveBeenCalled()
    expect(useLitMomentsStore.getState().byOwner).toEqual({})
  })

  it('waits for the map the point is on, drawn lit', async () => {
    const { source, acknowledge } = serverSource([observed])
    const physics = await showMap(mapOf('physics', ALL_LESSONS), source)
    expect(physics.phase()).toBe('idle')
    physics.view.unmount()
    const notYetLit = await showMap(mapOf('math', OPENING), source)
    expect(notYetLit.phase()).toBe('idle')
    expect(acknowledge).not.toHaveBeenCalled()
  })

  it('in production the default source emits nothing and asks nothing', async () => {
    await expect(emptyLightingEventSource.unacknowledged()).resolves.toEqual([])
    const spy = vi.spyOn(emptyLightingEventSource, 'unacknowledged')
    const shown = await showMap(mapOf('math', ALL_LESSONS))
    act(() => shown.clock.advance(4000))
    expect(spy).toHaveBeenCalled()
    expect(shown.phase()).toBe('idle')
    expect(shown.announced()).toBe('')
    expect(calls.fill).toBe(0)
    // And the map's states are what the fixture says.
    const map = demoStarMap('math', 10, i18n.getFixedT('en', 'starmap'))
    expect(identityStarMapOverride(map, 10)).toBe(map)
  })
})

describe('the lit card in Ask', () => {
  const moment: LitMoment = { unitId: KP, name: 'Sine and cosine', subjectId: 'math', nebulaId: 'trigonometry', litAt: '2026-10-02T09:00:00.000Z' }
  const message = (id: string, createdAt: string): ChatMessage => ({ id, conversationId: 'c1', role: 'assistant', content: id, createdAt, status: 'completed' })

  it('is handed over when the moment is shown', async () => {
    const { source } = serverSource([observed])
    await showMap(mapOf('math', ALL_LESSONS), source)
    expect(useLitMomentsStore.getState().byOwner['student-a']).toEqual([
      expect.objectContaining({ unitId: KP, name: 'Sine and cosine', subjectId: 'math', litAt: observed.litAt }),
    ])
  })

  it('sits among the messages by time, as its own kind of entry', () => {
    const entries = threadEntries([message('before', '2026-10-02T08:00:00.000Z'), message('after', '2026-10-02T10:00:00.000Z')], [moment])
    expect(entries.map((entry) => (entry.kind === 'lit' ? 'lit' : entry.message.id))).toEqual(['before', 'lit', 'after'])
  })

  it.each(['de', 'en', 'fr', 'it'] as const)('says the point is lit and leads back to its star, in %s', async (language) => {
    await i18n.changeLanguage(language)
    render(<I18nextProvider i18n={i18n}><MemoryRouter><AskLitCard moment={moment} /></MemoryRouter></I18nextProvider>)
    const card = screen.getByRole('region', { name: i18n.t('chat:ask.lit.label') })
    expect(card).toHaveTextContent(i18n.t('chat:ask.lit.title', { name: 'Sine and cosine' }))
    expect(screen.getByRole('link')).toHaveAttribute('href', `/map/math/trigonometry/${KP}`)
    expect(i18n.t('starmap:lighting.announce', { name: 'X' })).not.toContain('lighting.')
  })
})

describe('the design preview follows its lessons', () => {
  it('lights the demo knowledge point once its chapter is done, and opens Refraction', () => {
    const before = mapOf('math', OPENING)
    const after = mapOf('math', ALL_LESSONS)
    expect(before.stars.find((star) => star.unitId === KP)?.state).toBe('in_progress')
    expect(after.stars.find((star) => star.unitId === KP)).toMatchObject({ state: 'lit', progress: 1, unmetExercises: 0, recommendation: null })
    expect(after.summary.lit).toBe(before.summary.lit + 1)
    expect(after.stars.filter((star) => star.recommendation)).toHaveLength(1)
    expect(mapOf('physics', OPENING).stars.find((star) => star.unitId === DEMO_BRIDGE_STAR)?.state).toBe('locked')
    expect(mapOf('physics', ALL_LESSONS).stars.find((star) => star.unitId === DEMO_BRIDGE_STAR)?.state).toBe('ready')
  })

  it('draws the flare the same for the same instant', () => {
    const a = countingContext()
    const b = countingContext()
    expect(drawFlare(a.ctx, 900, 10, 10, 18, { lit: '#F2C572', core: '#FFF8EA' })).toBe(true)
    drawFlare(b.ctx, 900, 10, 10, 18, { lit: '#F2C572', core: '#FFF8EA' })
    expect(a.calls).toEqual(b.calls)
    expect(drawFlare(a.ctx, FLARE_MS, 10, 10, 18, { lit: '#F2C572', core: '#FFF8EA' })).toBe(false)
  })
})
