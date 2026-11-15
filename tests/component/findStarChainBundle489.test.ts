/*
 * The found path drawn as a numbered chain with bundled side branches
 * (#489): the chain's steps in walking order, the bundle points on the side
 * of each nebula facing the other, the curves' ends, the step badges kept
 * clear of names, badges and the chain, the words for a screen reader in four
 * languages -- and the star map's own lines between stars still straight.
 */
import type { TFunction } from 'i18next'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import de from '@/i18n/locales/de/starmap.json'
import en from '@/i18n/locales/en/starmap.json'
import fr from '@/i18n/locales/fr/starmap.json'
import it_ from '@/i18n/locales/it/starmap.json'
import { starLabel } from '@/features/starmap/components/labels'
import { StarMapEngine } from '@/features/starmap/engine/starMapEngine'
import { chainSteps, findStarPath, type FindStarPath } from '@/features/starmap/model/missingStars'
import { subjectOfNebula, type Star } from '@/features/starmap/model/starMap'
import { createCanvas2DRenderer } from '@/features/starmap/render/canvas2d'
import { boxesOverlap, boxHitsSegment, type Box } from '@/features/starmap/render/labels'
import { drawLinks, drawPath, PATH, pathCurve } from '@/features/starmap/render/links'
import { BUNDLE_FACING, BUNDLE_STRENGTH, bundleCubic, bundlePoint, pointAt, straightCubic, trimCubic } from '@/features/starmap/render/pathShapes'
import { placeStepBadges, STEP, stepSpots } from '@/features/starmap/render/pathSteps'
import { STATE_READY, type SceneData, type SceneFrame, type StarMapRenderer } from '@/features/starmap/render/types'
import { fakeCanvas, fakeClock, fakeContext, skyMap, THEME, type CanvasCounter } from './starmapHarness'

// ---------------------------------------------------------------- the chain's steps

describe('the steps of the main chain', () => {
  it('walk from the first missing star to the target, the target left out, the side branches ignored', () => {
    const edges = [
      { from: 'c', to: 't', main: true },
      { from: 'x', to: 'b', main: false },
      { from: 'a', to: 'b', main: true },
      { from: 'b', to: 'c', main: true },
    ]
    expect(chainSteps(edges, 't')).toEqual(['a', 'b', 'c'])
  })

  it('are none without a main line, and work on star indices as well', () => {
    expect(chainSteps([{ from: 1, to: 2, main: false }], 2)).toEqual([])
    expect(chainSteps([{ from: 4, to: 9, main: true }, { from: 9, to: 2, main: true }], 2)).toEqual([4, 9])
  })
})

// ---------------------------------------------------------------- bundling

describe('the bundle points and the curves', () => {
  it('sit on the side of a nebula facing the other one, not at its centre', () => {
    const p = bundlePoint({ x: 100, y: 100 }, 40, { x: 500, y: 100 })
    expect(p.x).toBeCloseTo(100 + 40 * BUNDLE_FACING)
    expect(p.y).toBeCloseTo(100)
    // Facing up-left: the point moves that way from the centre.
    const q = bundlePoint({ x: 0, y: 0 }, 50, { x: -300, y: -400 })
    expect(q.x).toBeCloseTo(-0.6 * 50 * BUNDLE_FACING)
    expect(q.y).toBeCloseTo(-0.8 * 50 * BUNDLE_FACING)
  })

  it('run from star to star, their controls pulled toward the bundle points', () => {
    const a = { x: 0, y: 0 }
    const b = { x: 300, y: 0 }
    const pa = { x: 60, y: 90 }
    const pb = { x: 240, y: 90 }
    const curve = bundleCubic(a, pa, pb, b)
    expect(curve[0]).toEqual(a)
    expect(curve[3]).toEqual(b)
    expect(curve[1].y).toBeCloseTo(90 * BUNDLE_STRENGTH)
    expect(curve[2].y).toBeCloseTo(90 * BUNDLE_STRENGTH)
    // Trimmed clear of both glyphs: its ends this far along from either star.
    const cut = trimCubic(straightCubic(a, b), 10)!
    expect(cut[0].x).toBeCloseTo(10, 0)
    expect(cut[3].x).toBeCloseTo(290, 0)
    expect(trimCubic(straightCubic(a, { x: 15, y: 0 }), 10)).toBeNull()
  })
})

