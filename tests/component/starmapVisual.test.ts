import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { StarMapEngine } from '@/features/starmap/engine/starMapEngine'
import { orderedNebulae, orderedStars } from '@/features/starmap/model/starMap'
import { NOT_ENROLLED_DIM } from '@/features/starmap/view/sky'
import type { FixtureSize } from '@/features/starmap/fixtures/demoSky'
import { nebulaLinks } from '@/features/starmap/model/links'
import { createCanvas2DRenderer } from '@/features/starmap/render/canvas2d'
import { belongsTo, boxHitsSegment, nebulaConnection, placeLabel } from '@/features/starmap/render/labels'
import { createTileCache, tileSizeFor } from '@/features/starmap/render/nebulaTiles'
import { nebulaFocusSpot } from '@/features/starmap/view/layers'
import type { SceneFrame, StarMapRenderer } from '@/features/starmap/render/types'
import { fakeCanvas, fakeClock, THEME, type CanvasCounter, skyMap } from './starmapHarness'

afterEach(() => vi.unstubAllGlobals())
beforeEach(() => vi.stubGlobal('Path2D', class {}))

function scene(points: FixtureSize, width: number, height: number, galaxy = false) {
  const counter: CanvasCounter = { drawImage: 0, filterSets: 0, texts: [] }
  let canvases = 0
  const real = createCanvas2DRenderer(fakeCanvas(counter), { createCanvas: (w, h) => {
    canvases += 1
    return fakeCanvas(counter, w, h)
  } })!
  let frame: SceneFrame
  const renderer: StarMapRenderer = { ...real, draw: (next) => { frame = next; real.draw(next) } }
  const clock = fakeClock()
  const engine = new StarMapEngine({ renderer, theme: THEME, reducedMotion: true, scheduler: clock, now: clock.now, foveate: false, galaxy })
  const map = skyMap(points, 'math', { relations: true })
  engine.setViewport(width, height, 2)
  engine.setData(map, { layer: 'map' })
  clock.advance(20)
  return { counter, real, clock, engine, map, frame: () => frame!, canvases: () => canvases }
}

describe('visual acceptance geometry (#76, #109)', () => {
  for (const points of [10, 500, 2000] as const) for (const [width, height] of [[1280, 776], [390, 700]]) {
    it(`${points} stars at ${width}×${height}: every drawn label belongs to its nebula and misses every connection`, () => {
      const s = scene(points, width, height)
      const f = s.frame()
      const nebulae = orderedNebulae(s.map)
      const names = nebulae.map((n) => n.name.toLocaleUpperCase())
      const circles = nebulae.map((_, n) => ({ x: f.nebulaX[n], y: f.nebulaY[n], r: f.nebulaR[n] }))
      const segments = nebulaLinks(s.map).flatMap((link) => nebulaConnection(
        circles[nebulae.findIndex((n) => n.topicId === link.a)],
        circles[nebulae.findIndex((n) => n.topicId === link.b)], Math.max(10, f.glyphSize * 0.65)).segments)
      const labels = s.counter.texts!.filter((t) => names.includes(t.text))
      expect(labels.length).toBeGreaterThan(0)
      if (width < 768) expect(labels.length).toBeLessThanOrEqual(4)
      for (const label of labels) {
        const n = names.indexOf(label.text)
        const half = (label.text.length * 7 + 8) / 2
        const box = { x0: label.x - half, x1: label.x + half, y0: label.y - 2, y1: label.y + 14 }
        expect(belongsTo(box, circles[n], circles.filter((_, m) => n !== m))).toBe(true)
        expect(segments.some((line) => boxHitsSegment(box, line))).toBe(false)
      }
      expect(f.dotBlend).toBe(1) // Even ten knowledge points retain a star-like overview scale.
      expect(f.dotRadius).toBeLessThanOrEqual(2.1)
      s.engine.destroy()
    })
  }

  it('refuses a label when every candidate crosses a connection', () => {
    const box = { x0: 20, x1: 60, y0: 20, y1: 40 }
    expect(placeLabel([box], { boxes: [], circles: [], segments: [{ x0: 0, y0: 30, x1: 80, y1: 30 }] },
      { x0: 0, x1: 100, y0: 0, y1: 100 })).toBeNull()
    // Centre alone is safe, but the right edge belongs to the neighbour: reject the entire label.
    expect(belongsTo({ x0: 0, x1: 80, y0: 0, y1: 16 }, { x: 0, y: 0, r: 10 }, [{ x: 100, y: 0, r: 10 }])).toBe(false)
  })

  it('bridges a tiny rim gap with a visible curve and anchors outside the outermost stars', () => {
    const a = { x: 0, y: 0, r: 50 }, b = { x: 130, y: 0, r: 50 }
    const path = nebulaConnection(a, b, 14)
    expect(path.bridge).toBe(true)
    const first = path.segments[0], last = path.segments[path.segments.length - 1]
    expect(Math.hypot(first.x0 - a.x, first.y0 - a.y)).toBeCloseTo(64)
    expect(Math.hypot(last.x1 - b.x, last.y1 - b.y)).toBeCloseTo(64)
    expect(path.segments.reduce((sum, s) => sum + Math.hypot(s.x1 - s.x0, s.y1 - s.y0), 0)).toBeGreaterThan(24)
    expect(nebulaConnection(a, { ...b, x: 300 }, 14).bridge).toBe(false)
  })

  it('names related destinations beyond the viewport in the nebula layer', () => {
    const s = scene(500, 390, 700)
    s.counter.texts = []
    s.engine.setTarget({ layer: 'nebula', nebulaId: orderedNebulae(s.map)[0].topicId })
    s.clock.advance(300)
    const destinations = s.counter.texts.filter((t) => /^[↖↗↙↘] /.test(t.text))
    expect(destinations.length).toBeGreaterThan(0)
    for (const t of destinations) {
      expect(t.x).toBeGreaterThan(12)
      expect(t.x).toBeLessThan(378)
    }
    s.engine.destroy()
  })

  it('keeps a measured, wrapped focus pill inside phone bounds instead of assuming 280 px', () => {
    const viewport = { width: 390, height: 700 }, bands = { top: 144, bottom: 72 }
    for (const x of [-200, 0, 200, 800]) for (const width of [200, 326, 358]) {
      const pill = { width, height: 84 }
      const spot = nebulaFocusSpot({ x, y: 600, r: 40 }, viewport, bands, pill)
      expect(spot.x - width / 2).toBeGreaterThanOrEqual(0)
      expect(spot.x + width / 2).toBeLessThanOrEqual(viewport.width)
      expect(spot.y).toBeGreaterThanOrEqual(bands.top)
      expect(spot.y + pill.height).toBeLessThanOrEqual(viewport.height - bands.bottom)
    }
  })
})

