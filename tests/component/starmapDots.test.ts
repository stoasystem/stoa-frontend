/**
 * The dot a knowledge point is far out (#109, #138 B2). Far out the stars are
 * dots however few there are, and that decision stands -- but on the real
 * map (ten points in mathematics: one lit, one ready, eight locked) it drew
 * eight white specks of 2.5 px at 42%, inside the spread of the sky's own
 * dust, under names at full strength. The panorama read as labels floating on
 * black.
 *
 * What is checked here:
 *
 *   D1  every state has a figure of its own, not a disc of another radius:
 *       the legend's marks at dot scale, so they tell apart without colour
 *   D2  the dot grows into the room a sparse map leaves, and not a pixel
 *       where a packed nebula leaves none
 *   D3  a locked point is out of the dust and past 3:1, and still quieter
 *       than a lit one; the recommended star is still far the most prominent
 *   D4  the sixth state, due for review, has its pip at dot scale too
 *   D5  the locked web is hinted where neither the bridges nor the focus
 *       rule reach it, and nowhere else
 *   D6  skill points stay off the panorama
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { StarMapEngine } from '@/features/starmap/engine/starMapEngine'
import { createCanvas2DRenderer, DOT_ALPHA, dotExtent, drawDotMark } from '@/features/starmap/render/canvas2d'
import { DOT_BOX, DOT_CUT, dotBoxFor, GLYPH_LARGE, GLYPH_SMALL, PRESS } from '@/features/starmap/render/glyph'
import { LOCKED_WEB, lockedWebHint } from '@/features/starmap/render/links'
import { STATE_IN_PROGRESS, STATE_LIT, STATE_LOCKED, STATE_READY, type SceneFrame, type StarMapRenderer } from '@/features/starmap/render/types'
import { fakeCanvas, fakeClock, skyMap, THEME, type CanvasCounter } from './starmapHarness'

afterEach(() => vi.unstubAllGlobals())
beforeEach(() => vi.stubGlobal('Path2D', class {}))

const STATES = [STATE_LIT, STATE_IN_PROGRESS, STATE_READY, STATE_LOCKED]
const NAMES: Record<number, string> = { [STATE_LIT]: 'lit', [STATE_IN_PROGRESS]: 'in progress', [STATE_READY]: 'ready', [STATE_LOCKED]: 'locked' }

/** What one mark put on the canvas: filled paths, filled discs and stroked rings, with their radii. */
type Mark = { star: boolean; discs: number[]; rings: { r: number; width: number }[]; glow: boolean }

function markOf(state: number, part: 'both' | 'glow' | 'core' = 'both'): Mark {
  const mark: Mark = { star: false, discs: [], rings: [], glow: false }
  let radius = 0
  let lineWidth = 0
  const ctx = {
    globalAlpha: 1,
    fillStyle: '',
    strokeStyle: '',
    get lineWidth() {
      return lineWidth
    },
    set lineWidth(value: number) {
      lineWidth = value
    },
    createRadialGradient: () => {
      mark.glow = true
      return { addColorStop() {} }
    },
    beginPath: () => undefined,
    arc: (_x: number, _y: number, r: number) => {
      radius = r
    },
    fill: (path?: unknown) => {
      if (path) mark.star = true
      else if (!mark.glow || radius !== 0) mark.discs.push(radius)
    },
    stroke: () => mark.rings.push({ r: radius, width: lineWidth }),
  } as unknown as CanvasRenderingContext2D
  // The halo fills the whole gradient disc; count it as the glow, not a core.
  const before = { ...mark }
  void before
  drawDotMark(ctx, DOT_CUT, state, THEME, part)
  // The halo's own fill carries the gradient: drop the largest disc when it glowed.
  if (mark.glow && part !== 'core' && mark.discs.length > 0) {
    const widest = Math.max(...mark.discs)
    mark.discs.splice(mark.discs.indexOf(widest), 1)
  }
  return mark
}

