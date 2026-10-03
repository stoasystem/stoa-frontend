/**
 * The connection lines (#121): brightness is how relevant a relation is to
 * the student now. Tiers by learning state, what each layer shows, the
 * cross-subject lines, and the shorter way round the seam (#120's wrap).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { StarMapEngine } from '@/features/starmap/engine/starMapEngine'
import {
  BRIDGE_FOCUSED,
  BRIDGE_UNFOCUSED,
  bridgeLook,
  galaxyHintLook,
  HINT_WHILE_BRIDGED,
  linkTier,
  starLineLook,
  TIER_IN_PROGRESS,
  TIER_LOCKED,
  TIER_RECOMMENDED,
  TIER_WALKED,
  UNFOCUSED_LINE,
  type LinkView,
  type StarLine,
} from '@/features/starmap/model/linkTiers'
import { nebulaLinks } from '@/features/starmap/model/links'
import { orderedNebulae, orderedStars, type StarMap } from '@/features/starmap/model/starMap'
import { createCanvas2DRenderer } from '@/features/starmap/render/canvas2d'
import { drawLinks, shortestDx, type LinkObstacles } from '@/features/starmap/render/links'
import { STATE_IN_PROGRESS, STATE_LIT, STATE_LOCKED, type SceneData, type SceneFrame, type StarMapRenderer } from '@/features/starmap/render/types'
import type { LayerTarget } from '@/features/starmap/view/layers'
import { fakeCanvas, fakeClock, THEME, skyMap, type CanvasCounter } from './starmapHarness'

afterEach(() => vi.unstubAllGlobals())
beforeEach(() => vi.stubGlobal('Path2D', class {}))

describe('four tiers, bright to dark', () => {
  it('a line into the recommended star is tier 1, whatever the states', () => {
    expect(linkTier('lit', 'in_progress', true)).toBe(TIER_RECOMMENDED)
    expect(linkTier('lit', 'ready', true)).toBe(TIER_RECOMMENDED)
  })

  it('an in-progress star to its prerequisites is tier 2', () => {
    expect(linkTier('lit', 'in_progress', false)).toBe(TIER_IN_PROGRESS)
  })

  it('both ends lit -- or a lit star to a ready one -- is the path walked, tier 3', () => {
    expect(linkTier('lit', 'lit', false)).toBe(TIER_WALKED)
    expect(linkTier('lit', 'ready', false)).toBe(TIER_WALKED)
  })

  it('a line into a locked star is tier 4, both ends locked included', () => {
    expect(linkTier('locked', 'locked', false)).toBe(TIER_LOCKED)
    expect(linkTier('lit', 'locked', false)).toBe(TIER_LOCKED)
    expect(linkTier('in_progress', 'locked', false)).toBe(TIER_LOCKED)
    expect(linkTier('ready', 'locked', false)).toBe(TIER_LOCKED)
  })
})

describe('what each layer shows', () => {
  const inside = (tier: StarLine['tier'], from = 1, to = 2): StarLine => ({ from, to, fromNebula: 0, toNebula: 0, tier })
  const panorama: LinkView = { nebula: 0, star: 0, chosen: -1, focusStar: -1 }
  const nebula: LinkView = { nebula: 1, star: 0, chosen: 0, focusStar: -1 }
  const star: LinkView = { nebula: 1, star: 1, chosen: 0, focusStar: 1 }

  it('the panorama draws no line between stars', () => {
    for (const tier of [1, 2, 3, 4] as const) {
      expect(starLineLook(inside(tier), panorama).strength).toBe(0)
      expect(starLineLook(inside(tier), { ...panorama, chosen: 0 }).strength).toBe(0)
    }
  })

  it('the nebula layer draws its own lines in tiers 1-3, never tier 4, and nothing of other nebulae', () => {
    for (const tier of [1, 2, 3] as const) expect(starLineLook(inside(tier), nebula)).toEqual({ strength: 1, reach: 0 })
    expect(starLineLook(inside(4), nebula).strength).toBe(0)
    expect(starLineLook({ ...inside(1), fromNebula: 3, toNebula: 4 }, nebula).strength).toBe(0)
    // A line to another nebula: drawn, fading out near this nebula's star (reach 0).
    expect(starLineLook({ ...inside(2), toNebula: 5 }, nebula)).toEqual({ strength: 1, reach: 0 })
  })

  it('a focused star on the nebula layer keeps only its own lines lit', () => {
    const focused = { ...nebula, focusStar: 1 }
    expect(starLineLook(inside(3, 1, 2), focused).strength).toBe(1)
    expect(starLineLook(inside(3, 7, 8), focused).strength).toBe(UNFOCUSED_LINE)
    expect(starLineLook(inside(4, 1, 2), focused).strength).toBe(0)
  })

  it('the star layer lights the star’s prerequisites and successors fully, every tier, and hides the rest', () => {
    for (const tier of [1, 2, 3, 4] as const) {
      expect(starLineLook(inside(tier, 9, 1), star)).toEqual({ strength: 1, reach: 1 })
      expect(starLineLook(inside(tier, 1, 9), star)).toEqual({ strength: 1, reach: 1 })
      expect(starLineLook(inside(tier, 7, 8), star).strength).toBe(0)
    }
    // Across nebulae too, drawn all the way to the other star.
    expect(starLineLook({ ...inside(4, 1, 9), toNebula: 6 }, star)).toEqual({ strength: 1, reach: 1 })
  })

  it('crossfades between the nebula and star layers', () => {
    const half = { ...star, star: 0.5 }
    expect(starLineLook(inside(4, 1, 2), half).strength).toBeCloseTo(0.5)
    expect(starLineLook(inside(3, 7, 8), half).strength).toBeCloseTo(UNFOCUSED_LINE / 2)
  })

  it('the panorama’s bridges: faint at rest, brighter for a focused nebula, dimmer for the rest; gone zoomed in', () => {
    const own = { a: 0, b: 1, count: 2, crossGalaxy: false }
    expect(bridgeLook(own, -1, panorama)).toBe(1)
    expect(bridgeLook(own, 0, panorama)).toBe(BRIDGE_FOCUSED)
    expect(bridgeLook(own, 3, panorama)).toBe(BRIDGE_UNFOCUSED)
    expect(bridgeLook(own, -1, nebula)).toBe(0)
    expect(BRIDGE_FOCUSED).toBeGreaterThan(1)
    expect(BRIDGE_UNFOCUSED).toBeLessThan(1)
  })
})

describe('cross-subject lines', () => {
  const panorama = { nebula: 0 }
  it('at rest no bridge crosses galaxies; a focused nebula lights its own', () => {
    const across = { a: 0, b: 5, count: 1, crossGalaxy: true }
    expect(bridgeLook(across, -1, panorama)).toBe(0)
    expect(bridgeLook(across, 3, panorama)).toBe(0)
    expect(bridgeLook(across, 5, panorama)).toBe(BRIDGE_FOCUSED)
  })

  it('the glow between two galaxies is there at rest, and steps back while one of their bridges is lit', () => {
    expect(galaxyHintLook(false, panorama)).toBe(1)
    expect(galaxyHintLook(true, panorama)).toBe(HINT_WHILE_BRIDGED)
    expect(galaxyHintLook(false, { nebula: 1 })).toBe(0)
  })
})

/** The real renderer over the one sky, with the demo sky's prerequisites. */
function sky(points: 10 | 1000 | 2000, width: number, height: number, subjectId = 'math') {
  const counter: CanvasCounter = { drawImage: 0, filterSets: 0, texts: [] }
  const real = createCanvas2DRenderer(fakeCanvas(counter), { createCanvas: (w, h) => fakeCanvas(counter, w, h) })!
  let frame: SceneFrame | null = null
  const renderer: StarMapRenderer = { ...real, draw: (next) => { frame = next; real.draw(next) } }
  const clock = fakeClock()
  const engine = new StarMapEngine({ renderer, theme: THEME, reducedMotion: true, scheduler: clock, now: clock.now, foveate: false, galaxy: true })
  const map = skyMap(points, subjectId, { relations: true })
  engine.setViewport(width, height, 1)
  engine.setData(map, { layer: 'map' })
  clock.advance(20)
  const go = (target: LayerTarget) => {
    counter.texts = []
    engine.setTarget(target)
    clock.advance(400)
  }
  const scene = () => (engine as unknown as { scene: SceneData }).scene
  return { counter, real, clock, engine, map, go, scene, frame: () => frame! }
}

