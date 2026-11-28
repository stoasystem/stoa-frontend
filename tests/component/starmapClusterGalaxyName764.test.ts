/**
 * A cluster name never covers the galaxy name on the whole view (#764). In
 * production, mathematics in English at 375 x 812 and 1024 x 768 drew "DATA
 * AND PROBABILITY" on a dark backing over the first letters of "MATHEMATICS"
 * (it read "THEMATICS"): the cluster sits in the sky's bottom row, with the
 * galaxy name under it and its neighbours either side, and with no side of
 * it off the letters the name fell back onto them.
 *
 * Drawn by the real renderer over the real engine and the knowledge base's
 * clustered sky, with one more cluster as production has it (a topic the
 * cluster table does not name is a cluster of its own: here `zahlen`), and
 * the galaxy name measured as a browser sets it (its sprite is as wide as its
 * letters at their size and tracking, not 7 px a character).
 *
 * Cluster names are what the student taps (#747), so they keep their place:
 * a name takes a corner or its two-line form off the letters where one is
 * free, and only where none is does the galaxy name step out of the picture,
 * whole (the page's heading names the subject too). Never partly covered.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { StarMapEngine } from '@/features/starmap/engine/starMapEngine'
import { createCanvas2DRenderer } from '@/features/starmap/render/canvas2d'
import { createGalaxyNames } from '@/features/starmap/render/galaxyNames'
import { boxesOverlap, type Box } from '@/features/starmap/render/labels'
import type { SceneData, SceneFrame, StarMapRenderer } from '@/features/starmap/render/types'
import { projectStarMap } from '@/features/starmap/readModelSource'
import { sheetBand } from '@/features/starmap/view/layers'
import { PANORAMA } from '@/features/starmap/view/semanticZoom'
import { demoKnowledgeMap } from '@/dev/preview/lighting'
import type { KnowledgeMapResponse } from '@/types/practice'
import { fakeClock, THEME } from './starmapHarness'

beforeEach(() => vi.stubGlobal('Path2D', class {}))
afterEach(() => vi.unstubAllGlobals())

type Fill = Box
type Sprite = { x: number; y: number; w: number; h: number }

/**
 * A 2D context that measures text as a browser roughly does (Nunito capitals: about 0.62 em a
 * character plus the letter spacing; the cluster names' 12 px with 1.5 px spacing come to 9.5 px,
 * a phone's 11 px with 1 px to 8.2), records every rectangle filled (a backing) and every image
 * drawn (a galaxy name's sprite).
 */
