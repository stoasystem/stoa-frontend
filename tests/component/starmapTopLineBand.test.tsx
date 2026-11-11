/**
 * A wide stage's top line can wrap, and the onboarding cards and the map
 * itself then start under it as drawn: in French a nebula's "Carte du ciel /
 * … · 0 sur 1 allumées" ended at 83 px at 768-900 wide, under the cards'
 * band (76) and the map's band (76). The stage measures the line's bottom
 * and hands it down as `--starmap-top-line`; `controlBands` keeps the map
 * 12 px under it. jsdom lays nothing out, so the line's height is mocked and
 * its size observer driven by hand; the built app is checked in
 * tests/e2e-dist/aboutYouLayout.spec.ts.
 */
import { act, render } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { StarMapView, TOP_LINE_GAP, controlBands } from '@/features/starmap/components/StarMapView'
import { StarMapEngine } from '@/features/starmap/engine/starMapEngine'
import { AboutYou } from '@/features/starmap/onboarding/AboutYou'
import i18n from '@/i18n'
import { fakeClock, recordingRenderer, skyMap } from './starmapHarness'

/** Where the wide top line ends, px from the stage's top, as the layout would have it. */
let lineBottom = 64
const observed: { target: Element; callback: ResizeObserverCallback }[] = []

beforeEach(async () => {
  await i18n.changeLanguage('en')
  lineBottom = 64
  observed.length = 0
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    const bottom = this.matches('[data-starmap-stage] > [data-starmap-overlay]') ? lineBottom : 776
    return { x: 0, y: 0, left: 0, top: 0, width: 840, height: bottom, right: 840, bottom, toJSON: () => ({}) } as DOMRect
  })
  // Laid out: the stage measures only a line that has a height.
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function (this: HTMLElement) {
    return this.matches('[data-starmap-stage] > [data-starmap-overlay]') ? Math.max(0, lineBottom - 20) : 0
  })
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(private readonly callback: ResizeObserverCallback) {}
      observe(target: Element) {
        observed.push({ target, callback: this.callback })
      }
      unobserve() {}
      disconnect() {}
    },
  )
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

function showNebula() {
  const clock = fakeClock()
  const sky = skyMap(10)
  const nebulaId = sky.nebulae[0]!.topicId
  const viewport = vi.spyOn(StarMapEngine.prototype, 'setViewport')
  const view = render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <div data-surface="sky">
          <StarMapView
            map={sky}
            target={{ layer: 'nebula', nebulaId }}
            onNavigate={vi.fn()}
            scheduler={clock}
            createRendererFor={() => recordingRenderer()}
            overlay={() => <AboutYou grades={[]} galaxies={sky.subjects} ticked={null} saving={false} failed={false} onSave={vi.fn()} onLater={vi.fn()} />}
          />
        </div>
      </MemoryRouter>
    </I18nextProvider>,
  )
  act(() => clock.advance(20))
  const stage = view.container.querySelector<HTMLElement>('[data-starmap-stage]')!
  const line = stage.querySelector(':scope > [data-starmap-overlay]')!
  const lastBands = () => viewport.mock.lastCall?.[3]
  const wrap = (bottom: number) => {
    lineBottom = bottom
    act(() => {
      for (const { target, callback } of observed) if (target === line) callback([], {} as ResizeObserver)
    })
  }
  return { stage, view, lastBands, wrap, line }
}

it('the stage follows the wide top line as it wraps, and the map keeps 12 px under it', () => {
  const { stage, lastBands, wrap, line } = showNebula()
  expect(observed.some(({ target }) => target === line), 'the top line is watched').toBe(true)
  // One line: as before, the map's band starts at 76.
  expect(stage.style.getPropertyValue('--starmap-top-line')).toBe('64px')
  expect(lastBands()?.top).toBe(76)

  // Wrapped (French at 768-900): the band moves down with it.
  wrap(83)
  expect(stage.style.getPropertyValue('--starmap-top-line')).toBe('83px')
  expect(lastBands()?.top).toBe(83 + TOP_LINE_GAP)

  // Back on one line: back to 76, never higher.
  wrap(59.4)
  expect(stage.style.getPropertyValue('--starmap-top-line')).toBe('60px')
  expect(lastBands()?.top).toBe(76)
})

it('the cards\' wide band starts under the measured line too, never above 76', () => {
  const { view } = showNebula()
  const band = view.container.querySelector('[data-about-you]')?.firstElementChild
  const wideTop = (band?.getAttribute('class') ?? '').split(/\s+/).find((name) => name.startsWith('@min-[768px]:top-['))
  expect(wideTop).toBe('@min-[768px]:top-[max(calc(76px+var(--starmap-notice-height,0px)),calc(var(--starmap-top-line,0px)+12px))]')
  expect(TOP_LINE_GAP).toBe(12)
})

it('a line not laid out (no height) moves nothing', () => {
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(0)
  const { stage, lastBands } = showNebula()
  expect(stage.style.getPropertyValue('--starmap-top-line')).toBe('')
  expect(lastBands()?.top).toBe(76)
})

it('a phone measures nothing: its line stacks, and its bands are as they were', () => {
  expect(controlBands(false, 0, false, 200)).toEqual(controlBands(false))
  expect(controlBands(true, 0, false, 0).top).toBe(76)
  expect(controlBands(true, 0, true, 0).top).toBe(108)
  expect(controlBands(true, 0, true, 120).top).toBe(132)
})