/** Nebula pairs with prerequisites between them, and those inside one galaxy. */
function pairs(map: StarMap) {
  const subject = new Map(map.nebulae.map((n) => [n.topicId, n.subjectId]))
  const all = nebulaLinks(map)
  return { all: all.length, inGalaxy: all.filter((l) => subject.get(l.a) === subject.get(l.b)).length }
}

describe('the 2000-star panorama (#121 acceptance)', () => {
  for (const [width, height] of [[1440, 900], [390, 844]] as const) {
    it(`${width}×${height}: no line between stars, and no more bridges than related nebula pairs`, () => {
      const s = sky(2000, width, height)
      const links = s.real.stats.links!
      const { all, inGalaxy } = pairs(s.map)
      expect(links.lines).toBe(0)
      expect(links.bridges).toBeGreaterThan(0)
      // At rest no bridge crosses galaxies, and the glows between galaxies are one per related pair at most.
      expect(links.bridges).toBeLessThanOrEqual(inGalaxy)
      expect(links.bridges + links.hints).toBeLessThanOrEqual(all)
      s.engine.destroy()
    })
  }

  it('focusing optics lights its bridge into mathematics; resting again puts it out', () => {
    const s = sky(2000, 1440, 900, 'physics')
    const optics = orderedNebulae(s.map).findIndex((n) => n.topicId === 'optics')
    const crossFromOptics = nebulaLinks(s.map).filter((l) => (l.a === 'optics' || l.b === 'optics') && (l.a === 'trigonometry' || l.b === 'trigonometry'))
    expect(crossFromOptics).toHaveLength(1)
    const scene = s.scene()
    s.engine.setFocusNebula(optics)
    s.clock.advance(1000)
    const frame = s.frame()
    expect(frame.highlightNebula).toBe(optics)
    // Which bridges were drawn: drawLinks again on a context that notes where each bridge's beads go.
    const ctx = recordingContext()
    drawLinks(ctx, scene, frame, THEME, { segments: [], boxes: [] })
    const trig = orderedNebulae(s.map).findIndex((n) => n.topicId === 'trigonometry')
    const towards = (n: number) => ctx.beads.some(([x, y]) => near(x, y, frame.nebulaX[optics], frame.nebulaY[optics], frame.nebulaX[n], frame.nebulaY[n]))
    expect(towards(trig)).toBe(true)
    s.engine.setFocusNebula(-1)
    s.clock.advance(1000)
    const rest = recordingContext()
    drawLinks(rest, scene, s.frame(), THEME, { segments: [], boxes: [] })
    expect(rest.beads.some(([x, y]) => near(x, y, s.frame().nebulaX[optics], s.frame().nebulaY[optics], s.frame().nebulaX[trig], s.frame().nebulaY[trig]))).toBe(false)
    s.engine.destroy()
  })
})

