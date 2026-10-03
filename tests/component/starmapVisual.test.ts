import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { StarMapEngine } from '@/features/starmap/engine/starMapEngine'
import { demoGalaxyPositions } from '@/features/starmap/fixtures/demoGalaxy'
import { starMapFixture } from '@/features/starmap/fixtures/starMapFixtures'
import { orderedNebulae } from '@/features/starmap/model/starMap'
import { nebulaLinks } from '@/features/starmap/model/links'
import { createCanvas2DRenderer } from '@/features/starmap/render/canvas2d'
import { belongsTo, boxHitsSegment, nebulaConnection, placeLabel } from '@/features/starmap/render/labels'
import { createTileCache, tileSizeFor } from '@/features/starmap/render/nebulaTiles'
import { nebulaFocusSpot } from '@/features/starmap/view/layers'
import type { SceneFrame, StarMapRenderer } from '@/features/starmap/render/types'
import { fakeCanvas, fakeClock, THEME, type CanvasCounter } from './starmapHarness'

afterEach(() => vi.unstubAllGlobals())
beforeEach(() => vi.stubGlobal('Path2D', class {}))

function scene(points: 10 | 500 | 2000, width: number, height: number, galaxy = false) {
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
  const base = starMapFixture(points)
  const positions = demoGalaxyPositions(base.stars)
  const map = galaxy ? { ...base, stars: base.stars.map((star, i) => ({ ...star, ...positions[i] })) } : base
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


describe('knowledge stars fill the sky', () => {
  it.each([500, 1000, 2000] as const)('%s real points cover the full field, including outside the dense cloud', (count) => {
    const fixture = starMapFixture(count)
    const positions = demoGalaxyPositions(fixture.stars)
    expect(demoGalaxyPositions(fixture.stars)).toEqual(positions)
    const bins = Array<number>(60).fill(0)
    positions.forEach((p) => {
      expect(p.x).toBeGreaterThanOrEqual(0)
      expect(p.x).toBeLessThanOrEqual(1)
      expect(p.y).toBeGreaterThanOrEqual(0)
      expect(p.y).toBeLessThanOrEqual(1)
      bins[Math.min(5, Math.floor((p.y - 0.28) / 0.44 * 6)) * 10 + Math.min(9, Math.floor((p.x - 0.03) / 0.94 * 10))] += 1
    })
    expect(bins.filter((count) => count > 0).length).toBeGreaterThanOrEqual(58)
    expect(positions.filter((p) => p.y < 0.355).length).toBeGreaterThan(count * 0.07)
    expect(positions.filter((p) => p.y > 0.645).length).toBeGreaterThan(count * 0.07)
  })

  it.each([[1280, 776], [390, 700]])('keeps real star clicks in their own topic at %s×%s', (width, height) => {
    const s = scene(500, width, height, true)
    const navigate = vi.fn()
    const renderer = { ...s.real, draw: vi.fn() }
    const engine = new StarMapEngine({ renderer, theme: THEME, reducedMotion: true, scheduler: s.clock, now: s.clock.now, galaxy: true, onRequestTarget: navigate })
    engine.setViewport(width, height, 2)
    engine.setData(s.map, { layer: 'map' })
    s.clock.advance(20)
    const frame = renderer.draw.mock.calls[0][0]
    const x = frame.x[0], y = frame.y[0]
    engine.pointerDown(1, x, y)
    engine.pointerUp(1, x, y)
    expect(navigate).toHaveBeenCalledWith({ layer: 'nebula', nebulaId: s.map.stars[0].nebulaId })
    engine.destroy()
    s.engine.destroy()
  })

  it('caches the coordinate-aligned glow and updates it when a knowledge star changes colour', () => {
    const s = scene(500, 390, 700, true)
    const made = s.canvases()
    s.real.draw(s.frame())
    s.clock.advance(200)
    expect(s.canvases()).toBe(made)
    const ready = s.map.stars.find((star) => star.state === 'ready')!
    s.engine.setData({ ...s.map, stars: s.map.stars.map((star) => star === ready ? { ...star, state: 'in_progress' } : star) }, { layer: 'map' })
    s.clock.advance(20)
    expect(s.canvases()).toBeGreaterThan(made)
    s.engine.destroy()
  })
})
