/**
 * A sky with ten knowledge points can still be zoomed into.
 *
 * `ZOOM.maxGlyph` is a target for a sky with enough stars in it. Mathematics
 * has ten, in five nebulae that are large for the two stars each holds, so a
 * 40 px glyph was already reached at the panorama: the closest zoom landed on
 * the farthest, both zoom buttons went disabled at once, and the reader was
 * held at the one zoom the design deliberately shows least at — stars as
 * dots, almost no names. Measured on production 2026-10-08: both buttons
 * disabled, at every moment, and still disabled after the wheel had zoomed.
 */
import { describe, expect, it, vi } from 'vitest'
import { StarMapEngine } from '@/features/starmap/engine/starMapEngine'
import type { StarMap } from '@/features/starmap/model/starMap'
import { ZOOM } from '@/features/starmap/view/semanticZoom'
import { recordingRenderer, fakeClock, THEME } from './starmapHarness'

const BANDS = { top: 120, bottom: 90 }

/** The five nebulae and ten stars mathematics actually has, laid out by #60. */
const PLACES: [string, string, number, number][] = [
  ['brueche-u1', 'brueche', 0.468892, 0.692211],
  ['brueche-u2', 'brueche', 0.42261, 0.68096],
  ['gleichungen-u1', 'gleichungen', 0.78461, 0.690184],
  ['gleichungen-u2', 'gleichungen', 0.831257, 0.680558],
  ['geometrie-u1', 'geometrie', 0.21539, 0.661743],
  ['geometrie-u2', 'geometrie', 0.260243, 0.645717],
  ['prozentrechnung-u1', 'prozentrechnung', 0.362007, 0.307789],
  ['prozentrechnung-u2', 'prozentrechnung', 0.365123, 0.26026],
  ['textaufgaben-u1', 'textaufgaben', 0.562801, 0.465501],
  ['textaufgaben-u2', 'textaufgaben', 0.525467, 0.495078],
]

function sparseSky(): StarMap {
  const topics = [...new Set(PLACES.map(([, topic]) => topic))]
  return {
    subject: { subjectId: 'math', name: 'Mathematik' },
    nebulae: topics.map((topicId, order) => ({ topicId, name: topicId, order, subjectId: 'math' })),
    stars: PLACES.map(([unitId, nebulaId, x, y], order) => ({
      unitId,
      name: unitId,
      nebulaId,
      order,
      state: order === 0 ? ('lit' as const) : ('locked' as const),
      progress: 0,
      unmetExercises: 0,
      reviewDue: 0,
      recommendation: null,
      x,
      y,
      skills: [],
      chapter: { lessonCount: 2, lessonsDone: 0, nextLesson: null },
    })),
    prerequisites: [{ from: 'brueche-u1', to: 'brueche-u2' }],
    summary: { lit: 1, total: 10, streakDays: 0, score: 0 },
    subjects: [{ subjectId: 'math', name: 'Mathematik', lit: 1, total: 10, enrolled: true }],
  }
}

function engineOn(width: number, height: number) {
  const clock = fakeClock()
  const engine = new StarMapEngine({
    renderer: recordingRenderer(),
    theme: THEME,
    reducedMotion: false,
    scheduler: clock,
    now: clock.now,
    galaxy: true,
    onRequestTarget: vi.fn(),
  })
  engine.setViewport(width, height, 1, BANDS)
  engine.setData(sparseSky(), { layer: 'map' })
  clock.advance(20)
  return { engine, clock }
}

describe('a sky with few stars in it', () => {
  it.each([
    ['desktop', 1440, 900],
    ['phone', 390, 844],
    ['narrow desktop', 1024, 768],
  ])('leaves somewhere to zoom in to on %s', (_name, width, height) => {
    const { engine } = engineOn(width, height)

    const { min, max } = engine.zoomRange
    expect(max / min).toBeGreaterThanOrEqual(ZOOM.leastRange - 1e-6)
  })

  it('does not report the farthest zoom as the closest one', () => {
    // Both at once is what disabled both buttons.
    const { engine } = engineOn(1440, 900)

    const zoom = engine.zoom
    expect([zoom.atMin, zoom.atMax]).toEqual([true, false])
  })

  it('lets the zoom-in button do something', () => {
    const { engine, clock } = engineOn(1440, 900)
    const before = engine.zoom.starPx

    engine.zoomBy(ZOOM.buttonStep, 1440 / 2, 900 / 2)
    clock.advance(1000)

    expect(engine.zoom.starPx).toBeGreaterThan(before)
    expect(engine.zoom.atMin).toBe(false)
  })

  it('still ends somewhere, rather than letting the zoom run away', () => {
    const { engine, clock } = engineOn(1440, 900)

    for (let i = 0; i < 20; i += 1) {
      engine.zoomBy(ZOOM.buttonStep, 1440 / 2, 900 / 2)
      clock.advance(200)
    }
    clock.advance(2000)

    expect(engine.zoom.atMax).toBe(true)
    expect(engine.zoom.starPx).toBeGreaterThan(ZOOM.maxGlyph)
  })
})


