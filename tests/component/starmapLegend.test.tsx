/**
 * The star map's legend (#141 B7): how to move today -- drag, scroll or
 * pinch, pick a star, press and drag a star (on touch, hold first) -- and
 * the keyboard's two orders (#141 E5), in de / en / fr / it.
 */
import { act, render } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { StarMapView } from '@/features/starmap/components/StarMapView'
import i18n from '@/i18n'
import de from '@/i18n/locales/de/starmap.json'
import en from '@/i18n/locales/en/starmap.json'
import fr from '@/i18n/locales/fr/starmap.json'
import it_ from '@/i18n/locales/it/starmap.json'
import { fakeClock, recordingRenderer, skyMap } from './starmapHarness'

describe('the legend (#141 B7)', () => {
  const locales = { en, de, fr, it: it_ }

  it('says how to move and both keyboard orders in all four languages', () => {
    for (const [lang, bundle] of Object.entries(locales)) {
      const legend = bundle.legend as Record<string, string>
      expect(legend.hint, lang).toBeUndefined()
      expect(legend.pointer.length, lang).toBeGreaterThan(40)
      expect(legend.keys, lang).toMatch(/Tab/)
      expect(legend.keys, lang).toMatch(/\+/)
      // Short enough to sit in the legend beside the glyphs.
      expect(legend.pointer.length + legend.keys.length, lang).toBeLessThan(330)
    }
    // Each language's own words, not English left behind.
    for (const lang of ['de', 'fr', 'it'] as const) {
      expect(locales[lang].legend.pointer).not.toBe(en.legend.pointer)
      expect(locales[lang].legend.keys).not.toBe(en.legend.keys)
    }
  })

  it('shows both lines on a wide screen, in the reader’s language', async () => {
    for (const lang of ['en', 'de', 'fr', 'it'] as const) {
      await i18n.changeLanguage(lang)
      vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
        x: 0, y: 0, left: 0, top: 0, width: 1280, height: 776, right: 1280, bottom: 776, toJSON: () => ({}),
      } as DOMRect)
      const clock = fakeClock()
      const view = render(
        <I18nextProvider i18n={i18n}>
          <MemoryRouter>
            <div data-surface="sky" className="flex">
              <StarMapView map={skyMap(10)} target={{ layer: 'map' }} onNavigate={vi.fn()} scheduler={clock} createRendererFor={() => recordingRenderer()} />
            </div>
          </MemoryRouter>
        </I18nextProvider>,
      )
      act(() => clock.advance(20))
      expect(view.container.querySelector('[data-legend-pointer]')?.textContent).toBe(locales[lang].legend.pointer)
      expect(view.container.querySelector('[data-legend-keys]')?.textContent).toBe(locales[lang].legend.keys)
      view.unmount()
      vi.restoreAllMocks()
    }
    await i18n.changeLanguage('en')
  })
})
