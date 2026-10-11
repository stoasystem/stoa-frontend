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
import { starLinkSize, type LayerTarget } from '@/features/starmap/view/layers'
import { REVEAL, ZOOM } from '@/features/starmap/view/semanticZoom'
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

function engineOn(width: number, height: number, onRequestTarget: (target: LayerTarget) => void = vi.fn()) {
  const clock = fakeClock()
  const engine = new StarMapEngine({
    renderer: recordingRenderer(),
    theme: THEME,
    reducedMotion: false,
    scheduler: clock,
    now: clock.now,
    galaxy: true,
    onRequestTarget,
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

/**
 * Card 125, measured on production 2026-10-11 signed in as `student@` at
 * 1440x900, clicking each star's own box in the parallel DOM:
 *
 *   Understanding and reducing fractions  ->  /map/math/brueche
 *   Calculating with fractions            ->  /map/math/brueche/brueche-u2
 *   Solving simple equations              ->  /map/math/gleichungen
 *   Equations from word problems          ->  /map/math/gleichungen
 *   Area and perimeter                    ->  /map/math/geometrie
 *
 * Eight of ten opened the nebula the star is in. The one that opened itself,
 * `brueche-u2`, is the recommended star -- the one case `beaconAt` let
 * through whatever the zoom. The map moved and no card opened, which is what
 * "I clicked the planet and nothing happened" was.
 *
 * `/` opens at the farthest zoom (`atMin`), so this is the zoom nearly every
 * reader is at, and `zoom.pickable` is false there however large the glyph:
 * it also asks for the zoom to be past the panorama.
 */
describe('a tap on a star picks that star, not its nebula (card 125)', () => {
  const tap = (engine: StarMapEngine, x: number, y: number) => {
    engine.pointerDown(1, x, y)
    engine.pointerUp(1, x, y)
  }

  /** The three stars production was read on, by the route each one went to. */
  const WENT_TO_THE_NEBULA = ['brueche-u1', 'gleichungen-u1', 'geometrie-u1'] as const

  it.each(WENT_TO_THE_NEBULA)('%s opens itself', (unitId) => {
    const asked: LayerTarget[] = []
    const { engine } = engineOn(1440, 900, (target) => asked.push(target))
    expect(engine.zoom.pickable, 'the zoom this is about is the one stars are not pickable at').toBe(false)

    const at = engine.starOnScreen(unitId)
    expect(at, `${unitId} is not on screen`).not.toBeNull()
    tap(engine, at!.x, at!.y)

    expect(asked).toEqual([{ layer: 'star', nebulaId: unitId.split('-')[0], unitId }])
  })

  it('and the pointer says so before the click: a hand over the star', () => {
    const { engine } = engineOn(1440, 900)
    const at = engine.starOnScreen('gleichungen-u1')!

    expect(engine.cursorAt(at.x, at.y)).toBe('pointer')
  })

  /**
   * The anti-control for the one above. A tap that is not on a star has to
   * keep flying to the nebula, or "pick the star" would just mean "pick
   * whichever star is nearest", and the nebula layer would be unreachable.
   */
  it('a tap on empty cloud still opens the nebula', () => {
    const asked: LayerTarget[] = []
    const { engine } = engineOn(1440, 900, (target) => asked.push(target))
    const at = engine.starOnScreen('brueche-u1')!
    const away = starLinkSize(engine.glyphSize) / 2 + 4

    tap(engine, at.x + away, at.y)

    expect(asked).toEqual([{ layer: 'nebula', nebulaId: 'brueche' }])
  })

  /**
   * The second anti-control, and the reason the reach is the drawn box rather
   * than something generous: a tap has to be clearly on one star. Between two
   * stars nearer each other than their boxes, it is on both, and the tap
   * belongs to the nebula -- which is what the zoom gate used to guarantee
   * for the panorama's dots, and still holds without it. A phone shows the
   * same ten stars in a third of the width, which brings a pair close enough.
   */
  it('a tap between two stars that share a box opens the nebula', () => {
    const asked: LayerTarget[] = []
    const { engine } = engineOn(390, 844, (target) => asked.push(target))
    const a = engine.starOnScreen('brueche-u1')!
    const b = engine.starOnScreen('brueche-u2')!
    const reach = starLinkSize(engine.glyphSize) / 2
    expect(Math.hypot(a.x - b.x, a.y - b.y), 'the pair is not close enough to be ambiguous').toBeLessThan(reach * 2)

    tap(engine, (a.x + b.x) / 2, (a.y + b.y) / 2)

    expect(asked).toEqual([{ layer: 'nebula', nebulaId: 'brueche' }])
  })

  /**
   * ...and the control on that control: the same pair on a wide screen is far
   * enough apart that a tap near one of them is on one star only, so the rule
   * above is a rule about crowding and not a rule that two stars in a nebula
   * can never be picked.
   */
  it('on a wide screen the same pair is not ambiguous: a tap near one picks it', () => {
    const asked: LayerTarget[] = []
    const { engine } = engineOn(1440, 900, (target) => asked.push(target))
    const a = engine.starOnScreen('brueche-u1')!
    const b = engine.starOnScreen('brueche-u2')!
    const reach = starLinkSize(engine.glyphSize) / 2
    expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(reach * 2)

    tap(engine, a.x + (b.x - a.x) * 0.15, a.y + (b.y - a.y) * 0.15)

    expect(asked).toEqual([{ layer: 'star', nebulaId: 'brueche', unitId: 'brueche-u1' }])
  })
})

/**
 * ...and for a name to be clickable it first has to be on screen. Measured on
 * production 2026-10-11: not one of mathematics' five nebula names was ever
 * drawn, at any zoom, hovered or not. A nebula is named by its disc's radius
 * only past the panorama (`nebulaNameAlpha`), and `priorityNameAlpha` hands
 * the nebula names to the star names by `starPx` -- and this map's farthest
 * zoom already draws glyphs past `REVEAL.nebulaNameOut`, so the two windows
 * never overlapped.
 */
describe('a cloud under the pointer says its name (card 125)', () => {
  type NameFrame = { priorityNameAlpha?: number; nebulaNames?: ArrayLike<number> }
  const frameNow = (engine: StarMapEngine): NameFrame => {
    const { frames } = (engine as unknown as { renderer: { frames: NameFrame[] } }).renderer
    return frames[frames.length - 1]
  }

  it('the precondition this is about: at the panorama the star names have already taken over', () => {
    const { engine } = engineOn(1440, 900)

    expect(engine.zoom.atMin, 'the map opens at the farthest zoom').toBe(true)
    expect(engine.zoom.starPx, 'a sparse map draws big glyphs even here').toBeGreaterThanOrEqual(REVEAL.nebulaNameOut[1])
  })

  it('and no nebula names itself there by its own size', () => {
    const { engine } = engineOn(1440, 900)
    const names = frameNow(engine).nebulaNames!

    expect([...Array(names.length).keys()].map((i) => names[i]).every((alpha) => alpha === 0)).toBe(true)
  })

  it('so the one under the pointer is named instead, at full strength', () => {
    const { engine, clock } = engineOn(1440, 900)
    const at = engine.starOnScreen('brueche-u1')!

    engine.hoverAt(at.x, at.y)
    clock.advance(40)

    expect(frameNow(engine).priorityNameAlpha).toBe(1)
  })

  /**
   * The anti-control: this is a panorama rule, not "name whatever is hovered,
   * always". Once the zoom is past the panorama the clouds name themselves by
   * size again and the star names take the rest, so the priority hands back.
   */
  it('zoomed in past the panorama it hands back to the star names', () => {
    const { engine, clock } = engineOn(1440, 900)
    const at = engine.starOnScreen('brueche-u1')!
    engine.hoverAt(at.x, at.y)
    for (let i = 0; i < 6; i += 1) {
      engine.zoomBy(ZOOM.buttonStep, 1440 / 2, 900 / 2)
      clock.advance(400)
    }
    clock.advance(1000)

    expect(engine.zoom.atMin).toBe(false)
    expect(frameNow(engine).priorityNameAlpha).toBe(0)
  })
})

/**
 * ...and the name has to still be there when the pointer arrives at it.
 *
 * A nebula's name is printed out at the cloud's rim, well past every star in
 * it, and on one sky a nebula was known to the pointer only by a star within
 * 28 px of it. So a student who read "FRACTIONS", moved towards it and
 * clicked found nothing: the name had faded on the way. Verified in a browser
 * on this branch, 2026-10-11: before this, a continuous glide from the star
 * to the printed name ended on `cursor: auto` and the click went nowhere.
 */
describe('a cloud keeps its name while the pointer crosses it (card 125)', () => {
  const hovered = (engine: StarMapEngine) => {
    const { frames } = (engine as unknown as { renderer: { frames: { hoveredNebula?: number }[] } }).renderer
    return frames[frames.length - 1].hoveredNebula
  }

  /** A point inside the fractions cloud, past every star in it -- where its name is printed. */
  function outInTheCloud(engine: StarMapEngine) {
    const discs = (engine as unknown as { nebulaX: Float32Array; nebulaY: Float32Array; nebulaR: Float32Array; nebulaIds: string[] })
    const n = discs.nebulaIds.indexOf('brueche')
    return { x: discs.nebulaX[n], y: discs.nebulaY[n] + discs.nebulaR[n] * 0.9, index: n }
  }

  it('the pointer out at the rim, far from every star, still names the cloud', () => {
    const { engine, clock } = engineOn(1440, 900)
    const spot = outInTheCloud(engine)
    const stars = ['brueche-u1', 'brueche-u2'].map((id) => engine.starOnScreen(id)!)
    const nearest = Math.min(...stars.map((s) => Math.hypot(s.x - spot.x, s.y - spot.y)))
    expect(nearest, 'the spot is not past the 28 px a star reaches').toBeGreaterThan(28)

    engine.hoverAt(spot.x, spot.y)
    clock.advance(40)

    expect(hovered(engine)).toBe(spot.index)
  })

  /** The anti-control: outside every cloud it is nobody's name, and nothing is highlighted. */
  it('the pointer out in the dark names nothing', () => {
    const { engine, clock } = engineOn(1440, 900)
    const spot = outInTheCloud(engine)

    engine.hoverAt(spot.x, spot.y)
    clock.advance(40)
    expect(hovered(engine)).toBe(spot.index)

    engine.hoverAt(4, 4)
    clock.advance(40)
    expect(hovered(engine)).toBe(-1)
  })
})
