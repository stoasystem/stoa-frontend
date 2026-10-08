/**
 * The star map's legend (#141 B7): how to move today -- drag, scroll or
 * pinch, pick a star, press and drag a star (on touch, hold first) -- and
 * the keyboard's two orders (#141 E5), in de / en / fr / it. On a phone the
 * same words sit behind a "?" button, in a dialog (#146, round three C15).
 */
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { StarMapView } from '@/features/starmap/components/StarMapView'
import type { LayerTarget } from '@/features/starmap/view/layers'
import i18n from '@/i18n'
import de from '@/i18n/locales/de/starmap.json'
import en from '@/i18n/locales/en/starmap.json'
import fr from '@/i18n/locales/fr/starmap.json'
import it_ from '@/i18n/locales/it/starmap.json'
import { fakeClock, recordingRenderer, skyMap } from './starmapHarness'

/** The map at `width` × `height`, inside the sky's tokens as the route renders it. */
function showAt(width: number, height: number, target: LayerTarget = { layer: 'map' }) {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    x: 0, y: 0, left: 0, top: 0, width, height, right: width, bottom: height, toJSON: () => ({}),
  } as DOMRect)
  const clock = fakeClock()
  const navigate = vi.fn()
  const view = render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <div data-surface="sky" className="flex">
          <StarMapView map={skyMap(10)} target={target} onNavigate={navigate} scheduler={clock} createRendererFor={() => recordingRenderer()} />
        </div>
      </MemoryRouter>
    </I18nextProvider>,
  )
  act(() => clock.advance(20))
  return { ...view, navigate }
}

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
      const view = showAt(1280, 776)
      expect(view.container.querySelector('[data-legend-pointer]')?.textContent).toBe(locales[lang].legend.pointer)
      expect(view.container.querySelector('[data-legend-keys]')?.textContent).toBe(locales[lang].legend.keys)
      view.unmount()
      vi.restoreAllMocks()
    }
    await i18n.changeLanguage('en')
  })
})

describe('the phone’s "?" (#146 C15)', () => {
  const locales = { en, de, fr, it: it_ }
  afterEach(async () => {
    vi.restoreAllMocks()
    await i18n.changeLanguage('en')
  })

  it('has its own words in all four languages', () => {
    for (const [lang, bundle] of Object.entries(locales)) {
      expect(bundle.help.open.length, lang).toBeGreaterThan(8)
      expect(bundle.help.close.length, lang).toBeGreaterThan(3)
    }
    for (const lang of ['de', 'fr', 'it'] as const) {
      expect(locales[lang].help.open).not.toBe(en.help.open)
      expect(locales[lang].help.close).not.toBe(en.help.close)
    }
  })

  it('stands in for the legend on a phone and opens the legend’s own words, in the reader’s language', async () => {
    for (const lang of ['en', 'de', 'fr', 'it'] as const) {
      await i18n.changeLanguage(lang)
      const bundle = locales[lang]
      const view = showAt(390, 844)
      // No legend on the map; a "?" named for what it opens.
      expect(view.container.querySelector('[data-legend-pointer]')).toBeNull()
      const button = screen.getByRole('button', { name: bundle.help.open })
      expect(button.textContent).toBe('?')
      expect(button.getAttribute('aria-expanded')).toBe('false')
      const user = userEvent.setup()
      await user.click(button)
      const dialog = screen.getByRole('dialog', { name: bundle.help.open })
      // The same words as the wide screen's legend: states, markers, pointer, keys.
      for (const state of ['lit', 'in_progress', 'ready', 'locked'] as const) expect(within(dialog).getByText(bundle.state[state])).toBeTruthy()
      expect(within(dialog).getByText(bundle.marker.recommended)).toBeTruthy()
      expect(within(dialog).getByText(bundle.legend.reviewDue)).toBeTruthy()
      expect(within(dialog).getByText(bundle.legend.label)).toBeTruthy()
      expect(dialog.querySelector('[data-legend-pointer]')?.textContent).toBe(bundle.legend.pointer)
      expect(dialog.querySelector('[data-legend-keys]')?.textContent).toBe(bundle.legend.keys)
      // The close button closes it, and focus goes back to the "?".
      await user.click(within(dialog).getByRole('button', { name: bundle.help.close }))
      expect(screen.queryByRole('dialog')).toBeNull()
      expect(document.activeElement).toBe(button)
      view.unmount()
      vi.restoreAllMocks()
    }
  })

  it('opens and closes from the keyboard: Enter or Space opens, focus goes in, Escape closes and focus comes back', async () => {
    const view = showAt(375, 812)
    const user = userEvent.setup()
    const button = screen.getByRole('button', { name: en.help.open })
    act(() => button.focus())
    await user.keyboard('{Enter}')
    const dialog = screen.getByRole('dialog', { name: en.help.open })
    expect(dialog.contains(document.activeElement)).toBe(true)
    // Tab stays inside while it is open.
    await user.tab()
    expect(dialog.contains(document.activeElement)).toBe(true)
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.activeElement).toBe(button)
    expect(button.getAttribute('aria-expanded')).toBe('false')
    await user.keyboard(' ')
    expect(screen.getByRole('dialog', { name: en.help.open })).toBeTruthy()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.activeElement).toBe(button)
    view.unmount()
  })

  it('on a nebula, Escape closes only the dialog: the nebula stays chosen', async () => {
    const nebulaId = skyMap(10).nebulae[0].topicId
    const view = showAt(390, 844, { layer: 'nebula', nebulaId })
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: en.help.open }))
    expect(screen.getByRole('dialog')).toBeTruthy()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(view.navigate).not.toHaveBeenCalled()
    view.unmount()
  })

  it('is not there on a wide screen (the legend is), nor with a star chosen (the sheet has the bottom)', () => {
    const wide = showAt(1280, 776)
    expect(screen.queryByRole('button', { name: en.help.open })).toBeNull()
    expect(wide.container.querySelector('[data-legend-pointer]')).not.toBeNull()
    wide.unmount()
    vi.restoreAllMocks()
    const star = skyMap(10).stars[0]
    const phone = showAt(390, 844, { layer: 'star', nebulaId: star.nebulaId, unitId: star.unitId })
    expect(screen.queryByRole('button', { name: en.help.open })).toBeNull()
    phone.unmount()
  })
})

describe('how much of the legend is open', () => {
  it('keeps the key open and folds the instructions away', () => {
    // Five lines of instructions took the whole bottom-left corner and were
    // louder than the stars they explained. The key is read on every visit;
    // how to drag and zoom is read once.
    const { container } = showAt(1280, 800)

    const legend = container.querySelector('[data-starmap-legend]')!
    expect(legend.querySelector('ul'), 'the key is not in the legend').not.toBeNull()
    const how = legend.querySelector('[data-starmap-legend-how]') as HTMLDetailsElement
    expect(how, 'the instructions are not folded away').not.toBeNull()
    expect(how.open).toBe(false)
    expect(how.querySelector('[data-legend-pointer]')).not.toBeNull()
    expect(how.querySelector('[data-legend-keys]')).not.toBeNull()
  })

  it('names the fold in the reader’s language, never as a bare key', () => {
    const { container } = showAt(1280, 800)

    const summary = container.querySelector('[data-starmap-legend-how] summary')!
    expect(summary.textContent?.trim()).toBeTruthy()
    expect(summary.textContent).not.toContain('legend.')
  })
})
