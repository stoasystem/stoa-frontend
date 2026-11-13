/**
 * No star or nebula name is written across a galaxy name (user report: at
 * the panorama, "Volume and surface area" printed over the letters of
 * "MATHEMATICS"). While a galaxy name is clearly drawn, its letters are an
 * obstacle the name placement knows about: a name takes another free spot,
 * and where none is free (a key star's name insists) it sits there on the
 * dark backing, so it stays legible. A fainter galaxy name is no obstacle,
 * and a galaxy name stepping back for a hovered nebula does not move names.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { StarMapEngine } from '@/features/starmap/engine/starMapEngine'
import { createCanvas2DRenderer } from '@/features/starmap/render/canvas2d'
import { galaxyNameBoxes, galaxyNamePlacements, type GalaxyNamePlacement } from '@/features/starmap/render/galaxyNames'
import { boxesOverlap, keyStars, placeInsisting, placeLabel, type Box } from '@/features/starmap/render/labels'
import { STATE_IN_PROGRESS, type SceneData, type SceneFrame, type StarMapRenderer } from '@/features/starmap/render/types'
import { PANORAMA } from '@/features/starmap/view/semanticZoom'
import { fakeCanvas, fakeClock, skyMap, THEME, type CanvasCounter } from './starmapHarness'

afterEach(() => vi.unstubAllGlobals())
beforeEach(() => vi.stubGlobal('Path2D', class {}))

const CHAR = 7

type Written = { text: string; x: number; y: number; backed: boolean }

/** A 2D context that records every `fillText` and whether a backing was filled just before it; text is `CHAR` px a character. */
function textContext(log: Written[]) {
  const store: Record<string | symbol, unknown> = { globalAlpha: 1 }
  const gradient = { addColorStop() {} }
  let backing: Box | null = null
  return new Proxy(store, {
    get(target, prop) {
      if (prop in target) return target[prop]
      if (prop === 'createRadialGradient' || prop === 'createLinearGradient') return () => gradient
      if (prop === 'measureText') return (text: string) => ({ width: CHAR * String(text).length })
      if (prop === 'roundRect' || prop === 'rect') return (x: number, y: number, w: number, h: number) => { backing = { x0: x, y0: y, x1: x + w, y1: y + h } }
      if (prop === 'beginPath') return () => { backing = null }
      if (prop === 'fillText') {
        return (text: string, x: number, y: number) => {
          const backed = backing !== null && x > backing.x0 && x < backing.x1 && y >= backing.y0 && y <= backing.y1
          log.push({ text, x, y, backed })
        }
      }
      return () => undefined
    },
    set(target, prop, value) {
      target[prop] = value
      return true
    },
    has(target, prop) {
      return prop in target
    },
  }) as unknown as CanvasRenderingContext2D
}

/** The real renderer and engine over the one sky, far out on the panorama. */
function session(width: number, height: number) {
  const log: Written[] = []
  const counter: CanvasCounter = { drawImage: 0, filterSets: 0 }
  const main = { width: 1, height: 1, getContext: () => textContext(log) } as unknown as HTMLCanvasElement
  const real = createCanvas2DRenderer(main, { createCanvas: (w, h) => fakeCanvas(counter, w, h) })!
  let frame: SceneFrame | null = null
  let scene: SceneData | null = null
  const renderer: StarMapRenderer = {
    ...real,
    draw: (next) => {
      frame = next
      real.draw(next)
    },
    setData: (next) => {
      scene = next
      real.setData(next)
    },
  }
  const clock = fakeClock()
  const engine = new StarMapEngine({ renderer, theme: THEME, reducedMotion: true, scheduler: clock, now: clock.now, foveate: false, galaxy: true })
  engine.setViewport(width, height, 1, { top: 76, bottom: 164 })
  engine.setData(skyMap(1000, 'math', { relations: true }), { layer: 'map' })
  clock.advance(40)
  /** Draw `f` over `s` (both as given); what it wrote. */
  const drawWith = (s: SceneData, f: SceneFrame) => {
    real.setData(s)
    log.length = 0
    real.draw(f)
    return [...log]
  }
  return { real, engine, drawWith, scene: () => scene!, frame: () => frame! }
}

