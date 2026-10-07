/**
 * The phone's star card is a sheet (#139, #123 E2), and a chosen star is
 * flown to before its card renders (#139, #123 B6): the sheet opens
 * collapsed (the star's name and its main action), pulls up and down, is
 * still the star's card for a screen reader and a keyboard, closes by the
 * same rules as the card; the map frames the star above the collapsed sheet,
 * and the way back to the star sits above it.
 */
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { useState } from 'react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEMO_KNOWLEDGE_POINT } from '@/dev/demo/sky/demoSky'
import { settleSheet } from '@/features/starmap/components/StarSheet'
import { StarMapView } from '@/features/starmap/components/StarMapView'
import { StarMapEngine } from '@/features/starmap/engine/starMapEngine'
import { orderedStars, type StarMap } from '@/features/starmap/model/starMap'
import type { Viewport } from '@/features/starmap/view/camera'
import { sheetBand, starFrameY, viewForTarget, type LayerTarget } from '@/features/starmap/view/layers'
import { CHOICE, SHEET } from '@/features/starmap/view/semanticZoom'
import { nebulaDiscs } from '@/features/starmap/view/geometry'
import i18n from '@/i18n'
import { fakeClock, recordingRenderer, skyMap, THEME } from './starmapHarness'

const POINT = DEMO_KNOWLEDGE_POINT.unitId
const NEBULA = 'trigonometry'
const pointTarget: LayerTarget = { layer: 'star', nebulaId: NEBULA, unitId: POINT }
const indexOf = (map: StarMap, unitId: string) => orderedStars(map).findIndex((s) => s.unitId === unitId)
/** The details' natural height in these tests (jsdom lays nothing out). */
const DETAILS_PX = 300

describe('where a phone frames a chosen star (#139)', () => {
  for (const [width, height] of [[390, 844], [375, 812]] as const) {
    it(`frames it in the middle of the map above the collapsed sheet, ${width}×${height}`, () => {
      const viewport: Viewport = { width, height, top: 144, bottom: 72, sheet: sheetBand(0) }
      const y = starFrameY(viewport) * height
      expect(sheetBand(0)).toBe(SHEET.marginPx + SHEET.collapsedPx + SHEET.clearancePx)
      expect(y).toBeGreaterThan(144)
      expect(y).toBeLessThan(height - sheetBand(0))
      expect(y).toBeCloseTo((144 + height - sheetBand(0)) / 2, 6)
      // The page's bottom inset (Ask's docked composer) lifts the sheet, and the star with it.
      const lifted = starFrameY({ ...viewport, sheet: sheetBand(80), bottom: 152 }) * height
      expect(lifted).toBeCloseTo((144 + height - sheetBand(80)) / 2, 6)
    })
  }

  it('leaves the wide card and a viewport with no sheet where they were', () => {
    const map = skyMap(1000, 'math')
    const discs = nebulaDiscs(map)
    const bounds = { minX: 0, minY: 0, maxX: 1, maxY: 1 }
    expect(viewForTarget(pointTarget, map, discs, bounds, { width: 1440, height: 900, top: 76, bottom: 164 }).fy).toBe(0.5)
    expect(viewForTarget(pointTarget, map, discs, bounds, { width: 390, height: 844, top: 112, bottom: 72 }).fy).toBe(0.3)
    expect(viewForTarget(pointTarget, map, discs, bounds, { width: 390, height: 844, top: 112, bottom: 72, sheet: 104 }).fy).toBeCloseTo((112 + 740) / 2 / 844, 6)
  })

  it('the engine flies a chosen star into that clear area, never under the sheet', () => {
    const map = skyMap(1000, 'math')
    const clock = fakeClock()
    const renderer = recordingRenderer()
    const engine = new StarMapEngine({ renderer, theme: THEME, reducedMotion: true, scheduler: clock, now: clock.now, galaxy: true })
    engine.setViewport(390, 844, 1, { top: 144, bottom: 72, sheet: sheetBand(0) })
    engine.setData(map, { layer: 'nebula', nebulaId: NEBULA })
    clock.advance(50)
    engine.setTarget(pointTarget)
    clock.advance(800)
    const i = indexOf(map, POINT)
    const y = renderer.last().y[i]
    expect(y).toBeGreaterThan(144)
    expect(y).toBeLessThan(844 - sheetBand(0))
    expect(y).toBeCloseTo((144 + 844 - sheetBand(0)) / 2, 0)
    engine.destroy()
  })
})