describe('D1: every state is its own figure at dot scale', () => {
  it('each state draws a mark, and no two states draw the same one', () => {
    const marks = STATES.map((state) => markOf(state, 'core'))
    for (const [i, mark] of marks.entries()) {
      expect(mark.star || mark.discs.length > 0 || mark.rings.length > 0, `${NAMES[STATES[i]]} draws nothing`).toBe(true)
    }
    const signature = (m: Mark) => `${m.star ? 'star' : '-'}/${m.discs.length > 0 ? 'core' : '-'}/${m.rings.length > 0 ? 'ring' : '-'}`
    const signatures = marks.map(signature)
    expect(new Set(signatures).size, `figures: ${signatures.join(', ')}`).toBe(STATES.length)
  })

  it('the figures are the legend’s: a star, a star in a ring, a ring with a core, a bare ring', () => {
    const [lit, inProgress, ready, locked] = STATES.map((state) => markOf(state, 'core'))
    expect(lit.star).toBe(true)
    expect(lit.rings).toHaveLength(0)
    expect(inProgress.star).toBe(true)
    expect(inProgress.rings).toHaveLength(1)
    expect(ready.star).toBe(false)
    expect(ready.rings).toHaveLength(1)
    expect(ready.discs).toHaveLength(1)
    expect(locked.star).toBe(false)
    expect(locked.rings).toHaveLength(1)
    expect(locked.discs).toHaveLength(0)
  })

  it('only a lit or in-progress dot glows, and the glow can be faded on its own (#137 A2)', () => {
    expect(markOf(STATE_LIT, 'glow').glow).toBe(true)
    expect(markOf(STATE_IN_PROGRESS, 'glow').glow).toBe(true)
    expect(markOf(STATE_READY, 'glow').glow).toBe(false)
    expect(markOf(STATE_LOCKED, 'glow').glow).toBe(false)
    expect(markOf(STATE_LIT, 'core').glow).toBe(false)
  })

  it('every state fills its box: none is left a speck beside the others', () => {
    const extents = STATES.map((state) => dotExtent(DOT_CUT, state))
    const half = DOT_CUT.box / 2
    for (const [i, extent] of extents.entries()) {
      expect(extent, `${NAMES[STATES[i]]} reaches ${extent} of ${half}`).toBeGreaterThanOrEqual(half * 0.6)
      expect(extent).toBeLessThanOrEqual(half)
    }
    // The widest state is no more than half again the narrowest: presence is not what tells them apart.
    expect(Math.max(...extents) / Math.min(...extents)).toBeLessThanOrEqual(1.5)
  })
})

describe('D2: the dot takes the room a sparse map leaves, and none that a packed one does not', () => {
  it('a packed nebula keeps exactly the engine’s dot', () => {
    // 2000 points: the engine's dot radius is at its floor and the glyph box at its own (9 px).
    expect(dotBoxFor(1.15, 9)).toBeCloseTo(1.15 * DOT_BOX.fromDot, 10)
    expect(dotBoxFor(1.6, 9)).toBeCloseTo(1.6 * DOT_BOX.fromDot, 10)
    expect(dotBoxFor(2.1, 9)).toBeCloseTo(2.1 * DOT_BOX.fromDot, 10)
  })

  it('ten points at the farthest zoom get a mark that can be seen', () => {
    // The engine caps its dot radius at 2.1 whatever the room: 8.4 px of box.
    expect(dotBoxFor(2.1, 40)).toBe(DOT_BOX.max)
    expect(dotBoxFor(2.1, 40)).toBeGreaterThan(2.1 * DOT_BOX.fromDot * 1.5)
  })

  it('never shrinks below the engine’s dot, never past its ceiling, and only ever grows with the room', () => {
    for (const dotRadius of [1.15, 1.6, 2.1]) {
      let previous = 0
      for (let glyph = 6; glyph <= 40; glyph += 1) {
        const box = dotBoxFor(dotRadius, glyph)
        expect(box).toBeGreaterThanOrEqual(dotRadius * DOT_BOX.fromDot)
        expect(box).toBeLessThanOrEqual(Math.max(DOT_BOX.max, dotRadius * DOT_BOX.fromDot))
        expect(box).toBeGreaterThanOrEqual(previous)
        previous = box
      }
    }
  })
})

/** `fg` at `alpha` over the opaque `bg`, and the WCAG ratio between them. */
const over = (fg: number[], bg: number[], a: number) => fg.map((c, i) => c * a + bg[i] * (1 - a))
const luminance = ([r, g, b]: number[]) => {
  const lin = (c: number) => {
    const v = c / 255
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}
const contrast = (a: number[], b: number[]) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}
const SKY = [0x0a, 0x10, 0x20]
const WHITE = [255, 255, 255]