describe('cached atmosphere and resolution tiers', () => {
  it('does not allocate or repaint sky/tile canvases on idle redraws or pointer hover', () => {
    const s = scene(500, 390, 700)
    const made = s.canvases()
    const tiles = s.real.stats.tilePaints
    s.real.draw(s.frame())
    s.engine.hoverAt(s.frame().nebulaX[0], s.frame().nebulaY[0])
    s.clock.advance(20)
    expect(s.frame().hoveredNebula).toBe(0)
    expect(s.canvases()).toBe(made)
    expect(s.real.stats.tilePaints).toBe(tiles)
    expect(s.clock.pending).toBe(0)
    s.engine.destroy()
  })

  it('upgrades once for a bigger nebula and keeps the tier on zoom-out', () => {
    const paint = vi.fn((_index: number, size: number) => ({ size, haze: fakeCanvas({ drawImage: 0, filterSets: 0 }), stars: fakeCanvas({ drawImage: 0, filterSets: 0 }) }))
    const cache = createTileCache(paint)
    expect(tileSizeFor(200, 2)).toBe(256)
    cache.get(0, 'same', 64)
    cache.get(0, 'same', 256)
    cache.get(0, 'same', 128)
    cache.get(0, 'same', 256)
    expect(paint).toHaveBeenCalledTimes(2)
    expect(cache.get(0, 'same', 64).size).toBe(256)
  })
})


