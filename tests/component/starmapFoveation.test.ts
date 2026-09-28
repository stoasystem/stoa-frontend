/**
 * Foveated rendering (#72 point 6): only the focus -- near the focus point,
 * and the chosen nebula -- is drawn star by star; every other nebula is one
 * pre-rendered, blurred tile, repainted only when its lit fraction changes.
 *
 * Poison (#72): repaint the tiles on every frame (key the tile cache on
 * anything that changes per frame) and "repaints a tile only when..." goes red.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { StarMapEngine } from '@/features/starmap/engine/starMapEngine'
import { starMapFixture } from '@/features/starmap/fixtures/starMapFixtures'
import { orderedNebulae, orderedStars, type StarMap } from '@/features/starmap/model/starMap'
import { createCanvas2DRenderer } from '@/features/starmap/render/canvas2d'
import type { SceneFrame, StarMapRenderer } from '@/features/starmap/render/types'
import { DRAW_THRESHOLD, focusBand, sharpnessOf } from '@/features/starmap/view/foveation'
import { fakeCanvas, fakeClock, recordingRenderer, THEME, type CanvasCounter, type RecordingRenderer } from './starmapHarness'

const W = 1280
const H = 776
const map500 = starMapFixture(500)

function engineWith(renderer: StarMapRenderer, map: StarMap = map500, reducedMotion = true) {
  const clock = fakeClock()
  const engine = new StarMapEngine({ renderer, theme: THEME, reducedMotion, scheduler: clock, now: clock.now })
  engine.setViewport(W, H, 2)
  engine.setData(map, { layer: 'map' })
  clock.advance(20)
  return { clock, engine }
}

const nebulaOfStar = (map: StarMap) => {
  const order = orderedNebulae(map).map((n) => n.topicId)
  return orderedStars(map).map((star) => order.indexOf(star.nebulaId))
}

describe('the focus band', () => {
  const band = focusBand(W, H)

  it('is sharp near the focus point, a tile far from it, and soft between', () => {
    expect(sharpnessOf(640, 388, 40, 640, 388, band, false)).toBe(1)
    expect(sharpnessOf(640 + 40 + band.outer + 1, 388, 40, 640, 388, band, false)).toBe(0)
    const between = sharpnessOf(640 + 40 + (band.inner + band.outer) / 2, 388, 40, 640, 388, band, false)
    expect(between).toBeGreaterThan(0)
    expect(between).toBeLessThan(1)
  })

  it('always keeps the chosen nebula sharp', () => {
    expect(sharpnessOf(-5000, -5000, 10, 640, 388, band, true)).toBe(1)
  })
})

describe('the engine draws only the focus star by star', () => {
  it('leaves every star of a nebula outside the focus to its tile (but the recommended one)', () => {
    const renderer = recordingRenderer()
    engineWith(renderer)
    const frame = renderer.last()
    const nebulaOf = nebulaOfStar(map500)
    const blurred = frame.sharpness.map((s, n) => (s === 0 ? n : -1)).filter((n) => n >= 0)
    const sharp = frame.sharpness.filter((s) => s === 1)
    expect(blurred.length).toBeGreaterThan(2)
    expect(sharp.length).toBeGreaterThan(0)
    const recommended = orderedStars(map500).findIndex((star) => star.recommendation)
    frame.starAlpha.forEach((alpha, i) => expect(alpha).toBe(i === recommended ? 1 : frame.sharpness[nebulaOf[i]]))
    const drawn = frame.starAlpha.filter((a) => a >= DRAW_THRESHOLD).length
    expect(drawn).toBeLessThan(map500.stars.length * 0.8)
  })

  it('draws a small map star by star everywhere', () => {
    const renderer = recordingRenderer()
    engineWith(renderer, starMapFixture(10))
    expect(renderer.last().sharpness.every((s) => s === 1)).toBe(true)
  })

  it('moves the focus with a pan: a nebula brought to the middle turns sharp', () => {
    const renderer = recordingRenderer()
    const { clock, engine } = engineWith(renderer)
    const first = renderer.last()
    const far = first.sharpness.findIndex((s) => s === 0)
    const [fx, fy] = [W * 0.5, H * 0.52]
    // Drag the far nebula's centre to the focus point.
    engine.pointerDown(1, first.nebulaX[far], first.nebulaY[far])
    for (let i = 1; i <= 10; i += 1) {
      engine.pointerMove(1, first.nebulaX[far] + ((fx - first.nebulaX[far]) * i) / 10, first.nebulaY[far] + ((fy - first.nebulaY[far]) * i) / 10)
      clock.advance(16)
    }
    engine.pointerUp(1, fx, fy)
    clock.advance(20)
    expect(renderer.last().sharpness[far]).toBe(1)
  })

  it('keeps the chosen nebula sharp in the nebula layer, wherever it sits', () => {
    const renderer = recordingRenderer()
    const { clock, engine } = engineWith(renderer)
    const chosen = orderedNebulae(map500)[5].topicId
    engine.setTarget({ layer: 'nebula', nebulaId: chosen })
    clock.advance(300)
    const frame = renderer.last()
    const index = orderedNebulae(map500).findIndex((n) => n.topicId === chosen)
    expect(frame.chosenNebula).toBe(index)
    expect(frame.sharpness[index]).toBe(1)
  })
})

describe('the Canvas 2D renderer: sprites for the focus, tiles for the rest', () => {
  let counter: CanvasCounter
  let made: number

  beforeEach(() => {
    counter = { drawImage: 0, filterSets: 0 }
    made = 0
    vi.stubGlobal('Path2D', class {})
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  /** The real renderer on a fake canvas, with every frame it is given kept. */
  function realRenderer() {
    const renderer = createCanvas2DRenderer(fakeCanvas(counter, W * 2, H * 2), {
      createCanvas: (w, h) => {
        made += 1
        return fakeCanvas(counter, w, h)
      },
    })!
    const frames: SceneFrame[] = []
    const tee: StarMapRenderer & { frames: SceneFrame[] } = {
      kind: renderer.kind,
      get stats() {
        return renderer.stats
      },
      frames,
      resize: (v, d) => renderer.resize(v, d),
      setTheme: (t) => renderer.setTheme(t),
      setData: (d) => renderer.setData(d),
      snapshot: () => renderer.snapshot(),
      destroy: () => renderer.destroy(),
      draw(frame) {
        frames.push({ ...frame, starAlpha: Float32Array.from(frame.starAlpha), x: Float32Array.from(frame.x), y: Float32Array.from(frame.y) })
        renderer.draw(frame)
      },
    }
    return tee
  }

  it('draws a sprite for each star in focus and none for the others', () => {
    const renderer = realRenderer()
    engineWith(renderer)
    const frame = renderer.frames[renderer.frames.length - 1]
    let expected = 0
    frame.starAlpha.forEach((a, i) => {
      const x = frame.x[i]
      const y = frame.y[i]
      const m = frame.glyphSize * 2
      if (a >= DRAW_THRESHOLD && x > -m && y > -m && x < W + m && y < H + m) expected += 1
    })
    expect(renderer.stats.starDraws).toBe(expected)
    expect(renderer.stats.starDraws).toBeLessThan(map500.stars.length)
    // Every nebula on screen is one tile.
    expect(renderer.stats.tileDraws).toBe(orderedNebulae(map500).length)
    expect(made).toBeGreaterThan(0)
  })

  it('repaints a tile only when its nebula’s lit fraction changes', () => {
    const renderer = realRenderer()
    const { clock, engine } = engineWith(renderer, map500, false)
    const nebulaCount = orderedNebulae(map500).length
    // The whole map is on screen at first: every tile painted once.
    expect(renderer.stats.tilePaints).toBe(nebulaCount)

    // Breathing frames, a pan, a zoom in and back out: no tile repainted.
    clock.advance(1000)
    engine.pointerDown(1, 600, 400)
    for (let i = 1; i <= 8; i += 1) {
      engine.pointerMove(1, 600 + i * 6, 400 - i * 4)
      clock.advance(16)
    }
    engine.pointerUp(1, 648, 368)
    clock.advance(1000)
    engine.setTarget({ layer: 'nebula', nebulaId: orderedNebulae(map500)[0].topicId })
    clock.advance(600)
    engine.setTarget({ layer: 'map' })
    clock.advance(600)
    expect(renderer.stats.frames).toBeGreaterThan(100)
    expect(renderer.stats.tilePaints).toBe(nebulaCount)

    // A star changes state but its nebula's lit fraction does not: still none.
    const ready = map500.stars.find((s) => s.state === 'ready')!
    const shuffled: StarMap = { ...map500, stars: map500.stars.map((s) => (s === ready ? { ...s, state: 'locked' as const } : s)) }
    engine.setData(shuffled, { layer: 'map' })
    clock.advance(20)
    expect(renderer.stats.tilePaints).toBe(nebulaCount)

    // A star lights up: exactly its nebula's tile is repainted.
    const lit: StarMap = { ...shuffled, stars: shuffled.stars.map((s) => (s.unitId === ready.unitId ? { ...s, state: 'lit' as const } : s)) }
    engine.setData(lit, { layer: 'map' })
    clock.advance(20)
    clock.advance(500)
    expect(renderer.stats.tilePaints).toBe(nebulaCount + 1)
  })

  it('never blurs per frame: no filter is ever set on the canvas', () => {
    const renderer = realRenderer()
    const { clock } = engineWith(renderer, map500, false)
    clock.advance(500)
    // Every context the renderer touched -- the screen, sprites, tiles -- is fake and counts it.
    expect(counter.filterSets).toBe(0)
    expect(renderer.stats.frames).toBeGreaterThan(10)
  })
})

describe('the parallel DOM is not blurred', () => {
  it('lists every star on screen, whether its nebula is sharp or a tile', () => {
    const renderer: RecordingRenderer = recordingRenderer()
    const listed: number[][] = []
    const clock = fakeClock()
    const engine = new StarMapEngine({
      renderer,
      theme: THEME,
      reducedMotion: true,
      scheduler: clock,
      now: clock.now,
      onVisibleChange: (stars) => listed.push(stars.map((s) => s.index)),
    })
    engine.setViewport(W, H, 2)
    engine.setData(map500, { layer: 'map' })
    clock.advance(20)
    const frame = renderer.last()
    const onScreen = frame.x.map((x, i) => i).filter((i) => frame.x[i] >= -8 && frame.y[i] >= -8 && frame.x[i] <= W + 8 && frame.y[i] <= H + 8)
    expect(listed[listed.length - 1]).toEqual(onScreen)
    const blurredListed = listed[listed.length - 1].filter((i) => frame.starAlpha[i] === 0)
    expect(blurredListed.length).toBeGreaterThan(50)
  })
})
