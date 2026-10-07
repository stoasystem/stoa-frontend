/**
 * The star map's two keyboard orders (#141, #123 E5), one rule each: the
 * arrow keys go by where things are on the map -- left and right along the
 * ring between nebulae, otherwise to the nearest star or nebula in that
 * direction -- and Tab goes by the course: galaxy, then nebula, then star.
 * The legend says both: starmapLegend.test.tsx.
 */
import { act, fireEvent, render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { StarMapView } from '@/features/starmap/components/StarMapView'
import { orderedNebulae, orderedStars, type Star, type StarMap } from '@/features/starmap/model/starMap'
import { nearestCopy } from '@/features/starmap/view/camera'
import { nebulaDiscs } from '@/features/starmap/view/geometry'
import { arrowDirection, courseNebulae, nearestInDirection, type ArrowDirection } from '@/features/starmap/view/keyboardOrder'
import type { LayerTarget } from '@/features/starmap/view/layers'
import { KEYS } from '@/features/starmap/view/semanticZoom'
import { SKY_WRAP } from '@/features/starmap/view/sky'
import i18n from '@/i18n'
import { fakeClock, recordingRenderer, skyMap } from './starmapHarness'

const KEY: Record<ArrowDirection, string> = { left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp', down: 'ArrowDown' }
const DIRECTIONS: ArrowDirection[] = ['left', 'right', 'up', 'down']

/** How far `to` lies ahead of `from` in `direction`, map units (x the shorter way round on a ring). */
function ahead(from: { x: number; y: number }, to: { x: number; y: number }, direction: ArrowDirection, wrap = 0): number {
  const dx = nearestCopy(to.x, from.x, wrap) - from.x
  const dy = to.y - from.y
  return direction === 'right' ? dx : direction === 'left' ? -dx : direction === 'down' ? dy : -dy
}

/** The cone alone (#141): the index `nearestInDirection` picked before the fallback (#146), or -1. */
function inCone(points: readonly { x: number; y: number }[], from: number, direction: ArrowDirection, wrap = 0): number {
  let best = -1
  let bestScore = Infinity
  points.forEach((point, i) => {
    if (i === from) return
    const a = ahead(points[from], point, direction, wrap)
    const dx = nearestCopy(point.x, points[from].x, wrap) - points[from].x
    const aside = Math.abs(direction === 'left' || direction === 'right' ? point.y - points[from].y : dx)
    if (!(a > KEYS.minAhead) || aside > a * KEYS.coneSlope) return
    const score = a + aside * KEYS.offAxisWeight
    if (score < bestScore) {
      best = i
      bestScore = score
    }
  })
  return best
}

/** The nearest point anywhere ahead in `direction`, by straight distance (the fallback, #146), or -1. */
function nearestAhead(points: readonly { x: number; y: number }[], from: number, direction: ArrowDirection, wrap = 0): number {
  let best = -1
  let bestDistance = Infinity
  points.forEach((point, i) => {
    if (i === from || !(ahead(points[from], point, direction, wrap) > KEYS.minAhead)) return
    const distance = Math.hypot(nearestCopy(point.x, points[from].x, wrap) - points[from].x, point.y - points[from].y)
    if (distance < bestDistance) {
      best = i
      bestDistance = distance
    }
  })
  return best
}

describe('arrows by position: the arithmetic', () => {
  // A plus sign round the middle point, with a far point straight right and a near one off to the side.
  const points = [
    { x: 0.5, y: 0.5 }, // 0 middle
    { x: 0.6, y: 0.5 }, // 1 right
    { x: 0.4, y: 0.5 }, // 2 left
    { x: 0.5, y: 0.4 }, // 3 up (y grows downwards)
    { x: 0.5, y: 0.62 }, // 4 down
    { x: 0.56, y: 0.44 }, // 5 up and to the right, nearer than 1 but off the axis
  ]

  it('maps the arrow keys and nothing else', () => {
    expect(arrowDirection('ArrowLeft')).toBe('left')
    expect(arrowDirection('ArrowRight')).toBe('right')
    expect(arrowDirection('ArrowUp')).toBe('up')
    expect(arrowDirection('ArrowDown')).toBe('down')
    expect(arrowDirection('Tab')).toBeNull()
    expect(arrowDirection('+')).toBeNull()
  })

  it('goes to the nearest point in each direction, straight ahead before off to the side', () => {
    expect(nearestInDirection(points, 0, 'right')).toBe(1)
    expect(nearestInDirection(points, 0, 'left')).toBe(2)
    expect(nearestInDirection(points, 0, 'up')).toBe(3)
    expect(nearestInDirection(points, 0, 'down')).toBe(4)
  })

  it('stays put (-1) when nothing lies that way', () => {
    expect(nearestInDirection(points, 1, 'right')).toBe(-1)
    expect(nearestInDirection(points, 3, 'up')).toBe(-1)
    expect(nearestInDirection(points, 9, 'up')).toBe(-1)
    // Level with the start is not ahead of it.
    expect(nearestInDirection([{ x: 0, y: 0 }, { x: 0.3, y: 0 }], 0, 'down')).toBe(-1)
  })

  it('prefers a point inside the cone to a nearer one outside it', () => {
    // Far to the side and barely below loses to one straight below, however much further.
    expect(nearestInDirection([{ x: 0, y: 0 }, { x: 0.5, y: 0.01 }, { x: 0.01, y: 0.9 }], 0, 'down')).toBe(2)
    expect(nearestInDirection([{ x: 0, y: 0 }, { x: 0.01, y: 0.5 }], 0, 'down')).toBe(1)
  })

  it('falls back to the nearest point anywhere that way when the cone is empty (#146 C17)', () => {
    // Only off to the side and barely below: still "down", the nearer of the two.
    expect(nearestInDirection([{ x: 0, y: 0 }, { x: 0.5, y: 0.01 }], 0, 'down')).toBe(1)
    expect(nearestInDirection([{ x: 0, y: 0 }, { x: 0.9, y: 0.02 }, { x: -0.4, y: 0.05 }], 0, 'down')).toBe(2)
    // Left and right the same.
    expect(nearestInDirection([{ x: 0, y: 0 }, { x: 0.02, y: 0.7 }, { x: 0.01, y: -0.3 }], 0, 'right')).toBe(2)
    // Behind or level is never that way: it stays.
    expect(nearestInDirection([{ x: 0, y: 0 }, { x: 0.5, y: -0.01 }, { x: 0.5, y: 0 }], 0, 'down')).toBe(-1)
    // On a ring the shorter way counts for the fallback too.
    expect(nearestInDirection([{ x: 0.98, y: 0.5 }, { x: 0.5, y: 0.52 }, { x: 0.1, y: 0.53 }], 0, 'down', 1)).toBe(2)
  })

  it('measures across the seam the shorter way, so the ring has no end', () => {
    const ring = [{ x: 0.97, y: 0.5 }, { x: 0.03, y: 0.5 }, { x: 0.5, y: 0.5 }, { x: 0.02, y: 0.4 }]
    // Right from just before the seam: the point just after it, not back across the band.
    expect(nearestInDirection(ring, 0, 'right', 1)).toBe(1)
    expect(nearestInDirection(ring, 1, 'left', 1)).toBe(0)
    // Up from just before the seam: the point above, on the other side of it.
    expect(nearestInDirection(ring, 0, 'up', 1)).toBe(3)
    // Without a ring there is an end.
    expect(nearestInDirection(ring, 0, 'right')).toBe(-1)
  })

  it('puts the nebulae in course order: galaxy first, then topic order, keeping the engine index', () => {
    const nebulae = [
      { topicId: 'p1', order: 0, subjectId: 'physics' },
      { topicId: 'm2', order: 2, subjectId: 'math' },
      { topicId: 'm1', order: 1, subjectId: 'math' },
      { topicId: 'x', order: -1, subjectId: 'unknown' },
      { topicId: 'own', order: 5 },
    ]
    const subjects = [{ subjectId: 'math' }, { subjectId: 'physics' }]
    const course = courseNebulae(nebulae, subjects, 'math')
    expect(course.map((entry) => entry.nebula.topicId)).toEqual(['m1', 'm2', 'own', 'p1', 'x'])
    expect(course.map((entry) => entry.index)).toEqual([2, 1, 4, 0, 3])
  })
})

describe('the keyboard on the map (#141)', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      x: 0, y: 0, left: 0, top: 0, width: 1280, height: 776, right: 1280, bottom: 776, toJSON: () => ({}),
    } as DOMRect)
  })
  afterEach(() => vi.restoreAllMocks())

  function show(map: StarMap, target: LayerTarget = { layer: 'map' }) {
    const clock = fakeClock()
    const renderer = recordingRenderer()
    const navigate = vi.fn()
    const view = render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <div data-surface="sky" className="flex">
            <StarMapView map={map} target={target} onNavigate={navigate} scheduler={clock} createRendererFor={() => renderer} />
          </div>
        </MemoryRouter>
      </I18nextProvider>,
    )
    act(() => clock.advance(20))
    const nebulaLink = (id: string) => view.container.querySelector<HTMLAnchorElement>(`a[data-nebula-link="${id}"]`)!
    const press = (element: HTMLElement, key: string) =>
      act(() => {
        fireEvent.keyDown(element, { key })
        clock.advance(1000)
      })
    return { clock, renderer, navigate, nebulaLink, press, ...view }
  }

  /** The biggest nebula of a galaxy and its stars, in course order. */
  function bigNebula(map: StarMap, subjectId = 'math') {
    const stars = orderedStars(map)
    const ids = orderedNebulae(map).filter((n) => n.subjectId === subjectId).map((n) => n.topicId)
    const size = (id: string) => stars.filter((s) => s.nebulaId === id).length
    const id = ids.sort((a, b) => size(b) - size(a))[0]
    return { id, stars: stars.filter((s) => s.nebulaId === id) }
  }

  it('Tab goes in course order: galaxy by galaxy, nebula by nebula, star by star', () => {
    const map = skyMap(1000, 'chemistry')
    // Shuffle the topic order across galaxies: the galaxy still comes first.
    const shuffled: StarMap = { ...map, nebulae: map.nebulae.map((n) => (n.subjectId === 'physics' ? { ...n, order: -100 + n.order } : n)) }
    const { container } = show(shuffled)
    const tabbable = [...container.querySelectorAll<HTMLAnchorElement>('a[data-nebula-link], a[data-unit]')].filter((a) => a.tabIndex >= 0)
    const nebulaIds = tabbable.filter((a) => a.dataset.nebulaLink).map((a) => a.dataset.nebulaLink)
    const rank = new Map(map.subjects.map((s, i) => [s.subjectId, i]))
    const expected = [...shuffled.nebulae].sort((a, b) => rank.get(a.subjectId!)! - rank.get(b.subjectId!)! || a.order - b.order).map((n) => n.topicId)
    expect(nebulaIds).toEqual(expected)
    // Physics' nebulae come after all of math's, whatever their topic order says.
    const subjectOf = new Map(map.nebulae.map((n) => [n.topicId, n.subjectId]))
    expect(nebulaIds.map((id) => subjectOf.get(id!))).toEqual(
      map.subjects.flatMap((s) => map.nebulae.filter((n) => n.subjectId === s.subjectId).map(() => s.subjectId)),
    )
    // A star's link comes right after its own nebula's (the recommended star is the Tab stop far out).
    let nebula = ''
    for (const link of tabbable) {
      if (link.dataset.nebulaLink) nebula = link.dataset.nebulaLink
      else expect(map.stars.find((s) => s.unitId === link.dataset.unit)!.nebulaId).toBe(nebula)
    }
  })

  it('Tab walks a chosen nebula star by star in course order', async () => {
    const map = skyMap(1000, 'math')
    const { id, stars } = bigNebula(map)
    const { container } = show(map, { layer: 'nebula', nebulaId: id })
    const links = [...container.querySelectorAll<HTMLAnchorElement>(`li[data-nebula="${id}"] a[data-unit]`)]
    expect(links.length).toBeGreaterThan(3)
    const order = new Map(stars.map((s, i) => [s.unitId, i]))
    const positions = links.map((a) => order.get(a.dataset.unit!)!)
    expect(positions).toEqual([...positions].sort((a, b) => a - b))
    const user = userEvent.setup()
    act(() => links[0].focus())
    for (let k = 1; k < 4; k += 1) {
      await user.tab()
      expect(document.activeElement).toBe(links[k])
    }
  })

  it('left and right go along the ring between nebulae, round the seam', () => {
    const map = skyMap(1000, 'chemistry')
    const { nebulaLink, press } = show(map)
    const discs = nebulaDiscs(map)
    const along = orderedNebulae(map).map((n) => n.topicId).sort((a, b) => discs.get(a)!.x - discs.get(b)!.x)
    const last = along[along.length - 1]
    act(() => nebulaLink(last).focus())
    press(nebulaLink(last), 'ArrowRight')
    expect(document.activeElement).toBe(nebulaLink(along[0]))
    press(nebulaLink(along[0]), 'ArrowLeft')
    expect(document.activeElement).toBe(nebulaLink(last))
  })

  it('up and down go to the nearest nebula above or below, the shorter way round the ring', () => {
    const map = skyMap(1000, 'chemistry')
    const { nebulaLink } = show(map)
    const discs = nebulaDiscs(map)
    let moved = 0
    for (const nebula of orderedNebulae(map)) {
      for (const direction of ['up', 'down'] as const) {
        const from = nebulaLink(nebula.topicId)
        act(() => from.focus())
        const event = new KeyboardEvent('keydown', { key: KEY[direction], bubbles: true, cancelable: true })
        act(() => {
          from.dispatchEvent(event)
        })
        // The arrow belongs to the map: the page never scrolls.
        expect(event.defaultPrevented).toBe(true)
        const to = (document.activeElement as HTMLElement).dataset.nebulaLink!
        expect(to).toBeDefined()
        if (to === nebula.topicId) continue
        moved += 1
        const a = discs.get(nebula.topicId)!
        const b = discs.get(to)!
        expect(ahead(a, b, direction, SKY_WRAP)).toBeGreaterThan(0)
        // Nothing else that way is nearer by the same measure.
        const all = orderedNebulae(map).map((n) => discs.get(n.topicId)!)
        const expected = nearestInDirection(all, orderedNebulae(map).indexOf(nebula), direction, SKY_WRAP)
        expect(to).toBe(orderedNebulae(map)[expected].topicId)
      }
    }
    expect(moved).toBeGreaterThan(4)
  })

  it('up and down between nebulae fall back to the nearest one that way when the cone is empty (#146 C17)', () => {
    const map = skyMap(1000, 'chemistry')
    const { nebulaLink, press } = show(map)
    const discs = nebulaDiscs(map)
    const nebulae = orderedNebulae(map)
    const spots = nebulae.map((n) => discs.get(n.topicId)!)
    let fellBack = 0
    for (const [i, nebula] of nebulae.entries()) {
      for (const direction of ['up', 'down'] as const) {
        if (inCone(spots, i, direction, SKY_WRAP) >= 0) continue
        const expected = nearestAhead(spots, i, direction, SKY_WRAP)
        const from = nebulaLink(nebula.topicId)
        act(() => from.focus())
        press(from, KEY[direction])
        const to = (document.activeElement as HTMLElement).dataset.nebulaLink
        if (expected < 0) {
          // Nothing at all that way: it stays.
          expect(to).toBe(nebula.topicId)
          continue
        }
        expect(to).toBe(nebulae[expected].topicId)
        expect(ahead(spots[i], spots[expected], direction, SKY_WRAP)).toBeGreaterThan(0)
        fellBack += 1
      }
    }
    // The band has such nebulae: before #146 these arrows did nothing.
    expect(fellBack).toBeGreaterThan(0)
  })

  it('arrows on a star fall back to the nearest star of its nebula that way when the cone is empty (#146 C17)', () => {
    const map = skyMap(1000, 'math')
    const stars = orderedStars(map)
    // A star whose cone is empty one way while some star of its nebula still lies that way.
    const cases: { star: Star; direction: ArrowDirection; expected: Star }[] = []
    for (const nebula of orderedNebulae(map)) {
      const inNebula = stars.filter((s) => s.nebulaId === nebula.topicId)
      inNebula.forEach((star, i) => {
        for (const direction of DIRECTIONS) {
          const expected = nearestAhead(inNebula, i, direction)
          if (inCone(inNebula, i, direction) < 0 && expected >= 0) cases.push({ star, direction, expected: inNebula[expected] })
        }
      })
    }
    expect(cases.length).toBeGreaterThan(0)
    // The star layer: the arrow flies to it.
    for (const { star, direction, expected } of cases.slice(0, 6)) {
      const { container, navigate, unmount } = show(map, { layer: 'star', nebulaId: star.nebulaId, unitId: star.unitId })
      const link = container.querySelector<HTMLElement>('article[aria-labelledby="starmap-star-title"] a')!
      act(() => link.focus())
      fireEvent.keyDown(link, { key: KEY[direction] })
      expect(navigate).toHaveBeenLastCalledWith({ layer: 'star', nebulaId: expected.nebulaId, unitId: expected.unitId })
      unmount()
    }
  })

  it('every arrow on a star goes to the nearest star of its nebula that way, and focus shows on the canvas', () => {
    const map = skyMap(1000, 'math')
    const { id } = bigNebula(map)
    const { container, renderer, press } = show(map, { layer: 'nebula', nebulaId: id })
    const stars = orderedStars(map)
    const links = () => [...container.querySelectorAll<HTMLAnchorElement>(`li[data-nebula="${id}"] a[data-unit]`)]
    const starOf = (a: Element) => stars[Number((a as HTMLElement).dataset.index)]
    // Start in the middle of the nebula's links.
    const middle = links()[Math.floor(links().length / 2)]
    act(() => middle.focus())
    let current: HTMLAnchorElement = middle
    let moved = 0
    for (const direction of [...DIRECTIONS, ...DIRECTIONS]) {
      const from = starOf(current)
      const candidates = links().map(starOf)
      const expected = nearestInDirection(candidates, candidates.indexOf(from), direction)
      press(current, KEY[direction])
      const now = document.activeElement as HTMLAnchorElement
      if (expected < 0) {
        expect(now).toBe(current)
        continue
      }
      const to = starOf(now)
      expect(to.unitId).toBe(candidates[expected].unitId)
      expect(to.nebulaId).toBe(id)
      expect(ahead(from, to, direction)).toBeGreaterThan(0)
      // The canvas picks out the focused star.
      expect(renderer.last().focusStar).toBe(Number(now.dataset.index))
      current = now
      moved += 1
    }
    expect(moved).toBeGreaterThan(4)
  })

  it('with a star chosen, arrows fly to the nearest star of its nebula that way, up and down too', () => {
    const map = skyMap(1000, 'math')
    const { id, stars } = bigNebula(map)
    // The star nearest the middle of its nebula has neighbours every way.
    const disc = nebulaDiscs(map).get(id)!
    const star = [...stars].sort((a, b) => Math.hypot(a.x - disc.x, a.y - disc.y) - Math.hypot(b.x - disc.x, b.y - disc.y))[0]
    const target = (s: Star): LayerTarget => ({ layer: 'star', nebulaId: s.nebulaId, unitId: s.unitId })
    const { container, navigate } = show(map, target(star))
    const card = container.querySelector('article[aria-labelledby="starmap-star-title"]')!
    const link = card.querySelector('a')!
    act(() => link.focus())
    for (const direction of DIRECTIONS) {
      navigate.mockClear()
      fireEvent.keyDown(link, { key: KEY[direction] })
      const next = stars[nearestInDirection(stars, stars.indexOf(star), direction)]
      expect(next).toBeDefined()
      expect(navigate).toHaveBeenLastCalledWith(target(next))
      expect(ahead(star, next, direction)).toBeGreaterThan(0)
    }
    // Escape still leaves for the nebula.
    fireEvent.keyDown(link, { key: 'Escape' })
    expect(navigate).toHaveBeenLastCalledWith({ layer: 'nebula', nebulaId: id })
  })

  it('with a star chosen at the edge of its nebula, an arrow outwards stays', () => {
    const map = skyMap(1000, 'math')
    const { stars } = bigNebula(map)
    const rightmost = [...stars].sort((a, b) => b.x - a.x)[0]
    const { container, navigate } = show(map, { layer: 'star', nebulaId: rightmost.nebulaId, unitId: rightmost.unitId })
    const link = container.querySelector('article[aria-labelledby="starmap-star-title"] a')!
    act(() => (link as HTMLElement).focus())
    fireEvent.keyDown(link, { key: 'ArrowRight' })
    expect(navigate).not.toHaveBeenCalled()
  })

  it('leaves dragging and zooming alone: + and − still zoom, a drag still pans', () => {
    const map = skyMap(1000, 'math')
    const { container, renderer, clock } = show(map)
    const stage = container.querySelector<HTMLElement>('[data-starmap-stage]')!
    const k0 = renderer.last().scale
    act(() => {
      fireEvent.keyDown(stage, { key: '+' })
      clock.advance(1000)
    })
    expect(renderer.last().scale / k0).toBeCloseTo(1.5, 4)
    const x0 = renderer.last().x[0]
    act(() => {
      fireEvent.pointerDown(stage, { pointerId: 1, clientX: 640, clientY: 700, button: 0, pointerType: 'mouse' })
      for (let k = 1; k <= 10; k += 1) {
        fireEvent.pointerMove(stage, { pointerId: 1, clientX: 640 - 10 * k, clientY: 700, buttons: 1, pointerType: 'mouse' })
        clock.advance(16)
      }
      fireEvent.pointerUp(stage, { pointerId: 1, clientX: 540, clientY: 700, pointerType: 'mouse' })
      clock.advance(2000)
    })
    expect(renderer.last().x[0]).toBeLessThan(x0 - 50)
    // An arrow on the stage itself, with nothing chosen, moves nothing.
    const x1 = renderer.last().x[0]
    act(() => {
      fireEvent.keyDown(stage, { key: 'ArrowRight' })
      clock.advance(1000)
    })
    expect(renderer.last().x[0]).toBeCloseTo(x1, 6)
  })
})