describe('the nebula and star layers', () => {
  it('the nebula layer draws its own lines, and names an off-screen destination in its own galaxy without a subject', () => {
    const s = sky(2000, 1440, 900)
    s.go({ layer: 'nebula', nebulaId: 'trigonometry' })
    expect(s.real.stats.links!.lines).toBeGreaterThan(0)
    expect(s.real.stats.links!.bridges).toBe(0)
    const destinations = s.counter.texts!.filter((t) => /^[↖↗↙↘] /.test(t.text))
    for (const t of destinations) expect(t.text).not.toContain(' · ')
    s.engine.destroy()
  })

  it('the star layer of Refraction draws its line into mathematics in full and says which subject it leads to', () => {
    const s = sky(2000, 1440, 900, 'physics')
    s.go({ layer: 'star', nebulaId: 'optics', unitId: 'demo-refraction' })
    expect(s.real.stats.links!.lines).toBeGreaterThan(0)
    expect(s.counter.texts!.some((t) => t.text.includes('Trigonometry · Mathematics'))).toBe(true)
    s.engine.destroy()
  })

  it('the recommended star’s prerequisites are tier 1 and its locked successors tier 4 (the demo sky has both)', () => {
    const s = sky(2000, 1440, 900)
    const stars = orderedStars(s.map)
    const kp = stars.findIndex((star) => star.unitId === 'demo-sine-cosine')
    const scene = s.scene()
    expect(scene.state[kp]).toBe(STATE_IN_PROGRESS)
    const into = scene.starLinks.filter((l) => l.to === kp)
    const out = scene.starLinks.filter((l) => l.from === kp)
    expect(into.length).toBeGreaterThan(0)
    for (const l of into) expect(scene.state[l.from]).toBe(STATE_LIT)
    expect(out.length).toBeGreaterThan(0)
    for (const l of out) expect(scene.state[l.to]).toBe(STATE_LOCKED)
    s.engine.destroy()
  })
})

