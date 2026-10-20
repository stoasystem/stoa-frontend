/**
 * The lighting moment when nobody can see the map (#330 M3), and while it
 * waits for a star off screen (#330 M4).
 *
 * On a phone, Ask opens as a full-screen sheet and the map under it is
 * `inert` (#49). The flare used to start, play out underneath and be
 * acknowledged, so the student never saw it and it never came back. And a
 * star off screen was looked for every frame, at rest, for as long as it
 * stayed away.
 */
import { act, render } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { demoStarMapOverride } from '@/dev/preview/lighting'
import { demoStarMap } from '@/dev/demo/sky/demoStarMap'
import { DEMO_KNOWLEDGE_POINT } from '@/dev/demo/sky/demoSky'
import { FLARE_MS, FLARE_PEAK_MS } from '@/features/starmap/lighting/flare'
import { LightingOverlay, SETTLE_MS } from '@/features/starmap/lighting/LightingOverlay'
import { LightingEventSourceContext, type LightingEventSource, type LitEvent } from '@/features/starmap/lighting/lightingEvents'
import i18n from '@/i18n'
import { useAuthStore } from '@/store/authStore'
import { useLitMomentsStore } from '@/store/litMomentsStore'
import { fakeClock } from './starmapHarness'

const KP = DEMO_KNOWLEDGE_POINT.unitId
const ALL_LESSONS = DEMO_KNOWLEDGE_POINT.lessons.map((lesson) => lesson.lessonId)
const lit = () => demoStarMapOverride(demoStarMap('math', 10, i18n.getFixedT('en', 'starmap'), { language: 'en' }), 10, ALL_LESSONS)
const observed: LitEvent = { unitId: KP, litAt: '2026-10-02T09:00:00.000Z', litAtSource: 'observed' }

type Spot = { x: number; y: number; size: number }
const ON_SCREEN: Spot = { x: 400, y: 300, size: 16 }

function serverSource() {
  const acknowledged = new Set<string>()
  const acknowledge = vi.fn(async (unitIds: string[]) => {
    for (const id of unitIds) acknowledged.add(id)
  })
  const source: LightingEventSource = {
    unacknowledged: async () => [observed].filter((event) => !acknowledged.has(event.unitId)),
    acknowledge,
  }
  return { source, acknowledge }
}

beforeEach(async () => {
  await i18n.changeLanguage('en')
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(800)
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(600)
  window.matchMedia = ((query: string) => ({ matches: false, media: query, addEventListener: () => {}, removeEventListener: () => {} })) as never
  useAuthStore.setState({ user: { id: 'student-a' } as never })
  useLitMomentsStore.setState({ byOwner: {} })
})
afterEach(() => {
  vi.restoreAllMocks()
  useAuthStore.setState({ user: null })
})

async function show(options: { where?: () => Spot | null; watch?: (listener: () => void) => () => void } = {}) {
  const clock = fakeClock()
  const { source, acknowledge } = serverSource()
  const locate = vi.fn((unitId: string) => (unitId === KP ? (options.where ?? (() => ON_SCREEN))() : null))
  const view = render(
    <I18nextProvider i18n={i18n}>
      <LightingEventSourceContext.Provider value={source}>
        <div data-testid="sheet-host">
          <LightingOverlay map={lit()} locate={locate} watch={options.watch} scheduler={clock} />
        </div>
      </LightingEventSourceContext.Provider>
    </I18nextProvider>,
  )
  await act(async () => {})
  const host = view.getByTestId('sheet-host')
  const phase = () => view.container.querySelector('[data-lighting]')?.getAttribute('data-lighting')
  return { clock, acknowledge, locate, host, phase }
}

describe('under the phone’s Ask sheet (#330 M3)', () => {
  it('does not start while the map is covered, and plays once it is uncovered', async () => {
    const s = await show()
    s.host.setAttribute('inert', '')
    act(() => s.clock.advance(SETTLE_MS + FLARE_MS + 1000))
    expect(s.phase()).toBe('idle')
    expect(s.acknowledge).not.toHaveBeenCalled()

    s.host.removeAttribute('inert')
    act(() => s.clock.advance(20))
    expect(s.phase()).toBe('playing')
    await act(async () => s.clock.advance(SETTLE_MS + FLARE_MS + 700))
    expect(s.acknowledge).toHaveBeenCalledWith([KP])
  })

  it('covered before its brightest moment: stops, is not acknowledged, and plays again once uncovered', async () => {
    const s = await show()
    act(() => s.clock.advance(SETTLE_MS + FLARE_PEAK_MS / 2))
    expect(s.phase()).toBe('playing')

    s.host.setAttribute('inert', '')
    await act(async () => s.clock.advance(SETTLE_MS + FLARE_MS + 1000))
    expect(s.phase()).toBe('idle')
    expect(s.acknowledge).not.toHaveBeenCalled()

    s.host.removeAttribute('inert')
    act(() => s.clock.advance(20))
    expect(s.phase()).toBe('playing')
    await act(async () => s.clock.advance(SETTLE_MS + FLARE_MS + 700))
    expect(s.acknowledge).toHaveBeenCalledTimes(1)
  })

  it('covered after its brightest moment: it was seen, so it ends there and is acknowledged', async () => {
    const s = await show()
    act(() => s.clock.advance(SETTLE_MS + FLARE_PEAK_MS + 100))
    s.host.setAttribute('inert', '')
    await act(async () => s.clock.advance(20))
    expect(s.phase()).toBe('done')
    expect(s.acknowledge).toHaveBeenCalledWith([KP])
    expect(s.clock.pending).toBe(0)
  })
})

describe('waiting for a star off screen (#330 M4)', () => {
  it('asks again only when the map says it moved, not every frame', async () => {
    let spot: Spot | null = { x: -500, y: 300, size: 16 }
    const listeners = new Set<() => void>()
    const watch = (listener: () => void) => {
      listeners.add(listener)
      return () => void listeners.delete(listener)
    }
    const s = await show({ where: () => spot, watch })
    act(() => s.clock.advance(3000))
    expect(s.locate.mock.calls.length, 'looked for once, then waits').toBeLessThanOrEqual(2)
    expect(s.clock.pending, 'no frame on order while waiting').toBe(0)
    expect(s.phase()).toBe('idle')

    // The map came to rest with the star on screen.
    spot = ON_SCREEN
    act(() => {
      for (const listener of [...listeners]) listener()
    })
    act(() => s.clock.advance(20))
    expect(s.phase()).toBe('playing')
  })
})
