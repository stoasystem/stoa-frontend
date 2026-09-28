/**
 * The planet's parallel DOM (#11 point 5, #47): the canvas is hidden from
 * assistive technology, and every point on screen is a link that reads out
 * its name, learning state, progress and markers, in the order region first,
 * then (topic.order, unit.order). The point layer is plain HTML.
 */
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PlanetView } from '@/features/planet/components/PlanetView'
import { planetFixture } from '@/features/planet/fixtures/planetFixtures'
import type { LayerTarget } from '@/features/planet/geo/zoom'
import i18n from '@/i18n'
import { fakeClock, recordingRenderer } from './planetHarness'

const map = planetFixture(10)

function showPlanet(target: LayerTarget = { layer: 'planet' }) {
  const clock = fakeClock()
  const renderer = recordingRenderer()
  const onNavigate = vi.fn()
  const view = render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <div data-surface="sky" className="flex">
          <PlanetView map={map} target={target} onNavigate={onNavigate} scheduler={clock} createRendererFor={() => renderer} />
        </div>
      </MemoryRouter>
    </I18nextProvider>,
  )
  act(() => clock.advance(20))
  return { clock, renderer, onNavigate, ...view }
}

function pointLinks(container: HTMLElement) {
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
    const { container } = showPlanet()
    expect(container.querySelector('canvas')).toHaveAttribute('aria-hidden', 'true')
  })

  it('gives every point on screen a link, in region order, then unit order', () => {
    const { container } = showPlanet()
    // The planet opens facing the recommended point's region; all ten points
    // of the small fixture sit on that hemisphere.
    expect(pointLinks(container).map((link) => link.dataset.unit)).toEqual([
      'u-1', 'u-2', 'u-3', // numbers (topic order 1)
      'u-4', 'u-5', 'u-6', // algebra (2)
      'u-7', 'u-8', // geometry (3)
      'u-9', 'u-10', // data (4)
    ])
  })

  it('reads out name, learning state, progress and markers', () => {
    showPlanet()
    const nav = screen.getByRole('navigation', { name: 'Knowledge planet: Mathematics' })
    const name = (unit: string) => within(nav).getByRole('link', { name: new RegExp(`^${unit},`) })
    expect(name('Decimals')).toHaveAccessibleName('Decimals, In progress, 60% of lessons done, Suggested next')
    expect(name('Fractions')).toHaveAccessibleName('Fractions, Lit, 100% of lessons done, 3 cards due for review')
    expect(name('Triangles')).toHaveAccessibleName('Triangles, Locked, 0% of lessons done')
    expect(name('Angles')).toHaveAccessibleName('Angles, Ready to start, 0% of lessons done')
  })

  it('links every point to its knowledge point route', () => {
    showPlanet()
    expect(screen.getByRole('link', { name: /^Linear equations,/ })).toHaveAttribute('href', '/planet/math/algebra/u-5')
  })

  it('opens the point layer when a point link is activated', () => {
    const { onNavigate } = showPlanet()
    fireEvent.click(screen.getByRole('link', { name: /^Angles,/ }))
    expect(onNavigate).toHaveBeenCalledWith({ layer: 'point', regionId: 'geometry', pointId: 'u-7' })
  })

  it('offers each region as a link too, and reads it in the reader’s language', async () => {
    await i18n.changeLanguage('de')
    showPlanet()
    expect(screen.getByRole('link', { name: 'Algebra, 1 von 3 leuchten' })).toHaveAttribute('href', '/planet/math/algebra')
    // The point's name is content from the backend; the rest is ours.
    expect(screen.getByRole('link', { name: 'Decimals, In Arbeit, 60 % der Lektionen erledigt, Als Nächstes empfohlen' })).toBeInTheDocument()
  })

  it('in a region, keeps the region order and names the region as the heading', () => {
    const { container } = showPlanet({ layer: 'region', regionId: 'algebra' })
    expect(screen.getByRole('heading', { level: 1, name: 'Algebra' })).toBeInTheDocument()
    const units = pointLinks(container).map((link) => link.dataset.unit)
    const algebra = units.filter((unit) => ['u-4', 'u-5', 'u-6'].includes(unit!))
    expect(algebra).toEqual(['u-4', 'u-5', 'u-6'])
    // Whatever else is on screen follows the region order around it.
    const order = ['u-1', 'u-2', 'u-3', 'u-4', 'u-5', 'u-6', 'u-7', 'u-8', 'u-9', 'u-10']
    expect([...units].sort((a, b) => order.indexOf(a!) - order.indexOf(b!))).toEqual(units)
  })

  it('shows the point layer as HTML: state, progress, markers and the way into the chapter', () => {
    const { container } = showPlanet({ layer: 'point', regionId: 'numbers', pointId: 'u-3' })
    expect(pointLinks(container)).toHaveLength(0)
    const card = screen.getByRole('article', { name: 'Decimals' })
    expect(within(card).getByText('Numbers · In progress')).toBeInTheDocument()
    expect(within(card).getByRole('progressbar', { name: '3 of 5 lessons done' })).toHaveAttribute('aria-valuenow', '60')
    expect(within(card).getByText('Suggested next')).toBeInTheDocument()
    expect(within(card).getByText('Rounding, lit')).toBeInTheDocument()
    expect(within(card).getByText('Comparing decimals, not lit yet')).toBeInTheDocument()
    expect(within(card).getByRole('link', { name: 'Continue' })).toHaveAttribute('href', '/chapter/u-3')
  })

  it('says what is still missing when every lesson is done but the point is not lit', () => {
    showPlanet({ layer: 'point', regionId: 'algebra', pointId: 'u-5' })
    expect(screen.getByText('All lessons done: 2 exercises still to get right')).toBeInTheDocument()
  })

  it('lists a locked point’s prerequisites instead of a chapter link', () => {
    showPlanet({ layer: 'point', regionId: 'geometry', pointId: 'u-8' })
    const card = screen.getByRole('article', { name: 'Triangles' })
    expect(within(card).getByRole('link', { name: 'Angles' })).toHaveAttribute('href', '/planet/math/geometry/u-7')
    expect(within(card).queryByRole('link', { name: /Start|Continue|Open chapter/ })).toBeNull()
  })

  it('shows a review marker count on the point layer', () => {
    showPlanet({ layer: 'point', regionId: 'numbers', pointId: 'u-2' })
    expect(screen.getByText('3 cards due for review')).toBeInTheDocument()
  })
})

describe('reduced motion on the page', () => {
  it('asks for no animation frames once the planet is drawn', () => {
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
    const { clock, renderer } = showPlanet()
    act(() => clock.advance(5000))
    expect(renderer.frames).toHaveLength(1)
    expect(clock.pending).toBe(0)
  })
})
