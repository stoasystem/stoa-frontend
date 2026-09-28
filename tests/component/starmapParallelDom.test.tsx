/**
 * The star map's parallel DOM (#11 point 5, kept by #72): the canvas is
 * hidden from assistive technology, and every star on screen -- sharp or left
 * to a blurred tile -- is a link that reads out its name, learning state,
 * progress and markers, in the order nebula first, then
 * (topic.order, unit.order). The star layer is plain HTML.
 */
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { controlBands, StarMapView } from '@/features/starmap/components/StarMapView'
import { NEBULA_FOCUS_HEIGHT } from '@/features/starmap/view/layers'
import { starMapFixture, type FixtureSize } from '@/features/starmap/fixtures/starMapFixtures'
import type { LayerTarget } from '@/features/starmap/view/layers'
import i18n from '@/i18n'
import { fakeClock, recordingRenderer } from './starmapHarness'

function showMap(target: LayerTarget = { layer: 'map' }, size: FixtureSize = 10) {
  const clock = fakeClock()
  const renderer = recordingRenderer()
  const onNavigate = vi.fn()
  const view = render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <div data-surface="sky" className="flex">
          <StarMapView map={starMapFixture(size)} target={target} onNavigate={onNavigate} scheduler={clock} createRendererFor={() => renderer} />
        </div>
      </MemoryRouter>
    </I18nextProvider>,
  )
  act(() => clock.advance(20))
  return { clock, renderer, onNavigate, ...view }
}

function starLinks(container: HTMLElement) {
  return [...container.querySelectorAll<HTMLAnchorElement>('a[data-unit]')]
}

