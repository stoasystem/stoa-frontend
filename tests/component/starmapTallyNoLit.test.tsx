/**
 * The lit count is on the map once. On a wide stage the tally top right said
 * "1 of 10 lit" too, the same number as the where-you-are line under the
 * subject name; the phone had no tally and only that line. The line keeps it
 * (it follows the view: the whole map or a nebula), the tally keeps the
 * streak, and the score when there is one.
 */
import { act, render } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { demoStarMap } from '@/dev/demo/sky/demoStarMap'
import '@/dev/demo/sky/source'
import { StarMapView } from '@/features/starmap/components/StarMapView'
import i18n from '@/i18n'
import type { SupportedLanguage } from '@/i18n/languages'
import { fakeClock, recordingRenderer } from './starmapHarness'

beforeEach(async () => {
  await i18n.changeLanguage('en')
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    x: 0, y: 0, left: 0, top: 0, width: 1280, height: 800, right: 1280, bottom: 800, toJSON: () => ({}),
  } as DOMRect)
})
afterEach(() => vi.restoreAllMocks())

function showMap(summary: { streakDays: number; score: number }) {
  const clock = fakeClock()
  const base = demoStarMap('math', 10, i18n.getFixedT('en', 'starmap'), { language: 'en' as SupportedLanguage })
  const map = { ...base, summary: { ...base.summary, ...summary } }
  const view = render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <div data-surface="sky">
          <StarMapView map={map} target={{ layer: 'map' }} onNavigate={vi.fn()} scheduler={clock} createRendererFor={() => recordingRenderer()} />
        </div>
      </MemoryRouter>
    </I18nextProvider>,
  )
  act(() => clock.advance(20))
  return { page: view.container, map }
}

it('on a wide stage the tally has the streak and no lit count; the where-you-are line has it', () => {
  const { page, map } = showMap({ streakDays: 3, score: 0 })
  const lit = i18n.t('starmap:summary.lit', { lit: map.summary.lit, total: map.summary.total })
  const tally = page.querySelector<HTMLElement>('[data-starmap-tally]')
  expect(tally, 'the tally is drawn on a wide stage').not.toBeNull()
  expect(tally!.textContent).toBe(i18n.t('starmap:summary.streak', { count: 3 }))
  expect(tally!.textContent).not.toContain(lit)

  const topLine = page.querySelector('[data-starmap-stage] > [data-starmap-overlay]')!
  const said = topLine.textContent!.split(lit).length - 1
  expect(said, 'the lit count, once, under the subject name').toBe(1)
  expect(topLine.querySelector('h1')?.parentElement?.textContent).toContain(lit)
})

it('keeps the score beside the streak when there is one', () => {
  const { page } = showMap({ streakDays: 1, score: 1240 })
  const tally = page.querySelector<HTMLElement>('[data-starmap-tally]')!
  expect(tally.children).toHaveLength(2)
  expect(tally.textContent).toContain(i18n.t('starmap:summary.streak', { count: 1 }))
  expect(tally.textContent).toMatch(/1\D?240 points/)
})