/** A star name's box as the renderer wrote it: centred on `x`, its top 1 px above `y`, 17 px tall. */
const nameBox = (w: Written): Box => {
  const half = (CHAR * w.text.length + 6) / 2
  return { x0: w.x - half, y0: w.y - 1, x1: w.x + half, y1: w.y + 16 }
}

const placement = (over: Partial<GalaxyNamePlacement>): GalaxyNamePlacement => ({
  galaxy: 0, text: 'MATHEMATICS', x: 500, y: 400, px: 40, alpha: 0.13, clear: 1, colour: [200, 210, 255], ...over,
})

describe('a galaxy name is an obstacle to other names while it is clearly drawn', () => {
  it('its box is round its letters; a name drawn fainter than `keepClear` of its ink has none', () => {
    const { keepClear, inkHeight, pad } = PANORAMA.galaxyName
    const [box] = galaxyNameBoxes([placement({})], () => 300)
    expect(box).toEqual({ x0: 500 - 150 - pad, y0: 400 - 20 * inkHeight - pad, x1: 500 + 150 + pad, y1: 400 + 20 * inkHeight + pad })
    expect(galaxyNameBoxes([placement({ clear: keepClear - 0.01 })], () => 300)).toHaveLength(0)
    expect(galaxyNameBoxes([placement({ clear: keepClear })], () => 300)).toHaveLength(1)
  })

  it('stepping back for a hovered nebula leaves its box where it was, so a hover never moves other names', () => {
    const s = session(1440, 900)
    const scene = s.scene()
    const frame = s.frame()
    const before = galaxyNamePlacements(scene, frame, THEME)
    const after = galaxyNamePlacements(scene, frame, THEME, scene.galaxies!.map(() => 1))
    expect(after.map((p) => p.clear)).toEqual(before.map((p) => p.clear))
    expect(after[0].alpha).toBeLessThan(before[0].alpha)
    s.engine.destroy()
  })

  it('a name whose first spot is on a galaxy name takes the next free one; none free: left out', () => {
    const area: Box = { x0: 0, y0: 0, x1: 800, y1: 800 }
    const spots: Box[] = [
      { x0: 100, y0: 100, x1: 180, y1: 117 },
      { x0: 100, y0: 60, x1: 180, y1: 77 },
    ]
    const letters: Box = { x0: 60, y0: 95, x1: 400, y1: 125 }
    expect(placeLabel(spots, { boxes: [], circles: [], segments: [] }, area)).toBe(spots[0])
    expect(placeLabel(spots, { boxes: [], circles: [], segments: [], covers: [letters] }, area)).toBe(spots[1])
    expect(placeLabel([spots[0]], { boxes: [], circles: [], segments: [], covers: [letters] }, area)).toBeNull()
  })

  it('a key star’s name prefers a spot further out to the galaxy name’s letters, and sits on them only if nothing else is left', () => {
    const area: Box = { x0: 0, y0: 0, x1: 800, y1: 800 }
    const near: Box = { x0: 100, y0: 100, x1: 180, y1: 117 }
    const far: Box = { x0: 100, y0: 114, x1: 180, y1: 131 }
    const letters: Box = { x0: 60, y0: 95, x1: 400, y1: 112 }
    // Seven spots in between cost their order: the farthest spot (16th) still wins over the letters.
    const between: Box[] = Array.from({ length: 14 }, () => ({ x0: 900, y0: 900, x1: 980, y1: 917 }))
    expect(placeInsisting([near, ...between, far], [], [], [], [], area, undefined, [letters])).toBe(far)
    // Nothing else: still placed, on them (the renderer gives it the backing).
    expect(placeInsisting([near], [], [], [], [], area, undefined, [letters])).toBe(near)
  })
})