describe('the seam: the shorter way round (#120)', () => {
  it('measures dx the shorter way round a band of width 1', () => {
    expect(shortestDx(0.95, 0.05)).toBeCloseTo(0.1)
    expect(shortestDx(0.05, 0.95)).toBeCloseTo(-0.1)
    expect(shortestDx(0.2, 0.6)).toBeCloseTo(0.4)
    expect(shortestDx(0.6, 0.2)).toBeCloseTo(-0.4)
    expect(shortestDx(0, 0.5)).toBeCloseTo(-0.5)
    for (let a = 0; a < 1; a += 0.13) for (let b = 0; b < 1; b += 0.17) {
      const d = shortestDx(a, b)
      expect(d).toBeGreaterThanOrEqual(-0.5)
      expect(d).toBeLessThan(0.5)
      // The same point, one band on or back.
      expect(Math.abs(a + d - b - Math.round(a + d - b))).toBeLessThan(1e-9)
    }
  })

  /** Two galaxies either side of the seam: nebula 0 at x 0.95, nebula 1 at x 0.05, one star each, a prerequisite between. */
  function seamScene(): { scene: SceneData; frame: SceneFrame } {
    const scene: SceneData = {
      mapKey: 'seam',
      count: 2,
      galaxy: true,
      galaxies: [
        { subjectId: 'a', name: 'Alpha', x0: 0.9, x1: 0.99, y0: 0.4, y1: 0.6, tint: 0.2, dim: 1, nebulae: [0] },
        { subjectId: 'b', name: 'Beta', x0: 0.01, x1: 0.1, y0: 0.4, y1: 0.6, tint: 0.8, dim: 1, nebulae: [1] },
      ],
      mapX: Float32Array.from([0.95, 0.05]),
      mapY: Float32Array.from([0.5, 0.5]),
      state: Uint8Array.from([STATE_LIT, STATE_IN_PROGRESS]),
      progress: new Float32Array(2),
      reviewDue: new Uint8Array(2),
      recommended: -1,
      nebula: Uint16Array.from([0, 1]),
      names: ['p', 'q'],
      skills: [[], []],
      nebulae: [
        { topicId: 'n0', name: 'Zero', x: 0.95, y: 0.5, r: 0.01, lit: 1, total: 1 },
        { topicId: 'n1', name: 'One', x: 0.05, y: 0.5, r: 0.01, lit: 0, total: 1 },
      ],
      links: [{ a: 0, b: 1, count: 1 }],
      starLinks: [{ from: 0, to: 1 }],
    }
    // 1000 px per band; the view on the seam's left side: x 0.95 at 500 px.
    const scale = 1000
    const ox = 500 - 0.95 * scale
    const frame = {
      viewport: { width: 1000, height: 600 },
      scale,
      ox,
      oy: 300 - 0.5 * scale,
      x: Float32Array.from([500, ox + 0.05 * scale]),
      y: Float32Array.from([300, 300]),
      starAlpha: Float32Array.from([1, 1]),
      nebulaX: Float32Array.from([500, ox + 0.05 * scale]),
      nebulaY: Float32Array.from([300, 300]),
      nebulaR: Float32Array.from([10, 10]),
      sharpness: Float32Array.from([1, 1]),
      glyphSize: 10,
      dotBlend: 1,
      dotRadius: 1.5,
      breath: null,
      starLabelAlpha: 0,
      nebulaLabelAlpha: 1,
      innerLinkAlpha: 0,
      starLayer: 0,
      chosenNebula: -1,
      focusStar: -1,
      highlightNebula: 0,
      dim: 1,
      showSkills: false,
      crossfade: 0,
    } satisfies SceneFrame
    return { scene, frame }
  }

  it('a bridge across the seam runs right, the short way, not back across the band', () => {
    const { scene, frame } = seamScene()
    const ctx = recordingContext()
    const stats = drawLinks(ctx, scene, frame, THEME, { segments: [], boxes: [] })
    expect(stats.bridges).toBe(1)
    const xs = ctx.beads.map(([x]) => x)
    expect(xs.length).toBeGreaterThan(0)
    // From x 500 to the right (towards 600 = 0.05 one band on), never leftwards to x -400.
    for (const x of xs) {
      expect(x).toBeGreaterThan(500)
      expect(x).toBeLessThan(600)
    }
  })

  it('a star line across the seam on the nebula layer leaves to the right, the short way', () => {
    const { scene, frame } = seamScene()
    const ctx = recordingContext()
    drawLinks(ctx, scene, { ...frame, innerLinkAlpha: 1, chosenNebula: 0, highlightNebula: -1 }, THEME, { segments: [], boxes: [] })
    // Anchored on the chosen nebula's star at x 500, it heads right, the short way, towards x 0.05 one band on (600).
    expect(ctx.strokes.length).toBeGreaterThan(0)
    for (const [x0, , x1] of ctx.strokes) {
      expect(x0).toBeGreaterThan(500)
      expect(x1).toBeGreaterThan(x0)
      expect(x1).toBeLessThan(600)
    }
  })

  it('with `wrap`, each shape is drawn again one band either side, where the other copies are', () => {
    const { scene, frame } = seamScene()
    const once = recordingContext()
    drawLinks(once, scene, { ...frame, innerLinkAlpha: 1, chosenNebula: 1, highlightNebula: -1 }, THEME, { segments: [], boxes: [] })
    const wrapped = recordingContext()
    const obstacles: LinkObstacles = { segments: [], boxes: [] }
    drawLinks(wrapped, scene, { ...frame, innerLinkAlpha: 1, chosenNebula: 1, highlightNebula: -1 }, THEME, obstacles, { wrap: true })
    // The chosen star sits at x -400, off screen; its copy one band on, at 600, is in view.
    expect(once.strokes).toHaveLength(0)
    expect(wrapped.strokes.length).toBeGreaterThan(0)
    for (const [x0, , x1] of wrapped.strokes) {
      expect(x0).toBeGreaterThan(500)
      expect(x1).toBeLessThan(x0)
    }
  })
})

