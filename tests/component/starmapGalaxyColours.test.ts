/**
 * Galaxy colours and the galaxy name stepping back (#143, round three A3 / A5
 * of #142).
 *
 *   A5  each galaxy has its subject's base colour -- mathematics blue-violet,
 *       physics cyan-blue, chemistry warm amber -- and a subject is told by hue
 *       alone: its haze, its nebulae's clouds and its name all take it; a
 *       subject not taken stays dimmed as a whole
 *   A3  while one of its nebulae is hovered or keyboard-focused, a galaxy's
 *       name steps back, continuously
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { StarMapEngine } from '@/features/starmap/engine/starMapEngine'
import { createCanvas2DRenderer } from '@/features/starmap/render/canvas2d'
import { hueOf, nebulaShade, paintGalaxyHaze } from '@/features/starmap/render/galaxy'
import {
  createGalaxyNames,
  GALAXY_NAME_INK,
  galaxyNamePlacements,
  galaxyNameYield,
  galaxyNameYieldTargets,
} from '@/features/starmap/render/galaxyNames'
import type { SceneData, SceneFrame, StarMapRenderer } from '@/features/starmap/render/types'
import { GALAXY_COLOURS, NEBULA_SHADE, PANORAMA, type Rgb } from '@/features/starmap/view/semanticZoom'
import { galaxyColour, NOT_ENROLLED_DIM } from '@/features/starmap/view/sky'
import { fakeCanvas, fakeClock, skyMap, THEME, type CanvasCounter } from './starmapHarness'

afterEach(() => vi.unstubAllGlobals())
beforeEach(() => vi.stubGlobal('Path2D', class {}))

const BANDS = { top: 120, bottom: 90 }

function session(width: number, height: number, subjectId = 'math', reducedMotion = true) {
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
      frames.push({ ...next, nebulaX: Float32Array.from(next.nebulaX), nebulaY: Float32Array.from(next.nebulaY) })
      real.draw(next)
    },
  }
  const clock = fakeClock()
  const engine = new StarMapEngine({ renderer, theme: THEME, reducedMotion, scheduler: clock, now: clock.now, galaxy: true })
  engine.setViewport(width, height, 1, BANDS)
  engine.setData(skyMap(1000, subjectId), { layer: 'map' })
  clock.advance(20)
  return { engine, clock, frames, real, scene: () => scene!, last: () => frames[frames.length - 1] }
}

/** The shortest way round the hue circle, degrees. */
const hueGap = (a: number, b: number) => {
  const d = Math.abs(a - b) % 360
  return Math.min(d, 360 - d)
}

function hsl([r, g, b]: Rgb) {
  const [R, G, B] = [r / 255, g / 255, b / 255]
  const max = Math.max(R, G, B)
  const min = Math.min(R, G, B)
  const l = (max + min) / 2
  const s = max === min ? 0 : l > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min)
  return { s, l }
}

const parseRgb = (value: string) => value.match(/[\d.]+/g)!.map(Number)

const SKY_TOKENS = (() => {
  const css = readFileSync(path.resolve(__dirname, '../../src/styles/brand-tokens.css'), 'utf8')
  return css.slice(css.indexOf('[data-surface="sky"] {'))
})()
const token = (name: string) => new RegExp(`${name}:\\s*([^;]+);`).exec(SKY_TOKENS)?.[1].trim()

