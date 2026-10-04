/**
 * The star layer pans (#132): a drag moves the map as on the other layers,
 * round the ring (#120) without a jump; the card stays open for the focused
 * star, whose lines go with it; a tap on another star refocuses it; panned
 * out of sight, a button points back; arrows step through the nebula.
 */
import { act, fireEvent, render } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { StarMapView } from '@/features/starmap/components/StarMapView'
import { StarMapEngine } from '@/features/starmap/engine/starMapEngine'
import { orderedNebulae, orderedStars, type Star, type StarMap } from '@/features/starmap/model/starMap'
import { nebulaDiscs } from '@/features/starmap/view/geometry'
import { starHintSpot, type LayerTarget } from '@/features/starmap/view/layers'
import { skyGalaxies, SKY_WRAP } from '@/features/starmap/view/sky'
import i18n from '@/i18n'
import { fakeClock, recordingRenderer, skyMap, THEME, type RecordedFrame } from './starmapHarness'

const starTarget = (star: Star): LayerTarget => ({ layer: 'star', nebulaId: star.nebulaId, unitId: star.unitId })

/** A star of `subjectId`'s galaxy: in its nebula nearest the seam (`edge`), else in its biggest nebula. */
function starOf(map: StarMap, subjectId: string, edge?: 'left' | 'right'): Star {
  const discs = nebulaDiscs(map)
  const nebulae = orderedNebulae(map).filter((n) => n.subjectId === subjectId)
  const stars = orderedStars(map)
  const size = (id: string) => stars.filter((s) => s.nebulaId === id).length
  const sorted = edge
    ? nebulae.sort((a, b) => (discs.get(a.topicId)!.x - discs.get(b.topicId)!.x) * (edge === 'left' ? 1 : -1))
    : nebulae.sort((a, b) => size(b.topicId) - size(a.topicId))
  const nebula = sorted[0]
  return stars.filter((s) => s.nebulaId === nebula.topicId)[Math.floor(size(nebula.topicId) / 2)]
}

function session(width: number, height: number, map: StarMap, target: LayerTarget, reducedMotion = true) {
  const clock = fakeClock()
  const renderer = recordingRenderer()
  const navigate = vi.fn()
  const engine = new StarMapEngine({ renderer, theme: THEME, reducedMotion, scheduler: clock, now: clock.now, galaxy: true, onRequestTarget: navigate })
  engine.setViewport(width, height, 1, { top: 120, bottom: 90 })
  engine.setData(map, target)
  clock.advance(20)
  return { clock, renderer, engine, navigate, width, height, map }
}
type Session = ReturnType<typeof session>

/**
 * A point near `(x, y)` with no star under it: a press on a star drags the
 * star (#136), a press on empty space pans the map.
 */
function clearOf(s: Session, x: number, y: number): [number, number] {
  const f = s.renderer.last()
  for (let step = 0; step < 200; step += 1) {
    const dy = (step % 2 ? 1 : -1) * Math.ceil(step / 2) * 6
    if (f.x.every((sx, k) => Math.hypot(sx - x, f.y[k] - (y + dy)) > 30)) return [x, y + dy]
  }
  return [x, y]
}