/** Is (x, y) on the segment between the two points (within 30 px of it, inside its span)? */
function near(x: number, y: number, ax: number, ay: number, bx: number, by: number): boolean {
  const dx = bx - ax
  const dy = by - ay
  const t = ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)
  if (t < 0.05 || t > 0.95) return false
  return Math.hypot(ax + dx * t - x, ay + dy * t - y) < 30
}

/** A 2D context that notes each stroke's [x0, y0, x1, y1] and where each bead of a bridge goes (a round, not oval, glow). */
function recordingContext() {
  const strokes: [number, number, number, number][] = []
  const beads: [number, number][] = []
  let moved: [number, number] = [0, 0]
  let path: number[] = []
  const store: Record<string | symbol, unknown> = {}
  const gradient = { addColorStop() {} }
  const ctx = new Proxy(store, {
    get(target, prop) {
      if (prop === 'strokes') return strokes
      if (prop === 'beads') return beads
      if (prop in target) return target[prop]
      if (prop === 'createRadialGradient' || prop === 'createLinearGradient') return () => gradient
      if (prop === 'measureText') return (text: string) => ({ width: 7 * String(text).length })
      if (prop === 'beginPath') return () => (path = [])
      if (prop === 'moveTo' || prop === 'lineTo') return (x: number, y: number) => path.push(x, y)
      if (prop === 'stroke') return () => {
        if (path.length >= 4) strokes.push([path[0], path[1], path[path.length - 2], path[path.length - 1]])
      }
      if (prop === 'translate') return (x: number, y: number) => (moved = [x, y])
      if (prop === 'scale') return (sx: number, sy: number) => {
        if (sx === sy) beads.push(moved)
      }
      return () => undefined
    },
    set(target, prop, value) {
      target[prop] = value
      return true
    },
  })
  return ctx as unknown as CanvasRenderingContext2D & { strokes: typeof strokes; beads: typeof beads }
}