function context(fills: Fill[], sprites: Sprite[]) {
  const store: Record<string | symbol, unknown> = { globalAlpha: 1, font: '', letterSpacing: '0px' }
  const gradient = { addColorStop() {} }
  let path: Box | null = null
  return new Proxy(store, {
    get(target, prop) {
      if (prop in target) return target[prop]
      if (prop === 'createRadialGradient' || prop === 'createLinearGradient') return () => gradient
      if (prop === 'measureText') {
        return (text: string) => {
          const px = Number(/(\d+(?:\.\d+)?)px/.exec(String(target.font))?.[1] ?? 12)
          const spacing = Number(/(-?\d+(?:\.\d+)?)px/.exec(String(target.letterSpacing))?.[1] ?? 0)
          const char = px === 12 ? 9.5 : px === 11 ? 8.2 : 0.62 * px + spacing
          return { width: String(text).length * char }
        }
      }
      if (prop === 'beginPath') return () => { path = null }
      if (prop === 'roundRect' || prop === 'rect') return (x: number, y: number, w: number, h: number) => { path = { x0: x, y0: y, x1: x + w, y1: y + h } }
      if (prop === 'fill') return () => { if (path) fills.push(path) }
      if (prop === 'drawImage') {
        return (_image: unknown, ...args: number[]) => {
          if (args.length === 4) sprites.push({ x: args[0], y: args[1], w: args[2], h: args[3] })
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

/** The knowledge base's sky, with mathematics in five clusters as production has it (`zahlen` a cluster of its own). */
function fiveClusterSky(): KnowledgeMapResponse {
  const sky = demoKnowledgeMap(1000)
  const own = 'zahlen-own-cluster'
  return {
    ...sky,
    nebulae: sky.nebulae.map((nebula) => (nebula.topicId === 'zahlen' ? { ...nebula, topicId: own } : nebula)),
    stars: sky.stars.map((star) => (star.nebulaId === 'zahlen' ? { ...star, nebulaId: own } : star)),
  }
}

/** The whole view of mathematics at `width` x `height`, as the page sets its bands, settled. */
function wholeView(width: number, height: number) {
  const fills: Fill[] = []
  const sprites: Sprite[] = []
  const main = { width: 1, height: 1, getContext: () => context(fills, sprites) } as unknown as HTMLCanvasElement
  const offscreen = (w: number, h: number) => ({ width: w, height: h, getContext: () => context([], []) }) as unknown as HTMLCanvasElement
  const real = createCanvas2DRenderer(main, { createCanvas: offscreen })!
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
  engine.setViewport(width, height, 1, width < 768 ? { top: 112, bottom: 68, sheet: sheetBand(0) } : { top: 76, bottom: 164 })
  engine.setData(projectStarMap(fiveClusterSky(), { subjectId: 'math', language: 'en' }), { layer: 'map' })
  for (let i = 0; i < 20; i += 1) clock.advance(100)
  fills.length = 0
  sprites.length = 0
  real.draw(frame!)
  const s = scene!
  const names = (real.stats.nebulaNames ?? []).map((box) => ({ ...box, topic: s.nebulae[box.nebula].topicId, text: s.nebulae[box.nebula].name }))
  const math = s.galaxies!.findIndex((galaxy) => galaxy.subjectId === 'math')
  engine.destroy()
  return { names, letters: real.stats.galaxyNameBoxes ?? [], leftOut: real.stats.galaxyNamesLeftOut ?? [], galaxyNames: real.stats.galaxyNames, fills, math }
}

describe('#764: on the whole view no cluster name covers a galaxy name', () => {
  it.each([
    ['phone', 375, 812],
    ['1024', 1024, 768],
    ['1280', 1280, 800],
  ] as const)('no cluster name and no backing lies on a galaxy name’s letters: %s', (_size, width, height) => {
    const { names, letters, fills } = wholeView(width, height)
    const data = names.find((name) => name.topic === 'data')
    // The name the report was about is drawn (it is a tap target)...
    expect(data?.text).toBe('Data and probability')
    // ...and neither it nor any other cluster name, nor any backing, is on letters that are drawn.
    for (const name of names) expect(letters.filter((letters) => boxesOverlap(letters, name)), name.text).toEqual([])
    for (const fill of fills) expect(letters.some((letters) => boxesOverlap(letters, fill))).toBe(false)
  })

  it('at 1024 x 768 the name finds a free spot: the galaxy name stays, every cluster is named', () => {
    const { names, letters, leftOut, math } = wholeView(1024, 768)
    expect(leftOut).toEqual([])
    expect(letters.length).toBeGreaterThan(0)
    expect(leftOut).not.toContain(math)
    const mathTopics = ['numbers', 'zahlen-own-cluster', 'geometry', 'algebra', 'data']
    expect(names.filter((name) => mathTopics.includes(name.topic)).map((name) => name.topic).sort()).toEqual([...mathTopics].sort())
  })

  it('on a phone, where the bottom row has no spot off the letters, the galaxy name is left out whole, not covered', () => {
    const { names, leftOut, math, letters, galaxyNames } = wholeView(375, 812)
    expect(leftOut).toContain(math)
    // Its letters are no longer drawn at all (no other galaxy's name is in view on a phone).
    expect(letters).toEqual([])
    expect(galaxyNames).toBe(0)
    expect(names.map((name) => name.topic)).toContain('data')
  })
})

describe('#764: a galaxy name left out', () => {
  it('is not drawn, keeps its letters known to the placer, and comes back over the step-back time', () => {
    const drawn: number[] = []
    const ctx = new Proxy({ globalAlpha: 1 } as Record<string | symbol, unknown>, {
      get(target, prop) {
        if (prop in target) return target[prop]
        if (prop === 'drawImage') return () => drawn.push(Number(target.globalAlpha))
        return () => undefined
      },
      set(target, prop, value) {
        target[prop] = value
        return true
      },
    }) as unknown as CanvasRenderingContext2D
    const sprite = () => ({ width: 1, height: 1, getContext: () => context([], []) }) as unknown as HTMLCanvasElement
    const names = createGalaxyNames(sprite)
    const scene = {
      galaxies: [{ subjectId: 'math', name: 'Mathematics', x0: 0, x1: 1, y0: 0, y1: 0.5, dim: 1, nebulae: [], colour: { name: [200, 210, 255] } }],
    } as unknown as SceneData
    const frame = (time: number) => ({ pastPanorama: 0, viewport: { width: 800, height: 600 }, ox: 0, oy: 0, scale: 800, highlightNebula: -1, chosenNebula: -1, time }) as unknown as SceneFrame

    expect(names.draw(ctx, scene, frame(0), THEME, 1)).toBe(1)
    const full = drawn[0]
    drawn.length = 0
    expect(names.draw(ctx, scene, frame(16), THEME, 1, new Set([0]))).toBe(0)
    expect(drawn).toEqual([])
    expect(names.boxes).toEqual([])
    expect(names.letters.map((l) => l.galaxy)).toEqual([0])
    // Back: from nothing, over `galaxyNameYield.ms`.
    names.draw(ctx, scene, frame(16 + PANORAMA.galaxyNameYield.ms / 2), THEME, 1)
    expect(drawn[0]).toBeGreaterThan(0)
    expect(drawn[0]).toBeLessThan(full)
    expect(names.settling).toBe(true)
    names.draw(ctx, scene, frame(16 + PANORAMA.galaxyNameYield.ms * 2), THEME, 1)
    expect(drawn[1]).toBeCloseTo(full)
    expect(names.boxes).toHaveLength(1)
  })
})
