/**
 * The star map fills whatever box it is mounted in (audit of #71): a flex
 * column (the map pages today) or a plain block with a definite size (#66's
 * Ask page area, `absolute inset-y-0`). It measures its own stage, sizes the
 * canvas's backing store from it, and follows it when the box changes -- as
 * it does when the Ask panel opens and closes beside it.
 */
import { act, render } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { StarMapView } from '@/features/starmap/components/StarMapView'
import { createCanvas2DRenderer } from '@/features/starmap/render/canvas2d'
import i18n from '@/i18n'
import { fakeClock, fakeContext, recordingRenderer, skyMap } from './starmapHarness'

let size = { width: 843, height: 700 }
let resize: (() => void) | null = null

beforeEach(async () => {
  await i18n.changeLanguage('en')
  size = { width: 843, height: 700 }
  vi.stubGlobal('Path2D', class {})
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(callback: () => void) {
        resize = callback
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
  vi.spyOn(window, 'devicePixelRatio', 'get').mockReturnValue(2)
  // jsdom lays nothing out: the stage reports the box it was given.
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
    () => ({ x: 0, y: 0, left: 0, top: 0, ...size, right: size.width, bottom: size.height, toJSON: () => ({}) }) as DOMRect,
  )
  const counter = { drawImage: 0, filterSets: 0 }
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => fakeContext(counter) as never)
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  resize = null
})

function mountInBlock() {
  const clock = fakeClock()
  const view = render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        {/* A plain block of known size, like #66's `data-ask-page`: not a flex container. */}
        <div data-surface="sky" style={{ position: 'absolute', top: 0, left: 0, width: size.width, height: size.height }}>
          <StarMapView
            map={skyMap(10)}
            target={{ layer: 'map' }}
            onNavigate={() => {}}
            scheduler={clock}
            createRendererFor={(canvas) => createCanvas2DRenderer(canvas)!}
          />
        </div>
      </MemoryRouter>
    </I18nextProvider>,
  )
  act(() => clock.advance(20))
  return { clock, ...view }
}

describe('the star map in a plain block container', () => {
  it('fills the block rather than a flex share: the frame takes its full height and the stage its whole frame', () => {
    const { container } = mountInBlock()
    const frame = container.querySelector('[data-starmap-frame]')!
    const stage = container.querySelector('[data-starmap-stage]')!
    // The frame is 100% of its parent's height in any display; the stage is absolutely inset in it.
    expect(frame.className).toMatch(/\bh-full\b/)
    expect(frame.className).toMatch(/\brelative\b/)
    expect(stage.className).toMatch(/\babsolute\b/)
    expect(stage.className).toMatch(/\binset-0\b/)
    expect(stage.parentElement).toBe(frame)
  })

  it('gives the canvas a backing store of the block’s size times the pixel ratio', () => {
    const { container } = mountInBlock()
    const canvas = container.querySelector('canvas')!
    expect(canvas.width).toBe(843 * 2)
    expect(canvas.height).toBe(700 * 2)
  })

  it('follows the block when the Ask panel opens beside it and closes again', () => {
    const { container, clock } = mountInBlock()
    const canvas = container.querySelector('canvas')!
    size = { width: 843 - 420, height: 700 }
    act(() => {
      resize?.()
      clock.advance(20)
    })
    expect(canvas.width).toBe(423 * 2)
    size = { width: 843, height: 700 }
    act(() => {
      resize?.()
      clock.advance(20)
    })
    expect(canvas.width).toBe(843 * 2)
  })
})

describe('the foveation switch (#44)', () => {
  function mountWith(foveate: boolean | undefined) {
    const clock = fakeClock()
    const renderer = recordingRenderer()
    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <div data-surface="sky" style={{ position: 'absolute', top: 0, left: 0, width: size.width, height: size.height }}>
            <StarMapView
              map={skyMap(500)}
              target={{ layer: 'map' }}
              onNavigate={() => {}}
              foveate={foveate}
              scheduler={clock}
              createRendererFor={() => renderer}
            />
          </div>
        </MemoryRouter>
      </I18nextProvider>,
    )
    act(() => clock.advance(20))
    return renderer.last()
  }

  it('blurs the nebulae outside the focus by default', () => {
    expect(mountWith(undefined).sharpness.some((s) => s === 0)).toBe(true)
  })

  it('reaches the engine: switched off, every nebula is drawn sharp', () => {
    expect(mountWith(false).sharpness.every((s) => s === 1)).toBe(true)
  })
})