beforeEach(async () => {
  await i18n.changeLanguage('en')
  // jsdom lays nothing out; give the stage a desktop size.
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    x: 0, y: 0, left: 0, top: 0, width: 1280, height: 776, right: 1280, bottom: 776, toJSON: () => ({}),
  } as DOMRect)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('the parallel DOM', () => {
  it('hides the canvas from assistive technology', () => {
    const { container } = showMap()
    expect(container.querySelector('canvas')).toHaveAttribute('aria-hidden', 'true')
  })

  it('gives every star on screen a link, in nebula order, then unit order', () => {
    const { container } = showMap()
    expect(starLinks(container).map((link) => link.dataset.unit)).toEqual([
      'u-1', 'u-2', 'u-3', // numbers (topic order 1)
      'u-4', 'u-5', 'u-6', // algebra (2)
      'u-7', 'u-8', // geometry (3)
      'u-9', 'u-10', // data (4)
    ])
  })

  it('reads out name, learning state, progress and markers', () => {
    showMap()
    const nav = screen.getByRole('navigation', { name: 'Star map: Mathematics' })
    const star = (name: string) => within(nav).getByRole('link', { name: new RegExp(`^${name},`) })
    expect(star('Decimals')).toHaveAccessibleName('Decimals, In progress, 60% of lessons done, Suggested next')
    expect(star('Fractions')).toHaveAccessibleName('Fractions, Lit, 100% of lessons done, 3 cards due for review')
    expect(star('Triangles')).toHaveAccessibleName('Triangles, Locked, 0% of lessons done')
    expect(star('Angles')).toHaveAccessibleName('Angles, Ready to start, 0% of lessons done')
  })

  it('links every star to its route under /map', () => {
    showMap()
    expect(screen.getByRole('link', { name: /^Linear equations,/ })).toHaveAttribute('href', '/map/math/algebra/u-5')
  })

  it('opens the star layer when a star link is activated', () => {
    const { onNavigate } = showMap()
    fireEvent.click(screen.getByRole('link', { name: /^Angles,/ }))
    expect(onNavigate).toHaveBeenCalledWith({ layer: 'star', nebulaId: 'geometry', unitId: 'u-7' })
  })

  it('offers each nebula as a link too, in the reader’s language', async () => {
    await i18n.changeLanguage('de')
    showMap()
    expect(screen.getByRole('link', { name: 'Algebra, 1 von 3 leuchten, verbunden mit Numbers, Geometry' })).toHaveAttribute('href', '/map/math/algebra')
    // The star's name is content from the backend; the rest is ours.
    expect(screen.getByRole('link', { name: 'Decimals, In Arbeit, 60 % der Lektionen erledigt, Als Nächstes empfohlen' })).toBeInTheDocument()
  })

  it('says which nebulae each one is linked to, since the lines carry meaning', () => {
    showMap()
    expect(screen.getByRole('link', { name: 'Numbers, 2 of 3 lit, related to Algebra, Data' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Geometry, 0 of 2 lit, related to Algebra' })).toBeInTheDocument()
  })

  it('on the whole map, Tab goes nebula by nebula and to the recommended star; the other stars are read, not tabbed through', () => {
    const { container } = showMap()
    for (const link of starLinks(container)) {
      if (link.dataset.unit === 'u-3') expect(link).not.toHaveAttribute('tabindex')
      else expect(link).toHaveAttribute('tabindex', '-1')
    }
    const nav = screen.getByRole('navigation', { name: 'Star map: Mathematics' })
    const tabbable = within(nav).getAllByRole('link').filter((link) => link.getAttribute('tabindex') !== '-1')
    expect(tabbable.map((link) => link.getAttribute('href'))).toEqual([
      '/map/math/numbers',
      '/map/math/numbers/u-3', // Decimals, the recommended star
      '/map/math/algebra',
      '/map/math/geometry',
      '/map/math/data',
    ])
  })

  it('shows a focused nebula link by its nebula, clear of the page controls, and rings the nebula on the canvas', () => {
    const { clock, renderer, container } = showMap({ layer: 'map' }, 500)
    const bands = controlBands(true)
    const links = [...container.querySelectorAll<HTMLAnchorElement>('a[data-nebula-link]')]
    expect(links.length).toBeGreaterThan(5)
    for (const [index, link] of links.entries()) {
      act(() => {
        link.focus()
        clock.advance(600)
      })
      const frame = renderer.last()
      expect(frame.highlightNebula).toBe(index)
      expect(frame.sharpness[index]).toBe(1)
      const top = Number(link.dataset.focusTop)
      expect(top).toBeGreaterThanOrEqual(bands.top)
      expect(top + NEBULA_FOCUS_HEIGHT).toBeLessThanOrEqual(776 - bands.bottom)
      act(() => {
        link.blur()
        clock.advance(20)
      })
    }
  })

  it('inside a nebula, its stars are the next Tab stops', () => {
    const { container } = showMap({ layer: 'nebula', nebulaId: 'algebra' })
    const tabbable = starLinks(container).filter((link) => link.getAttribute('tabindex') !== '-1').map((link) => link.dataset.unit)
    expect(tabbable).toEqual(['u-4', 'u-5', 'u-6'])
  })

  it('lists every star on screen, blurred or sharp, on a 500-star map', () => {
    const { container, renderer } = showMap({ layer: 'map' }, 500)
    const frame = renderer.last()
    const onScreen = frame.x.filter((x, i) => x >= -8 && frame.y[i] >= -8 && x <= 1288 && frame.y[i] <= 784).length
    const links = starLinks(container)
    expect(links).toHaveLength(onScreen)
    const blurred = frame.starAlpha.filter((alpha) => alpha === 0).length
    expect(blurred).toBeGreaterThan(50)
    expect(links.length).toBeGreaterThan(frame.starAlpha.filter((alpha) => alpha > 0).length)
  })

  it('in a nebula, keeps the nebula order and names the nebula as the heading', () => {
    const { container } = showMap({ layer: 'nebula', nebulaId: 'algebra' })
    expect(screen.getByRole('heading', { level: 1, name: 'Algebra' })).toBeInTheDocument()
    const units = starLinks(container).map((link) => link.dataset.unit)
    expect(units.filter((unit) => ['u-4', 'u-5', 'u-6'].includes(unit!))).toEqual(['u-4', 'u-5', 'u-6'])
    const order = ['u-1', 'u-2', 'u-3', 'u-4', 'u-5', 'u-6', 'u-7', 'u-8', 'u-9', 'u-10']
    expect([...units].sort((a, b) => order.indexOf(a!) - order.indexOf(b!))).toEqual(units)
  })
})

describe('the star layer is HTML', () => {
  it('shows state, progress, markers, skills and the way into the chapter', () => {
    const { container } = showMap({ layer: 'star', nebulaId: 'numbers', unitId: 'u-3' })
    expect(starLinks(container)).toHaveLength(0)
    const card = screen.getByRole('article', { name: 'Decimals' })
    expect(within(card).getByText('Numbers · In progress')).toBeInTheDocument()
    expect(within(card).getByRole('progressbar', { name: '3 of 5 lessons done' })).toHaveAttribute('aria-valuenow', '60')
    expect(within(card).getByText('Suggested next')).toBeInTheDocument()
    expect(within(card).getByText('Rounding, lit')).toBeInTheDocument()
    expect(within(card).getByText('Comparing decimals, not lit yet')).toBeInTheDocument()
    expect(within(card).getByRole('link', { name: 'Continue' })).toHaveAttribute('href', '/chapter/u-3')
  })

  it('says what is still missing when every lesson is done but the star is not lit', () => {
    showMap({ layer: 'star', nebulaId: 'algebra', unitId: 'u-5' })
    expect(screen.getByText('All lessons done: 2 exercises still to get right')).toBeInTheDocument()
  })

  it('lists a locked star’s prerequisites instead of a chapter link', () => {
    showMap({ layer: 'star', nebulaId: 'geometry', unitId: 'u-8' })
    const card = screen.getByRole('article', { name: 'Triangles' })
    expect(within(card).getByRole('link', { name: 'Angles' })).toHaveAttribute('href', '/map/math/geometry/u-7')
    expect(within(card).queryByRole('link', { name: /Start|Continue|Open chapter/ })).toBeNull()
  })

  it('shows the review count', () => {
    showMap({ layer: 'star', nebulaId: 'numbers', unitId: 'u-2' })
    expect(screen.getByText('3 cards due for review')).toBeInTheDocument()
  })
})

describe('the canvas pixel ratio', () => {
  it('is capped at 2 and follows the screen when it changes', () => {
    const listeners: (() => void)[] = []
    vi.spyOn(window, 'matchMedia').mockImplementation(
      (query: string) =>
        ({
          matches: false,
          media: query,
          addEventListener: (_: string, listener: () => void) => listeners.push(listener),
          removeEventListener: vi.fn(),
          addListener: vi.fn(),
          removeListener: vi.fn(),
          dispatchEvent: vi.fn(),
        }) as unknown as MediaQueryList,
    )
    const ratio = vi.spyOn(window, 'devicePixelRatio', 'get').mockReturnValue(3)
    const { renderer } = showMap()
    expect(renderer.ratios[renderer.ratios.length - 1]).toBe(2)
    ratio.mockReturnValue(1)
    act(() => listeners.forEach((listener) => listener()))
    expect(renderer.ratios[renderer.ratios.length - 1]).toBe(1)
  })
})

describe('the subject switcher (#72 point 7)', () => {
  it('shows one map at a time and links to the others', () => {
    showMap()
    const switcher = screen.getByRole('navigation', { name: 'Subjects' })
    expect(within(switcher).getByRole('link', { name: 'Mathematics' })).toHaveAttribute('aria-current', 'page')
    expect(within(switcher).getByRole('link', { name: 'Physics' })).toHaveAttribute('href', '/map/physics')
  })
})

describe('reduced motion on the page', () => {
  it('asks for no animation frames once the map is drawn', () => {
    vi.spyOn(window, 'matchMedia').mockImplementation(
      (query: string) =>
        ({
          matches: query.includes('prefers-reduced-motion'),
          media: query,
          onchange: null,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          addListener: vi.fn(),
          removeListener: vi.fn(),
          dispatchEvent: vi.fn(),
        }) as unknown as MediaQueryList,
    )
    const { clock, renderer } = showMap()
    act(() => clock.advance(5000))
    expect(renderer.frames).toHaveLength(1)
    expect(clock.pending).toBe(0)
  })
})