describe('where a let-go pull settles (#139)', () => {
  const [low, high] = [SHEET.collapsedPx, SHEET.collapsedPx + DETAILS_PX]
  it('follows a flick, else settles at the nearer state', () => {
    expect(settleSheet(low + 10, SHEET.flickSpeed + 0.1, low, high)).toBe('expanded')
    expect(settleSheet(high - 10, -SHEET.flickSpeed - 0.1, low, high)).toBe('collapsed')
    expect(settleSheet(low + DETAILS_PX * 0.4, 0, low, high)).toBe('collapsed')
    expect(settleSheet(low + DETAILS_PX * 0.6, 0, low, high)).toBe('expanded')
    expect(settleSheet(low + DETAILS_PX * 0.6, -0.1, low, high)).toBe('expanded')
  })
})

describe('the star sheet on a phone (#139)', () => {
  let scrollHeight: PropertyDescriptor | undefined
  beforeEach(async () => {
    await i18n.changeLanguage('en')
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      x: 0, y: 0, left: 0, top: 0, width: 390, height: 844, right: 390, bottom: 844, toJSON: () => ({}),
    } as DOMRect)
    scrollHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollHeight')
    Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
      configurable: true,
      get() {
        return (this as HTMLElement).hasAttribute('data-star-sheet-details') ? DETAILS_PX : 0
      },
    })
  })
  afterEach(() => {
    vi.restoreAllMocks()
    if (scrollHeight) Object.defineProperty(HTMLElement.prototype, 'scrollHeight', scrollHeight)
    else delete (HTMLElement.prototype as { scrollHeight?: number }).scrollHeight
  })

  /** The map with its route kept in state, as the page keeps it. */
  function show(start: LayerTarget) {
    const map = skyMap(1000, 'math')
    const clock = fakeClock()
    const renderer = recordingRenderer()
    const navigate = vi.fn()
    function Page() {
      const [target, setTarget] = useState<LayerTarget>(start)
      return (
        <StarMapView
          map={map}
          target={target}
          onNavigate={(next) => {
            navigate(next)
            setTarget(next)
          }}
          scheduler={clock}
          createRendererFor={() => renderer}
        />
      )
    }
    const view = render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <div data-surface="sky" className="flex">
            <Page />
          </div>
        </MemoryRouter>
      </I18nextProvider>,
    )
    act(() => clock.advance(800))
    const stage = view.container.querySelector<HTMLElement>('[data-starmap-stage]')!
    const sheet = () => view.container.querySelector<HTMLElement>('[data-star-sheet]')
    const head = () => sheet()!.querySelector<HTMLElement>('[data-star-sheet-head]')!
    const point = map.stars.find((s) => s.unitId === POINT)!
    return { map, clock, renderer, navigate, stage, sheet, head, point, ...view }
  }

  it('opens collapsed: the star’s name and its main action, and it is still the star’s card', () => {
    const { sheet, point } = show(pointTarget)
    expect(sheet()).not.toBeNull()
    expect(sheet()!.dataset.starSheet).toBe('collapsed')
    expect(sheet()!.style.height).toBe(`${SHEET.collapsedPx}px`)
    const card = screen.getByRole('article', { name: point.name })
    expect(card).toBe(sheet())
    const title = within(card).getByRole('button', { name: point.name })
    expect(title).toHaveAttribute('aria-expanded', 'false')
    const details = document.getElementById(title.getAttribute('aria-controls')!)!
    expect(details).toHaveAttribute('data-star-sheet-details')
    expect(title).toHaveAccessibleDescription("Shows or hides this star's details")
    expect(within(card).getByRole('heading', { level: 1, name: point.name })).toContainElement(title)
    // The action is in the row that shows when collapsed, not in the details.
    const go = within(card).getByRole('link', { name: 'Continue' })
    expect(go).toHaveAttribute('href', `/chapter/${POINT}`)
    expect(details).not.toContainElement(go)
    // Every detail of the wide card is in the sheet, behind the row.
    expect(within(details).getByRole('link', { name: 'Back to Trigonometry' })).toHaveAttribute('href', `/map/math/${NEBULA}`)
    expect(within(details).getByRole('progressbar')).toBeInTheDocument()
    expect(within(details).getByRole('heading', { name: 'Skills' })).toBeInTheDocument()
  })

  it('keeps a focus order that follows the screen: the name, the action, then the details', () => {
    const { sheet } = show(pointTarget)
    const focusable = [...sheet()!.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')]
    expect(focusable.slice(0, 3).map((element) => element.textContent?.trim())).toEqual([expect.stringContaining('Sine'), 'Continue', 'Back to Trigonometry'])
  })

  it('opens and closes on a tap of the name or of the head, and opens when focus moves into the details', () => {
    const { sheet, head, point } = show(pointTarget)
    const title = screen.getByRole('button', { name: point.name })
    fireEvent.click(title)
    expect(title).toHaveAttribute('aria-expanded', 'true')
    expect(sheet()!.dataset.starSheet).toBe('expanded')
    expect(sheet()!.style.height).toBe(`${SHEET.collapsedPx + DETAILS_PX}px`)
    fireEvent.click(title)
    expect(sheet()!.dataset.starSheet).toBe('collapsed')
    // The head's empty space (the grabber) toggles as well.
    fireEvent.click(head().firstElementChild!)
    expect(sheet()!.dataset.starSheet).toBe('expanded')
    fireEvent.click(head().firstElementChild!)
    expect(sheet()!.dataset.starSheet).toBe('collapsed')
    // Tab into the details: they open, so nothing focused is clipped away.
    act(() => screen.getByRole('link', { name: 'Back to Trigonometry' }).focus())
    expect(sheet()!.dataset.starSheet).toBe('expanded')
  })

  it('follows a pull up and a pull down, and a drag is not a tap', () => {
    const { sheet, head, navigate } = show(pointTarget)
    const pull = (from: number, to: number) => {
      fireEvent.pointerDown(head(), { pointerId: 7, clientY: from, button: 0, pointerType: 'touch' })
      for (let k = 1; k <= 5; k += 1) fireEvent.pointerMove(head(), { pointerId: 7, clientY: from + ((to - from) * k) / 5, pointerType: 'touch' })
    }
    pull(780, 700)
    // Mid-pull the sheet is as tall as the finger has it, with no easing.
    expect(sheet()!.style.height).toBe(`${SHEET.collapsedPx + 80}px`)
    expect(sheet()!.style.transition).toBe('none')
    fireEvent.pointerUp(head(), { pointerId: 7, clientY: 700, pointerType: 'touch' })
    fireEvent.click(head())
    expect(sheet()!.dataset.starSheet).toBe('expanded')
    // Never past either end.
    pull(500, 100)
    expect(sheet()!.style.height).toBe(`${SHEET.collapsedPx + DETAILS_PX}px`)
    fireEvent.pointerUp(head(), { pointerId: 7, clientY: 100, pointerType: 'touch' })
    pull(500, 700)
    fireEvent.pointerUp(head(), { pointerId: 7, clientY: 700, pointerType: 'touch' })
    expect(sheet()!.dataset.starSheet).toBe('collapsed')
    expect(sheet()!.style.height).toBe(`${SHEET.collapsedPx}px`)
    // A small wobble is a tap, not a drag; and nothing reached the map.
    fireEvent.pointerDown(head(), { pointerId: 8, clientY: 780, button: 0, pointerType: 'touch' })
    fireEvent.pointerMove(head(), { pointerId: 8, clientY: 780 - SHEET.tapSlopPx + 2, pointerType: 'touch' })
    fireEvent.pointerUp(head(), { pointerId: 8, clientY: 780 - SHEET.tapSlopPx + 2, pointerType: 'touch' })
    expect(sheet()!.style.height).toBe(`${SHEET.collapsedPx}px`)
    expect(navigate).not.toHaveBeenCalled()
  })

  it('closes by the card’s rules: Escape, a tap on empty map, zooming out past the card', () => {
    {
      const { sheet, navigate, point, unmount } = show(pointTarget)
      fireEvent.keyDown(screen.getByRole('button', { name: point.name }), { key: 'Escape' })
      expect(navigate).toHaveBeenLastCalledWith({ layer: 'nebula', nebulaId: NEBULA })
      expect(sheet()).toBeNull()
      unmount()
    }
    {
      // A tap on no star: the card closes at once (letting go flies nowhere).
      const { sheet, navigate, stage, unmount } = show(pointTarget)
      act(() => {
        fireEvent.pointerDown(stage, { pointerId: 1, clientX: 4, clientY: 300, button: 0, pointerType: 'touch' })
        fireEvent.pointerUp(stage, { pointerId: 1, clientX: 4, clientY: 300, pointerType: 'touch' })
      })
      expect(navigate).toHaveBeenLastCalledWith({ layer: 'nebula', nebulaId: NEBULA })
      expect(sheet()).toBeNull()
      unmount()
    }
    {
      const { sheet, navigate, clock } = show(pointTarget)
      const out = screen.getByRole('button', { name: 'Zoom out' })
      for (let k = 0; k < 8 && sheet(); k += 1) {
        fireEvent.click(out)
        act(() => clock.advance(500))
      }
      expect(navigate).toHaveBeenCalledWith({ layer: 'nebula', nebulaId: NEBULA })
      expect(sheet()).toBeNull()
    }
  })

  it('flies first: the flight’s first frame is drawn before the route, the sheet and the parallel DOM change', () => {
    const { map, clock, renderer, navigate, stage, sheet, container } = show({ layer: 'nebula', nebulaId: NEBULA })
    const i = indexOf(map, POINT)
    const at = renderer.last()
    const [x, y] = [at.x[i], at.y[i]]
    const links = container.querySelectorAll('a[data-unit]').length
    expect(links).toBeGreaterThan(0)
    const frames = renderer.frames.length
    act(() => {
      fireEvent.pointerDown(stage, { pointerId: 1, clientX: x, clientY: y, button: 0, pointerType: 'touch' })
      fireEvent.pointerUp(stage, { pointerId: 1, clientX: x, clientY: y, pointerType: 'touch' })
    })
    expect(navigate).not.toHaveBeenCalled()
    expect(sheet()).toBeNull()
    // The next frame is the flight's: the map has moved, the route has not.
    act(() => clock.advance(1000 / 60))
    expect(renderer.frames.length).toBe(frames + 1)
    expect(Math.hypot(renderer.last().x[i] - x, renderer.last().y[i] - y)).toBeGreaterThan(0.5)
    expect(navigate).not.toHaveBeenCalled()
    expect(sheet()).toBeNull()
    expect(container.querySelectorAll('a[data-unit]').length).toBe(links)
    // `CHOICE.routeAfterFrames` frames in, the route follows; the sheet opens collapsed, the parallel DOM goes.
    for (let k = 1; k < CHOICE.routeAfterFrames; k += 1) act(() => clock.advance(1000 / 60))
    expect(navigate).toHaveBeenCalledTimes(1)
    expect(navigate).toHaveBeenCalledWith(pointTarget)
    expect(sheet()!.dataset.starSheet).toBe('collapsed')
    expect(container.querySelectorAll('a[data-unit]').length).toBe(0)
    // The flight goes on unbroken to the star, above the sheet.
    act(() => clock.advance(800))
    expect(renderer.last().y[i]).toBeLessThan(844 - sheetBand(0))
  })

  it('puts the way back to the star above the sheet, collapsed or open', () => {
    const { clock, stage, sheet, point } = show(pointTarget)
    const hint = () => document.querySelector<HTMLButtonElement>('[data-star-hint]')
    const hintY = () => Number(/translate\([-\d.]+px, ([-\d.]+)px\)/.exec(hint()!.style.transform)![1])
    expect(hint()).toBeNull()
    const drag = (dy: number) =>
      act(() => {
        fireEvent.pointerDown(stage, { pointerId: 1, clientX: 200, clientY: 300, button: 0, pointerType: 'touch' })
        for (let k = 1; k <= 20; k += 1) {
          fireEvent.pointerMove(stage, { pointerId: 1, clientX: 200, clientY: 300 + (dy * k) / 20, pointerType: 'touch' })
          clock.advance(16)
        }
        clock.advance(200)
        fireEvent.pointerUp(stage, { pointerId: 1, clientX: 200, clientY: 300 + dy, pointerType: 'touch' })
        clock.advance(400)
      })
    // Pulled down out of the clear area: the star is under or below the sheet.
    drag(500)
    expect(hint()).not.toBeNull()
    expect(hint()!.getAttribute('aria-label')).toBe(`Back to ${point.name}`)
    const collapsedTop = 844 - SHEET.marginPx - SHEET.collapsedPx
    expect(hintY()).toBeLessThanOrEqual(collapsedTop - 16)
    // Opened, the sheet reaches higher; the way back moves above it.
    fireEvent.click(screen.getByRole('button', { name: point.name }))
    expect(sheet()!.dataset.starSheet).toBe('expanded')
    expect(hintY()).toBeLessThanOrEqual(844 - SHEET.marginPx - SHEET.collapsedPx - DETAILS_PX - 16)
  })
})