describe('A5: the three galaxies are told apart by hue alone', () => {
  const subjects = ['math', 'physics', 'chemistry'] as const

  it('mathematics is blue-violet, physics cyan-blue, chemistry warm amber, each well apart on the hue circle', () => {
    const hue = Object.fromEntries(subjects.map((s) => [s, hueOf(GALAXY_COLOURS[s].base)]))
    expect(hue.math).toBeGreaterThan(235)
    expect(hue.math).toBeLessThan(265)
    expect(hue.physics).toBeGreaterThan(185)
    expect(hue.physics).toBeLessThan(215)
    expect(hue.chemistry).toBeGreaterThan(25)
    expect(hue.chemistry).toBeLessThan(45)
    for (const a of subjects) for (const b of subjects) if (a !== b) expect(hueGap(hue[a], hue[b])).toBeGreaterThanOrEqual(40)
  })

  it('stays inside the sky design: muted and mid-light, no neon', () => {
    for (const s of subjects) {
      const { s: saturation, l } = hsl(GALAXY_COLOURS[s].base)
      expect(saturation).toBeLessThanOrEqual(0.75)
      expect(l).toBeGreaterThanOrEqual(0.5)
      expect(l).toBeLessThanOrEqual(0.75)
      // The name's ink is the same hue, lifted towards white.
      const name = GALAXY_COLOURS[s].name
      expect(hueGap(hueOf(name), hueOf(GALAXY_COLOURS[s].base))).toBeLessThan(12)
      expect(hsl(name).l).toBeGreaterThan(l)
    }
  })

  it('a galaxy is known by its subject id or its name in any language; an unknown one takes the colours in turn', () => {
    expect(galaxyColour('math', 'Mathematics', 2)).toBe(GALAXY_COLOURS.math)
    expect(galaxyColour('mathematics', '', 0)).toBe(GALAXY_COLOURS.math)
    expect(galaxyColour('s-17', 'Matematica', 2)).toBe(GALAXY_COLOURS.math)
    expect(galaxyColour('s-18', 'Physik', 0)).toBe(GALAXY_COLOURS.physics)
    expect(galaxyColour('s-19', 'Fisica', 0)).toBe(GALAXY_COLOURS.physics)
    expect(galaxyColour('s-20', 'Chimie', 0)).toBe(GALAXY_COLOURS.chemistry)
    expect(galaxyColour('s-21', 'Chemie', 0)).toBe(GALAXY_COLOURS.chemistry)
    const order = Object.values(GALAXY_COLOURS)
    expect([0, 1, 2, 3].map((i) => galaxyColour(`x-${i}`, 'Latin', i))).toEqual([order[0], order[1], order[2], order[0]])
  })

  it('every nebula is its own small shift round its galaxy’s base, nearer its own galaxy’s hue than any other', () => {
    const s = session(1440, 900)
    const scene = s.scene()
    const bases = scene.galaxies!.map((g) => g.colour.base)
    const seen = new Set<string>()
    scene.galaxies!.forEach((galaxy, g) => {
      for (const n of galaxy.nebulae) {
        const colour = scene.nebulae[n].colour!
        seen.add(colour.join(','))
        const own = hueGap(hueOf(colour), hueOf(bases[g]))
        expect(own).toBeLessThanOrEqual(NEBULA_SHADE.hue + 2)
        bases.forEach((other, k) => {
          if (k !== g) expect(hueGap(hueOf(colour), hueOf(other))).toBeGreaterThan(own + 25)
        })
      }
    })
    // Shades differ from nebula to nebula (#117 B2).
    expect(seen.size).toBeGreaterThan(scene.nebulae.length * 0.8)
    s.engine.destroy()
  })

  it('the shade is bounded and continuous in its two shifts', () => {
    const base = GALAXY_COLOURS.physics.base
    expect(nebulaShade(base, 0, 0)).toEqual(base.map(Math.round))
    for (const [h, l] of [[-1, -1], [1, 1], [-1, 1], [1, -1], [5, -5]] as const) {
      const shade = nebulaShade(base, h, l)
      expect(hueGap(hueOf(shade), hueOf(base))).toBeLessThanOrEqual(NEBULA_SHADE.hue + 1)
      expect(Math.abs(hsl(shade).l - hsl(base).l)).toBeLessThanOrEqual(NEBULA_SHADE.light + 0.01)
    }
    let previous = nebulaShade(base, -1, 0)
    for (let t = -0.95; t <= 1.0001; t += 0.05) {
      const next = nebulaShade(base, t, 0)
      for (let k = 0; k < 3; k += 1) expect(Math.abs(next[k] - previous[k])).toBeLessThanOrEqual(3)
      previous = next
    }
  })

  it('the engine gives each galaxy its subject’s colour; a subject not taken stays dimmed as a whole (×0.4)', () => {
    const s = session(1440, 900)
    const scene = s.scene()
    expect(scene.galaxies!.map((g) => [g.subjectId, g.colour, g.dim])).toEqual([
      ['math', GALAXY_COLOURS.math, 1],
      ['physics', GALAXY_COLOURS.physics, 1],
      ['chemistry', GALAXY_COLOURS.chemistry, NOT_ENROLLED_DIM],
    ])
    scene.galaxies!.forEach((galaxy) => {
      for (const n of galaxy.nebulae) expect(scene.nebulae[n].dim).toBe(galaxy.dim)
    })
    s.engine.destroy()
  })

  it('the galaxy haze is painted in its galaxy’s base colour', () => {
    const s = session(1440, 900)
    const scene = s.scene()
    for (let g = 0; g < scene.galaxies!.length; g += 1) {
      const stops: string[] = []
      const fills: string[] = []
      const recording = (): CanvasRenderingContext2D =>
        new Proxy({} as Record<string | symbol, unknown>, {
          get(target, prop) {
            if (prop === 'createRadialGradient' || prop === 'createLinearGradient') return () => ({ addColorStop: (_: number, c: string) => stops.push(c) })
            if (prop === 'getImageData') return undefined
            if (prop === 'canvas') return { width: 64, height: 64 }
            if (prop in target) return target[prop]
            return () => undefined
          },
          set(target, prop, value) {
            if (prop === 'fillStyle' && typeof value === 'string') fills.push(value)
            target[prop] = value
            return true
          },
        }) as unknown as CanvasRenderingContext2D
      const make = (w: number, h: number) => ({ width: w, height: h, getContext: () => recording() }) as unknown as HTMLCanvasElement
      paintGalaxyHaze(recording(), 512, scene, g, THEME, make)
      const [r, gg, b] = scene.galaxies![g].colour.base
      const base = `${r}, ${gg}, ${b}`
      expect(stops.some((c) => c.includes(base))).toBe(true)
      expect(fills.some((c) => c.includes(base))).toBe(true)
      // No other galaxy's colour gets into it.
      scene.galaxies!.forEach((other, k) => {
        if (k === g) return
        const [or, og, ob] = other.colour.base
        expect([...stops, ...fills].some((c) => c.includes(`${or}, ${og}, ${ob}`))).toBe(false)
      })
    }
    s.engine.destroy()
  })

  it('the colours are the sky tokens, and the gate records each tinted name as decorative', () => {
    const names = { math: 'math', physics: 'physics', chemistry: 'chemistry' } as const
    const nameAlpha = parseRgb(token('--starmap-galaxy-name')!)[3]
    expect(nameAlpha).toBe(parseRgb(GALAXY_NAME_INK)[3])
    const pairs = JSON.parse(readFileSync(path.resolve(__dirname, '../../scripts/contrast-pairs.json'), 'utf8')) as {
      pairs: { fg: string; bg: string; gate?: boolean; why?: string }[]
    }
    for (const [key, suffix] of Object.entries(names)) {
      const colours = GALAXY_COLOURS[key as keyof typeof GALAXY_COLOURS]
      expect(parseRgb(token(`--starmap-galaxy-${suffix}`)!)).toEqual([...colours.base])
      expect(parseRgb(token(`--starmap-galaxy-name-${suffix}`)!)).toEqual([...colours.name, nameAlpha])
      const pair = pairs.pairs.find((p) => p.fg === `--starmap-galaxy-name-${suffix}`)!
      expect(pair.bg).toBe('--sky')
      expect(pair.gate).toBe(false)
      expect(pair.why).toMatch(/#143/)
    }
  })

  it('each galaxy’s name is drawn in its own ink, at the shared name alpha', () => {
    const s = session(1440, 900, 'physics')
    const placed = galaxyNamePlacements(s.scene(), s.last(), THEME)
    const physics = placed.find((p) => p.text === 'PHYSICS')!
    expect(physics.colour).toBe(GALAXY_COLOURS.physics.name)
    expect(physics.alpha).toBeCloseTo(parseRgb(GALAXY_NAME_INK)[3], 6)
    s.engine.destroy()
  })
})

describe('A3: a focused or hovered nebula’s galaxy name steps back', () => {
  it('the galaxy of a hovered, keyboard-focused or chosen nebula yields; the others do not', () => {
    const s = session(1440, 900, 'physics')
    const scene = s.scene()
    const physics = scene.galaxies!.findIndex((g) => g.subjectId === 'physics')
    const optics = scene.nebulae.findIndex((n) => n.topicId.includes('optics'))
    expect(scene.galaxies![physics].nebulae).toContain(optics)
    const base = { ...s.last(), hoveredNebula: -1, highlightNebula: -1, chosenNebula: -1 }
    expect(galaxyNameYieldTargets(scene, base)).toEqual([0, 0, 0])
    for (const which of ['hoveredNebula', 'highlightNebula', 'chosenNebula'] as const) {
      const targets = galaxyNameYieldTargets(scene, { ...base, [which]: optics })
      expect(targets[physics]).toBe(1)
      expect(targets.filter((t) => t === 1)).toHaveLength(1)
    }
    // Stepped back: the name's alpha is `to` of what it was, its place unchanged.
    const yields = scene.galaxies!.map((_, g) => (g === physics ? 1 : 0))
    const before = galaxyNamePlacements(scene, base, THEME).find((p) => p.galaxy === physics)!
    const after = galaxyNamePlacements(scene, base, THEME, yields).find((p) => p.galaxy === physics)
    if (after) {
      expect(after.alpha).toBeCloseTo(before.alpha * PANORAMA.galaxyNameYield.to, 9)
      expect([after.x, after.y, after.px]).toEqual([before.x, before.y, before.px])
    }
    s.engine.destroy()
  })

  it('the yield is a continuous, monotone function of its eased amount', () => {
    expect(galaxyNameYield(0)).toBe(1)
    expect(galaxyNameYield(1)).toBeCloseTo(PANORAMA.galaxyNameYield.to, 9)
    let previous = 1
    for (let t = 0.02; t <= 1.0001; t += 0.02) {
      const next = galaxyNameYield(t)
      expect(next).toBeLessThanOrEqual(previous + 1e-12)
      expect(previous - next).toBeLessThan(0.05)
      previous = next
    }
  })

  it('the drawn name eases down over several frames when a nebula is hovered, and back when the pointer leaves', () => {
    const s = session(1440, 900, 'physics')
    const scene = s.scene()
    const optics = scene.nebulae.findIndex((n) => n.topicId.includes('optics'))
    const alphas: number[] = []
    const ctx = new Proxy({} as Record<string | symbol, unknown>, {
      get(target, prop) {
        if (prop === 'drawImage') return () => alphas.push(target.globalAlpha as number)
        if (prop in target) return target[prop]
        return () => undefined
      },
      set(target, prop, value) {
        target[prop] = value
        return true
      },
    }) as unknown as CanvasRenderingContext2D
    const counter: CanvasCounter = { drawImage: 0, filterSets: 0 }
    const names = createGalaxyNames((w, h) => fakeCanvas(counter, w, h))
    const frame = { ...s.last(), hoveredNebula: -1, highlightNebula: -1, chosenNebula: -1, labelFadeMs: 180 }
    const physicsName = () => {
      alphas.length = 0
      return alphas
    }
    const physics = galaxyNamePlacements(scene, frame, THEME).findIndex((p) => p.text === 'PHYSICS')
    const drawn = (f: SceneFrame) => {
      physicsName()
      names.draw(ctx, scene, f, THEME, 1)
      return alphas[physics]
    }
    const rest = drawn({ ...frame, time: 0 })
    const series: number[] = []
    for (let t = 16; t <= PANORAMA.galaxyNameYield.ms + 64; t += 16) series.push(drawn({ ...frame, hoveredNebula: optics, time: t }))
    // Continuous: many frames in between, no step larger than a fraction of the change.
    const inBetween = series.filter((a) => a < rest - 1e-6 && a > rest * PANORAMA.galaxyNameYield.to + 1e-6)
    expect(inBetween.length).toBeGreaterThanOrEqual(8)
    for (let i = 1; i < series.length; i += 1) {
      expect(series[i]).toBeLessThanOrEqual(series[i - 1] + 1e-12)
      expect(series[i - 1] - series[i]).toBeLessThan(rest * 0.2)
    }
    expect(series[series.length - 1]).toBeCloseTo(rest * PANORAMA.galaxyNameYield.to, 9)
    expect(names.settling).toBe(false)
    // While it eases, the renderer asks for frames.
    drawn({ ...frame, hoveredNebula: -1, time: PANORAMA.galaxyNameYield.ms + 80 })
    expect(names.settling).toBe(true)
    let back = 0
    for (let t = PANORAMA.galaxyNameYield.ms + 96; t <= 3 * PANORAMA.galaxyNameYield.ms; t += 16) back = drawn({ ...frame, hoveredNebula: -1, time: t })
    expect(back).toBeCloseTo(rest, 9)
    s.engine.destroy()
  })

  it('the engine keeps drawing frames while the name eases, so it never jumps; under reduced motion it steps at once', () => {
    const s = session(1440, 900, 'physics', false)
    const scene = s.scene()
    const optics = scene.nebulae.findIndex((n) => n.topicId.includes('optics'))
    const at = s.last()
    s.clock.advance(200)
    const before = s.frames.length
    s.engine.hoverAt(at.nebulaX[optics], at.nebulaY[optics])
    s.clock.advance(PANORAMA.galaxyNameYield.ms + 200)
    const hovered = s.frames.slice(before)
    expect(hovered.every((f) => f.hoveredNebula === optics)).toBe(true)
    // About one frame per 16 ms through the ease, not a single redraw.
    expect(hovered.length).toBeGreaterThanOrEqual(Math.floor(PANORAMA.galaxyNameYield.ms / 17))
    expect(s.real.stats.settling).toBe(false)
    s.engine.destroy()

    const counter: CanvasCounter = { drawImage: 0, filterSets: 0 }
    const names = createGalaxyNames((w, h) => fakeCanvas(counter, w, h))
    const still = s.scene()
    const frame = { ...at, hoveredNebula: -1, highlightNebula: -1, chosenNebula: -1, labelFadeMs: 0 }
    names.draw(fakeCanvas(counter).getContext('2d')!, still, { ...frame, time: 0 }, THEME, 1)
    names.draw(fakeCanvas(counter).getContext('2d')!, still, { ...frame, hoveredNebula: optics, time: 16 }, THEME, 1)
    expect(names.settling).toBe(false)
  })
})