/** Four stars: 0 and 1 in nebula 0 (left), 2 and 3 in nebula 1 (right). */
function twoNebulae(): { scene: SceneData; frame: SceneFrame } {
  const scene = {
    mapKey: 'bundle',
    count: 4,
    mapX: Float32Array.from([0.2, 0.22, 0.6, 0.62]),
    mapY: Float32Array.from([0.3, 0.5, 0.35, 0.55]),
    state: Uint8Array.from([STATE_READY, STATE_READY, STATE_READY, STATE_READY]),
    progress: new Float32Array(4),
    reviewDue: new Uint8Array(4),
    recommended: -1,
    nebula: Uint16Array.from([0, 0, 1, 1]),
    names: ['a', 'b', 'c', 'd'],
    skills: [[], [], [], []],
    nebulae: [
      { topicId: 'n0', name: 'Zero', x: 0.21, y: 0.4, r: 0.12, lit: 0, total: 2 },
      { topicId: 'n1', name: 'One', x: 0.61, y: 0.45, r: 0.12, lit: 0, total: 2 },
    ],
    links: [{ a: 0, b: 1, count: 2 }],
    starLinks: [{ from: 0, to: 2 }, { from: 1, to: 3 }, { from: 0, to: 1 }],
  } satisfies SceneData
  const frame = {
    viewport: { width: 1000, height: 1000 },
    scale: 1000,
    ox: 0,
    oy: 0,
    x: Float32Array.from([200, 220, 600, 620]),
    y: Float32Array.from([300, 500, 350, 550]),
    nebulaX: Float32Array.from([210, 610]),
    nebulaY: Float32Array.from([400, 450]),
    nebulaR: Float32Array.from([120, 120]),
    focusStar: -1,
    glyphSize: 10,
    dotRadius: 2,
    path: {
      target: 3,
      missing: [0, 1, 2],
      edges: [{ from: 0, to: 2, main: false }, { from: 1, to: 3, main: true }, { from: 0, to: 1, main: false }],
      amount: 1,
    },
  } as unknown as SceneFrame
  return { scene, frame }
}

/** A context that notes each stroke's shape and how it was drawn. */
function strokeRecorder() {
  const strokes: { curve: boolean; points: number[]; width: number; alpha: number }[] = []
  let points: number[] = []
  let curve = false
  const store: Record<string | symbol, unknown> = {}
  const ctx = new Proxy(store, {
    get(target, prop) {
      if (prop in target) return target[prop]
      if (prop === 'createRadialGradient' || prop === 'createLinearGradient') return () => ({ addColorStop() {} })
      if (prop === 'measureText') return (text: string) => ({ width: 7 * String(text).length })
      if (prop === 'beginPath') return () => { points = []; curve = false }
      if (prop === 'moveTo' || prop === 'lineTo') return (x: number, y: number) => points.push(x, y)
      if (prop === 'bezierCurveTo') return (...xy: number[]) => { curve = true; points.push(...xy) }
      if (prop === 'stroke') return () => strokes.push({ curve, points, width: store.lineWidth as number, alpha: store.globalAlpha as number })
      return () => undefined
    },
    set(target, prop, value) {
      target[prop] = value
      return true
    },
  }) as unknown as CanvasRenderingContext2D
  return { ctx, strokes }
}