/** Drag horizontally by `dx` px in strokes across the screen, holding still before each release (no glide). */
function drag(s: Session, dx: number, dy = 0, step = 40): RecordedFrame[] {
  const start = s.renderer.frames.length
  const y0 = s.height * 0.4
  const fresh = () => (dx < 0 ? s.width * 0.8 : s.width * 0.2)
  let [x, y] = clearOf(s, fresh(), y0)
  s.engine.pointerDown(1, x, y)
  x += Math.sign(dx) * 10
  s.engine.pointerMove(1, x, y)
  s.clock.advance(16)
  let left = dx - Math.sign(dx) * 10
  let down = dy
  while (Math.abs(left) > 0 || Math.abs(down) > 0) {
    const move = Math.sign(left) * Math.min(Math.abs(left), step)
    const fall = Math.sign(down) * Math.min(Math.abs(down), step)
    x += move
    y += fall
    left -= move
    down -= fall
    s.engine.pointerMove(1, x, y)
    s.clock.advance(16)
    if (x < 20 || x > s.width - 20) {
      s.clock.advance(200)
      s.engine.pointerUp(1, x, y)
      ;[x, y] = clearOf(s, fresh(), y0)
      s.engine.pointerDown(1, x, y)
      x += Math.sign(dx) * 10
      s.engine.pointerMove(1, x, y)
      s.clock.advance(16)
      left -= Math.sign(dx) * 10
      if (Math.sign(left) !== Math.sign(dx)) left = 0
    }
  }
  s.clock.advance(200)
  s.engine.pointerUp(1, x, y)
  s.clock.advance(100)
  return s.renderer.frames.slice(start)
}

const indexOf = (map: StarMap, unitId: string) => orderedStars(map).findIndex((s) => s.unitId === unitId)

