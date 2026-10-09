/**
 * The panorama's light (#137, round two A2 / A3 / A4 / C4 of #123): far out
 * the sky reads as glowing nebulae grouped into galaxies, not as a scatter of
 * gold grains.
 *
 *   A2  lit dots are small and dim on the panorama, the cloud glows by its lit share
 *   A3  each galaxy's name, very faint, fading continuously as the zoom closes in;
 *       a stronger base tint on the panorama; a galaxy not taken stays dimmed
 *   A4  a phone held upright starts one zoom step further out: the galaxy fits
 *   C4  the galaxy haze is dithered
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { StarMapEngine } from '@/features/starmap/engine/starMapEngine'
import { orderedNebulae } from '@/features/starmap/model/starMap'
import { createCanvas2DRenderer } from '@/features/starmap/render/canvas2d'
import {
  ditherHaze,
  GALAXY_HAZE_ALPHA,
  galaxyHazeAlpha,
  hazeDitherAmplitude,
  KNOWLEDGE_GLOW_ALPHA,
  NEBULA_GLOW,
  nebulaGlowAlpha,
  paintGalaxyHaze,
} from '@/features/starmap/render/galaxy'
import { GALAXY_NAME_INK, galaxyNameAside, galaxyNamePlacements, galaxyNameSize } from '@/features/starmap/render/galaxyNames'
import { seededRandom } from '@/features/starmap/layout/layout'
import type { SceneData, SceneFrame, StarMapRenderer } from '@/features/starmap/render/types'
import { galaxyNameAlpha, PANORAMA, panoramaDot, panoramaLook, ramp, REVEAL, ZOOM } from '@/features/starmap/view/semanticZoom'
import { NOT_ENROLLED_DIM, panoramaZoom, skyBounds, skyGalaxies } from '@/features/starmap/view/sky'
import { baseScale, usableHeight } from '@/features/starmap/view/camera'
import { fakeCanvas, fakeClock, skyMap, THEME, type CanvasCounter } from './starmapHarness'

afterEach(() => vi.unstubAllGlobals())
beforeEach(() => vi.stubGlobal('Path2D', class {}))

const BANDS = { top: 120, bottom: 90 }

function session(width: number, height: number, points: 1000 | 2000 = 1000, subjectId = 'math', reducedMotion = true) {
  const counter: CanvasCounter = { drawImage: 0, filterSets: 0, texts: [] }
  const real = createCanvas2DRenderer(fakeCanvas(counter), { createCanvas: (w, h) => fakeCanvas(counter, w, h) })!
  const frames: SceneFrame[] = []
  let scene: SceneData | null = null
  const renderer: StarMapRenderer = {
    ...real,
    setData: (next) => {
      scene = next
      real.setData(next)
    },
    draw: (next) => {
      frames.push({ ...next })
      real.draw(next)
    },
  }
  const clock = fakeClock()
  const engine = new StarMapEngine({ renderer, theme: THEME, reducedMotion, scheduler: clock, now: clock.now, galaxy: true })
  const map = skyMap(points, subjectId)
  engine.setViewport(width, height, 1, BANDS)
  engine.setData(map, { layer: 'map' })
  clock.advance(20)
  return { engine, clock, frames, real, map, counter, scene: () => scene!, last: () => frames[frames.length - 1] }
}

const alphaOf = (colour: string) => Number(colour.match(/[\d.]+/g)![3])

describe('A2: on the panorama the light is the nebulae’s, not the dots’', () => {
  it('a lit dot is smaller and dimmer far out, and loses its glow; zoomed in it is as before', () => {
    const far = panoramaDot(true, 1)
    expect(far.radius).toBeLessThan(0.8)
    expect(far.alpha).toBeLessThan(0.75)
    expect(far.glow).toBe(0)
    expect(panoramaDot(true, 0)).toEqual({ radius: 1, alpha: 1, glow: 1 })
    expect(panoramaDot(false, 0)).toEqual({ radius: 1, alpha: 1, glow: 1 })
    // A lit dot gives up more than a ready or locked one: the gold grains are what went.
    const other = panoramaDot(false, 1)
    expect(far.radius * far.alpha).toBeLessThan(other.radius * other.alpha)
    // Continuous in the look, and only ever quieter towards the panorama.
    let previous = panoramaDot(true, 0)
    for (let t = 0.05; t <= 1.0001; t += 0.05) {
      const next = panoramaDot(true, t)
      expect(next.radius).toBeLessThanOrEqual(previous.radius + 1e-9)
      expect(previous.radius - next.radius).toBeLessThan(0.05)
      expect(next.alpha).toBeLessThanOrEqual(previous.alpha + 1e-9)
      previous = next
    }
  })

  it('a nebula glows by its lit share at every zoom, far brighter on the panorama; a fully lit one several times an unlit one', () => {
    for (const look of [0, 0.3, 0.7, 1]) {
      let previous = -1
      for (let share = 0; share <= 1.0001; share += 0.1) {
        const glow = nebulaGlowAlpha(share, look)
        expect(glow).toBeGreaterThan(previous)
        previous = glow
      }
    }
    expect(nebulaGlowAlpha(0, 0)).toBeCloseTo(NEBULA_GLOW.base, 9)
    expect(nebulaGlowAlpha(1, 0)).toBeCloseTo(NEBULA_GLOW.base + NEBULA_GLOW.lit, 9)
    expect(nebulaGlowAlpha(1, 1)).toBeGreaterThan(2.5 * nebulaGlowAlpha(0, 1))
    expect(nebulaGlowAlpha(1, 1)).toBeGreaterThan(2 * nebulaGlowAlpha(1, 0))
  })

  for (const [width, height] of [[1440, 900], [1280, 776], [3440, 1440], [390, 844], [375, 812]] as const) {
    it(`${width}×${height}: the engine starts on the full panorama look, and it gives way as the lines come in`, () => {
      const s = session(width, height)
      const first = s.last()
      expect(first.pastPanorama).toBeCloseTo(1, 6)
      // The full look on the panorama, unless the screen is so wide that its farthest zoom already shows lines.
      expect(panoramaLook(first.pastPanorama!, first.starPx)).toBeCloseTo(1 - ramp(first.starPx!, REVEAL.linesNear), 9)
      if (first.starPx! <= REVEAL.linesNear[0]) expect(panoramaLook(first.pastPanorama!, first.starPx)).toBe(1)
      // Zoom in until the knowledge lines are fully in: the panorama's light gives way as they come
      // (never more of it than the lines' share still missing), and is gone once they are whole, so
      // names, lines and glyph rings at rest only ever sit on the zoomed-in light (KNOWLEDGE_GLOW_ALPHA).
      for (let i = 0; i < 600 && s.engine.zoom.starPx < REVEAL.starNameIn[0]; i += 1) {
        s.engine.wheelBy(-5, width / 2, height / 2)
        s.clock.advance(20)
      }
      for (const frame of s.frames) {
        const look = panoramaLook(frame.pastPanorama!, frame.starPx)
        expect(look).toBeLessThanOrEqual(1 - frame.lineReveal.tiers[1] + 1e-9)
        if (frame.starPx! >= REVEAL.linesNear[1]) expect(look).toBe(0)
      }
      expect(s.engine.zoom.starPx).toBeGreaterThanOrEqual(REVEAL.starNameIn[0])
      s.engine.destroy()
    })
  }
})

describe('A3: each galaxy is named far out, and reads as one whole', () => {
  it('the name’s visibility is a continuous, monotone function of the zoom: whole on the panorama, gone by the second threshold', () => {
    expect(galaxyNameAlpha(1)).toBe(1)
    expect(galaxyNameAlpha(PANORAMA.galaxyName.out[1])).toBe(0)
    let previous = 1
    for (let past = 1; past <= 2.2; past += 0.005) {
      const alpha = galaxyNameAlpha(past)
      expect(alpha).toBeLessThanOrEqual(previous + 1e-12)
      // No step: a 0.5% zoom never moves it by more than 2%.
      expect(previous - alpha).toBeLessThan(0.02)
      previous = alpha
    }
  })

  it('fades over many frames while the wheel zooms in, never jumping', () => {
    const s = session(1440, 900, 1000, 'math', false)
    for (let i = 0; i < 12; i += 1) {
      s.engine.wheelBy(-30, 720, 450)
      s.clock.advance(60)
    }
    s.clock.advance(600)
    const alphas = s.frames.map((frame) => galaxyNameAlpha(frame.pastPanorama!))
    const fading = alphas.filter((alpha) => alpha > 0.01 && alpha < 0.99)
    expect(fading.length).toBeGreaterThan(5)
    for (let i = 1; i < alphas.length; i += 1) expect(Math.abs(alphas[i] - alphas[i - 1])).toBeLessThan(0.15)
    expect(alphas[alphas.length - 1]).toBe(0)
    s.engine.destroy()
  })

  it('places the subject’s name, large and faint, under its galaxy; a galaxy not taken dimmed; none once zoomed in', () => {
    const s = session(1440, 900)
    const scene = s.scene()
    const frame = s.last()
    const placed = galaxyNamePlacements(scene, frame, THEME)
    const math = placed.find((t) => t.text === 'MATHEMATICS')!
    expect(math).toBeDefined()
    expect(math.px).toBeGreaterThanOrEqual(PANORAMA.galaxyName.minPx)
    expect(math.alpha).toBeGreaterThan(0.05)
    expect(math.alpha).toBeLessThan(0.2)
    expect(math.alpha).toBeCloseTo(alphaOf(GALAXY_NAME_INK), 6)
    // Under its stars: below the galaxy's lowest star on screen.
    const galaxy = scene.galaxies!.find((g) => g.subjectId === 'math')!
    expect(math.y).toBeGreaterThan(frame.oy + galaxy.y1 * frame.scale)
    expect(math.x).toBeGreaterThan(0)
    expect(math.x).toBeLessThan(1440)

    // The galaxy not taken: centred on chemistry, its name is drawn at NOT_ENROLLED_DIM of math's.
    const c = session(1440, 900, 1000, 'chemistry')
    const chemistry = galaxyNamePlacements(c.scene(), c.last(), THEME).find((t) => t.text === 'CHEMISTRY')!
    expect(chemistry.alpha).toBeCloseTo(math.alpha * NOT_ENROLLED_DIM, 6)

    // Zoomed in: no galaxy names at all.
    expect(galaxyNamePlacements(scene, { ...frame, pastPanorama: PANORAMA.galaxyName.out[1] + 0.01 }, THEME)).toHaveLength(0)
    s.engine.destroy()
    c.engine.destroy()
  })

  it('the canvas falls back to exactly the sky token, which the contrast gate records as decorative', () => {
    const css = readFileSync(path.resolve(__dirname, '../../src/styles/brand-tokens.css'), 'utf8')
    const sky = css.slice(css.indexOf('[data-surface="sky"] {'))
    expect(/--starmap-galaxy-name:\s*([^;]+);/.exec(sky)?.[1].trim()).toBe(GALAXY_NAME_INK)
    const pairs = JSON.parse(readFileSync(path.resolve(__dirname, '../../scripts/contrast-pairs.json'), 'utf8')) as { pairs: { fg: string; gate?: boolean; why?: string }[] }
    const pair = pairs.pairs.find((p) => p.fg === '--starmap-galaxy-name')!
    expect(pair.gate).toBe(false)
    expect(pair.why).toMatch(/#137/)
  })

  it('a neighbour’s name fades as it moves aside, so no cut-off letters linger at an edge', () => {
    expect(galaxyNameAside(0, 1440)).toBe(1)
    expect(galaxyNameAside(1440 * PANORAMA.galaxyName.aside[1], 1440)).toBe(0)
    expect(galaxyNameAside(-200, 1440)).toBe(galaxyNameAside(200, 1440))
    expect(galaxyNameSize(10)).toBe(PANORAMA.galaxyName.minPx)
    expect(galaxyNameSize(1e5)).toBe(PANORAMA.galaxyName.maxPx)
  })

  it('the renderer draws the names far out from sprites set once, and counts them', () => {
    const s = session(1440, 900)
    s.clock.advance(40)
    expect(s.real.stats.galaxyNames).toBeGreaterThan(0)
    const set = s.counter.texts!.filter((t) => t.text === 'MATHEMATICS').length
    expect(set).toBe(1)
    // Panning far out redraws the names without setting them again.
    const frames = s.frames.length
    s.engine.pointerDown(1, 700, 450)
    for (let i = 1; i <= 6; i += 1) {
      s.engine.pointerMove(1, 700 - 10 * i, 450)
      s.clock.advance(17)
    }
    s.engine.pointerUp(1, 640, 450)
    s.clock.advance(100)
    expect(s.frames.length).toBeGreaterThan(frames + 3)
    expect(s.real.stats.galaxyNames).toBeGreaterThan(0)
    expect(s.counter.texts!.filter((t) => t.text === 'MATHEMATICS').length).toBe(set)
    s.engine.destroy()
  })

  it('the base tint is several times stronger on the panorama; zoomed in it is as before (the contrast bound holds)', () => {
    expect(galaxyHazeAlpha(1)).toBe(PANORAMA.galaxyHaze)
    expect(galaxyHazeAlpha(1)).toBeGreaterThanOrEqual(3 * GALAXY_HAZE_ALPHA)
    expect(galaxyHazeAlpha(0)).toBe(GALAXY_HAZE_ALPHA)
    expect(KNOWLEDGE_GLOW_ALPHA).toBeCloseTo(galaxyHazeAlpha(0) + nebulaGlowAlpha(1, 0), 9)
  })
})

describe('A4: a phone held upright starts one zoom step further out', () => {
  for (const [width, height] of [[390, 844], [375, 812]] as const) {
    it(`${width}×${height}: every star of the galaxy in view is on screen at the start`, () => {
      for (const subjectId of ['math', 'physics', 'chemistry']) {
        const s = session(width, height, 2000, subjectId)
        const frame = s.last()
        const scene = s.scene()
        const galaxy = scene.galaxies!.findIndex((g) => g.subjectId === subjectId)
        const own = new Set(scene.galaxies![galaxy].nebulae)
        let xs = 0
        for (let i = 0; i < scene.count; i += 1) {
          if (!own.has(scene.nebula[i])) continue
          xs += 1
          expect(frame.x[i]).toBeGreaterThan(0)
          expect(frame.x[i]).toBeLessThan(width)
          expect(frame.y[i]).toBeGreaterThan(BANDS.top)
          expect(frame.y[i]).toBeLessThan(height - BANDS.bottom)
        }
        expect(xs).toBeGreaterThan(100)
        s.engine.destroy()
      }
    })
  }

  it('one button step further out than before on a phone; a landscape screen exactly as before', () => {
    const map = skyMap(1000, 'math')
    const galaxies = skyGalaxies(map)
    const bounds = skyBounds(galaxies)
    const before = (viewport: { width: number; height: number; top: number; bottom: number }) => {
      const tallest = Math.max(...galaxies.map((g) => g.y1 - g.y0))
      const widest = Math.max(...galaxies.map((g) => g.x1 - g.x0))
      return Math.max(1, Math.min((usableHeight(viewport) * 0.8) / tallest, (viewport.width * 1.3) / widest) / baseScale(viewport, bounds))
    }
    for (const viewport of [{ width: 1440, height: 900, ...BANDS }, { width: 1280, height: 776, ...BANDS }, { width: 3440, height: 1440, ...BANDS }]) {
      expect(panoramaZoom(galaxies, bounds, viewport)).toBe(before(viewport))
    }
    for (const viewport of [{ width: 390, height: 844, ...BANDS }, { width: 375, height: 812, ...BANDS }]) {
      expect(before(viewport) / panoramaZoom(galaxies, bounds, viewport)).toBeCloseTo(ZOOM.buttonStep, 6)
    }
    expect(orderedNebulae(map).length).toBeGreaterThan(0)
  })
})

describe('C4: the galaxy haze is dithered', () => {
  it('moves each hazy pixel by at most the amplitude, keeps the mean, leaves the dark untouched', () => {
    const width = 512
    const pixels = new Uint8ClampedArray(width * 4)
    // A slow ramp of alpha: the kind of gradient that fell into bands.
    for (let x = 0; x < width; x += 1) pixels[x * 4 + 3] = x < 64 ? 0 : Math.round(((x - 64) / (width - 64)) * 120)
    const before = Uint8ClampedArray.from(pixels)
    const amplitude = hazeDitherAmplitude(1)
    ditherHaze(pixels, amplitude, seededRandom(1))
    let changed = 0
    let sum = 0
    let sumBefore = 0
    for (let x = 0; x < width; x += 1) {
      const [a, b] = [pixels[x * 4 + 3], before[x * 4 + 3]]
      if (b === 0) expect(a).toBe(0)
      expect(Math.abs(a - b)).toBeLessThanOrEqual(Math.ceil(amplitude))
      if (a !== b) changed += 1
      sum += a
      sumBefore += b
    }
    expect(changed).toBeGreaterThan(width / 2)
    expect(Math.abs(sum - sumBefore) / sumBefore).toBeLessThan(0.02)
    // Deterministic: the same seed, the same pixels.
    const again = Uint8ClampedArray.from(before)
    ditherHaze(again, amplitude, seededRandom(1))
    expect(Array.from(again)).toEqual(Array.from(pixels))
  })

  it('reaches PANORAMA.dither drawn levels, more in a dimmed galaxy (drawn fainter)', () => {
    expect(hazeDitherAmplitude(1) * PANORAMA.galaxyHaze).toBeCloseTo(PANORAMA.dither, 9)
    expect(hazeDitherAmplitude(NOT_ENROLLED_DIM)).toBeCloseTo(hazeDitherAmplitude(1) / NOT_ENROLLED_DIM, 9)
  })

  it('every galaxy’s haze canvas is dithered when it is painted', () => {
    const s = session(1440, 900)
    const scene = s.scene()
    for (let g = 0; g < scene.galaxies!.length; g += 1) {
      const width = 64
      const height = 32
      const data = new Uint8ClampedArray(width * height * 4).fill(40)
      let put = 0
      const store: Record<string | symbol, unknown> = { canvas: { width, height } }
      const ctx = new Proxy(store, {
        get(target, prop) {
          if (prop in target) return target[prop]
          if (prop === 'createRadialGradient' || prop === 'createLinearGradient') return () => ({ addColorStop() {} })
          if (prop === 'getImageData') return () => ({ data, width, height })
          if (prop === 'putImageData') return () => (put += 1)
          return () => undefined
        },
        set(target, prop, value) {
          target[prop] = value
          return true
        },
      }) as unknown as CanvasRenderingContext2D
      paintGalaxyHaze(ctx, width, scene, g, THEME, (w, h) => fakeCanvas({ drawImage: 0, filterSets: 0 }, w, h))
      expect(put).toBe(1)
      expect(new Set(Array.from(data.filter((_, i) => i % 4 === 3))).size).toBeGreaterThan(3)
    }
    s.engine.destroy()
  })
})