describe('what the pointer says', () => {
  it('shows a hand over a star, so the sky reads as something to open', () => {
    // Measured on production 2026-10-08: the canvas cursor was `auto`
    // everywhere, over stars included.
    const { engine } = engineOn(1440, 900)

    const over = engine.starOnScreen("brueche-u1")
    expect(over, 'the star is not on screen').not.toBeNull()
    expect(engine.cursorAt(over!.x, over!.y)).not.toBe('')
  })

  it('says nothing over empty sky once a nebula is already open', () => {
    const { engine } = engineOn(1440, 900)

    expect(engine.cursorAt(-500, -500)).toBe('')
  })
})


describe('what the sky answers to being pointed at', () => {
  it('names the star under the pointer, even where nothing can be dragged', () => {
    // Hover only tracked a star close enough to *drag*, and on the panorama
    // nothing is draggable — so pointing at a star did nothing at all.
    const { engine } = engineOn(1440, 900)
    const star = engine.starOnScreen('brueche-u1')!

    engine.hoverAt(star.x, star.y)

    expect(engine.hoveredStarIndex).toBeGreaterThanOrEqual(0)
  })

  it('lets go once the pointer leaves', () => {
    const { engine } = engineOn(1440, 900)
    const star = engine.starOnScreen('brueche-u1')!
    engine.hoverAt(star.x, star.y)

    engine.hoverAt(null)

    expect(engine.hoveredStarIndex).toBe(-1)
  })
})

describe('where a zoom press goes', () => {
  it('holds the stars where they are instead of walking away from them', () => {
    // A press zoomed around the middle of the viewport. On a sky whose stars
    // sit off to one side that is empty space, so each press pushed the
    // content further towards the edge.
    const { engine, clock } = engineOn(1440, 900)
    const middleOfTheStars = () => {
      const seen = PLACES.map(([unitId]) => engine.starOnScreen(unitId)).filter((p) => p !== null)
      return {
        x: seen.reduce((sum, p) => sum + p!.x, 0) / seen.length,
        y: seen.reduce((sum, p) => sum + p!.y, 0) / seen.length,
        seen: seen.length,
      }
    }
    const before = middleOfTheStars()

    engine.step('in')
    clock.advance(1500)

    const after = middleOfTheStars()
    expect(after.seen, 'every star left the screen').toBeGreaterThan(0)
    // Zooming around the stars keeps their middle still; zooming around the
    // viewport's middle moves it by a share of the zoom.
    expect(Math.hypot(after.x - before.x, after.y - before.y)).toBeLessThan(40)
  })
})


describe('what happens when a star is pressed', () => {
  it('holds the star it was pressed on, and lets go on release', () => {
    // Between the press and the page changing the sky stayed perfectly still,
    // which reads as a click that did not land.
    const { engine } = engineOn(1440, 900)
    const star = engine.starOnScreen('brueche-u1')!

    engine.pointerDown(1, star.x, star.y)
    expect(engine.pressedStarIndex).toBeGreaterThanOrEqual(0)

    engine.pointerUp(1, star.x, star.y)
    expect(engine.pressedStarIndex).toBe(-1)
  })

  it('lets go when the press wanders off, because that is a pan', () => {
    const { engine } = engineOn(1440, 900)
    const star = engine.starOnScreen('brueche-u1')!
    engine.pointerDown(1, star.x, star.y)

    engine.pointerMove(1, star.x + 400, star.y + 300)

    expect(engine.pressedStarIndex).toBe(-1)
  })

  it('presses nothing when the press lands on empty sky', () => {
    const { engine } = engineOn(1440, 900)

    engine.pointerDown(1, 5, 5)

    expect(engine.pressedStarIndex).toBe(-1)
  })

  it('lets go when the gesture is cancelled', () => {
    const { engine } = engineOn(1440, 900)
    const star = engine.starOnScreen('brueche-u1')!
    engine.pointerDown(1, star.x, star.y)

    engine.pointerCancel(1)

    expect(engine.pressedStarIndex).toBe(-1)
  })
})
