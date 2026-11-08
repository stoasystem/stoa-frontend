/**
 * Two layout leftovers of the onboarding sequel (#598, after #586):
 *
 *   1. on a 375 phone the "Find my own star" examples over the docked
 *      composer covered the map's zoom pair and "?" until they went: now they
 *      narrow to the room between those controls, and only the examples
 *      themselves take a tap, so the controls stay visible and usable;
 *   2. beside the practice stage, Murmi's tip stood 76 px up from the panel's
 *      bottom whatever was there: now it stands above the composer area as
 *      tall as it is, the tray of pictures added with "+" included.
 *
 * The rectangles are the ones measured in the design preview
 * (`surface=map-newcomer`, 375x812; `surface=lesson-first`, 1024x768).
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AskHost } from '@/features/ask/AskHost'
import { AskServerProvider } from '@/features/ask/server/askServer'
import { sidePads, type Box } from '@/features/ask/clearOfControls'
import { StageAskTipBubble } from '@/features/chapter/StageAskTip'
import i18n from '@/i18n'
import { resetAsk, useAskStore } from '@/store/askStore'
import { type CurrentUser, useAuthStore } from '@/store/authStore'
import { createFakeAskServer } from '../fakes/askServer'

const OWNER = 'u-1'

const box = ([left, top, right, bottom]: [number, number, number, number]): Box => ({ left, top, right, bottom })
const rect = ({ left, top, right, bottom }: Box) =>
  ({ left, top, right, bottom, x: left, y: top, width: right - left, height: bottom - top, toJSON: () => ({}) }) as DOMRect

/** Measured at 375x812 before the fix: the examples' band, the "?" and the zoom pair. */
const PHONE = {
  examples: box([12, 588, 363, 724]),
  help: box([20, 668, 64, 712]),
  zoom: box([308, 618, 359, 716]),
}

/** Lays the page out: each element found by `match` gets its rectangle; the rest have none. */
function layOut(match: (element: Element) => Box | null) {
  return vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    return rect(match(this) ?? { left: 0, top: 0, right: 0, bottom: 0 })
  })
}

function emulatePhone() {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent: () => false,
  })) as never
}

function mount(node: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <AskServerProvider value={createFakeAskServer()}>{node}</AskServerProvider>
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  )
}

beforeEach(async () => {
  await i18n.changeLanguage('en')
  useAuthStore.setState({
    user: { id: OWNER, name: 'L', email: 'l@x', role: 'student' } as CurrentUser,
    accessToken: 't',
    isAuthenticated: true,
  })
  resetAsk()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('1. the examples keep clear of the map controls on a phone', () => {
  it('pads each side past the control beside it', () => {
    // "?" ends at 64: 64 - 12 + 8. The zoom pair starts at 308: 363 - 308 + 8.
    expect(sidePads(PHONE.examples, [PHONE.help, PHONE.zoom])).toEqual({ left: 60, right: 63 })
  })

  it('leaves alone a control above or below the examples, or across their middle', () => {
    const above = box([308, 400, 359, 460])
    const across = box([12, 109, 363, 181])
    const middle = box([150, 650, 230, 700])
    expect(sidePads(PHONE.examples, [above, across, middle])).toEqual({ left: 0, right: 0 })
  })

  it('narrows the examples between the "?" and the zoom pair, and lets taps through around them', () => {
    emulatePhone()
    layOut((element) => {
      if (element.hasAttribute('data-ask-examples')) return PHONE.examples
      if (element.hasAttribute('data-starmap-help-button')) return PHONE.help
      if (element.getAttribute('role') === 'group') return PHONE.zoom
      return null
    })
    mount(
      <AskHost subjectId="math">
        {/* The map's controls as StarMapView draws them: the "?" in a wrapper with no size of its own. */}
        <div data-starmap-overlay data-starmap-help>
          <div>
            <button type="button" data-starmap-help-button aria-label="How to read the map">?</button>
          </div>
        </div>
        <div data-starmap-overlay role="group" aria-label="Zoom">
          <button type="button" aria-label="Zoom in">+</button>
          <button type="button" aria-label="Zoom out">-</button>
        </div>
      </AskHost>,
    )
    act(() => useAskStore.getState().offerExamples(OWNER, ['I want to practise quadratic equations', 'We are learning derivatives']))

    const examples = document.querySelector<HTMLElement>('[data-ask-examples]')!
    expect(examples.style.paddingLeft).toBe('60px')
    expect(examples.style.paddingRight).toBe('63px')
    // The band is out of the flow and lets taps through; the examples take them.
    expect(examples.className).toContain('pointer-events-none')
    expect(examples.className).toContain('absolute')
    for (const item of examples.querySelectorAll('li')) expect(item.className).toContain('pointer-events-auto')
    // An example narrowed this far wraps rather than lose its end.
    const example = screen.getByRole('button', { name: 'I want to practise quadratic equations' })
    expect(example.className).toContain('whitespace-normal')
    expect(example.querySelector('.truncate')).toBeNull()
    // The controls are all still there.
    expect(screen.getByRole('button', { name: 'Zoom in' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'How to read the map' })).toBeVisible()
  })
})

describe('2. beside the stage, Murmi stands above the composer area, tray included', () => {
  /** The panel 768 down; its composer area from `areaTop` (706 alone, 651 with a picture's tray). */
  function panel(areaTop: { current: number }) {
    layOut((element) => {
      if (element.hasAttribute('data-panel')) return box([605, 0, 1024, 768])
      if (element.hasAttribute('data-ask-composer-area')) return box([605, areaTop.current, 1024, 768])
      return null
    })
  }

  it('moves up when the tray arrives and back down when it goes', async () => {
    const areaTop = { current: 706 }
    panel(areaTop)
    mount(
      <aside data-panel>
        <div data-ask-composer-area>
          <form />
        </div>
        <StageAskTipBubble beside onDismiss={() => {}} />
      </aside>,
    )
    const tip = document.querySelector<HTMLElement>('[data-stage-ask-tip="beside"]')!
    // 768 - 706 + 14: where the 76 used to be written down.
    expect(tip.style.bottom).toBe('76px')

    const area = document.querySelector('[data-ask-composer-area]')!
    const tray = document.createElement('div')
    areaTop.current = 651
    act(() => {
      area.prepend(tray)
    })
    // 768 - 651 + 14: clear of the tray.
    await waitFor(() => expect(tip.style.bottom).toBe('131px'))
    areaTop.current = 706
    act(() => tray.remove())
    await waitFor(() => expect(tip.style.bottom).toBe('76px'))
  })

  it('sits in the flow over the docked composer otherwise', () => {
    mount(<StageAskTipBubble beside={false} onDismiss={() => {}} />)
    const tip = document.querySelector<HTMLElement>('[data-stage-ask-tip="docked"]')!
    expect(tip.style.bottom).toBe('')
  })
})
