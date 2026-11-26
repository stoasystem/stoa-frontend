/*
 * The star clusters' names on the whole view (#747), drawn by the real
 * renderer over the real engine: every cluster of the subject in focus is
 * named on a phone as on a wide screen, the names clear of each other and of
 * the clusters, readable (not shrunk below 10 px).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { demoClusterMap } from '@/dev/demo/clusters/demoClusterMap'
import { StarMapEngine } from '@/features/starmap/engine/starMapEngine'
import { createCanvas2DRenderer } from '@/features/starmap/render/canvas2d'
import { boxesOverlap, boxHitsCircle } from '@/features/starmap/render/labels'
import type { SceneData, SceneFrame, StarMapRenderer } from '@/features/starmap/render/types'
import { projectStarMap } from '@/features/starmap/readModelSource'
import { sheetBand } from '@/features/starmap/view/layers'
import type { KnowledgeMapResponse } from '@/types/practice'
import { fakeCanvas, fakeClock, THEME, type CanvasCounter } from './starmapHarness'

beforeEach(() => vi.stubGlobal('Path2D', class {}))
afterEach(() => vi.unstubAllGlobals())

/** Characters measured at about the size the names are drawn: 12 px, letter-spaced. */
const CHAR = 8.5

function textContext(log: { text: string; x: number; y: number; font: string }[]) {
  const store: Record<string | symbol, unknown> = { globalAlpha: 1, font: '' }
  const gradient = { addColorStop() {} }
  return new Proxy(store, {
    get(target, prop) {
      if (prop in target) return target[prop]
      if (prop === 'createRadialGradient' || prop === 'createLinearGradient') return () => gradient
      if (prop === 'measureText') return (text: string) => ({ width: CHAR * String(text).length })
      if (prop === 'fillText') return (text: string, x: number, y: number) => log.push({ text, x, y, font: String(target.font) })
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

function sky(): KnowledgeMapResponse {
  const map = demoClusterMap('en')
  return {
    subjectId: 'math',
    galaxies: map.subjects,
    nebulae: map.nebulae.map((nebula) => ({ ...nebula, subjectId: 'math' })),
    stars: map.stars as KnowledgeMapResponse['stars'],
    prerequisites: map.prerequisites,
    summary: map.summary,
  }
}

function wholeView(width: number, height: number) {
  const log: { text: string; x: number; y: number; font: string }[] = []
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
  const engine = new StarMapEngine({ renderer, theme: THEME, reducedMotion: true, scheduler: clock, now: clock.now, foveate: false, galaxy: true })
  engine.setViewport(width, height, 1, width < 768 ? { top: 112, bottom: 68, sheet: sheetBand(0) } : { top: 76, bottom: 164 })
  engine.setData(projectStarMap(sky(), { subjectId: 'math', language: 'en' }), { layer: 'map' })
  for (let i = 0; i < 20; i += 1) clock.advance(100)
  log.length = 0
  real.draw(frame!)
  return { boxes: real.stats.nebulaNames ?? [], scene: scene!, frame: frame!, log }
}

describe('the clusters named on the whole view', () => {
  it.each([
    ['phone', 375, 812],
    ['wide', 1440, 900],
  ] as const)('names all four mathematics clusters, clear of each other and the clusters: %s', (_size, width, height) => {
    const { boxes, scene, frame, log } = wholeView(width, height)
    const named = boxes.map((box) => scene.nebulae[box.nebula].topicId).filter((id) => ['numbers', 'geometry', 'algebra', 'data'].includes(id))
    expect(named.sort()).toEqual(['algebra', 'data', 'geometry', 'numbers'])
    const own = boxes.filter((box) => ['numbers', 'geometry', 'algebra', 'data'].includes(scene.nebulae[box.nebula].topicId))
    for (let i = 0; i < own.length; i += 1) {
      for (let j = i + 1; j < own.length; j += 1) expect(boxesOverlap(own[i], own[j])).toBe(false)
      // Clear of every other cluster's stars (the core the renderer keeps names off).
      for (let n = 0; n < scene.nebulae.length; n += 1) {
        if (n === own[i].nebula) continue
        expect(boxHitsCircle(own[i], { x: frame.nebulaX[n], y: frame.nebulaY[n], r: frame.nebulaR[n] * 0.9 })).toBe(false)
      }
      // Inside the screen.
      expect(own[i].x0).toBeGreaterThanOrEqual(0)
      expect(own[i].x1).toBeLessThanOrEqual(width)
    }
    // Readable: no name drawn under 10 px.
    const sizes = log.filter((entry) => /[A-Z]{3}/.test(entry.text)).map((entry) => Number(/(\d+(?:\.\d+)?)px/.exec(entry.font)?.[1] ?? 12))
    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(10)
  })
})