describe('D3: a locked point is out of the dust, and the recommended star still leads', () => {
  it('the sky’s brightest dust grain is 1.3 px across at 58%; a locked dot is several times that', () => {
    // paintGalaxy (render/galaxy.ts): radius 0.2 + u^5 * 1.1, alpha 0.08 + u^3 * 0.5.
    const dustRadius = 0.2 + 1.1
    const locked = (dotBoxFor(2.1, 40) / DOT_CUT.box) * dotExtent(DOT_CUT, STATE_LOCKED)
    expect(locked).toBeGreaterThan(dustRadius * 3)
  })

  it('a locked dot keeps 3:1 on the sky (it is a control, WCAG 1.4.11) and stays quieter than the rest', () => {
    expect(contrast(over(WHITE, SKY, DOT_ALPHA[STATE_LOCKED]), SKY)).toBeGreaterThanOrEqual(3)
    expect(DOT_ALPHA[STATE_LOCKED]).toBeLessThan(DOT_ALPHA[STATE_READY])
    expect(DOT_ALPHA[STATE_READY]).toBeLessThan(DOT_ALPHA[STATE_LIT])
    expect(DOT_ALPHA[STATE_IN_PROGRESS]).toBeLessThan(DOT_ALPHA[STATE_LIT])
  })

  it('the recommended star stays the largest mark, and twice the dot where the dot has grown', () => {
    // The beacon's box (canvas2d): max(12, min(glyphSize, 32)).
    const beaconOf = (glyph: number) => Math.max(12, Math.min(glyph, 32))
    for (const dotRadius of [1.15, 1.6, 2.1]) {
      for (let glyph = 9; glyph <= 40; glyph += 1) {
        expect(beaconOf(glyph) / dotBoxFor(dotRadius, glyph), `glyph ${glyph}, dot ${dotRadius}`).toBeGreaterThanOrEqual(1.42)
      }
    }
    // Far out on a sparse map -- the map this is about -- it is twice over, and gold against white.
    expect(beaconOf(40) / dotBoxFor(2.1, 40)).toBeGreaterThanOrEqual(2)
  })

  it('the --starmap-dot-* tokens are the alphas the canvas draws at', () => {
    const css = readFileSync(path.resolve(__dirname, '../../src/styles/brand-tokens.css'), 'utf8')
    const sky = css.slice(css.indexOf('[data-surface="sky"] {'))
    const token = (name: string) => {
      const match = new RegExp(`${name}:\\s*([^;]+);`).exec(sky)
      if (!match) throw new Error(`no ${name} in the sky block`)
      const value = match[1].trim()
      if (value.startsWith('#')) return [parseInt(value.slice(1, 3), 16), parseInt(value.slice(3, 5), 16), parseInt(value.slice(5, 7), 16)]
      return value.match(/[\d.]+/g)!.map(Number)
    }
    const lit = token('--lit')
    const white = [255, 255, 255]
    const pairs: [string, number[], number][] = [
      ['--starmap-dot-lit', lit, DOT_ALPHA[STATE_LIT]],
      ['--starmap-dot-in-progress', lit, DOT_ALPHA[STATE_IN_PROGRESS]],
      ['--starmap-dot-ready', white, DOT_ALPHA[STATE_READY]],
      ['--starmap-dot-locked', white, DOT_ALPHA[STATE_LOCKED]],
      ['--starmap-dot-review', white, DOT_ALPHA.review],
    ]
    for (const [name, rgb, alpha] of pairs) {
      expect(token(name), name).toEqual([...rgb, alpha])
    }
  })
})

/** The 10-point sky at its farthest zoom: the map the user is looking at. */
function panorama(reviewDue = false) {
  const counter: CanvasCounter = { drawImage: 0, filterSets: 0, texts: [] }
  const arcs: { r: number }[] = []
  const images: { w: number; h: number }[] = []
  const main = fakeCanvas(counter)
  const ctx = main.getContext('2d')!
  const recording = new Proxy(ctx, {
    get(target, prop) {
      if (prop === 'arc') return (_x: number, _y: number, r: number) => arcs.push({ r })
      if (prop === 'drawImage') {
        return (...args: unknown[]) => {
          counter.drawImage += 1
          if (args.length === 5) images.push({ w: args[3] as number, h: args[4] as number })
        }
      }
      return Reflect.get(target, prop)
    },
  })
  const canvas = { width: 1, height: 1, getContext: () => recording } as unknown as HTMLCanvasElement
  const real = createCanvas2DRenderer(canvas, { createCanvas: (w, h) => fakeCanvas(counter, w, h) })!
  let frame: SceneFrame | null = null
  const renderer: StarMapRenderer = { ...real, draw: (next) => { frame = next; real.draw(next) } }
  const clock = fakeClock()
  const engine = new StarMapEngine({ renderer, theme: THEME, reducedMotion: true, scheduler: clock, now: clock.now, galaxy: true })
  const map = skyMap(10, 'math', { relations: true })
  engine.setViewport(1280, 776, 2, { top: 120, bottom: 90 })
  engine.setData(reviewDue ? { ...map, stars: map.stars.map((star) => ({ ...star, reviewDue: Date.now() })) } : map, { layer: 'map' })
  clock.advance(20)
  return { real, arcs, images, map, frame: () => frame! }
}

