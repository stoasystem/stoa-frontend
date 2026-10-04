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
  type LinkTier,
  type LinkView,
  type StarLine,
} from '@/features/starmap/model/linkTiers'
import { nebulaLinks } from '@/features/starmap/model/links'
import { orderedNebulae, orderedStars, type StarMap } from '@/features/starmap/model/starMap'
import { createCanvas2DRenderer, withAlpha } from '@/features/starmap/render/canvas2d'
import { drawLinks, LINE, LINK_INK, shortestDx, type LinkObstacles } from '@/features/starmap/render/links'
import { STATE_IN_PROGRESS, STATE_LIT, STATE_LOCKED, STATE_READY, type LinkInk, type SceneData, type SceneFrame, type StarMapRenderer } from '@/features/starmap/render/types'
import type { LayerTarget } from '@/features/starmap/view/layers'
import { lineReveal } from '@/features/starmap/view/semanticZoom'
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

describe('what each zoom shows (#121 tiers, by zoom since #134)', () => {
  const inside = (tier: StarLine['tier'], from = 1, to = 2): StarLine => ({ from, to, fromNebula: 0, toNebula: 0, tier })
  /** The lines at a glyph size of `starPx`. */
  const at = (starPx: number, more: Partial<LinkView> = {}): LinkView => ({ ...lineReveal(starPx), star: 0, chosen: -1, focusStar: -1, ...more })
  const panorama = at(5)
  const nebula = at(28, { chosen: 0 })
  const star = at(34, { chosen: 0, focusStar: 1, star: 1 })

  it('the panorama draws no line between stars', () => {
    for (const tier of [1, 2, 3, 4] as const) {
      expect(starLineLook(inside(tier), panorama).strength).toBe(0)
      expect(starLineLook(inside(tier), { ...panorama, chosen: 0 }).strength).toBe(0)
    }
  })

  it('a nebula zoomed in draws lines in tiers 1-3, tier 4 only very close, and other nebulae’s lines too', () => {
    for (const tier of [1, 2, 3] as const) expect(starLineLook(inside(tier), nebula)).toEqual({ strength: 1, reach: 0, lit: 0 })
    expect(starLineLook(inside(4), nebula).strength).toBe(0)
    expect(starLineLook(inside(4), at(40)).strength).toBe(1)
    // Every star's lines by zoom, not just the chosen nebula's: nothing pops when a nebula is chosen.
    expect(starLineLook({ ...inside(1), fromNebula: 3, toNebula: 4 }, nebula).strength).toBe(1)
    // A line to another nebula: drawn, fading out near this nebula's star (reach 0).
    expect(starLineLook({ ...inside(2), toNebula: 5 }, nebula)).toEqual({ strength: 1, reach: 0, lit: 0 })
  })

  it('a focused star keeps only its own lines lit', () => {
    const focused = { ...nebula, focusStar: 1 }
    expect(starLineLook(inside(3, 1, 2), focused).strength).toBe(1)
    expect(starLineLook(inside(3, 7, 8), focused).strength).toBe(UNFOCUSED_LINE)
    expect(starLineLook(inside(4, 1, 2), focused).strength).toBe(0)
  })

  it('a chosen star, zoomed in, lights its prerequisites and successors fully, every tier, and hides the rest', () => {
    for (const tier of [1, 2, 3, 4] as const) {
      expect(starLineLook(inside(tier, 9, 1), star)).toEqual({ strength: 1, reach: 1, lit: 0 })
      expect(starLineLook(inside(tier, 1, 9), star)).toEqual({ strength: 1, reach: 1, lit: 0 })
      expect(starLineLook(inside(tier, 7, 8), star).strength).toBe(0)
    }
    // Across nebulae too, drawn all the way to the other star.
    expect(starLineLook({ ...inside(4, 1, 9), toNebula: 6 }, star)).toEqual({ strength: 1, reach: 1, lit: 0 })
  })

  it('crossfades as the map gives way to a chosen star', () => {
    const half = at(28, { chosen: 0, focusStar: 1, star: 0.5 })
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
  const panorama = { bridges: 1 }
  it('at rest no bridge crosses galaxies; a focused nebula lights its own', () => {
    const across = { a: 0, b: 5, count: 1, crossGalaxy: true }
    expect(bridgeLook(across, -1, panorama)).toBe(0)
    expect(bridgeLook(across, 3, panorama)).toBe(0)
    expect(bridgeLook(across, 5, panorama)).toBe(BRIDGE_FOCUSED)
  })

  it('the glow between two galaxies is there at rest, and steps back while one of their bridges is lit', () => {
    expect(galaxyHintLook(false, panorama)).toBe(1)
    expect(galaxyHintLook(true, panorama)).toBe(HINT_WHILE_BRIDGED)
    expect(galaxyHintLook(false, { bridges: 0 })).toBe(0)
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

describe('a chosen nebula and a chosen star', () => {
  it('a chosen nebula draws its lines, and names an off-screen destination in its own galaxy without a subject', () => {
    const s = sky(2000, 1440, 900)
    s.go({ layer: 'nebula', nebulaId: 'trigonometry' })
    expect(s.real.stats.links!.lines).toBeGreaterThan(0)
    expect(s.real.stats.links!.bridges).toBe(0)
    const destinations = s.counter.texts!.filter((t) => /^[↖↗↙↘] /.test(t.text))
    for (const t of destinations) expect(t.text).not.toContain(' · ')
    s.engine.destroy()
  })

  it('a chosen Refraction draws its line into mathematics in full and says which subject it leads to', () => {
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
      lineReveal: lineReveal(5),
      starFocus: 0,
      chosenNebula: -1,
      focusStar: -1,
      highlightNebula: 0,
      dim: 1,
      showSkills: 0,
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
    drawLinks(ctx, scene, { ...frame, lineReveal: lineReveal(28), chosenNebula: 0, highlightNebula: -1 }, THEME, { segments: [], boxes: [] })
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
    drawLinks(once, scene, { ...frame, lineReveal: lineReveal(28), chosenNebula: 1, highlightNebula: -1 }, THEME, { segments: [], boxes: [] })
    const wrapped = recordingContext()
    const obstacles: LinkObstacles = { segments: [], boxes: [] }
    drawLinks(wrapped, scene, { ...frame, lineReveal: lineReveal(28), chosenNebula: 1, highlightNebula: -1 }, THEME, obstacles, { wrap: true })
    // The chosen star sits at x -400, off screen; its copy one band on, at 600, is in view.
    expect(once.strokes).toHaveLength(0)
    expect(wrapped.strokes.length).toBeGreaterThan(0)
    for (const [x0, , x1] of wrapped.strokes) {
      expect(x0).toBeGreaterThan(500)
      expect(x1).toBeLessThan(x0)
    }
  })
})

describe('each tier in its own ink, through drawLinks (#121, #123)', () => {
  /** A star at the centre with one prerequisite line to each of four stars around it, one per tier. */
  function tierScene(): { scene: SceneData; frame: SceneFrame; tierOf: Map<number, LinkTier> } {
    // 0 lit at the centre; 1 ready and recommended (tier 1), 2 in progress (tier 2), 3 lit (tier 3), 4 locked (tier 4).
    const mapX = [0.5, 0.7, 0.3, 0.5, 0.5]
    const mapY = [0.5, 0.5, 0.5, 0.3, 0.7]
    const scene: SceneData = {
      mapKey: 'tiers',
      count: 5,
      mapX: Float32Array.from(mapX),
      mapY: Float32Array.from(mapY),
      state: Uint8Array.from([STATE_LIT, STATE_READY, STATE_IN_PROGRESS, STATE_LIT, STATE_LOCKED]),
      progress: new Float32Array(5),
      reviewDue: new Uint8Array(5),
      recommended: 1,
      recommendations: [1],
      nebula: new Uint16Array(5),
      names: ['centre', 'r', 'p', 'w', 'l'],
      skills: [[], [], [], [], []],
      nebulae: [{ topicId: 'n0', name: 'Zero', x: 0.5, y: 0.5, r: 0.3, lit: 2, total: 5 }],
      links: [],
      starLinks: [1, 2, 3, 4].map((to) => ({ from: 0, to })),
    }
    const scale = 1000
    const frame = {
      viewport: { width: 1000, height: 1000 },
      scale,
      ox: 0,
      oy: 0,
      x: Float32Array.from(mapX.map((v) => v * scale)),
      y: Float32Array.from(mapY.map((v) => v * scale)),
      starAlpha: new Float32Array(5).fill(1),
      nebulaX: Float32Array.from([500]),
      nebulaY: Float32Array.from([500]),
      nebulaR: Float32Array.from([300]),
      sharpness: Float32Array.from([1]),
      glyphSize: 30,
      dotBlend: 0,
      dotRadius: 1.5,
      breath: null,
      starLabelAlpha: 1,
      nebulaLabelAlpha: 0,
      // A chosen centre star, zoomed in to it: every tier is drawn, all the way.
      lineReveal: lineReveal(34),
      starFocus: 1,
      chosenNebula: 0,
      focusStar: 0,
      highlightNebula: -1,
      dim: 0.35,
      showSkills: 0,
      crossfade: 0,
    } satisfies SceneFrame
    const tierOf = new Map<number, LinkTier>([[1, TIER_RECOMMENDED], [2, TIER_IN_PROGRESS], [3, TIER_WALKED], [4, TIER_LOCKED]])
    return { scene, frame, tierOf }
  }

  type InkStroke = { to: [number, number]; style: unknown; width: number; dash: number[]; alpha: number }

  /** A 2D context that notes each stroke's end point and the ink it was stroked with. */
  function inkContext() {
    const strokes: InkStroke[] = []
    let path: number[] = []
    let dash: number[] = []
    const store: Record<string | symbol, unknown> = { globalAlpha: 1, lineWidth: 1 }
    const ctx = new Proxy(store, {
      get(target, prop) {
        if (prop === 'strokes') return strokes
        if (prop in target) return target[prop]
        if (prop === 'createRadialGradient' || prop === 'createLinearGradient') return () => ({ addColorStop() {} })
        if (prop === 'measureText') return (text: string) => ({ width: 7 * String(text).length })
        if (prop === 'setLineDash') return (next: number[]) => (dash = [...next])
        if (prop === 'beginPath') return () => (path = [])
        if (prop === 'moveTo' || prop === 'lineTo') return (x: number, y: number) => path.push(x, y)
        if (prop === 'stroke') return () => {
          if (path.length >= 4) strokes.push({
            to: [path[path.length - 2], path[path.length - 1]],
            style: target.strokeStyle, width: target.lineWidth as number, dash, alpha: target.globalAlpha as number,
          })
        }
        return () => undefined
      },
      set(target, prop, value) {
        target[prop] = value
        return true
      },
    })
    return ctx as unknown as CanvasRenderingContext2D & { strokes: InkStroke[] }
  }

  /** The strokes of the line from the centre star to star `to`, in order (tier 1: its glow, then the line). */
  const strokesTo = (ctx: { strokes: InkStroke[] }, frame: SceneFrame, to: number) => {
    const [cx, cy] = [frame.x[0], frame.y[0]]
    const [ux, uy] = [Math.sign(Math.round(frame.x[to] - cx)), Math.sign(Math.round(frame.y[to] - cy))]
    return ctx.strokes.filter(({ to: [x, y] }) => Math.sign(Math.round(x - cx)) === ux && Math.sign(Math.round(y - cy)) === uy)
  }

  const custom: LinkInk = { recommended: '#AA0001', inProgress: '#AA0002', walked: '#AA0003', locked: '#AA0004', bridge: '#AA0005' }
  const inkFor = (ink: LinkInk, tier: LinkTier) =>
    ({ [TIER_RECOMMENDED]: ink.recommended, [TIER_IN_PROGRESS]: ink.inProgress, [TIER_WALKED]: ink.walked, [TIER_LOCKED]: ink.locked })[tier]

  it.each([
    ['the default inks (LINK_INK)', undefined, LINK_INK],
    ['the sky tokens the theme reads', custom, custom],
  ] as const)('draws each tier with its ink, width and dash: %s', (_name, links, ink) => {
    const { scene, frame, tierOf } = tierScene()
    const ctx = inkContext()
    const stats = drawLinks(ctx, scene, frame, { ...THEME, links }, { segments: [], boxes: [] })
    expect(stats.lines).toBe(4)
    for (const [to, tier] of tierOf) {
      const strokes = strokesTo(ctx, frame, to)
      // Tier 1 has its warm glow under the line; every tier, one line.
      expect(strokes, `tier ${tier}`).toHaveLength(tier === TIER_RECOMMENDED ? 2 : 1)
      const line = strokes[strokes.length - 1]
      expect(line.style, `tier ${tier} ink`).toBe(inkFor(ink, tier))
      expect(line.width, `tier ${tier} width`).toBe(LINE.width[tier])
      expect(line.dash, `tier ${tier} dash`).toEqual(tier === TIER_LOCKED ? [...LINE.dash] : [])
      expect(line.alpha, `tier ${tier} strength`).toBe(1)
      if (tier === TIER_RECOMMENDED) {
        const glow = strokes[0]
        expect(glow.width).toBe(LINE.glow.width)
        expect(glow.alpha).toBeCloseTo(LINE.glow.alpha)
        expect(glow.dash).toEqual([])
        expect(String(glow.style).replace(/\s/g, '')).toBe(withAlpha(inkFor(ink, tier), 1).replace(/\s/g, ''))
      }
    }
  })

  it('pins the tier constants to the token values (#121 table)', () => {
    expect(LINK_INK).toEqual({
      recommended: 'rgba(242, 197, 114, 0.9)',
      inProgress: 'rgba(255, 255, 255, 0.5)',
      walked: 'rgba(255, 255, 255, 0.16)',
      locked: 'rgba(255, 255, 255, 0.3)',
      bridge: 'rgba(170, 190, 255, 0.07)',
    })
    expect(LINE.width).toEqual({ [TIER_RECOMMENDED]: 2, [TIER_IN_PROGRESS]: 1.5, [TIER_WALKED]: 1, [TIER_LOCKED]: 1 })
    expect([...LINE.dash]).toEqual([3, 4])
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