describe('one sky: galaxies of nebulae (#119)', () => {
  it.each([[1280, 776], [390, 700]])('keeps real star clicks in their own topic at %s×%s', (width, height) => {
    const s = scene(500, width, height, true)
    const navigate = vi.fn()
    const renderer = { ...s.real, draw: vi.fn() }
    const engine = new StarMapEngine({ renderer, theme: THEME, reducedMotion: true, scheduler: s.clock, now: s.clock.now, galaxy: true, onRequestTarget: navigate })
    engine.setViewport(width, height, 2)
    engine.setData(s.map, { layer: 'map' })
    s.clock.advance(20)
    const frame = renderer.draw.mock.calls[0][0]
    const onScreen = s.map.stars.findIndex((_, i) => frame.x[i] > 40 && frame.x[i] < width - 40 && frame.y[i] > 160 && frame.y[i] < height - 100)
    const star = orderedStars(s.map)[onScreen]
    engine.pointerDown(1, frame.x[onScreen], frame.y[onScreen])
    engine.pointerUp(1, frame.x[onScreen], frame.y[onScreen])
    expect(navigate).toHaveBeenCalledWith({ layer: 'nebula', nebulaId: star.nebulaId })
    engine.destroy()
    s.engine.destroy()
  })

  it('opens on the galaxy in focus: the window on the band is that galaxy, never the whole band squeezed in', () => {
    for (const [width, height] of [[1440, 844], [390, 760]]) {
      const s = scene(1000, width, height, true)
      const f = s.frame()
      const nebulae = orderedNebulae(s.map)
      const math = nebulae.flatMap((n, i) => (n.subjectId === 'math' ? [i] : []))
      const chemistry = nebulae.flatMap((n, i) => (n.subjectId === 'chemistry' ? [i] : []))
      const middle = math.reduce((sum, n) => sum + f.nebulaX[n], 0) / math.length
      expect(Math.abs(middle - width / 2)).toBeLessThan(width * 0.12)
      // Chemistry is two galaxies along: off screen.
      for (const n of chemistry) expect(f.nebulaX[n] - f.nebulaR[n]).toBeGreaterThan(width)
      // Not turned on a phone: the band still runs left to right.
      const ys = math.map((n) => f.nebulaY[n])
      const xs = math.map((n) => f.nebulaX[n])
      expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(Math.max(...ys) - Math.min(...ys))
      s.engine.destroy()
    }
  })

  it('gives every nebula its own tint between blue-violet and gold, and dims a subject not taken', () => {
    const s = scene(1000, 1440, 844, true)
    const engine = s.engine as unknown as { scene: { nebulae: { topicId: string; tint: number; dim: number }[]; galaxies: { subjectId: string; dim: number }[] } }
    const { nebulae, galaxies } = engine.scene
    for (const nebula of nebulae) {
      expect(nebula.tint).toBeGreaterThanOrEqual(0)
      expect(nebula.tint).toBeLessThanOrEqual(1)
    }
    expect(new Set(nebulae.map((n) => n.tint.toFixed(3))).size).toBe(nebulae.length)
    const subject = new Map(s.map.nebulae.map((n) => [n.topicId, n.subjectId]))
    for (const nebula of nebulae) expect(nebula.dim).toBe(subject.get(nebula.topicId) === 'chemistry' ? NOT_ENROLLED_DIM : 1)
    expect(galaxies.map((g) => [g.subjectId, g.dim])).toEqual([['math', 1], ['physics', 1], ['chemistry', NOT_ENROLLED_DIM]])
    s.engine.destroy()
  })

  it('flies to another galaxy when the switcher asks, keeping every tile, and names the galaxy at the centre once at rest', () => {
    const counter: CanvasCounter = { drawImage: 0, filterSets: 0 }
    const real = createCanvas2DRenderer(fakeCanvas(counter), { createCanvas: (w, h) => fakeCanvas(counter, w, h) })!
    const frames: SceneFrame[] = []
    const renderer: StarMapRenderer = { ...real, draw: (next) => { frames.push({ ...next, nebulaX: Float32Array.from(next.nebulaX) }); real.draw(next) } }
    const clock = fakeClock()
    const centred = vi.fn()
    const engine = new StarMapEngine({ renderer, theme: THEME, reducedMotion: false, scheduler: clock, now: clock.now, galaxy: true, onCentreGalaxy: centred })
    engine.setViewport(1440, 844, 1)
    const math = skyMap(1000, 'math')
    engine.setData(math, { layer: 'map' })
    clock.advance(50)
    const paints = real.stats.tilePaints
    const physics = skyMap(1000, 'physics')
    engine.setData(physics, { layer: 'map' })
    clock.advance(2000)
    const nebulae = orderedNebulae(physics)
    const own = nebulae.flatMap((n, i) => (n.subjectId === 'physics' ? [i] : []))
    const last = frames[frames.length - 1]
    const middle = own.reduce((sum, n) => sum + last.nebulaX[n], 0) / own.length
    expect(Math.abs(middle - 720)).toBeLessThan(1440 * 0.12)
    // A flight, not a jump: frames in between.
    expect(frames.length).toBeGreaterThan(10)
    expect(real.stats.tilePaints - paints).toBeLessThan(nebulae.length)
    // Arrived where it was sent: nothing to report.
    expect(centred).not.toHaveBeenCalled()
    // A drag to chemistry, and once at rest the header is told.
    engine.pointerDown(1, 1300, 400)
    for (let x = 1300; x >= 200; x -= 50) {
      engine.pointerMove(1, x, 400)
      clock.advance(16)
    }
    engine.pointerUp(1, 200, 400)
    clock.advance(3000)
    expect(centred).toHaveBeenLastCalledWith('chemistry')
    engine.destroy()
  })

  it('caches galaxy haze and nebula clouds, and repaints only the cloud whose star changed', () => {
    const s = scene(500, 390, 700, true)
    // The second frame at one zoom keeps the light as one image (a pan then moves only that).
    s.real.draw(s.frame())
    const made = s.canvases()
    const blits = s.counter.drawImage
    s.real.draw(s.frame())
    s.clock.advance(200)
    expect(s.canvases()).toBe(made)
    // A redraw at rest: the sky, one image of light, the stars -- no cloud drawn one by one.
    const perFrame = s.counter.drawImage - blits
    s.real.draw(s.frame())
    expect(s.counter.drawImage - blits).toBe(perFrame * 2)
    expect(perFrame).toBeLessThan(2 + s.map.stars.length)
    const paints = s.real.stats.tilePaints
    const ready = s.map.stars.find((star) => star.state === 'ready')!
    s.engine.setData({ ...s.map, stars: s.map.stars.map((star) => (star === ready ? { ...star, state: 'in_progress' } : star)) }, { layer: 'map' })
    s.clock.advance(20)
    s.real.draw(s.frame())
    expect(s.real.stats.tilePaints - paints).toBeLessThanOrEqual(1)
    s.engine.destroy()
  })
})