describe('the path drawn as a chain and bundles', () => {
  it('draws a line inside one nebula straight, and one between two as a curve', () => {
    const { scene, frame } = twoNebulae()
    expect(pathCurve(scene, frame, 0, 1).straight).toBe(true)
    const between = pathCurve(scene, frame, 0, 2)
    expect(between.straight).toBe(false)
    // From the prerequisite's star to the dependent's.
    expect(between.curve[0].x).toBeCloseTo(200)
    expect(between.curve[0].y).toBeCloseTo(300)
    expect(between.curve[3]).toEqual({ x: 600, y: 350 })
    const { ctx, strokes } = strokeRecorder()
    const stats = drawPath(ctx, scene, frame, THEME, { segments: [] })
    expect(stats).toEqual({ lines: 3, glows: 3, curves: 2 })
    expect(strokes.filter((s) => s.curve)).toHaveLength(3) // the side curve, and the chain's halo and core
  })

  it('bundles the lines between the same two nebulae: their middles closer than the straight lines’', () => {
    const { scene, frame } = twoNebulae()
    const one = pathCurve(scene, frame, 0, 2).curve
    const two = pathCurve(scene, frame, 1, 3).curve
    const apart = (p: { x: number; y: number }, q: { x: number; y: number }) => Math.hypot(p.x - q.x, p.y - q.y)
    const straightApart = apart(pointAt(straightCubic(one[0], one[3]), 0.5), pointAt(straightCubic(two[0], two[3]), 0.5))
    expect(apart(pointAt(one, 0.5), pointAt(two, 0.5))).toBeLessThan(straightApart * 0.5)
  })

  it('keeps the seam: a line across it takes the shorter way round, as a curve too', () => {
    const { scene, frame } = twoNebulae()
    scene.mapX[2] = 0.98
    scene.nebulae[1].x = 0.97
    frame.x[2] = 980
    const { curve } = pathCurve(scene, frame, 2, 0)
    // Star 0 at x 200 is anchored; star 2 is drawn 0.22 of a band to its left, not 0.78 to its right.
    expect(curve[3].x).toBe(200)
    expect(curve[0].x).toBeCloseTo(200 - 220, 0)
  })

  it('puts an arrowhead on the chain, and brightens the side branches of the star in focus', () => {
    const { scene, frame } = twoNebulae()
    let rec = strokeRecorder()
    drawPath(rec.ctx, scene, frame, THEME, { segments: [] })
    expect(rec.strokes.filter((s) => s.width === PATH.arrow.width)).toHaveLength(1)
    expect(rec.strokes.filter((s) => s.width === PATH.side.width).map((s) => s.alpha)).toEqual([PATH.side.alpha, PATH.side.alpha])
    // Star 2 in focus: its own side branch (0 -> 2) brightens, the other stays dim.
    rec = strokeRecorder()
    drawPath(rec.ctx, scene, { ...frame, focusStar: 2 }, THEME, { segments: [] })
    expect(rec.strokes.filter((s) => s.width === PATH.sideFocused.width).map((s) => s.alpha)).toEqual([PATH.sideFocused.alpha])
    expect(rec.strokes.filter((s) => s.width === PATH.side.width)).toHaveLength(1)
  })

  it('hands the chain’s pieces apart, for the step badges', () => {
    const { scene, frame } = twoNebulae()
    const segments: { x0: number; y0: number; x1: number; y1: number }[] = []
    const chain: typeof segments = []
    drawPath(strokeRecorder().ctx, scene, frame, THEME, { segments, chain })
    // The chain's one curve as `PATH.pieces` pieces; the side curve's and the straight line's too, in `segments`.
    expect(chain).toHaveLength(PATH.pieces)
    expect(segments).toHaveLength(PATH.pieces * 2 + 1)
  })

  it('leaves the star map’s own lines between stars straight', () => {
    const { scene, frame } = twoNebulae()
    const plain = {
      ...frame,
      path: undefined,
      lineReveal: { bridges: 0, tiers: [1, 1, 1, 1] },
      starFocus: 1,
      chosenNebula: 0,
      focusStar: 0,
      dotBlend: 0,
    } as unknown as SceneFrame
    const { ctx, strokes } = strokeRecorder()
    const stats = drawLinks(ctx, scene, plain, THEME, { segments: [], boxes: [] })
    expect(stats.lines).toBeGreaterThan(0)
    expect(strokes.length).toBeGreaterThan(0)
    expect(strokes.some((s) => s.curve)).toBe(false)
  })
})

// ---------------------------------------------------------------- the badges

describe('the step badges', () => {
  const at = (boxes: Box[], chain: { x0: number; y0: number; x1: number; y1: number }[] = []) => ({
    boxes,
    segments: chain,
    chain,
    area: { x0: 0, y0: 0, x1: 1000, y1: 1000 },
    starsNear: () => [],
    radius: () => 5,
    slots: new Map<number, number>(),
  })

  it('go up and left of their star when that is free', () => {
    const badges = placeStepBadges(fakeContext({ drawImage: 0, filterSets: 0 }), THEME, [0], [500], [500], at([]))
    expect(badges).toHaveLength(1)
    expect(badges[0].box).toEqual(stepSpots(500, 500, 5, STEP.height, STEP.height)[0])
    expect(badges[0].box.x1).toBeLessThan(500)
    expect(badges[0].box.y1).toBeLessThan(500)
  })

  it('keep clear of a star’s name, of each other, and of the chain', () => {
    // Two stars close together, a name over the first's up-left corner, the chain through the second's up-right one.
    const xs = [500, 512]
    const ys = [500, 500]
    const name: Box = { x0: 470, y0: 470, x1: 500, y1: 497 }
    const chain = [{ x0: 516, y0: 470, x1: 540, y1: 494 }]
    const placed = [name]
    const badges = placeStepBadges(fakeContext({ drawImage: 0, filterSets: 0 }), THEME, [0, 1], xs, ys, at(placed, chain))
    expect(badges.map((b) => b.step)).toEqual([1, 2])
    for (const badge of badges) {
      expect(boxesOverlap(badge.box, name)).toBe(false)
      expect(boxHitsSegment(badge.box, chain[0])).toBe(false)
    }
    expect(boxesOverlap(badges[0].box, badges[1].box)).toBe(false)
    // Both went in with the placed names, so the nebula names keep clear of them too.
    expect(placed).toHaveLength(3)
  })

  it('stay where they were while that spot is free', () => {
    const where = at([])
    where.slots.set(0, 2)
    const [badge] = placeStepBadges(fakeContext({ drawImage: 0, filterSets: 0 }), THEME, [0], [500], [500], where)
    expect(badge.box).toEqual(stepSpots(500, 500, 5, STEP.height, STEP.height)[2])
  })
})

