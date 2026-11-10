/**
 * The star map's legend (#141 B7): how to move today -- drag, scroll or
 * pinch, pick a star, press and drag a star (on touch, hold first) -- and
 * the keyboard's two orders (#141 E5), in de / en / fr / it. The words sit
 * behind a "?" button, in a dialog (#146, round three C15) -- on a phone and,
 * since #643, on a wide screen too: no legend stays on the map.
 */
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { controlBands, StarMapView } from '@/features/starmap/components/StarMapView'
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

/** Every string in a locale bundle, with its key. */
function strings(bundle: unknown, prefix = ''): [string, string][] {
  if (typeof bundle === 'string') return [[prefix, bundle]]
  if (!bundle || typeof bundle !== 'object') return []
  return Object.entries(bundle).flatMap(([key, value]) => strings(value, prefix ? `${prefix}.${key}` : key))
}

describe('the star map in French says tu to the student (#267)', () => {
  // The map is the student's: "vous" and its imperatives (Choisissez, faites...) are the parents' and staff's.
  it.each(strings(fr))('%s', (_key, text) => {
    expect(text).not.toMatch(/\b(vous|votre|vos)\b/i)
    expect(text).not.toMatch(/\b\p{L}+ez\b/iu)
  })
})

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

  it('shows both lines behind the wide screen’s "?", in the reader’s language', async () => {
    for (const lang of ['en', 'de', 'fr', 'it'] as const) {
      await i18n.changeLanguage(lang)
      const view = showAt(1280, 776)
      await userEvent.setup().click(screen.getByRole('button', { name: locales[lang].help.open }))
      const dialog = screen.getByRole('dialog', { name: locales[lang].help.open })
      expect(dialog.querySelector('[data-legend-pointer]')?.textContent).toBe(locales[lang].legend.pointer)
      expect(dialog.querySelector('[data-legend-keys]')?.textContent).toBe(locales[lang].legend.keys)
      view.unmount()
      vi.restoreAllMocks()
    }
    await i18n.changeLanguage('en')
  })
})

describe('the "?" (#146 C15, wide screens too since #643)', () => {
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
      // The legend's words: states, markers, pointer, keys.
      for (const state of ['lit', 'in_progress', 'ready'] as const) expect(within(dialog).getByText(bundle.state[state])).toBeTruthy()
      expect(within(dialog).getByText(bundle.legend.waiting)).toBeTruthy()
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

  it('is not there with a star chosen, wide or phone (the card or the sheet has the stage)', () => {
    const star = skyMap(10).stars[0]
    for (const [width, height] of [[1280, 776], [390, 844]] as const) {
      const view = showAt(width, height, { layer: 'star', nebulaId: star.nebulaId, unitId: star.unitId })
      expect(screen.queryByRole('button', { name: en.help.open }), `${width}`).toBeNull()
      view.unmount()
      vi.restoreAllMocks()
    }
  })
})

describe('the wide screen’s "?" (#643)', () => {
  afterEach(async () => {
    vi.restoreAllMocks()
    await i18n.changeLanguage('en')
  })

  it('stands bottom left in place of the legend, on the zoom pair’s line, with a 44 px target', () => {
    const view = showAt(1280, 800)
    expect(view.container.querySelector('[data-starmap-legend]'), 'no always-on legend').toBeNull()
    expect(view.container.querySelector('[data-legend-pointer]'), 'nothing of the legend on the map').toBeNull()
    const button = screen.getByRole('button', { name: en.help.open })
    expect(button.textContent).toBe('?')
    expect(button.className).toContain('size-11')
    const frame = button.parentElement!
    expect(frame.className).toContain('left-6')
    expect(frame.className).toContain('bottom-[calc(1.5rem+var(--page-bottom-inset,0px))]')
    const zoom = screen.getByRole('group', { name: en.zoom.group })
    expect(zoom.className).toContain('bottom-[calc(1.5rem+var(--page-bottom-inset,0px))]')
    view.unmount()
  })

  it('is there on a nebula too', () => {
    const nebulaId = skyMap(10).nebulae[0].topicId
    const view = showAt(1280, 800, { layer: 'nebula', nebulaId })
    expect(screen.getByRole('button', { name: en.help.open })).toBeTruthy()
    view.unmount()
  })

  it('opens the key and how to move, in a panel by the "?", not across the stage', async () => {
    const view = showAt(1280, 800)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: en.help.open }))
    const dialog = screen.getByRole('dialog', { name: en.help.open })
    for (const state of ['lit', 'in_progress', 'ready'] as const) expect(within(dialog).getByText(en.state[state])).toBeTruthy()
    expect(within(dialog).getByText(en.legend.waiting)).toBeTruthy()
    expect(within(dialog).getByText(en.legend.reviewDue)).toBeTruthy()
    expect(within(dialog).getByRole('heading', { name: en.legend.label })).toBeTruthy()
    expect(within(dialog).getByRole('heading', { name: en.legend.howLabel })).toBeTruthy()
    expect(dialog.querySelector('[data-legend-pointer]')).not.toBeNull()
    expect(dialog.className).toContain('left-6')
    expect(dialog.className).toMatch(/w-\[min\(460px/)
    expect(dialog.className).not.toContain('inset-x-3')
    expect(dialog.className).toContain('overflow-y-auto')
    view.unmount()
  })

  it('closes on Escape, on its close button and on a click outside, and gives the focus back to the "?"', async () => {
    const view = showAt(1280, 800)
    const user = userEvent.setup()
    const button = screen.getByRole('button', { name: en.help.open })

    await user.click(button)
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.activeElement).toBe(button)

    await user.click(button)
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: en.help.close }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.activeElement).toBe(button)

    await user.click(button)
    const overlay = view.container.querySelector('[data-starmap-help] .bg-black\\/40')!
    expect(overlay).not.toBeNull()
    await user.click(overlay)
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.activeElement).toBe(button)
    view.unmount()
  })

  it('leaves the map a band below that clears the "?" and the zoom pair, not the old legend’s', () => {
    // "?" 24 px up and 50 tall; zoom pair 24 px up and about 74 tall.
    const { bottom } = controlBands(true)
    expect(bottom).toBeGreaterThanOrEqual(24 + 74 + 8)
    expect(bottom).toBeLessThan(164)
  })
})
