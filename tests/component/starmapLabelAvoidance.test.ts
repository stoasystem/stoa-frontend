/**
 * Names that keep out of each other's way (#144, round three of #142): the
 * names at the screen's edge slide along it to keep clear of the key stars,
 * and sit over other stars only when nothing is free (B4); every key star on
 * screen gets its name, over other stars or lines on a dark backing if it
 * must (B5); a star held by a long press names itself and its linked stars,
 * and a short tap still chooses (B8); the longest names of four languages
 * stay on screen and clear of the phone's zoom buttons (#76).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { TFunction } from 'i18next'
import { StarMapEngine } from '@/features/starmap/engine/starMapEngine'
import { orderedStars, type StarMap } from '@/features/starmap/model/starMap'
import { createCanvas2DRenderer } from '@/features/starmap/render/canvas2d'
import { boxesOverlap, boxHitsCircle, edgeSpots, keyStars, nearerStars, placeInsisting, type Box, type Circle } from '@/features/starmap/render/labels'
import { placeEdgeBox } from '@/features/starmap/render/links'
import { STATE_IN_PROGRESS, type SceneData, type SceneFrame, type StarMapRenderer } from '@/features/starmap/render/types'
import { sheetBand, type LayerTarget } from '@/features/starmap/view/layers'
import { DRAG, reachFade, REVEAL } from '@/features/starmap/view/semanticZoom'
import { linkedStars } from '@/features/starmap/view/starDrag'
import { demoStarMap } from '@/dev/demo/sky/demoStarMap'
import { addDemoSkyStrings, DEMO_SKY_STRINGS } from '@/dev/demo/sky/strings'
import i18n from '@/i18n'
import type { SupportedLanguage } from '@/i18n/languages'
import { fakeCanvas, fakeClock, skyMap, THEME, type CanvasCounter } from './starmapHarness'

afterEach(() => vi.unstubAllGlobals())
beforeEach(() => vi.stubGlobal('Path2D', class {}))

const DEMO = 'demo-sine-cosine'
const CHAR = 7

/** A 2D context that records every `fillText` (text, where, alpha) and measures text at `CHAR` px a character. */
function textContext(log: { text: string; x: number; y: number; alpha: number }[]) {
  const store: Record<string | symbol, unknown> = { globalAlpha: 1 }
  const gradient = { addColorStop() {} }
  return new Proxy(store, {
    get(target, prop) {
      if (prop in target) return target[prop]
      if (prop === 'createRadialGradient' || prop === 'createLinearGradient') return () => gradient
      if (prop === 'measureText') return (text: string) => ({ width: CHAR * String(text).length })
      if (prop === 'fillText') return (text: string, x: number, y: number) => log.push({ text, x, y, alpha: target.globalAlpha as number })
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

/** The page's bands as StarMapView sets them (no Demo notice): a phone also has its sheet band. */
const bandsFor = (width: number) => (width < 768 ? { top: 112, bottom: 72, sheet: sheetBand(0) } : { top: 76, bottom: 164 })

/** The real renderer and engine over the one sky with its prerequisites. */
function session(width: number, height: number, { map = skyMap(1000, 'math', { relations: true }) as StarMap } = {}) {
  const log: { text: string; x: number; y: number; alpha: number }[] = []
  const counter: CanvasCounter = { drawImage: 0, filterSets: 0, texts: [] }
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
  const navigate = vi.fn()
  const engine = new StarMapEngine({ renderer, theme: THEME, reducedMotion: true, scheduler: clock, now: clock.now, foveate: false, galaxy: true, onRequestTarget: navigate })
  const bands = bandsFor(width)
  engine.setViewport(width, height, 1, bands)
  engine.setData(map, { layer: 'map' })
  clock.advance(20)
  const go = (target: LayerTarget) => {
    engine.setTarget(target)
    clock.advance(400)
  }
  /** Draw the last frame again; what it wrote. */
  const redraw = () => {
    log.length = 0
    real.draw(frame!)
    return [...log]
  }
  const area: Box = { x0: 0, y0: bands.top, x1: width, y1: height - bands.bottom }
  const corner: Box | null =
    'sheet' in bands ? { x0: width - REVEAL.phoneZoomCorner.width, y0: height - REVEAL.phoneZoomCorner.height, x1: width, y1: height } : null
  const index = (unitId: string) => orderedStars(map).findIndex((star) => star.unitId === unitId)
  return { real, engine, clock, navigate, go, redraw, area, corner, index, map, scene: () => scene!, frame: () => frame! }
}

/** A key star's glyph on screen, as the edge names keep clear of it. */
const glyphOf = (f: SceneFrame, i: number): Circle => ({ x: f.x[i], y: f.y[i], r: Math.max(f.glyphSize * 0.42, f.dotRadius * 2) })

/** The key stars well inside the area names may use, whole in the reach of names: each should be named. */
function keyStarsInView(s: ReturnType<typeof session>): number[] {
  const scene = s.scene()
  const f = s.frame()
  const key = keyStars(scene, STATE_IN_PROGRESS)
  const reach = f.starNameReach
  const inset = 30
  return [...Array(scene.count).keys()].filter((i) => {
    if (key[i] !== 1 || f.starAlpha[i] < 0.5) return false
    if (f.x[i] < s.area.x0 + inset || f.x[i] > s.area.x1 - inset || f.y[i] < s.area.y0 + inset || f.y[i] > s.area.y1 - inset) return false
    if (s.corner && f.x[i] > s.corner.x0 - inset && f.y[i] > s.corner.y0 - inset) return false
    return !reach || reachFade(Math.hypot(f.x[i] - reach.x, f.y[i] - reach.y), reach) >= 1
  })
}

const VIEWS = [[1440, 900], [390, 844], [375, 812]] as const

describe('B4: names at the edge keep clear of the key stars', () => {
  const area: Box = { x0: 0, y0: 100, x1: 400, y1: 700 }
  const spots = edgeSpots(392 - 60, 400, 60, area, false)
  const at = spots[0]
  const mid = { x: (at.x0 + at.x1) / 2, y: (at.y0 + at.y1) / 2 }

  it('slide along the edge they are at, every spot inside the area', () => {
    expect(spots.length).toBeGreaterThan(10)
    for (const box of spots) {
      expect(box.x0).toBeGreaterThanOrEqual(area.x0)
      expect(box.x1).toBeLessThanOrEqual(area.x1)
      expect(box.y0).toBeGreaterThanOrEqual(area.y0)
      expect(box.y1).toBeLessThanOrEqual(area.y1)
      expect(box.x0).toBeCloseTo(at.x0) // up and down a side
    }
    const along = edgeSpots(200, 120, 50, area, true)
    expect(new Set(along.map((b) => b.y0)).size).toBe(1) // along the top
  })

  it('a key star where the name would go: the name slides off it', () => {
    const key = [{ ...mid, r: 10 }]
    const box = placeEdgeBox(spots, { segments: [], boxes: [], stars: () => ({ key, other: [] }) }, area)!
    expect(boxHitsCircle(box, key[0])).toBe(false)
    expect(Math.abs((box.y0 + box.y1) / 2 - mid.y)).toBeLessThanOrEqual(REVEAL.edgeLabel.slideY * 2)
  })

  it('nothing free: over other stars rather than a key star; every spot over a key star: still placed', () => {
    // A key star on every second spot and another star on the rest.
    const key: Circle[] = []
    const other: Circle[] = []
    spots.forEach((b, k) => (k % 2 === 0 ? key : other).push({ x: (b.x0 + b.x1) / 2, y: (b.y0 + b.y1) / 2, r: 9 }))
    const boxes: Box[] = []
    const box = placeEdgeBox(spots, { segments: [], boxes, stars: () => ({ key, other }) }, area)!
    expect(key.some((c) => boxHitsCircle(box, c))).toBe(false)
    expect(boxes).toContain(box)
    const all = spots.map((b) => ({ x: (b.x0 + b.x1) / 2, y: (b.y0 + b.y1) / 2, r: 9 }))
    expect(placeEdgeBox(spots, { segments: [], boxes: [], stars: () => ({ key: all, other: [] }) }, area)).not.toBeNull()
  })

  for (const points of [1000, 2000] as const) {
    for (const [width, height] of VIEWS) {
      it(`${width}×${height}, ${points} stars: a chosen trigonometry’s edge names cover no key star`, () => {
        const s = session(width, height, { map: skyMap(points, 'math', { relations: true }) })
        s.go({ layer: 'nebula', nebulaId: 'trigonometry' })
        s.redraw()
        const labels = s.real.stats.edgeLabels ?? []
        expect(labels.length).toBeGreaterThan(0)
        expect(s.engine.edgeLabels).toBe(s.real.stats.edgeLabels)
        const f = s.frame()
        const key = keyStars(s.scene(), STATE_IN_PROGRESS)
        for (const label of labels) {
          for (let i = 0; i < key.length; i += 1) {
            if (key[i] !== 1 || f.starAlpha[i] < 0.5) continue
            expect(boxHitsCircle(label, glyphOf(f, i)), `${label.text} over ${s.scene().names[i]}`).toBe(false)
          }
        }
        s.engine.destroy()
      })
    }
  }
})

describe('B5: every key star in view has its name', () => {
  it('a name with nowhere free sits over another star or a line, never over a placed name or a key star while it can', () => {
    const area: Box = { x0: 0, y0: 0, x1: 400, y1: 400 }
    const spots = [
      { x0: 100, y0: 100, x1: 160, y1: 117 },
      { x0: 100, y0: 60, x1: 160, y1: 77 },
      { x0: 170, y0: 80, x1: 230, y1: 97 },
    ]
    const placed = [spots[0]]
    const keyCircle = { x: 130, y: 68, r: 8 }
    const other = { x: 200, y: 88, r: 8 }
    const box = placeInsisting(spots, placed, [other], [keyCircle], [], area)
    expect(box).toBe(spots[2])
    expect(placeInsisting(spots, spots, [], [], [], area)).toBeNull()
    // A spot nearer another star than its own reads as theirs.
    expect(nearerStars(spots[2], { x: 120, y: 120 }, [other])).toBe(1)
    expect(nearerStars(spots[2], { x: 200, y: 90 }, [{ x: 0, y: 0, r: 4 }])).toBe(0)
  })

  for (const points of [1000, 2000] as const) {
    for (const [width, height] of VIEWS) {
      it(`${width}×${height}, ${points} stars: every key star of a chosen trigonometry is named`, () => {
        const s = session(width, height, { map: skyMap(points, 'math', { relations: true }) })
        s.go({ layer: 'nebula', nebulaId: 'trigonometry' })
        const texts = new Set(s.redraw().map((o) => o.text))
        const wanted = keyStarsInView(s)
        expect(wanted.length).toBeGreaterThan(2)
        const names = s.scene().names
        expect(wanted.filter((i) => !texts.has(names[i])).map((i) => names[i])).toEqual([])
        // Names stay out of the phone's zoom buttons.
        if (s.corner) {
          for (const o of s.redraw()) {
            const half = (o.text.length * CHAR) / 2
            expect(boxesOverlap({ x0: o.x - half, y0: o.y - 6, x1: o.x + half, y1: o.y + 6 }, s.corner), o.text).toBe(false)
          }
        }
        s.engine.destroy()
      })
    }
  }

  it('the named trigonometry 16 and 19 of the review (#142 B5) are among them', () => {
    const s = session(390, 844)
    s.go({ layer: 'nebula', nebulaId: 'trigonometry' })
    const texts = new Set(s.redraw().map((o) => o.text))
    const key = keyStars(s.scene(), STATE_IN_PROGRESS)
    for (const name of ['Trigonometry 16', 'Trigonometry 19']) {
      const i = s.scene().names.indexOf(name)
      expect(i, name).toBeGreaterThanOrEqual(0)
      expect(key[i], name).toBe(1)
      expect(texts.has(name), name).toBe(true)
    }
    s.engine.destroy()
  })
})

describe('B8: a long press names the held star and its linked stars; a short tap still chooses', () => {
  for (const [width, height] of [[390, 844], [375, 812]] as const) {
    it(`${width}×${height}: held, the star and every linked star in view are named; let go, the others' names go`, () => {
      const s = session(width, height)
      s.go({ layer: 'nebula', nebulaId: 'trigonometry' })
      const scene = s.scene()
      const i = s.index(DEMO)
      const linked = linkedStars(scene.starLinks, i)
      const key = keyStars(scene, STATE_IN_PROGRESS)
      const inView = (j: number) => {
        const f = s.frame()
        return f.x[j] > 30 && f.x[j] < width - 30 && f.y[j] > s.area.y0 + 30 && f.y[j] < s.area.y1 - 30
      }
      const before = new Set(s.redraw().map((o) => o.text))
      const plain = linked.filter((j) => key[j] === 0 && inView(j))
      expect(plain.length).toBeGreaterThan(0)
      for (const j of plain) expect(before.has(scene.names[j]), scene.names[j]).toBe(false)

      const f = s.frame()
      s.engine.pointerDown(1, f.x[i], f.y[i], 'touch')
      s.clock.advance(DRAG.longPressMs + 60)
      expect(s.engine.holdingStar).toBe(true)
      s.clock.advance(300)
      const held = new Set(s.redraw().map((o) => o.text))
      expect(held.has(scene.names[i])).toBe(true)
      const missing = linked.filter((j) => inView(j) && !held.has(scene.names[j])).map((j) => scene.names[j])
      expect(missing).toEqual([])

      s.engine.pointerUp(1, f.x[i], f.y[i])
      s.clock.advance(1500)
      expect(s.navigate).not.toHaveBeenCalled()
      const after = new Set(s.redraw().map((o) => o.text))
      for (const j of plain) expect(after.has(scene.names[j]), scene.names[j]).toBe(false)
      s.engine.destroy()
    })
  }

  it('a short tap on the same star still chooses it, and names nothing more', () => {
    const s = session(390, 844)
    s.go({ layer: 'nebula', nebulaId: 'trigonometry' })
    const i = s.index(DEMO)
    const f = s.frame()
    s.engine.pointerDown(1, f.x[i], f.y[i], 'touch')
    s.clock.advance(80)
    expect(s.engine.holdingStar).toBe(false)
    s.engine.pointerUp(1, f.x[i], f.y[i])
    expect(s.navigate).toHaveBeenCalledWith(expect.objectContaining({ layer: 'star', unitId: DEMO }))
    s.engine.destroy()
  })
})

describe('#76: the longest names of four languages fit at the nebula band', () => {
  addDemoSkyStrings()
  for (const language of Object.keys(DEMO_SKY_STRINGS) as SupportedLanguage[]) {
    for (const [width, height] of VIEWS) {
      it(`${language}, ${width}×${height}: edge names stay on screen, inside the bands, clear of the zoom buttons`, () => {
        const t = i18n.getFixedT(language, 'starmap') as unknown as TFunction<'starmap'>
        const map = demoStarMap('math', 1000, t, { language, relations: true, longNames: true })
        expect(map.nebulae[0].name.length).toBeGreaterThan(40)
        const s = session(width, height, { map })
        s.go({ layer: 'nebula', nebulaId: 'trigonometry' })
        s.redraw()
        const labels = s.real.stats.edgeLabels ?? []
        expect(labels.length).toBeGreaterThan(0)
        for (const label of labels) {
          expect(label.x0, label.text).toBeGreaterThanOrEqual(0)
          expect(label.x1, label.text).toBeLessThanOrEqual(width)
          expect(label.y0, label.text).toBeGreaterThanOrEqual(s.area.y0)
          expect(label.y1, label.text).toBeLessThanOrEqual(s.area.y1)
          expect(label.x1 - label.x0, label.text).toBeLessThanOrEqual(220 + 16)
          if (s.corner) expect(boxesOverlap(label, s.corner), label.text).toBe(false)
        }
        // Every key star still has its name with the long edge names about.
        const texts = new Set(s.redraw().map((o) => o.text))
        const names = s.scene().names
        expect(keyStarsInView(s).filter((i) => !texts.has(names[i])).map((i) => names[i])).toEqual([])
        s.engine.destroy()
      })
    }
  }
})
