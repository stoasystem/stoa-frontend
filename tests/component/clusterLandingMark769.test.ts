/**
 * A newcomer's first landing on a sky of clusters (#769) says "start in this
 * cluster": the cluster it means is ringed on the canvas, and Murmi's bubble
 * never covers that cluster's name or its stars.
 *
 *   A. the ring (`LANDING_MARK`): drawn round the marked cluster's stars by
 *      the real renderer, only while one is marked; it pulses with the
 *      recommended star's breath, and holds still under reduced motion;
 *   B. the bubble's place, from the real engine's whole view and the real
 *      renderer's name boxes: at 1280 x 800 beside the cluster
 *      (`placeAvoiding`), at 375 x 812 docked (`dockedPlace`), clear of the
 *      cluster's name and stars both times.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { dockedPlace, placeAvoiding, starBox } from '@/features/starmap/components/MurmiBubble'
import { StarMapEngine, type StarOnScreen } from '@/features/starmap/engine/starMapEngine'
import { CLUSTER_STARS_SHARE, hintCluster } from '@/features/starmap/onboarding/ClusterHint'
import { clusterAsDrawn, createCanvas2DRenderer } from '@/features/starmap/render/canvas2d'
import type { SceneData, SceneFrame, StarMapRenderer } from '@/features/starmap/render/types'
import { subjectOfNebula } from '@/features/starmap/model/starMap'
import { projectStarMap } from '@/features/starmap/readModelSource'
import { sheetBand } from '@/features/starmap/view/layers'
import { LANDING_MARK } from '@/features/starmap/view/semanticZoom'
import { demoKnowledgeMap } from '@/dev/preview/lighting'
import { fakeClock, THEME } from './starmapHarness'

beforeEach(() => vi.stubGlobal('Path2D', class {}))
afterEach(() => vi.unstubAllGlobals())

type Rect = { x0: number; y0: number; x1: number; y1: number }
type Arc = { x: number; y: number; r: number; lineWidth: number; alpha: number }

/** A 2D context that measures text roughly as a browser does and records each arc stroked. */
function context(arcs: Arc[]) {
  const store: Record<string | symbol, unknown> = { globalAlpha: 1, font: '', letterSpacing: '0px', lineWidth: 1 }
  const gradient = { addColorStop() {} }
  let pending: { x: number; y: number; r: number } | null = null
  return new Proxy(store, {
    get(target, prop) {
      if (prop in target) return target[prop]
      if (prop === 'createRadialGradient' || prop === 'createLinearGradient') return () => gradient
      if (prop === 'measureText') {
        return (text: string) => {
          const px = Number(/(\d+(?:\.\d+)?)px/.exec(String(target.font))?.[1] ?? 12)
          return { width: String(text).length * (px === 12 ? 9.5 : px === 11 ? 8.2 : 0.62 * px) }
        }
      }
      if (prop === 'beginPath') return () => { pending = null }
      if (prop === 'arc') return (x: number, y: number, r: number) => { pending = { x, y, r } }
      if (prop === 'stroke') return () => { if (pending) arcs.push({ ...pending, lineWidth: Number(target.lineWidth), alpha: Number(target.globalAlpha) }) }
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

const MAP = () => projectStarMap(demoKnowledgeMap(1000), { subjectId: 'math', language: 'en' })

/** The whole view of mathematics at `width` x `height`, as the page sets its bands, settled, by the real renderer. */
function wholeView(width: number, height: number, { reducedMotion = true } = {}) {
  const arcs: Arc[] = []
  const main = { width: 1, height: 1, getContext: () => context(arcs) } as unknown as HTMLCanvasElement
  const offscreen = (w: number, h: number) => ({ width: w, height: h, getContext: () => context([]) }) as unknown as HTMLCanvasElement
  const real = createCanvas2DRenderer(main, { createCanvas: offscreen })!
  const frames: SceneFrame[] = []
  let scene: SceneData | null = null
  const renderer: StarMapRenderer = {
    ...real,
    draw: (next) => {
      frames.push(next)
      real.draw(next)
    },
    setData: (next) => {
      scene = next
      real.setData(next)
    },
  }
  const clock = fakeClock()
  const engine = new StarMapEngine({ renderer, theme: THEME, reducedMotion, scheduler: clock, now: clock.now, foveate: false, galaxy: true })
  engine.setViewport(width, height, 1, width < 768 ? { top: 112, bottom: 68, sheet: sheetBand(0) } : { top: 76, bottom: 164 })
  const map = MAP()
  engine.setData(map, { layer: 'map' })
  for (let i = 0; i < 20; i += 1) clock.advance(100)
  return { engine, clock, real, arcs, frames, map, scene: () => scene! }
}

/** Where the marked cluster's stars are drawn now: the box round them, as the ring goes round them. */
function starsOf(view: ReturnType<typeof wholeView>, clusterId: string): Rect {
  const frame = view.frames[view.frames.length - 1]
  const scene = view.scene()
  const n = scene.nebulae.findIndex((nebula) => nebula.topicId === clusterId)
  const around = clusterAsDrawn(n, scene.nebula, frame.x, frame.y, frame.starAlpha, frame.x.length)!
  return { x0: around.x - around.r, y0: around.y - around.r, x1: around.x + around.r, y1: around.y + around.r }
}

const meets = (a: Rect, b: Rect) => Math.min(a.x1, b.x1) > Math.max(a.x0, b.x0) && Math.min(a.y1, b.y1) > Math.max(a.y0, b.y0)

describe('A. the ring round the cluster to start in', () => {
  it('is drawn round the marked cluster only while one is marked', () => {
    const view = wholeView(1280, 800)
    const clusterId = hintCluster(view.map)!
    const index = view.scene().nebulae.findIndex((nebula) => nebula.topicId === clusterId)
    expect(view.real.stats.markCluster ?? -1).toBe(-1)

    view.engine.setMarkedCluster(clusterId)
    view.arcs.length = 0
    view.clock.advance(100)
    expect(view.real.stats.markCluster).toBe(index)
    const stars = starsOf(view, clusterId)
    const ring = view.arcs.find((arc) => arc.lineWidth === LANDING_MARK.width)!
    expect(ring).toBeDefined()
    // Round the cluster's stars, a little outside them.
    expect(ring.x).toBeCloseTo((stars.x0 + stars.x1) / 2, 0)
    expect(ring.r).toBeGreaterThan((stars.x1 - stars.x0) / 2 + LANDING_MARK.pad - 1)
    expect(view.arcs.some((arc) => arc.lineWidth === LANDING_MARK.width * LANDING_MARK.glowWide)).toBe(true)

    view.engine.setMarkedCluster(null)
    view.arcs.length = 0
    view.clock.advance(100)
    expect(view.real.stats.markCluster).toBe(-1)
    expect(view.arcs.some((arc) => arc.lineWidth === LANDING_MARK.width)).toBe(false)
    view.engine.destroy()
  })

  it('holds still under reduced motion, and pulses with the breath otherwise', () => {
    const still = wholeView(1280, 800)
    still.engine.setMarkedCluster(hintCluster(still.map))
    for (let i = 0; i < 10; i += 1) still.clock.advance(170)
    expect(new Set(still.frames.slice(-8).map((frame) => frame.markAlpha))).toEqual(new Set([1]))
    still.engine.destroy()

    const moving = wholeView(1280, 800, { reducedMotion: false })
    moving.engine.setMarkedCluster(hintCluster(moving.map))
    // One look a step, over one breath and more.
    const alphas: number[] = []
    for (let i = 0; i < 30; i += 1) {
      moving.clock.advance(170)
      alphas.push(moving.frames[moving.frames.length - 1].markAlpha ?? 1)
    }
    expect(Math.min(...alphas)).toBeLessThan(0.9)
    expect(Math.min(...alphas)).toBeGreaterThanOrEqual(LANDING_MARK.pulseFrom - 1e-6)
    expect(Math.max(...alphas)).toBeGreaterThan(0.9)
    moving.engine.destroy()
  })
})

describe("B. the bubble keeps clear of the cluster's name and stars", () => {
  /** The cluster as the bubble sees it (`ClusterLandingBubble`'s `near`): its stars' share of the disc, its name. */
  function spotOf(view: ReturnType<typeof wholeView>, id: string): StarOnScreen {
    const spot = view.engine.nebulaOnScreen(id)!
    return { ...spot, size: spot.size * CLUSTER_STARS_SHARE }
  }

  /** Each of mathematics' clusters in turn as the one to start in: where the bubble goes. */
  function placeFor(view: ReturnType<typeof wholeView>, layer: { width: number; height: number }, controls: Rect[], docked: boolean) {
    const ids = view.map.nebulae.filter((nebula) => subjectOfNebula(view.map, nebula.topicId) === 'math').map((nebula) => nebula.topicId)
    return ids.map((clusterId) => {
      const spot = spotOf(view, clusterId)
      const others = ids.filter((id) => id !== clusterId).map((id) => spotOf(view, id))
      const [strict = null, ...rest] = others.map((other) => starBox(other))
      const names = others.flatMap((other) => (other.name ? [other.name] : []))
      const height = 140
      const rect = (at: StarOnScreen): Rect => {
        if (docked) {
          const dock = dockedPlace(at, { height }, layer, controls, strict, [...rest, ...names])
          return { x0: dock.x, y0: dock.y, x1: dock.x + dock.width, y1: dock.y + height }
        }
        const place = placeAvoiding(at, { width: 320, height }, layer, controls, strict, [...rest, ...names])
        return { x0: place.x, y0: place.y, x1: place.x + 320, y1: place.y + height }
      }
      return { clusterId, name: spot.name, stars: starsOf(view, clusterId), bubble: rect(spot) }
    })
  }

  it('beside the cluster at 1280 x 800, whichever cluster it is', () => {
    const view = wholeView(1280, 800)
    // The page's controls: the switcher and header along the top, zoom bottom right, the composer bottom middle.
    const controls = [
      { x0: 0, y0: 0, x1: 1280, y1: 150 },
      { x0: 1216, y0: 634, x1: 1256, y1: 708 },
      { x0: 320, y0: 732, x1: 960, y1: 778 },
    ]
    const named = placeFor(view, { width: 1280, height: 800 }, controls, false).filter((each) => each.name)
    expect(named.length, 'clusters named on the whole view').toBeGreaterThan(2)
    for (const each of named) {
      expect(meets(each.bubble, each.name!), `${each.clusterId}: its name`).toBe(false)
      expect(meets(each.bubble, each.stars), `${each.clusterId}: its stars`).toBe(false)
    }
    view.engine.destroy()
  })

  it('docked at 375 x 812, whichever cluster it is', () => {
    const view = wholeView(375, 812)
    // The phone's controls: the header and switcher along the top, help and zoom along the bottom, the composer under them.
    const controls = [
      { x0: 0, y0: 0, x1: 375, y1: 180 },
      { x0: 16, y0: 676, x1: 48, y1: 708 },
      { x0: 319, y0: 642, x1: 359, y1: 716 },
      { x0: 12, y0: 732, x1: 363, y1: 778 },
    ]
    const named = placeFor(view, { width: 375, height: 812 }, controls, true).filter((each) => each.name)
    expect(named.length, 'clusters named on the whole view').toBeGreaterThan(2)
    for (const each of named) {
      expect(meets(each.bubble, each.name!), `${each.clusterId}: its name`).toBe(false)
      expect(meets(each.bubble, each.stars), `${each.clusterId}: its stars`).toBe(false)
    }
    view.engine.destroy()
  })
})