describe('the badges on the real sky', () => {
  beforeEach(() => vi.stubGlobal('Path2D', class {}))
  afterEach(() => vi.unstubAllGlobals())

  it('number every step on screen, none over another', () => {
    const map = skyMap(1000, 'math', { relations: true })
    const path = map.stars
      .filter((star) => subjectOfNebula(map, star.nebulaId) === 'math')
      .map((star) => findStarPath(map, star.unitId))
      .find((found): found is FindStarPath => found !== null && chainSteps(found.edges, found.target).length >= 3)!
    const counter: CanvasCounter = { drawImage: 0, filterSets: 0, texts: [] }
    const real = createCanvas2DRenderer(fakeCanvas(counter), { createCanvas: (w, h) => fakeCanvas(counter, w, h) })!
    const renderer: StarMapRenderer = { ...real, draw: (next) => real.draw(next) }
    const clock = fakeClock()
    const engine = new StarMapEngine({ renderer, theme: THEME, reducedMotion: true, scheduler: clock, now: clock.now, foveate: false, galaxy: true })
    engine.setViewport(1440, 900, 1)
    engine.setData(map, { layer: 'map' })
    engine.setTarget({ layer: 'map', fly: true, frame: [path.target, ...path.missing] })
    engine.setPath(path)
    clock.advance(600)
    const badges = real.stats.stepBadges!
    const steps = chainSteps(path.edges, path.target)
    expect(badges.length).toBe(steps.length)
    expect(real.stats.path!.steps).toBe(steps.length)
    expect(badges.map((b) => b.step)).toEqual(steps.map((_, k) => k + 1))
    for (let i = 0; i < badges.length; i += 1) {
      for (let j = i + 1; j < badges.length; j += 1) expect(boxesOverlap(badges[i], badges[j])).toBe(false)
    }
    // Their numbers were painted.
    for (const { step } of badges) expect(counter.texts!.some((t) => t.text === String(step))).toBe(true)
    engine.setPath(null)
    clock.advance(1000)
    expect(real.stats.stepBadges).toEqual([])
    engine.destroy()
  })
})

// ---------------------------------------------------------------- the words

describe('the step in words, in four languages', () => {
  const bundles = { en, de, fr, it: it_ } as Record<string, { findStar: Record<string, string> }>

  it('names the step, the count and the star in every language, each in its own words', () => {
    for (const [language, bundle] of Object.entries(bundles)) {
      const step = bundle.findStar.step
      expect(step, language).toMatch(/\{\{step\}\}/)
      expect(step, language).toMatch(/\{\{total\}\}/)
      expect(step, language).toMatch(/\{\{name\}\}/)
      if (language !== 'en') expect(step, language).not.toBe(en.findStar.step)
    }
  })

  it('is said first for a star on the chain, as the badge numbers it', () => {
    const t = ((key: string, values?: Record<string, unknown>) =>
      key === 'findStar.step' ? `Step ${values?.step} of ${values?.total}: ${values?.name}` : key) as unknown as TFunction<'starmap'>
    const star = { unitId: 'u', name: 'Fractions', state: 'available', progress: 0, reviewDue: 0 } as unknown as Star
    expect(starLabel(t, star, { step: 3, total: 10 }).startsWith('Step 3 of 10: Fractions, ')).toBe(true)
    expect(starLabel(t, star).startsWith('Fractions, ')).toBe(true)
  })
})