describe('dragging the star layer (#132)', () => {
  for (const [width, height] of [[1440, 900], [390, 844], [375, 812]] as const) {
    it(`${width}×${height}: a drag moves the map and the focused star with it; the layer and its focus stay`, () => {
      const map = skyMap(1000, 'math')
      const star = starOf(map, 'math')
      const s = session(width, height, map, starTarget(star))
      const i = indexOf(map, star.unitId)
      const before = s.renderer.last()
      const spot = s.engine.starOnScreen(star.unitId)!
      expect(spot.x).toBeCloseTo(before.x[i])
      drag(s, -120, 60)
      const after = s.renderer.last()
      // Every star moved with the hand, the focused one too.
      expect(after.x[i] - before.x[i]).toBeCloseTo(-120, 3)
      expect(after.y[i] - before.y[i]).toBeCloseTo(60, 3)
      const moved = after.x.map((x, k) => x - before.x[k])
      for (let k = 0; k < moved.length; k += 1) if (Math.abs(before.x[k] - width / 2) < width) expect(moved[k]).toBeCloseTo(-120, 3)
      // Still the star layer, on the same star: its lines (the renderer draws the focused star's) follow.
      expect(s.engine.layer).toBe('star')
      expect(after.focusStar).toBe(i)
      expect(after.starFocus).toBe(1)
      expect(s.navigate).not.toHaveBeenCalled()
      // The lighting layer is told where the star is drawn now.
      const moved2 = s.engine.starOnScreen(star.unitId)!
      expect(moved2.x).toBeCloseTo(after.x[i])
      expect(moved2.y).toBeCloseTo(after.y[i])
      expect(s.engine.focusedStarOnScreen).toEqual(moved2)
      s.engine.destroy()
    })
  }

  it('glides after a throw and stays on the star layer', () => {
    const map = skyMap(1000, 'math')
    const star = starOf(map, 'math')
    const s = session(1440, 900, map, starTarget(star), false)
    s.clock.advance(1000)
    const i = indexOf(map, star.unitId)
    const x0 = s.renderer.last().x[i]
    s.engine.pointerDown(1, 700, 450)
    for (let x = 690; x >= 400; x -= 30) {
      s.engine.pointerMove(1, x, 450)
      s.clock.advance(16)
    }
    s.engine.pointerUp(1, 400, 450)
    const released = s.renderer.last().x[i]
    s.clock.advance(3000)
    expect(s.renderer.last().x[i]).toBeLessThan(released)
    expect(released).toBeLessThan(x0)
    expect(s.engine.layer).toBe('star')
    expect(s.navigate).not.toHaveBeenCalled()
    s.engine.destroy()
  })

  for (const [width, height] of [[1440, 900], [390, 844]] as const) {
    it(`${width}×${height}: pans across the seam without a jump, and taps the drawn copy on the other side`, () => {
      const map = skyMap(1000, 'chemistry')
      const galaxies = skyGalaxies(map)
      const last = galaxies[galaxies.length - 1]
      expect(last.subjectId).toBe('chemistry')
      // A chemistry star near the seam; mathematics is across it, to the right.
      const star = starOf(map, 'chemistry', 'right')
      const s = session(width, height, map, starTarget(star))
      const stars = orderedStars(map)
      const subjectOf = new Map(map.nebulae.map((n) => [n.topicId, n.subjectId]))
      const isMath = stars.map((st) => subjectOf.get(st.nebulaId) === 'math')
      const first = s.renderer.last()
      // Bring mathematics' nebula nearest the seam to where the star was: across the seam.
      const discs = nebulaDiscs(map)
      const mathEdge = orderedNebulae(map).filter((n) => n.subjectId === 'math').sort((a, b) => discs.get(a.topicId)!.x - discs.get(b.topicId)!.x)[0]
      const disc = discs.get(mathEdge.topicId)!
      const frames = drag(s, -(disc.x + SKY_WRAP - star.x) * first.scale, -(disc.y - star.y) * first.scale, 60)
      expect(frames.length).toBeGreaterThan(10)
      for (let f = 1; f < frames.length; f += 1) {
        const [a, b] = [frames[f - 1], frames[f]]
        expect(b.scale).toBe(a.scale)
        const steps = a.x.map((x, k) => b.x[k] - x).sort((p, q) => p - q)
        const moved = steps[Math.floor(steps.length / 2)]
        // Every star seen in both frames moved exactly with the map: no jump at the seam.
        for (let k = 0; k < stars.length; k += 1) {
          if (a.x[k] > -20 && a.x[k] < width + 20 && b.x[k] > -20 && b.x[k] < width + 20) expect(Math.abs(b.x[k] - a.x[k] - moved)).toBeLessThan(0.01)
        }
      }
      const end = s.renderer.last()
      expect(s.engine.layer).toBe('star')
      expect(end.focusStar).toBe(indexOf(map, star.unitId))
      // Mathematics came round from the right; one of its stars, as drawn, is hit by a tap and by `starOnScreen`.
      const m = stars.findIndex((_, k) => isMath[k] && end.x[k] > 40 && end.x[k] < width - 40 && end.y[k] > 160 && end.y[k] < height - 160)
      expect(m).toBeGreaterThanOrEqual(0)
      const spot = s.engine.starOnScreen(stars[m].unitId)!
      expect(spot.x).toBeCloseTo(end.x[m])
      expect(spot.y).toBeCloseTo(end.y[m])
      s.engine.pointerDown(2, end.x[m], end.y[m])
      s.engine.pointerUp(2, end.x[m], end.y[m])
      expect(s.navigate).toHaveBeenCalledWith({ layer: 'star', nebulaId: stars[m].nebulaId, unitId: stars[m].unitId })
      // The focused star is far off screen, the shorter way back is left.
      const focused = s.engine.focusedStarOnScreen!
      expect(focused.x).toBeLessThan(0)
      // At rest, the view is back on the first turn of the ring.
      expect(s.engine.currentView.cx).toBeGreaterThanOrEqual(0)
      expect(s.engine.currentView.cx).toBeLessThan(SKY_WRAP)
      s.engine.destroy()
    })
  }

  it('a tap on another star refocuses it; a tap on the open star brings it back beside the card', () => {
    const map = skyMap(1000, 'math')
    const star = starOf(map, 'math')
    const s = session(1440, 900, map, starTarget(star))
    const i = indexOf(map, star.unitId)
    const home = { x: s.renderer.last().x[i], y: s.renderer.last().y[i] }
    drag(s, -80)
    const f = s.renderer.last()
    // The open star, tapped where it is drawn now: back to its place.
    s.engine.pointerDown(2, f.x[i], f.y[i])
    s.engine.pointerUp(2, f.x[i], f.y[i])
    s.clock.advance(1000)
    expect(s.navigate).not.toHaveBeenCalled()
    expect(s.renderer.last().x[i]).toBeCloseTo(home.x)
    expect(s.renderer.last().y[i]).toBeCloseTo(home.y)
    // Another star on screen: the route is asked for it.
    const g = s.renderer.last()
    const other = orderedStars(map).findIndex((_, k) => k !== i && Math.hypot(g.x[k] - g.x[i], g.y[k] - g.y[i]) > 60 && g.x[k] > 40 && g.x[k] < 900 && g.y[k] > 160 && g.y[k] < 740)
    s.engine.pointerDown(3, g.x[other], g.y[other])
    s.engine.pointerUp(3, g.x[other], g.y[other])
    const next = orderedStars(map)[other]
    expect(s.navigate).toHaveBeenCalledWith({ layer: 'star', nebulaId: next.nebulaId, unitId: next.unitId })
    s.engine.destroy()
  })

  it('recentres the shorter way round the ring', () => {
    const map = skyMap(1000, 'chemistry')
    const star = starOf(map, 'chemistry', 'right')
    const s = session(1440, 900, map, starTarget(star), false)
    s.clock.advance(1000)
    const i = indexOf(map, star.unitId)
    const home = s.renderer.last().x[i]
    drag(s, -2000)
    s.clock.advance(3000)
    const start = s.renderer.frames.length
    s.engine.recentre()
    s.clock.advance(2000)
    const flight = s.renderer.frames.slice(start)
    expect(s.renderer.last().x[i]).toBeCloseTo(home, 1)
    // Back to the right, never round the long way: the star only ever moves right.
    for (let f = 1; f < flight.length; f += 1) expect(flight[f].x[i]).toBeGreaterThanOrEqual(flight[f - 1].x[i] - 0.01)
    expect(s.engine.layer).toBe('star')
    s.engine.destroy()
  })
})