describe('the renderer keeps key star names off a galaxy name, or backs them', () => {
  it('moving the galaxy name onto a key star’s name moves the name off it or puts it on the dark backing', () => {
    const s = session(1440, 900)
    const scene = s.scene()
    // Star names in, far out: the galaxy name whole.
    const frame: SceneFrame = { ...s.frame(), starLabelAlpha: 1, pastPanorama: 1, starNameReach: undefined }
    const key = keyStars(scene, STATE_IN_PROGRESS)
    const galaxies = scene.galaxies!
    // The galaxy name moved far off: where each key star's name goes on its own.
    const away: SceneData = { ...scene, galaxies: galaxies.map((g) => ({ ...g, y0: g.y0 + 1e5, y1: g.y1 + 1e5 })) }
    const alone = s.drawWith(away, frame)
    expect(s.real.stats.galaxyNameBoxes).toHaveLength(0)
    const names = new Set(scene.names.filter((_, i) => key[i] === 1))
    const named = alone.filter((w) => names.has(w.text) && !w.backed)
    expect(named.length).toBeGreaterThan(0)
    const target = named[0]
    const spot = nameBox(target)

    // Now the math galaxy's name right where that name was.
    const g = galaxies.findIndex((galaxy) => galaxy.subjectId === 'math')
    const placed = galaxyNamePlacements(scene, frame, THEME).find((p) => p.galaxy === g)!
    const dx = ((spot.x0 + spot.x1) / 2 - placed.x) / frame.scale
    const dy = ((spot.y0 + spot.y1) / 2 - placed.y) / frame.scale
    const onIt: SceneData = {
      ...scene,
      galaxies: galaxies.map((galaxy, k) => (k === g ? { ...galaxy, x0: galaxy.x0 + dx, x1: galaxy.x1 + dx, y0: galaxy.y0 + dy, y1: galaxy.y1 + dy } : galaxy)),
    }
    const written = s.drawWith(onIt, frame)
    const letters = s.real.stats.galaxyNameBoxes ?? []
    expect(letters.some((b) => boxesOverlap(b, spot))).toBe(true)
    const again = written.find((w) => w.text === target.text)
    expect(again).toBeDefined()
    // Off the letters, or on the backing: never bare across them.
    expect(again!.backed || !letters.some((b) => boxesOverlap(b, nameBox(again!)))).toBe(true)
    // And no star name at all is written bare across the letters.
    for (const w of written) {
      if (!scene.names.includes(w.text) || w.backed) continue
      expect(letters.some((b) => boxesOverlap(b, nameBox(w)))).toBe(false)
    }
    s.engine.destroy()
  })

  it('a nebula name the galaxy name moves onto also moves off it or gets the backing', () => {
    const s = session(1440, 900)
    const scene = s.scene()
    const frame: SceneFrame = { ...s.frame(), nebulaLabelAlpha: 1, nebulaNames: undefined, pastPanorama: 1 }
    const galaxies = scene.galaxies!
    const away: SceneData = { ...scene, galaxies: galaxies.map((g) => ({ ...g, y0: g.y0 + 1e5, y1: g.y1 + 1e5 })) }
    s.drawWith(away, frame)
    const first = (s.real.stats.nebulaNames ?? [])[0]
    expect(first).toBeDefined()
    const spot: Box = { x0: first.x0, y0: first.y0, x1: first.x1, y1: first.y1 }
    const g = galaxies.findIndex((galaxy) => galaxy.subjectId === 'math')
    const placed = galaxyNamePlacements(scene, frame, THEME).find((p) => p.galaxy === g)!
    const dx = ((spot.x0 + spot.x1) / 2 - placed.x) / frame.scale
    const dy = ((spot.y0 + spot.y1) / 2 - placed.y) / frame.scale
    const onIt: SceneData = {
      ...scene,
      galaxies: galaxies.map((galaxy, k) => (k === g ? { ...galaxy, x0: galaxy.x0 + dx, x1: galaxy.x1 + dx, y0: galaxy.y0 + dy, y1: galaxy.y1 + dy } : galaxy)),
    }
    const written = s.drawWith(onIt, frame)
    const letters = s.real.stats.galaxyNameBoxes ?? []
    expect(letters.some((b) => boxesOverlap(b, spot))).toBe(true)
    const drawn = s.real.stats.nebulaNames ?? []
    expect(drawn.length).toBeGreaterThan(0)
    for (const name of drawn) {
      const text = scene.nebulae[name.nebula].name.toLocaleUpperCase()
      const backed = written.some((w) => w.text === text && w.backed)
      expect(backed || !letters.some((b) => boxesOverlap(b, name))).toBe(true)
    }
    s.engine.destroy()
  })
})