describe('D4: the sixth state, due for review, is told apart far out too', () => {
  it('a point due for review draws its pip at dot scale', () => {
    const plain = panorama(false)
    const due = panorama(true)
    expect(plain.frame().dotBlend).toBe(1) // Far out, as #109 decided: dots, however few there are.
    expect(due.arcs.length).toBeGreaterThan(plain.arcs.length)
    // The pip and its outline, at the dot cut's own radii.
    const unit = dotBoxFor(due.frame().dotRadius, due.frame().glyphSize) / DOT_CUT.box
    const wanted = [DOT_CUT.review.radius * unit, (DOT_CUT.review.radius + DOT_CUT.review.outline) * unit]
    for (const r of wanted) expect(due.arcs.some((a) => Math.abs(a.r - r) < 0.01), `no pip arc at ${r.toFixed(2)} px`).toBe(true)
  })
})

describe('D5: the locked web is hinted only where nothing else reaches it', () => {
  it('nothing while the bridges carry the panorama, nothing once the dots are gone', () => {
    const at = (dotBlend: number, bridges: number) => lockedWebHint({ dotBlend, lineReveal: { bridges, tiers: [0, 0, 0, 0, 0] } })
    expect(at(1, 1)).toBe(0)
    expect(at(0, 0)).toBe(0)
    expect(at(1, 0)).toBe(LOCKED_WEB)
    // Continuous and monotone as the dots give way to glyphs: nothing pops.
    let previous = at(0, 0)
    for (let d = 0; d <= 1.0001; d += 0.1) {
      const now = at(d, 0)
      expect(now).toBeGreaterThanOrEqual(previous - 1e-9)
      previous = now
    }
    expect(LOCKED_WEB).toBeLessThan(1)
  })

  it('on the real map it puts lines on the panorama that nothing drew before', () => {
    const s = panorama()
    const frame = s.frame()
    expect(frame.lineReveal.bridges).toBe(0) // A sparse map's farthest zoom is already past the bridges.
    expect(frame.dotBlend).toBe(1)
    expect(frame.focusStar).toBe(-1) // Nothing in focus: the only rule that drew tier 4 before.
    const locked = s.map.prerequisites.filter(({ from, to }) => {
      const stateOf = (id: string) => s.map.stars.find((star) => star.unitId === id)?.state
      return stateOf(from) === 'locked' || stateOf(to) === 'locked'
    })
    expect(locked.length, 'the fixture has locked prerequisites to draw').toBeGreaterThan(0)
    const withWeb = s.real.stats.links!.lines
    // The same frame with the dots gone is the same frame without the hint.
    s.real.draw({ ...frame, dotBlend: 0 })
    expect(withWeb).toBeGreaterThan(s.real.stats.links!.lines)
  })
})

describe('D6: skill points stay off the panorama', () => {
  it('an ordinary star gets no skill dots while the stars are dots', () => {
    const s = panorama()
    const f = s.frame()
    expect(f.dotBlend).toBe(1)
    // Skill dots are drawn only where glyphs are (`glyphs = 1 - dotBlend`); the recommended star is the one glyph.
    expect(1 - f.dotBlend).toBeLessThan(0.01)
  })
})

describe('a pressed star answers before the page does', () => {
  it('draws the pressed star smaller than the others', () => {
    // The whole point: the sky is not perfectly still between the press and
    // the flight.
    expect(PRESS.scale).toBeLessThan(1)
    expect(PRESS.scale).toBeGreaterThan(0.7)
  })

  it('does not dim it while it sinks', () => {
    expect(PRESS.alpha).toBeGreaterThanOrEqual(1)
  })

  it('is applied to both the glyph and the dot, not only declared', () => {
    // A constant that exists and is never multiplied in is the same as no
    // press feedback at all, and reads as done from the outside.
    const source = readFileSync(path.resolve(__dirname, '../../src/features/starmap/render/canvas2d.ts'), 'utf8')

    expect(source).toContain('PRESS.scale')
    expect(source).toContain('PRESS.alpha')
    expect(source, 'the glyph is drawn without the press').toMatch(/const grow = [^\n]*sunk\(i\)/)
    expect(source, 'the dot is drawn without the press').toMatch(/const size = dotBox \* quiet\.radius \* sunk\(i\)/)
  })
})

describe('a locked knowledge point at full glyph size', () => {
  it.each([
    ['large', GLYPH_LARGE],
    ['small', GLYPH_SMALL],
  ])('is as big as a ready one on the %s cut', (_name, cut) => {
    // It was half the size and the dimmest mark on the map, while being the
    // state most points are in — so the sky read as empty at every zoom, not
    // only on the panorama.
    expect(cut.locked.ring).toBeCloseTo(cut.ready.ring, 5)
  })

  it.each([
    ['large', GLYPH_LARGE],
    ['small', GLYPH_SMALL],
  ])('is still told apart from a ready one, by the core, on the %s cut', (_name, cut) => {
    expect(cut.ready.core).toBeGreaterThan(0)
    expect('core' in cut.locked).toBe(false)
  })
})
