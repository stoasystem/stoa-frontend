/**
 * Keyboard focus across a choice (#330 M2), and the map telling its overlay
 * when it has come to rest (#330 M4).
 *
 * Choosing a nebula from the keyboard turns its link into its name; choosing
 * a star takes the whole parallel DOM away (#139). Either way the element
 * that had focus is gone: focus fell to the page, and the arrows that step
 * from star to star are the stage's keys, so they stopped working.
 */
import { act, fireEvent, render } from '@testing-library/react'
import type { ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { StarMapView } from '@/features/starmap/components/StarMapView'
import type { LayerTarget } from '@/features/starmap/view/layers'
import i18n from '@/i18n'
import { fakeClock, recordingRenderer, skyMap } from './starmapHarness'

const map = skyMap(10, 'math', { relations: true })

function showMap(target: LayerTarget, overlay?: (locate: unknown, watch: (listener: () => void) => () => void) => ReactNode) {
  const clock = fakeClock()
  const renderer = recordingRenderer()
  const onNavigate = vi.fn()
  const tree = (at: LayerTarget) => (
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <div data-surface="sky" className="flex">
          <StarMapView map={map} target={at} onNavigate={onNavigate} scheduler={clock} createRendererFor={() => renderer} overlay={overlay} />
        </div>
      </MemoryRouter>
    </I18nextProvider>
  )
  const view = render(tree(target))
  act(() => clock.advance(20))
  const stage = view.container.querySelector<HTMLElement>('[data-starmap-stage]')!
  const go = (next: LayerTarget) => {
    view.rerender(tree(next))
    act(() => clock.advance(1500))
  }
  return { ...view, clock, onNavigate, stage, go }
}

beforeEach(async () => {
  await i18n.changeLanguage('en')
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    x: 0, y: 0, left: 0, top: 0, width: 1280, height: 776, right: 1280, bottom: 776, toJSON: () => ({}),
  } as DOMRect)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('keyboard focus across a choice (#330 M2)', () => {
  it('a nebula chosen from its link: focus stays on the map, and an arrow goes into its stars', () => {
    const s = showMap({ layer: 'map' })
    const link = s.container.querySelector<HTMLAnchorElement>('a[data-nebula-link="trigonometry"]')!
    link.focus()
    expect(document.activeElement).toBe(link)

    s.go({ layer: 'nebula', nebulaId: 'trigonometry' })
    expect(s.container.querySelector('a[data-nebula-link="trigonometry"]')).toBeNull()
    expect(document.activeElement).toBe(s.stage)

    fireEvent.keyDown(s.stage, { key: 'ArrowRight' })
    const focused = document.activeElement as HTMLElement
    expect(focused.matches('a[data-unit]')).toBe(true)
    expect(focused.closest('li[data-nebula]')?.getAttribute('data-nebula')).toBe('trigonometry')
  })

  it('a star chosen from its link: focus stays on the map, and the arrows still step from star to star', () => {
    const s = showMap({ layer: 'nebula', nebulaId: 'trigonometry' })
    const link = s.container.querySelector<HTMLAnchorElement>('a[data-unit="demo-sine-cosine"]')!
    link.focus()

    s.go({ layer: 'star', nebulaId: 'trigonometry', unitId: 'demo-sine-cosine' })
    expect(s.container.querySelector('a[data-unit]')).toBeNull()
    expect(document.activeElement).toBe(s.stage)

    fireEvent.keyDown(document.activeElement!, { key: 'ArrowRight' })
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowLeft' })
    expect(s.onNavigate).toHaveBeenCalledWith(expect.objectContaining({ layer: 'star', nebulaId: 'trigonometry' }))
  })

  it('leaves focus alone when it was not on the map', () => {
    const s = showMap({ layer: 'map' })
    const outside = document.createElement('button')
    document.body.append(outside)
    outside.focus()

    s.go({ layer: 'nebula', nebulaId: 'trigonometry' })
    expect(document.activeElement).toBe(outside)
    outside.remove()
  })
})

describe('telling the overlay the map came to rest (#330 M4)', () => {
  function watched() {
    const listener = vi.fn()
    let stop: (() => void) | undefined
    const s = showMap({ layer: 'map' }, (_locate, watch) => {
      stop ??= watch(listener)
      return null
    })
    return { ...s, listener, stop: () => stop!() }
  }

  it('calls its watchers when the map settles after a move, and stops once they unwatch', async () => {
    const s = watched()
    await act(async () => {})
    s.listener.mockClear()
    fireEvent.keyDown(s.stage, { key: '+' })
    act(() => s.clock.advance(2000))
    expect(s.listener).toHaveBeenCalled()

    s.stop()
    s.listener.mockClear()
    fireEvent.keyDown(s.stage, { key: '-' })
    act(() => s.clock.advance(2000))
    expect(s.listener).not.toHaveBeenCalled()
  })

  it('calls them when the map is covered and uncovered (the phone’s Ask sheet)', async () => {
    const s = watched()
    await act(async () => {})
    s.listener.mockClear()
    const host = s.container.querySelector<HTMLElement>('[data-surface="sky"]')!
    host.setAttribute('inert', '')
    await act(async () => {})
    expect(s.listener).toHaveBeenCalledTimes(1)
    host.removeAttribute('inert')
    await act(async () => {})
    expect(s.listener).toHaveBeenCalledTimes(2)
  })
})
