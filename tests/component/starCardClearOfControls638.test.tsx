/**
 * The wide star card keeps clear of the map's floating controls (#638).
 *
 * In the production walk-through (1280 x 800) the card stood centred on the
 * stage, as tall as its details: its "Weiter" went under the docked Ask
 * composer (a press on its left half sent the draft) and the zoom pair sat
 * over its lower right corner. The card now keeps to the band between the
 * page's controls -- under the top line, over the docked composer, left of
 * the zoom pair -- and, taller than that band, scrolls its details while the
 * action stays in sight.
 *
 * jsdom lays nothing out, so the band is read off the card's own style and
 * the zoom pair's classes; the preview check in the PR is the layout itself.
 */
import { act, render, screen, within } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { STAR_CARD_PLACE } from '@/features/starmap/components/StarCard'
import { StarMapView } from '@/features/starmap/components/StarMapView'
import type { LayerTarget } from '@/features/starmap/view/layers'
import i18n from '@/i18n'
import en from '@/i18n/locales/en/starmap.json'
import { fakeClock, recordingRenderer, skyMap } from './starmapHarness'

const map = skyMap(10)
// A star with a chapter to go on with, so the card has its action.
const star = map.stars.find((candidate) => candidate.chapter.lessonCount > 0) ?? map.stars[0]
const TARGET: LayerTarget = { layer: 'star', nebulaId: star.nebulaId, unitId: star.unitId }

function showAt(width: number, height: number) {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    x: 0, y: 0, left: 0, top: 0, width, height, right: width, bottom: height, toJSON: () => ({}),
  } as DOMRect)
  const clock = fakeClock()
  const view = render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <div data-surface="sky" className="flex">
          <StarMapView map={map} target={TARGET} onNavigate={vi.fn()} scheduler={clock} createRendererFor={() => recordingRenderer()} />
        </div>
      </MemoryRouter>
    </I18nextProvider>,
  )
  act(() => clock.advance(20))
  return view
}

/** A Tailwind spacing class's px: `right-6` is 24, `p-[3px]` is 3. */
function spacing(className: string, prefix: string): number {
  const match = new RegExp(`(?:^|\\s)${prefix}-(\\[(\\d+)px\\]|(\\d+(?:\\.\\d+)?))(?:\\s|$)`).exec(className)
  if (!match) throw new Error(`no ${prefix}-* in "${className}"`)
  return match[2] !== undefined ? Number(match[2]) : Number(match[3]) * 4
}

describe('the wide star card keeps clear of the floating controls (#638)', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('ends over the docked Ask composer, never under it, and starts under the top line', () => {
    const view = showAt(1280, 800)
    const card = view.container.querySelector<HTMLElement>('[data-star-card]')!
    expect(card).not.toBeNull()
    // No longer centred on the whole stage, whatever its height.
    expect(card.className).not.toContain('top-1/2')
    expect(card.className).not.toContain('-translate-y-1/2')
    // Inset top and bottom to the band, centred in it by its auto margins, as tall as its content.
    expect(card.className).toContain('absolute')
    expect(card.className).toContain('my-auto')
    expect(card.className).toContain('h-fit')
    expect(STAR_CARD_PLACE.bottom).toBe('calc(var(--page-bottom-inset, 0px) + 12px)')
    expect(STAR_CARD_PLACE.top).toContain('var(--starmap-top-line, 0px) + 12px')
    expect(STAR_CARD_PLACE.top).toContain('76px + var(--starmap-notice-height, 0px)')
    // The style carries the band (jsdom may drop a max() it cannot parse; the constant above is what is set).
    expect(card.getAttribute('style')).toContain('--page-bottom-inset')
    expect(card.getAttribute('style')).toContain('max-height: calc(100%')
    view.unmount()
  })

  it('stands left of the zoom pair, with room between', () => {
    const view = showAt(1280, 800)
    const card = view.container.querySelector<HTMLElement>('[data-star-card]')!
    const zoom = screen.getByRole('group', { name: en.zoom.group })
    // The zoom pair: its right inset, its padding and border, a 32 px button.
    const zoomRight = spacing(zoom.className, 'right')
    const pad = spacing(zoom.className, 'p')
    for (const button of within(zoom).getAllByRole('button')) expect(button.className).toContain('size-8')
    expect(zoom.className).toContain('border ')
    const zoomLeftEdge = zoomRight + pad * 2 + 2 + 32
    expect(zoomRight).toBe(24)
    expect(zoomLeftEdge).toBe(64)
    expect(card.style.right).toBe(`${STAR_CARD_PLACE.right}px`)
    expect(STAR_CARD_PLACE.right - zoomLeftEdge).toBeGreaterThanOrEqual(12)
    view.unmount()
  })

  it('scrolls its details when taller than the band, and keeps its action out of the scroll', () => {
    const view = showAt(1280, 800)
    const card = view.container.querySelector<HTMLElement>('[data-star-card]')!
    const scroll = card.querySelector<HTMLElement>('[data-star-card-scroll]')!
    expect(scroll.className).toContain('overflow-y-auto')
    expect(scroll.className).toContain('min-h-0')
    // The card itself does not scroll: the action under the details stays in sight.
    expect(card.className).not.toContain('overflow-y-auto')
    const action = card.querySelector<HTMLElement>('[data-star-card-action]')
    expect(action, 'the test star has a chapter to go on with').not.toBeNull()
    expect(scroll.contains(action)).toBe(false)
    expect(action!.className).toContain('shrink-0')
    expect(within(action!).getByRole('link')).toBeTruthy()
    // The name and the way back are in the scrolling part, above the action.
    expect(scroll.querySelector('h1')).not.toBeNull()
    view.unmount()
  })
})
