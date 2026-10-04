/**
 * Names and lines by importance (#138, round two of #123): at the nebula band
 * only the key stars are named (B2) -- recommended, in progress, on the gold
 * path -- the rest on hover or further in; locked lines only for the star in
 * focus or the dragged one (D1); a relation across subjects keeps a faint
 * direction and an edge name (D2); a focused nebula's bridge to another
 * galaxy, off screen, is pointed to at the edge (D3); edge names are painted
 * over the stars (D5); a dragged star's off-screen linked star in its own
 * nebula is named itself (H4); the glow between galaxies is dithered.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { StarMapEngine } from '@/features/starmap/engine/starMapEngine'
import { CROSS_SUBJECT_LINE, starLineLook, TIER_LOCKED, TIER_WALKED, type LinkView, type StarLine } from '@/features/starmap/model/linkTiers'
import { orderedNebulae } from '@/features/starmap/model/starMap'
import { createCanvas2DRenderer } from '@/features/starmap/render/canvas2d'
import { keyStars } from '@/features/starmap/render/labels'
import { drawLinks, GLOW_SPRITE_PX, glowDitherAmplitude, glowProfile, LINK_INK, paintGlowSprite } from '@/features/starmap/render/links'
import { STATE_IN_PROGRESS, STATE_LIT, STATE_LOCKED, STATE_READY, type SceneData, type SceneFrame, type StarMapRenderer } from '@/features/starmap/render/types'
import type { LayerTarget } from '@/features/starmap/view/layers'
import { lineReveal, restStarNameAlpha, REVEAL, ZOOM } from '@/features/starmap/view/semanticZoom'
import { fakeCanvas, fakeClock, fakeContext, skyMap, THEME, type CanvasCounter } from './starmapHarness'

afterEach(() => vi.unstubAllGlobals())
beforeEach(() => vi.stubGlobal('Path2D', class {}))

type Op = { op: 'draw' } | { op: 'text'; text: string; alpha: number }

/** A 2D context that logs, in order, every `drawImage` and every `fillText` (with its alpha). */
function orderContext(log: Op[]) {
  const store: Record<string | symbol, unknown> = { globalAlpha: 1 }
  const gradient = { addColorStop() {} }
  return new Proxy(store, {
    get(target, prop) {
      if (prop in target) return target[prop]
      if (prop === 'createRadialGradient' || prop === 'createLinearGradient') return () => gradient
      if (prop === 'measureText') return (text: string) => ({ width: 7 * String(text).length })
      if (prop === 'drawImage') return () => log.push({ op: 'draw' })
      if (prop === 'fillText') return (text: string) => log.push({ op: 'text', text, alpha: target.globalAlpha as number })
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

/** The real renderer over the one sky with its prerequisites; `log` sees the main canvas only. */
function sky(width: number, height: number, subjectId = 'math', points: 1000 | 2000 = 1000) {
  const log: Op[] = []
  const counter: CanvasCounter = { drawImage: 0, filterSets: 0, texts: [] }
  const main = { width: 1, height: 1, getContext: () => orderContext(log) } as unknown as HTMLCanvasElement
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
  const map = skyMap(points, subjectId, { relations: true })
  engine.setViewport(width, height, 1)
  engine.setData(map, { layer: 'map' })
  clock.advance(20)
  const go = (target: LayerTarget) => {
    engine.setTarget(target)
    clock.advance(400)
  }
  /** Draw one more frame and return what it logged. */
  const redraw = () => {
    log.length = 0
    real.draw(frame!)
    return [...log]
  }
  return { real, engine, clock, map, go, redraw, log, scene: () => scene!, frame: () => frame! }
}

const ARROW = /^[↖↗↙↘] /

describe('B2: at the nebula band only the key stars are named', () => {
  it('the key stars are the recommended ones, those in progress, and the gold path’s', () => {
    // 0 lit -> 1 recommended (gold), 2 in progress, 3 lit -> 4 locked, 5 ready.
    const key = keyStars(
      {
        count: 6,
        state: [STATE_LIT, STATE_READY, STATE_IN_PROGRESS, STATE_LIT, STATE_LOCKED, STATE_READY],
        starLinks: [{ from: 0, to: 1 }, { from: 3, to: 4 }, { from: 5, to: 2 }],
        recommended: 1,
        recommendations: [1],
      },
      STATE_IN_PROGRESS,
    )
    expect([...key]).toEqual([1, 1, 1, 0, 0, 0])
  })

  it('names fade in continuously and monotonically with the zoom: the key stars’ first, the rest past a chosen nebula’s zoom', () => {
    let last = 0
    for (let px = 0; px <= ZOOM.maxGlyph; px += 0.05) {
      const now = restStarNameAlpha(px)
      expect(now).toBeGreaterThanOrEqual(last)
      expect(now - last).toBeLessThan(0.02)
      last = now
    }
    expect(REVEAL.starNamesRest[0]).toBeGreaterThan(ZOOM.nebulaGlyph)
    expect(REVEAL.starNamesRest[0]).toBeGreaterThan(REVEAL.starNameIn[1])
  })

  for (const [width, height] of [[1440, 900], [390, 844], [375, 812]] as const) {
    it(`${width}×${height}: a chosen trigonometry names only key stars, and more once zoomed all the way in`, () => {
      const s = sky(width, height)
      s.go({ layer: 'nebula', nebulaId: 'trigonometry' })
      const scene = s.scene()
      const key = keyStars(scene, STATE_IN_PROGRESS)
      const byName = new Map<string, number[]>()
      scene.names.forEach((name, i) => byName.set(name, [...(byName.get(name) ?? []), i]))
      const starNames = (ops: Op[]) => ops.flatMap((o) => (o.op === 'text' && byName.has(o.text) ? [o.text] : []))
      const atNebula = starNames(s.redraw())
      expect(atNebula.length).toBeGreaterThan(0)
      for (const name of atNebula) expect(byName.get(name)!.some((i) => key[i] === 1), name).toBe(true)
      // All the way in, around the same point, the rest are named too.
      for (let k = 0; k < 40; k += 1) s.engine.zoomBy(0.25, width / 2, height / 2)
      s.clock.advance(1500)
      expect(s.engine.zoom.starPx).toBeGreaterThanOrEqual(REVEAL.starNamesRest[1])
      const allIn = starNames(s.redraw())
      expect(allIn.some((name) => byName.get(name)!.every((i) => key[i] === 0))).toBe(true)
      s.engine.destroy()
    })
  }

  it('hovering a star names it; the pointer leaving lets it go', () => {
    const s = sky(1440, 900)
    s.go({ layer: 'nebula', nebulaId: 'trigonometry' })
    const scene = s.scene()
    const key = keyStars(scene, STATE_IN_PROGRESS)
    const f = s.frame()
    const named = (i: number) => s.redraw().some((o) => o.op === 'text' && o.text === scene.names[i])
    // Ordinary stars on screen, nearest the middle first.
    const plain = [...Array(scene.count).keys()]
      .filter((i) => key[i] === 0 && f.x[i] > 100 && f.x[i] < 1340 && f.y[i] > 100 && f.y[i] < 800 && f.starAlpha[i] > 0.5)
      .sort((a, b) => Math.hypot(f.x[a] - 720, f.y[a] - 450) - Math.hypot(f.x[b] - 720, f.y[b] - 450))
      .slice(0, 8)
    expect(plain.length).toBeGreaterThan(0)
    let revealed = 0
    for (const i of plain) {
      expect(named(i), scene.names[i]).toBe(false)
      s.engine.hoverAt(f.x[i], f.y[i])
      s.clock.advance(50)
      if (named(i)) revealed += 1
      s.engine.hoverAt(null)
      s.clock.advance(50)
      expect(named(i), scene.names[i]).toBe(false)
    }
    expect(revealed).toBeGreaterThan(plain.length / 2)
    s.engine.destroy()
  })
})

describe('D1 / D2: locked lines for the star in focus only; across subjects a faint direction', () => {
  const view = (starPx: number, more: Partial<LinkView> = {}): LinkView => ({ ...lineReveal(starPx), star: 0, chosen: 0, focusStar: -1, ...more })
  const line = (tier: StarLine['tier'], crossSubject = false): StarLine => ({ from: 1, to: 2, fromNebula: 0, toNebula: crossSubject ? 9 : 0, tier, crossSubject })

  it('tier 4 is drawn for the star in focus and the dragged star, never for every star', () => {
    for (const px of [ZOOM.nebulaGlyph, ZOOM.starGlyph, ZOOM.maxGlyph]) {
      expect(starLineLook(line(TIER_LOCKED), view(px)).strength).toBe(0)
      expect(starLineLook(line(TIER_LOCKED), view(px, { focusStar: 1 })).strength).toBe(1)
      expect(starLineLook(line(TIER_LOCKED), view(px, { dragStar: 2, drag: 1 })).lit).toBe(1)
    }
  })

  it('a relation across subjects keeps a faint direction at the nebula band, whatever its tier; none on the panorama', () => {
    for (const tier of [TIER_WALKED, TIER_LOCKED] as const) {
      expect(starLineLook(line(tier, true), view(ZOOM.nebulaGlyph)).strength).toBeGreaterThanOrEqual(CROSS_SUBJECT_LINE)
      expect(starLineLook(line(tier, true), view(ZOOM.nebulaGlyph)).reach).toBe(0)
      expect(starLineLook(line(tier, true), view(13)).strength).toBeCloseTo(CROSS_SUBJECT_LINE)
      expect(starLineLook(line(tier, true), view(4)).strength).toBe(0)
    }
  })

  it('a chosen trigonometry points to optics in physics at its edge (the cross-subject relation)', () => {
    const s = sky(1440, 900)
    s.go({ layer: 'nebula', nebulaId: 'trigonometry' })
    const physics = s.scene().galaxies!.find((g) => g.subjectId === 'physics')!.name
    const texts = s.redraw().flatMap((o) => (o.op === 'text' ? [o.text] : []))
    expect(texts).toContainEqual(expect.stringMatching(new RegExp(`^[↖↗↙↘] Optics · ${physics}$`)))
    s.engine.destroy()
  })
})

describe('D3: a focused nebula’s bridge to another galaxy, off screen, is pointed to at the edge', () => {
  it.each([[390, 844], [375, 812]] as const)('%i×%i: focusing optics points to trigonometry in mathematics', (width, height) => {
    const s = sky(width, height, 'physics', 2000)
    const optics = orderedNebulae(s.map).findIndex((n) => n.topicId === 'optics')
    s.engine.setFocusNebula(optics)
    s.clock.advance(1000)
    const math = s.scene().galaxies!.find((g) => g.subjectId === 'math')!.name
    const texts = s.redraw().flatMap((o) => (o.op === 'text' ? [o.text] : []))
    expect(s.real.stats.links!.bridgeLabels).toBe(1)
    expect(texts).toContainEqual(expect.stringMatching(new RegExp(`^[↖↙] Trigonometry · ${math}$`)))
    s.engine.setFocusNebula(-1)
    s.clock.advance(1000)
    s.redraw()
    expect(s.real.stats.links!.bridgeLabels).toBe(0)
    s.engine.destroy()
  })

  it('wherever the far end is on screen there is no edge name: a 3440 screen shows trigonometry, a 1440 one does not', () => {
    for (const [width, height] of [[3440, 1440], [1440, 900]] as const) {
      const s = sky(width, height, 'physics', 2000)
      const nebulae = orderedNebulae(s.map)
      const optics = nebulae.findIndex((n) => n.topicId === 'optics')
      const trig = nebulae.findIndex((n) => n.topicId === 'trigonometry')
      s.engine.setFocusNebula(optics)
      s.clock.advance(1000)
      s.redraw()
      const f = s.frame()
      const shown = f.nebulaX[trig] >= 0 && f.nebulaX[trig] <= width && f.nebulaY[trig] >= 0 && f.nebulaY[trig] <= height
      expect(s.real.stats.links!.bridges).toBeGreaterThan(0)
      expect(s.real.stats.links!.bridgeLabels, `${width}`).toBe(shown ? 0 : 1)
      s.engine.destroy()
    }
  })
})

describe('D5: edge names are painted over the stars and their names', () => {
  it.each([[1440, 900], [390, 844]] as const)('%i×%i: every edge name comes after the last star and star name', (width, height) => {
    const s = sky(width, height)
    s.go({ layer: 'nebula', nebulaId: 'trigonometry' })
    const ops = s.redraw()
    const edges = ops.map((o, k) => (o.op === 'text' && ARROW.test(o.text) ? k : -1)).filter((k) => k >= 0)
    expect(edges.length).toBeGreaterThan(0)
    const names = new Set(s.scene().names)
    const lastStar = ops.reduce((at, o, k) => (o.op === 'draw' || (o.op === 'text' && names.has(o.text)) ? k : at), -1)
    expect(Math.min(...edges)).toBeGreaterThan(lastStar)
    s.engine.destroy()
  })
})

describe('H4: dragging, a linked star off screen in the same nebula is named itself', () => {
  it('its own nebula’s star by its name, another nebula by the nebula’s', () => {
    // 0 dragged at the middle; 1 in its nebula, off screen right; 2 in another nebula, off screen left.
    const mapX = [0.5, 0.95, 0.05]
    const scale = 1000
    const scene: SceneData = {
      mapKey: 'h4',
      count: 3,
      galaxy: true,
      galaxies: [{ subjectId: 'a', name: 'Alpha', x0: 0, x1: 1, y0: 0.4, y1: 0.6, tint: 0.2, dim: 1, nebulae: [0, 1] }],
      mapX: Float32Array.from(mapX),
      mapY: Float32Array.from([0.5, 0.5, 0.52]),
      state: Uint8Array.from([STATE_IN_PROGRESS, STATE_LOCKED, STATE_LIT]),
      progress: new Float32Array(3),
      reviewDue: new Uint8Array(3),
      recommended: -1,
      nebula: Uint16Array.from([0, 0, 1]),
      names: ['Held', 'Same cloud star', 'Far star'],
      skills: [[], [], []],
      nebulae: [
        { topicId: 'n0', name: 'Home', x: 0.6, y: 0.5, r: 0.3, lit: 0, total: 2 },
        { topicId: 'n1', name: 'Yonder', x: 0.05, y: 0.5, r: 0.05, lit: 1, total: 1 },
      ],
      links: [{ a: 0, b: 1, count: 1 }],
      starLinks: [{ from: 0, to: 1 }, { from: 2, to: 0 }],
    }
    const ox = 400 - 0.5 * scale
    const frame = {
      viewport: { width: 800, height: 600 },
      scale,
      ox,
      oy: 300 - 0.5 * scale,
      x: Float32Array.from(mapX.map((v) => ox + v * scale)),
      y: Float32Array.from([300, 300, 320]),
      starAlpha: new Float32Array(3).fill(1),
      nebulaX: Float32Array.from([ox + 0.6 * scale, ox + 0.05 * scale]),
      nebulaY: Float32Array.from([300, 300]),
      nebulaR: Float32Array.from([300, 50]),
      sharpness: Float32Array.from([1, 1]),
      glyphSize: 28,
      dotBlend: 0,
      dotRadius: 1.5,
      breath: null,
      starLabelAlpha: 1,
      nebulaLabelAlpha: 1,
      lineReveal: lineReveal(28),
      starFocus: 0,
      chosenNebula: 0,
      focusStar: -1,
      highlightNebula: -1,
      dim: 1,
      showSkills: 0,
      crossfade: 0,
      drag: { star: 0, related: Uint8Array.from([1, 1, 1]), offsetX: new Float32Array(3), offsetY: new Float32Array(3), amount: 1, grow: 1 },
    } satisfies SceneFrame
    const counter: CanvasCounter = { drawImage: 0, filterSets: 0, texts: [] }
    const stats = drawLinks(fakeContext(counter), scene, frame, THEME, { segments: [], boxes: [] })
    const texts = counter.texts!.map((t) => t.text)
    expect(stats.dragLabels).toBe(2)
    expect(texts).toContain('↘ Same cloud star')
    expect(texts).toContainEqual(expect.stringMatching(/^[↙↖] Yonder$/))
    expect(texts.some((t) => t.includes('Home'))).toBe(false)
  })
})

describe('the glow between galaxies is dithered (#137 report, #138)', () => {
  it('its sprite’s alpha gets bounded noise, its mean kept, the dark around it untouched', () => {
    const size = GLOW_SPRITE_PX
    const smooth = new Uint8ClampedArray(size * size * 4)
    for (let y = 0; y < size; y += 1) for (let x = 0; x < size; x += 1) {
      const d = Math.hypot(x + 0.5 - size / 2, y + 0.5 - size / 2) / (size / 2)
      smooth[(y * size + x) * 4 + 3] = Math.round(255 * Math.max(0, 1 - d))
    }
    let put: Uint8ClampedArray | null = null
    const ctx = {
      createRadialGradient: () => ({ addColorStop() {} }),
      clearRect() {},
      beginPath() {},
      arc() {},
      fill() {},
      getImageData: () => ({ data: Uint8ClampedArray.from(smooth) }),
      putImageData: (image: { data: Uint8ClampedArray }) => (put = image.data),
    }
    const canvas = { width: 1, height: 1, getContext: () => ctx } as unknown as HTMLCanvasElement
    paintGlowSprite(canvas, LINK_INK.bridge)
    expect(canvas.width).toBe(size)
    expect(put).not.toBeNull()
    const amplitude = glowDitherAmplitude(LINK_INK.bridge)
    // 1.5 drawn levels at the ink's 0.07: about 21 levels of the sprite.
    expect(amplitude).toBeCloseTo(1.5 / 0.07, 5)
    let changed = 0
    let sum = 0
    let sumSmooth = 0
    for (let p = 3; p < smooth.length; p += 4) {
      const a = smooth[p]
      const b = put![p]
      if (a === 0) expect(b).toBe(0)
      expect(Math.abs(b - a)).toBeLessThanOrEqual(Math.ceil(amplitude))
      if (a !== b) changed += 1
      sum += b
      sumSmooth += a
    }
    expect(changed).toBeGreaterThan(smooth.length / 4 / 4)
    expect(Math.abs(sum - sumSmooth) / sumSmooth).toBeLessThan(0.01)
  })

  it('its fade meets the rim flat (no circular edge) and falls monotonically from a flat middle', () => {
    expect(glowProfile(0)).toBe(1)
    expect(glowProfile(1)).toBe(0)
    expect(1 - glowProfile(0.01)).toBeLessThan(0.001)
    expect(glowProfile(0.99)).toBeLessThan(0.001)
    for (let t = 0.01; t <= 1; t += 0.01) expect(glowProfile(t)).toBeLessThanOrEqual(glowProfile(t - 0.01))
  })

  it('the renderer draws the glow from the sprite, not a fresh gradient', () => {
    const counter: CanvasCounter = { drawImage: 0, filterSets: 0, texts: [] }
    const s = sky(1440, 900, 'math', 2000)
    const frame = s.frame()
    const sprite = vi.fn(() => fakeCanvas(counter))
    const stats = drawLinks(fakeContext(counter), s.scene(), frame, THEME, { segments: [], boxes: [] }, { glowSprite: sprite })
    expect(stats.hints).toBeGreaterThan(0)
    expect(sprite).toHaveBeenCalledWith(LINK_INK.bridge)
    expect(counter.drawImage).toBeGreaterThanOrEqual(stats.hints)
    s.engine.destroy()
  })
})
