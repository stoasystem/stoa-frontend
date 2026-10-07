import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { StarMapEngine } from '@/features/starmap/engine/starMapEngine'
import { orderedNebulae, orderedStars } from '@/features/starmap/model/starMap'
import { NOT_ENROLLED_DIM } from '@/features/starmap/view/sky'
import type { FixtureSize } from '@/dev/demo/sky/demoSky'
import { nebulaLinks } from '@/features/starmap/model/links'
import { createCanvas2DRenderer } from '@/features/starmap/render/canvas2d'
import { CLOUD_REACH, galaxyHazeBox } from '@/features/starmap/render/galaxy'
import { belongsTo, boxHitsSegment, placeLabel } from '@/features/starmap/render/labels'
import { bridgeAxis } from '@/features/starmap/render/links'
import { createTileCache, tileSizeFor } from '@/features/starmap/render/nebulaTiles'
import { nebulaFocusSpot } from '@/features/starmap/view/layers'
import type { SceneData, SceneFrame, StarMapRenderer } from '@/features/starmap/render/types'
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
      // The panorama's soft bridges (#121), one per related pair of nebulae, while drawn (#134: they give way to star lines by zoom).
      const segments = f.lineReveal.bridges <= 0 ? [] : nebulaLinks(s.map).flatMap((link) => bridgeAxis(
        circles[nebulae.findIndex((n) => n.topicId === link.a)],
        circles[nebulae.findIndex((n) => n.topicId === link.b)]) ?? [])
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

  it('trims a bridge into both clouds, and leaves out one between clouds that touch (#121)', () => {
    const a = { x: 0, y: 0, r: 50 }, b = { x: 300, y: 0, r: 50 }
    const axis = bridgeAxis(a, b)!
    expect(axis.x0).toBeCloseTo(27.5)
    expect(axis.x1).toBeCloseTo(272.5)
    expect(bridgeAxis(a, { ...b, x: 80 })).toBeNull()
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
      // Chemistry is two galaxies along, which on the ring (#120) is math's left
      // neighbour across the seam: off screen, to the left.
      for (const n of chemistry) expect(f.nebulaX[n] + f.nebulaR[n]).toBeLessThan(0)
      // Not turned on a phone: the band still runs left to right.
      const ys = math.map((n) => f.nebulaY[n])
      const xs = math.map((n) => f.nebulaX[n])
      expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(Math.max(...ys) - Math.min(...ys))
      s.engine.destroy()
    }
  })

  it('gives every nebula its own shade near its galaxy’s base colour (#143), and dims a subject not taken', () => {
    const s = scene(1000, 1440, 844, true)
    const engine = s.engine as unknown as { scene: { nebulae: { topicId: string; colour: readonly number[]; dim: number }[]; galaxies: { subjectId: string; dim: number }[] } }
    const { nebulae, galaxies } = engine.scene
    for (const nebula of nebulae) {
      expect(nebula.colour).toHaveLength(3)
      for (const channel of nebula.colour) expect(channel).toBeGreaterThanOrEqual(0)
      for (const channel of nebula.colour) expect(channel).toBeLessThanOrEqual(255)
    }
    expect(new Set(nebulae.map((n) => n.colour.join(','))).size).toBeGreaterThan(nebulae.length * 0.8)
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
    // A drag to chemistry (put down, no glide), and once at rest the header is told.
    engine.pointerDown(1, 1300, 400)
    for (let x = 1300; x >= 200; x -= 50) {
      engine.pointerMove(1, x, 400)
      clock.advance(16)
    }
    clock.advance(200)
    engine.pointerUp(1, 200, 400)
    clock.advance(3000)
    expect(centred).toHaveBeenLastCalledWith('chemistry')
    engine.destroy()
  })

  it.each([[1440, 900], [390, 844]])('names only the nebula under the pointer at %s×%s, never another (#123)', (width, height) => {
    for (const points of [1000, 2000] as const) {
      const s = scene(points, width, height, true)
      const nebulae = orderedNebulae(s.map)
      const names = nebulae.map((n) => n.name.toLocaleUpperCase())
      const f = s.frame()
      const wrong: string[] = []
      const unnamed: string[] = []
      for (let n = 0; n < nebulae.length; n += 1) {
        const [x, y] = [f.nebulaX[n], f.nebulaY[n]]
        if (x < 0 || y < 0 || x > width || y > height) continue
        s.engine.hoverAt(x, y)
        s.counter.texts = []
        s.clock.advance(20)
        s.real.draw(s.frame())
        const hovered = s.frame().hoveredNebula ?? -1
        expect(hovered, `pointer on ${names[n]}`).toBe(n)
        const drawn = s.counter.texts.filter((t) => names.includes(t.text)).map((t) => t.text)
        for (const text of drawn) if (text !== names[n]) wrong.push(`${names[n]} -> ${text}`)
        if (!drawn.includes(names[n])) unnamed.push(names[n])
      }
      expect(wrong, `${points} stars`).toEqual([])
      // And the name drawn is its own: every nebula on screen is named when hovered.
      expect(unnamed, `${points} stars`).toEqual([])
      s.engine.destroy()
    }
  })

  it.each([[1440, 900], [390, 844]])('keyboard focus on the whole sky names no other nebula, of any galaxy, at %s×%s (#123)', (width, height) => {
    const s = scene(1000, width, height, true)
    const nebulae = orderedNebulae(s.map)
    const names = nebulae.map((n) => n.name.toLocaleUpperCase())
    const stars = orderedStars(s.map)
    const named = () => {
      s.counter.texts = []
      s.real.draw(s.frame())
      return s.counter.texts.filter((t) => names.includes(t.text)).map((t) => t.text)
    }
    const others: string[] = []
    // A nebula's link: its name is the focus pill (parallel DOM); the canvas adds none.
    for (let n = 0; n < nebulae.length; n += 1) {
      s.engine.setFocusNebula(n)
      s.clock.advance(400)
      expect(s.frame().highlightNebula).toBe(n)
      for (const text of named()) if (text !== names[n]) others.push(`${names[n]}: ${text}`)
      s.engine.setFocusNebula(-1)
      s.clock.advance(20)
    }
    // A recommended star's link on the whole map: no nebula's name either, but its own.
    for (const i of stars.flatMap((star, k) => (star.recommendation ? [k] : []))) {
      const own = names[nebulae.findIndex((n) => n.topicId === stars[i].nebulaId)]
      s.engine.setFocusStar(i)
      s.clock.advance(20)
      for (const text of named()) if (text !== own) others.push(`star in ${own}: ${text}`)
      s.engine.setFocusStar(-1)
      s.clock.advance(20)
    }
    expect(others).toEqual([])
    s.engine.destroy()
  })

  it('caches the light of the whole margin: nothing missing at the right or bottom after a pan (#123)', () => {
    // Every offscreen canvas records what is drawn into it, so the light cache can be read back.
    type Blit = { x: number; y: number; w: number; h: number }
    const blits = new Map<HTMLCanvasElement, Blit[]>()
    const counter: CanvasCounter = { drawImage: 0, filterSets: 0 }
    const recording = (w: number, h: number) => {
      const canvas = fakeCanvas(counter, w, h)
      const list: Blit[] = []
      const ctx = canvas.getContext('2d')!
      const own = new Proxy(ctx, {
        get: (target, prop) =>
          prop === 'drawImage'
            ? (_image: unknown, x: number, y: number, dw: number, dh: number) => list.push({ x, y, w: dw, h: dh })
            : Reflect.get(target, prop),
      })
      const recorded = { get width() { return canvas.width }, set width(v) { canvas.width = v },
        get height() { return canvas.height }, set height(v) { canvas.height = v }, getContext: () => own } as unknown as HTMLCanvasElement
      blits.set(recorded, list)
      return recorded
    }
    const real = createCanvas2DRenderer(fakeCanvas(counter), { createCanvas: recording })!
    let frame!: SceneFrame
    const renderer: StarMapRenderer = { ...real, draw: (next) => { frame = next; real.draw(next) } }
    const clock = fakeClock()
    const engine = new StarMapEngine({ renderer, theme: THEME, reducedMotion: true, scheduler: clock, now: clock.now, galaxy: true })
    const [width, height] = [1440, 900]
    engine.setViewport(width, height, 1)
    engine.setData(skyMap(1000, 'math'), { layer: 'map' })
    clock.advance(20)
    for (const n of Array.from(blits.values())) n.length = 0
    // The second frame at one zoom paints the cache: the view grown by the margin on every side.
    real.draw(frame)
    const margin = Math.round(Math.max(width, height) * 0.25)
    const cache = [...blits.entries()].find(([canvas]) => canvas.width === width + 2 * margin && canvas.height === height + 2 * margin)
    expect(cache, 'the light cache').toBeDefined()
    const drawn = cache![1]
    const missing: number[] = []
    let expected = 0
    for (let n = 0; n < frame.nebulaX.length; n += 1) {
      const reach = frame.nebulaR[n] * CLOUD_REACH
      // In cache space: the cloud's box shifted by the margin.
      const x = frame.nebulaX[n] - reach + margin
      const y = frame.nebulaY[n] - reach + margin
      if (x + 2 * reach <= 0 || y + 2 * reach <= 0 || x >= width + 2 * margin || y >= height + 2 * margin) continue
      expected += 1
      if (!drawn.some((b) => Math.abs(b.x - x) < 0.5 && Math.abs(b.y - y) < 0.5 && Math.abs(b.w - 2 * reach) < 0.5)) missing.push(n)
    }
    // The physics galaxy to the right reaches into the margin: a pan left shows it from the cache.
    expect(expected).toBeGreaterThan(0)
    expect(missing).toEqual([])
    // And each galaxy's haze that reaches into the cache is in it.
    const scene = (engine as unknown as { scene: SceneData }).scene
    scene.galaxies!.forEach((galaxy, g) => {
      const box = galaxyHazeBox(galaxy)
      const turn = frame.galaxyShift?.[g] ?? 0
      const x0 = frame.ox + (box.x0 + turn) * frame.scale + margin
      const x1 = frame.ox + (box.x1 + turn) * frame.scale + margin
      if (x1 <= 0 || x0 >= width + 2 * margin) return
      expect(drawn.some((b) => Math.abs(b.x - x0) < 0.5 && Math.abs(b.w - (x1 - x0)) < 0.5), galaxy.subjectId).toBe(true)
    })
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
