/**
 * Foveated rendering (#72 point 6): only the focus -- near the focus point,
 * and the chosen nebula -- is drawn star by star; every other nebula is one
 * pre-rendered, blurred tile, repainted only when its star states change or a larger resolution is needed.
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

  it('draws a big map star by star everywhere with foveation switched off, for the phone bench (#44)', () => {
    const renderer = recordingRenderer()
    const clock = fakeClock()
    const engine = new StarMapEngine({ renderer, theme: THEME, reducedMotion: true, scheduler: clock, now: clock.now, foveate: false })
    engine.setViewport(W, H, 2)
    engine.setData(map500, { layer: 'map' })
    clock.advance(20)
    const frame = renderer.last()
    expect(frame.sharpness.every((s) => s === 1)).toBe(true)
    expect(frame.starAlpha.every((a) => a === 1)).toBe(true)
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
    counter = { drawImage: 0, filterSets: 0, texts: [] }
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

  it('repaints tiles for every state change, including changes with identical lit counts', () => {
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

    // Ready → locked keeps the lit fraction but changes the tile's actual dots.
    const ready = map500.stars.find((s) => s.state === 'ready')!
    const shuffled: StarMap = { ...map500, stars: map500.stars.map((s) => (s === ready ? { ...s, state: 'locked' as const } : s)) }
    engine.setData(shuffled, { layer: 'map' })
    clock.advance(20)
    expect(renderer.stats.tilePaints).toBe(nebulaCount + 1)

    // A star lights up: exactly its nebula's tile is repainted.
    const lit: StarMap = { ...shuffled, stars: shuffled.stars.map((s) => (s.unitId === ready.unitId ? { ...s, state: 'lit' as const } : s)) }
    engine.setData(lit, { layer: 'map' })
    clock.advance(20)
    clock.advance(500)
    expect(renderer.stats.tilePaints).toBe(nebulaCount + 2)
  })

  it('never reuses a tile across maps: a subject switch repaints every tile', () => {
    const renderer = realRenderer()
    const { clock, engine } = engineWith(renderer, map500, true)
    const nebulaCount = orderedNebulae(map500).length
    expect(renderer.stats.tilePaints).toBe(nebulaCount)
    // Another subject with the same topic ids and the same lit counts: only its identity differs.
    const other: StarMap = { ...map500, subject: { subjectId: 'physics', name: 'Physics' } }
    engine.setData(other, { layer: 'map' })
    clock.advance(20)
    expect(renderer.stats.tilePaints).toBe(nebulaCount * 2)
    // The same subject laid out differently (mirrored): new layout, new tiles.
    const mirrored: StarMap = { ...other, stars: other.stars.map((star) => ({ ...star, x: 1 - star.x })) }
    engine.setData(mirrored, { layer: 'map' })
    clock.advance(20)
    expect(renderer.stats.tilePaints).toBe(nebulaCount * 3)
  })

  it('places each nebula name by its own nebula, never over another name, and not at all when its nebula is off screen', () => {
    counter.texts = []
    const renderer = realRenderer()
    const { clock, engine } = engineWith(renderer, map500, true)
    const frame = renderer.frames[renderer.frames.length - 1]
    const names = orderedNebulae(map500).map((n) => n.name.toLocaleUpperCase())
    const drawn = counter.texts.filter((t) => names.includes(t.text))
    expect(drawn.length).toBeGreaterThan(3)
    const boxes = drawn.map((t) => {
      const n = names.indexOf(t.text)
      const half = (7 * t.text.length + 8) / 2
      // By its own nebula: within its disc plus one label height of it.
      const gap = Math.max(0, Math.hypot(t.x - frame.nebulaX[n], t.y - frame.nebulaY[n]) - frame.nebulaR[n])
      expect(gap).toBeLessThan(half + 24)
      return { x0: t.x - half, x1: t.x + half, y0: t.y, y1: t.y + 16 }
    })
    for (let i = 0; i < boxes.length; i += 1) {
      for (let j = i + 1; j < boxes.length; j += 1) {
        const a = boxes[i]
        const b = boxes[j]
        expect(a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0).toBe(false)
      }
    }
    // Pan far to one side: nebulae now off screen have no name drawn anywhere.
    counter.texts = []
    engine.pointerDown(1, 100, 400)
    for (let i = 1; i <= 10; i += 1) {
      engine.pointerMove(1, 100 + i * 90, 400)
      clock.advance(16)
    }
    // Only the frame drawn after letting go counts (reduced motion: no glide, one frame).
    counter.texts = []
    engine.pointerUp(1, 1000, 400)
    clock.advance(20)
    const moved = renderer.frames[renderer.frames.length - 1]
    const offScreen = names.filter((_, n) => moved.nebulaX[n] > W || moved.nebulaX[n] < 0)
    expect(offScreen.length).toBeGreaterThan(0)
    expect(counter.texts.length).toBeGreaterThan(0)
    for (const name of offScreen) expect(counter.texts.some((t) => t.text === name)).toBe(false)
  })

  it('rings the nebula whose link has keyboard focus, and brings it into the focus region', () => {
    const renderer = realRenderer()
    const { clock, engine } = engineWith(renderer, map500, true)
    const first = renderer.frames[renderer.frames.length - 1]
    const far = first.sharpness.findIndex((s) => s === 0)
    engine.setFocusNebula(far)
    clock.advance(300)
    expect(renderer.stats.highlightNebula).toBe(far)
    const frame = renderer.frames[renderer.frames.length - 1]
    expect(frame.sharpness[far]).toBe(1)
    const fx = W * engine.currentView.fx
    const fy = H * engine.currentView.fy
    expect(Math.hypot(frame.nebulaX[far] - fx, frame.nebulaY[far] - fy)).toBeLessThan(1)
    engine.setFocusNebula(-1)
    clock.advance(20)
    expect(renderer.stats.highlightNebula).toBe(-1)
  })

  it('hands the parallel DOM the final positions when a focus pan ends, with nothing breathing on screen', () => {
    // Audit of #71: at /map/math/algebra, focusing Geometry panned the canvas
    // but the DOM kept the pre-pan positions, because the flight's last frame
    // was treated as moving and no later frame came (the recommended star,
    // in Numbers, is off screen).
    const map = starMapFixture(10)
    const recording = recordingRenderer()
    let discs: { x: number; y: number; r: number }[] = []
    let stars: { index: number; x: number; y: number }[] = []
    const clock = fakeClock()
    const engine = new StarMapEngine({
      renderer: recording,
      theme: THEME,
      reducedMotion: false,
      scheduler: clock,
      now: clock.now,
      onVisibleChange: (visible, _glyph, nebulae) => {
        stars = visible
        discs = nebulae
      },
    })
    engine.setViewport(W, H, 2, { top: 76, bottom: 164 })
    engine.setData(map, { layer: 'nebula', nebulaId: 'algebra' })
    clock.advance(20)
    for (const [n, nebula] of orderedNebulae(map).entries()) {
      engine.setFocusNebula(n)
      clock.advance(600)
      const frame = recording.last()
      expect(Math.hypot(discs[n].x - frame.nebulaX[n], discs[n].y - frame.nebulaY[n]), nebula.name).toBeLessThan(1)
      for (const star of stars) {
        expect(Math.abs(star.x - frame.x[star.index])).toBeLessThan(1)
        expect(Math.abs(star.y - frame.y[star.index])).toBeLessThan(1)
      }
      engine.setFocusNebula(-1)
      clock.advance(20)
    }
    engine.destroy()
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
