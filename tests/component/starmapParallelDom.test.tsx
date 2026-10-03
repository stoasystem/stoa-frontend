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
import { nebulaFocusSpot, NEBULA_FOCUS_HEIGHT } from '@/features/starmap/view/layers'
import type { FixtureSize } from '@/features/starmap/fixtures/demoSky'
import { orderedStars, type StarMap } from '@/features/starmap/model/starMap'
import type { LayerTarget } from '@/features/starmap/view/layers'
import i18n from '@/i18n'
import { fakeClock, recordingRenderer, skyMap } from './starmapHarness'

function showMap(target: LayerTarget = { layer: 'map' }, size: FixtureSize = 10, map: StarMap = skyMap(size)) {
  const clock = fakeClock()
  const renderer = recordingRenderer()
  const onNavigate = vi.fn()
  const view = render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <div data-surface="sky" className="flex">
          <StarMapView map={map} target={target} onNavigate={onNavigate} scheduler={clock} createRendererFor={() => renderer} />
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

/** The ten-star sky with its prerequisites, so the lines (and what they say) are there. */
const sky10 = (subjectId = 'math') => skyMap(10, subjectId, { relations: true })

describe('the parallel DOM', () => {
  it('hides the canvas from assistive technology', () => {
    const { container } = showMap()
    expect(container.querySelector('canvas')).toHaveAttribute('aria-hidden', 'true')
  })

  it('gives every star on screen a link, in nebula order, then unit order', () => {
    const map = sky10()
    const { container } = showMap({ layer: 'map' }, 10, map)
    const units = starLinks(container).map((link) => link.dataset.unit)
    // The galaxy in focus, whole, in order: numbers, algebra, trigonometry...
    expect(units.slice(0, 4)).toEqual(['numbers-1', 'algebra-1', 'demo-sine-cosine', 'trigonometry-2'])
    // ...and whatever else of the sky is on screen, still in the sky's order.
    const order = orderedStars(map).map((star) => star.unitId)
    expect([...units].sort((p, q) => order.indexOf(p!) - order.indexOf(q!))).toEqual(units)
  })

  it('reads out name, learning state, progress and markers', () => {
    showMap({ layer: 'map' }, 10, sky10())
    const nav = screen.getByRole('navigation', { name: 'Star map: Mathematics' })
    const star = (name: string) => within(nav).getByRole('link', { name: new RegExp(`^${name},`) })
    expect(star('Sine and cosine')).toHaveAccessibleName('Sine and cosine, In progress, 33% of lessons done, Suggested next')
    expect(star('Integers')).toHaveAccessibleName('Integers, Lit, 100% of lessons done, 4 cards due for review')
    expect(star('Tangent')).toHaveAccessibleName('Tangent, Locked, 0% of lessons done')
    expect(star('Terms and expressions')).toHaveAccessibleName('Terms and expressions, Ready to start, 0% of lessons done')
  })

  it('links every star to its route under /map, under its own galaxy', () => {
    showMap({ layer: 'map' }, 10, sky10())
    expect(screen.getByRole('link', { name: /^Terms and expressions,/ })).toHaveAttribute('href', '/map/math/algebra/algebra-1')
    // One sky: a physics nebula is a link under physics, whichever galaxy the map opened on.
    expect(screen.getByRole('link', { name: /^Optics,/ })).toHaveAttribute('href', '/map/physics/optics')
  })

  it('opens the star layer when a star link is activated', () => {
    const { onNavigate } = showMap({ layer: 'map' }, 10, sky10())
    fireEvent.click(screen.getByRole('link', { name: /^Terms and expressions,/ }))
    expect(onNavigate).toHaveBeenCalledWith({ layer: 'star', nebulaId: 'algebra', unitId: 'algebra-1' })
  })

  it('offers each nebula as a link too, in the reader’s language', async () => {
    await i18n.changeLanguage('de')
    showMap({ layer: 'map' }, 10, sky10())
    expect(screen.getByRole('link', { name: 'Algebra, 0 von 1 leuchten, verbunden mit Numbers' })).toHaveAttribute('href', '/map/math/algebra')
    // The star's name is content from the backend; the rest is ours.
    expect(screen.getByRole('link', { name: 'Sine and cosine, In Arbeit, 33 % der Lektionen erledigt, Als Nächstes empfohlen' })).toBeInTheDocument()
  })

  it('says which nebulae each one is linked to, since the lines carry meaning -- across galaxies too', () => {
    showMap({ layer: 'map' }, 10, sky10())
    expect(screen.getByRole('link', { name: 'Numbers, 1 of 1 lit, related to Algebra' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Trigonometry, 0 of 2 lit, related to Optics' })).toBeInTheDocument()
  })

  it('on the whole map, Tab goes nebula by nebula and to the recommended stars; the other stars are read, not tabbed through', () => {
    const map = sky10()
    const { container } = showMap({ layer: 'map' }, 10, map)
    const recommended = new Set(map.stars.filter((star) => star.recommendation).map((star) => star.unitId))
    for (const link of starLinks(container)) {
      if (recommended.has(link.dataset.unit!)) expect(link).not.toHaveAttribute('tabindex')
      else expect(link).toHaveAttribute('tabindex', '-1')
    }
    const nav = screen.getByRole('navigation', { name: 'Star map: Mathematics' })
    const tabbable = within(nav).getAllByRole('link').filter((link) => link.getAttribute('tabindex') !== '-1')
    const hrefs = tabbable.map((link) => link.getAttribute('href'))
    // Every nebula of the sky, in band order, each under its own galaxy.
    expect(hrefs.filter((href) => href!.split('/').length === 4)).toEqual([
      '/map/math/numbers',
      '/map/math/algebra',
      '/map/math/trigonometry',
      '/map/physics/mechanics',
      '/map/physics/optics',
      '/map/chemistry/atoms',
      '/map/chemistry/reactions',
    ])
    // The recommended star of the galaxy in focus, right after its nebula.
    expect(hrefs.indexOf('/map/math/trigonometry/demo-sine-cosine')).toBe(hrefs.indexOf('/map/math/trigonometry') + 1)
  })

  it('moves the focus pill with its nebula when focusing pans the map (normal motion, nothing breathing)', () => {
    // No recommended star, so no breathing frame can come along later and
    // mask a stale last frame of the pan.
    const quiet: StarMap = { ...sky10(), stars: sky10().stars.map((star) => ({ ...star, recommendation: null })) }
    const { clock, renderer, container } = showMap({ layer: 'nebula', nebulaId: 'algebra' }, 10, quiet)
    const link = container.querySelector<HTMLAnchorElement>('a[data-nebula-link="trigonometry"]')!
    act(() => {
      link.focus()
      clock.advance(600)
    })
    const frame = renderer.last()
    const n = 2 // trigonometry, in nebula order
    expect(frame.highlightNebula).toBe(n)
    // The pill is where nebulaFocusSpot puts it for the nebula as drawn now, not before the pan.
    const expected = nebulaFocusSpot(
      { x: frame.nebulaX[n], y: frame.nebulaY[n], r: frame.nebulaR[n] },
      { width: 1280, height: 776 },
      controlBands(true),
    )
    expect(Math.abs(Number(link.dataset.focusTop) - expected.y)).toBeLessThan(1)
    const pill = /translate\(([-\d.]+)px, ([-\d.]+)px\)/.exec(link.style.transform)!
    expect(Math.abs(Number(pill[1]) - expected.x)).toBeLessThan(1)
    // ...and that spot is by the nebula: at most a pill's height beyond its disc, horizontally over it.
    expect(Math.abs(expected.x - frame.nebulaX[n])).toBeLessThan(Math.max(frame.nebulaR[n], 1))
    // And every star link sits on its star as drawn now.
    for (const star of starLinks(container)) {
      const index = Number(star.dataset.index)
      const size = Number.parseFloat(star.style.width)
      const match = /translate\(([-\d.]+)px, ([-\d.]+)px\)/.exec(star.style.transform)!
      expect(Math.abs(Number(match[1]) + size / 2 - frame.x[index])).toBeLessThan(1)
      expect(Math.abs(Number(match[2]) + size / 2 - frame.y[index])).toBeLessThan(1)
    }
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
    const { container } = showMap({ layer: 'nebula', nebulaId: 'trigonometry' }, 10, sky10())
    const tabbable = starLinks(container).filter((link) => link.getAttribute('tabindex') !== '-1').map((link) => link.dataset.unit)
    expect(tabbable.filter((unit) => !unit!.startsWith('mechanics'))).toEqual(['demo-sine-cosine', 'trigonometry-2'])
  })

  it('lists every star on screen, blurred or sharp, on a 500-star map', () => {
    const { container, renderer } = showMap({ layer: 'map' }, 500)
    const frame = renderer.last()
    const onScreen = frame.x.filter((x, i) => x >= -8 && frame.y[i] >= -8 && x <= 1288 && frame.y[i] <= 784).length
    const links = starLinks(container)
    expect(links).toHaveLength(onScreen)
    expect(onScreen).toBeGreaterThan(150)
  })

  it('in a nebula, keeps the nebula order and names the nebula as the heading', () => {
    const map = sky10()
    const { container } = showMap({ layer: 'nebula', nebulaId: 'trigonometry' }, 10, map)
    expect(screen.getByRole('heading', { level: 1, name: 'Trigonometry' })).toBeInTheDocument()
    const units = starLinks(container).map((link) => link.dataset.unit)
    expect(units.filter((unit) => unit!.startsWith('demo-sine') || unit!.startsWith('trigonometry'))).toEqual(['demo-sine-cosine', 'trigonometry-2'])
    const order = orderedStars(map).map((star) => star.unitId)
    expect([...units].sort((p, q) => order.indexOf(p!) - order.indexOf(q!))).toEqual(units)
  })
})

describe('the star layer is HTML', () => {
  it('shows state, progress, markers, skills and the way into the chapter', () => {
    const { container } = showMap({ layer: 'star', nebulaId: 'trigonometry', unitId: 'demo-sine-cosine' }, 10, sky10())
    expect(starLinks(container)).toHaveLength(0)
    const card = screen.getByRole('article', { name: 'Sine and cosine' })
    expect(within(card).getByText('Trigonometry · In progress')).toBeInTheDocument()
    expect(within(card).getByRole('progressbar', { name: '1 of 3 lessons done' })).toHaveAttribute('aria-valuenow', '33')
    expect(within(card).getByText('Suggested next')).toBeInTheDocument()
    expect(within(card).getByText('Opposite and adjacent sides, lit')).toBeInTheDocument()
    expect(within(card).getByText('Sine as a ratio, not lit yet')).toBeInTheDocument()
    expect(within(card).getByRole('link', { name: 'Continue' })).toHaveAttribute('href', '/chapter/demo-sine-cosine')
  })

  it('says what is still missing when every lesson is done but the star is not lit', () => {
    const map = sky10()
    const done: StarMap = {
      ...map,
      stars: map.stars.map((star) =>
        star.unitId === 'demo-sine-cosine' ? { ...star, progress: 1, unmetExercises: 2, chapter: { ...star.chapter, lessonsDone: star.chapter.lessonCount } } : star,
      ),
    }
    showMap({ layer: 'star', nebulaId: 'trigonometry', unitId: 'demo-sine-cosine' }, 10, done)
    expect(screen.getByText('All lessons done: 2 exercises still to get right')).toBeInTheDocument()
  })

  it('lists a locked star’s prerequisites instead of a chapter link, across galaxies too', () => {
    showMap({ layer: 'star', nebulaId: 'optics', unitId: 'demo-refraction' }, 10, sky10('physics'))
    const card = screen.getByRole('article', { name: 'Refraction' })
    expect(within(card).getByRole('link', { name: 'Sine and cosine' })).toHaveAttribute('href', '/map/math/trigonometry/demo-sine-cosine')
    expect(within(card).queryByRole('link', { name: /Start|Continue|Open chapter/ })).toBeNull()
  })

  it('shows the review count', () => {
    showMap({ layer: 'star', nebulaId: 'numbers', unitId: 'numbers-1' }, 10, sky10())
    expect(screen.getByText('4 cards due for review')).toBeInTheDocument()
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
  it('names the galaxy in focus and links to the others, which the map flies to', () => {
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
