/**
 * The onboarding cards sit under the design preview's "Demo" line (#625).
 *
 * The card's band starts under the map's top line; in the preview the stage
 * draws a 32 px notice above that line and moves the line down, and the band
 * ignored it: at 375 x 812 the card covered "0 von 443 leuchten". The height
 * has one source, `DEMO_NOTICE_HEIGHT`, handed down as
 * `--starmap-notice-height`; jsdom lays nothing out, so this checks that the
 * stage sets it and that everything at the top reads it. A real map (no
 * notice) sets nothing, and the fallback is 0.
 */
import { act, render } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { demoStarMap } from '@/dev/demo/sky/demoStarMap'
import '@/dev/demo/sky/source'
import { DEMO_NOTICE_HEIGHT, StarMapView, controlBands } from '@/features/starmap/components/StarMapView'
import { AboutYou } from '@/features/starmap/onboarding/AboutYou'
import { FirstSubjectQuestion } from '@/features/starmap/onboarding/FirstSubjectQuestion'
import i18n from '@/i18n'
import type { SupportedLanguage } from '@/i18n/languages'
import { fakeClock, recordingRenderer } from './starmapHarness'

beforeEach(async () => {
  await i18n.changeLanguage('en')
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    x: 0, y: 0, left: 0, top: 0, width: 375, height: 767, right: 375, bottom: 767, toJSON: () => ({}),
  } as DOMRect)
})
afterEach(() => vi.restoreAllMocks())

const map = () => demoStarMap('math', 10, i18n.getFixedT('en', 'starmap'), { language: 'en' as SupportedLanguage })

function showCards(demo: boolean) {
  const clock = fakeClock()
  const sky = map()
  const view = render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <div data-surface="sky">
          <StarMapView
            demo={demo}
            map={sky}
            target={{ layer: 'map' }}
            onNavigate={vi.fn()}
            scheduler={clock}
            createRendererFor={() => recordingRenderer()}
            overlay={() => (
              <>
                <AboutYou grades={[]} galaxies={sky.subjects} ticked={null} saving={false} failed={false} onSave={vi.fn()} onLater={vi.fn()} />
                <FirstSubjectQuestion subjects={sky.subjects} onChoose={vi.fn()} />
              </>
            )}
          />
        </div>
      </MemoryRouter>
    </I18nextProvider>,
  )
  act(() => clock.advance(20))
  return view.container
}

/** Every `top-[...]` class on `element`, phone and wide. */
const tops = (element: Element | null) => (element?.getAttribute('class') ?? '').split(/\s+/).filter((name) => /(^|:)top-\[/.test(name))

it('with the Demo line, the stage hands its height down and the cards start under it', () => {
  const page = showCards(true)
  const stage = page.querySelector<HTMLElement>('[data-starmap-stage]')!
  expect(stage.style.getPropertyValue('--starmap-notice-height')).toBe(`${DEMO_NOTICE_HEIGHT}px`)
  // The same height the map keeps its stars under.
  expect(controlBands(false, 0, true).top - controlBands(false).top).toBe(DEMO_NOTICE_HEIGHT)

  for (const marker of ['[data-about-you]', '[data-first-question]']) {
    const band = page.querySelector(marker)?.firstElementChild ?? null
    const bandTops = tops(band)
    expect(bandTops, `${marker}: a top on the phone and on a wide stage`).toHaveLength(2)
    for (const top of bandTops) expect(top, marker).toContain('var(--starmap-notice-height,0px)')
  }
  // The top line moves down by the same height, read from the same place.
  const topLine = stage.querySelector(':scope > [data-starmap-overlay]')
  for (const top of tops(topLine)) expect(top).toContain('var(--starmap-notice-height,0px)')
})

it('on a real map there is no Demo line, and nothing is added', () => {
  const page = showCards(false)
  const stage = page.querySelector<HTMLElement>('[data-starmap-stage]')!
  expect(stage.style.getPropertyValue('--starmap-notice-height')).toBe('')
  expect(page.textContent).not.toContain(i18n.t('starmap:demo.notice'))
})