describe('the way back to the star (#132)', () => {
  const area = { left: 16, top: 140, right: 1000, bottom: 700 }

  it('is not shown while the star is in the clear area, or just outside it', () => {
    expect(starHintSpot({ x: 500, y: 400 }, area)).toBeNull()
    expect(starHintSpot({ x: 1010, y: 400 }, area, 16)).toBeNull()
    expect(starHintSpot({ x: 1010, y: 400 }, area)).not.toBeNull()
  })

  it('sits on the edge towards the star, aligned to stay inside', () => {
    const right = starHintSpot({ x: 3000, y: 420 }, area)!
    expect(right.x).toBeCloseTo(1000)
    expect(right.alignX).toBe(1)
    expect(right.angle).toBeCloseTo(0, 1)
    const left = starHintSpot({ x: -3000, y: 420 }, area)!
    expect(left.x).toBeCloseTo(16)
    expect(left.alignX).toBe(0)
    expect(Math.abs(left.angle)).toBeCloseTo(Math.PI, 1)
    const below = starHintSpot({ x: 508, y: 2000 }, area)!
    expect(below.y).toBeCloseTo(700)
    expect(below.alignY).toBe(1)
    expect(below.alignX).toBe(0.5)
  })
})

describe('the star layer in the page (#132)', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      x: 0, y: 0, left: 0, top: 0, width: 1280, height: 776, right: 1280, bottom: 776, toJSON: () => ({}),
    } as DOMRect)
  })
  afterEach(() => vi.restoreAllMocks())

  function show(map: StarMap, star: Star) {
    const clock = fakeClock()
    const renderer = recordingRenderer()
    const navigate = vi.fn()
    const view = render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <div data-surface="sky" className="flex">
            <StarMapView map={map} target={starTarget(star)} onNavigate={navigate} scheduler={clock} createRendererFor={() => renderer} />
          </div>
        </MemoryRouter>
      </I18nextProvider>,
    )
    act(() => clock.advance(20))
    const stage = view.container.querySelector<HTMLElement>('[data-starmap-stage]')!
    const card = () => view.container.querySelector('article[aria-labelledby="starmap-star-title"]')
    const hint = () => view.container.querySelector<HTMLButtonElement>('[data-star-hint]')
    const dragStage = (dx: number) =>
      act(() => {
        fireEvent.pointerDown(stage, { pointerId: 1, clientX: 600, clientY: 400, button: 0, pointerType: 'touch' })
        for (let k = 1; k <= 20; k += 1) {
          fireEvent.pointerMove(stage, { pointerId: 1, clientX: 600 + (dx * k) / 20, clientY: 400, pointerType: 'touch' })
          clock.advance(16)
        }
        clock.advance(200)
        fireEvent.pointerUp(stage, { pointerId: 1, clientX: 600 + dx, clientY: 400, pointerType: 'touch' })
        clock.advance(200)
      })
    return { clock, renderer, navigate, stage, card, hint, dragStage, ...view }
  }

  it('keeps the card open while the map is dragged, and points back once the star is out of sight', () => {
    const map = skyMap(1000, 'math')
    const star = starOf(map, 'math')
    const { renderer, navigate, card, hint, dragStage, clock } = show(map, star)
    const i = indexOf(map, star.unitId)
    const x0 = renderer.last().x[i]
    expect(card()).not.toBeNull()
    expect(hint()).toBeNull()
    dragStage(-200)
    expect(renderer.last().x[i]).toBeCloseTo(x0 - 200, 3)
    expect(card()).not.toBeNull()
    expect(card()!.textContent).toContain(star.name)
    // Dragged far: the star is gone off the left edge, and a button points back.
    dragStage(-500)
    dragStage(-500)
    expect(renderer.last().x[i]).toBeLessThan(0)
    const back = hint()!
    expect(back).not.toBeNull()
    expect(back.tagName).toBe('BUTTON')
    expect(back.tabIndex).toBe(0)
    expect(back.getAttribute('aria-label')).toBe(`Back to ${star.name}`)
    // It sits on the clear area's left edge.
    expect(back.style.transform).toMatch(/^translate\(16px, /)
    act(() => {
      back.focus()
      fireEvent.click(back)
      clock.advance(2000)
    })
    expect(renderer.last().x[i]).toBeCloseTo(x0, 1)
    expect(hint()).toBeNull()
    expect(navigate).not.toHaveBeenCalled()
  })

  it('left and right arrows go to the star before and after in the nebula, stopping at the ends', () => {
    const map = skyMap(1000, 'math')
    const star = starOf(map, 'math')
    const inNebula = orderedStars(map).filter((s) => s.nebulaId === star.nebulaId)
    const at = inNebula.findIndex((s) => s.unitId === star.unitId)
    const { navigate, card, unmount } = show(map, star)
    const back = card()!.querySelector('a')!
    act(() => back.focus())
    fireEvent.keyDown(back, { key: 'ArrowRight' })
    expect(navigate).toHaveBeenLastCalledWith(starTarget(inNebula[at + 1]))
    fireEvent.keyDown(back, { key: 'ArrowLeft' })
    expect(navigate).toHaveBeenLastCalledWith(starTarget(inNebula[at - 1]))
    // Escape still leaves for the nebula.
    fireEvent.keyDown(back, { key: 'Escape' })
    expect(navigate).toHaveBeenLastCalledWith({ layer: 'nebula', nebulaId: star.nebulaId })
    unmount()
    const lastStar = inNebula[inNebula.length - 1]
    const end = show(map, lastStar)
    const link = end.card()!.querySelector('a')!
    act(() => link.focus())
    fireEvent.keyDown(link, { key: 'ArrowRight' })
    expect(end.navigate).not.toHaveBeenCalled()
    fireEvent.keyDown(link, { key: 'ArrowLeft' })
    expect(end.navigate).toHaveBeenLastCalledWith(starTarget(inNebula[inNebula.length - 2]))
  })
})
