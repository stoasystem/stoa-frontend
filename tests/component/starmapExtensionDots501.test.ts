/**
 * Extension small stars on the canvas (#501): dark, a smaller and fainter ring
 * than a core one; lit, a gold dot with a glow of its own. Drawn into a
 * recording context at the demo knowledge point's star layer, where its three
 * small stars show (one of them an extension).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { StarMapEngine } from '@/features/starmap/engine/starMapEngine'
import type { StarMap } from '@/features/starmap/model/starMap'
import { createCanvas2DRenderer, EXTENSION_DOT } from '@/features/starmap/render/canvas2d'
import type { SceneFrame, StarMapRenderer } from '@/features/starmap/render/types'
import { fakeCanvas, fakeClock, skyMap, THEME, type CanvasCounter } from './starmapHarness'

const KP = 'demo-sine-cosine'

beforeEach(() => vi.stubGlobal('Path2D', class {}))
afterEach(() => vi.unstubAllGlobals())

function draw(map: StarMap) {
  const counter: CanvasCounter = { drawImage: 0, filterSets: 0, texts: [] }
  const arcs: number[] = []
  let gradients = 0
  const ctx = fakeCanvas(counter).getContext('2d')!
  const recording = new Proxy(ctx, {
    get(target, prop) {
      if (prop === 'arc') return (_x: number, _y: number, r: number) => arcs.push(r)
      if (prop === 'createRadialGradient') {
        return (...args: unknown[]) => {
          gradients += 1
          return (Reflect.get(target, prop) as (...a: unknown[]) => unknown)(...args)
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
  engine.setViewport(1280, 776, 1, { top: 120, bottom: 90 })
  engine.setData(map, { layer: 'star', nebulaId: 'trigonometry', unitId: KP })
  clock.advance(2000)
  arcs.length = 0
  gradients = 0
  engine.setData({ ...map, stars: [...map.stars] }, { layer: 'star', nebulaId: 'trigonometry', unitId: KP })
  clock.advance(50)
  const glyph = frame!.glyphSize
  return { arcs, gradients, dot: Math.max(1.6, glyph * 0.045), showSkills: frame!.showSkills }
}

/** The demo sky with the demo knowledge point's small stars as given. */
function withSkills(map: StarMap, skills: (extension: boolean) => { lit: boolean; extension?: boolean }): StarMap {
  return {
    ...map,
    stars: map.stars.map((star) =>
      star.unitId === KP ? { ...star, skills: star.skills.map((skill) => ({ ...skill, ...skills(skill.extension === true) })) } : star,
    ),
  }
}

const near = (arcs: number[], r: number) => arcs.some((a) => Math.abs(a - r) < 1e-6)

describe('extension small stars on the canvas (#501)', () => {
  it('draw a dark extension small star as a smaller ring than a core one', () => {
    const map = skyMap(10)
    expect(map.stars.find((star) => star.unitId === KP)!.skills.some((skill) => skill.extension)).toBe(true)

    const shown = draw(withSkills(map, () => ({ lit: false })))
    expect(shown.showSkills).toBeGreaterThan(0.01)
    expect(near(shown.arcs, shown.dot)).toBe(true)
    expect(near(shown.arcs, shown.dot * EXTENSION_DOT.darkScale)).toBe(true)

    // The same small stars, none an extension: no smaller ring.
    const plain = draw(withSkills(map, () => ({ lit: false, extension: false })))
    expect(near(plain.arcs, plain.dot * EXTENSION_DOT.darkScale)).toBe(false)
  })

  it('give a lit extension small star a glow a lit core one does not have', () => {
    const map = skyMap(10)
    const extension = draw(withSkills(map, (isExtension) => ({ lit: isExtension })))
    const core = draw(withSkills(map, (isExtension) => ({ lit: isExtension, extension: false })))

    expect(extension.gradients).toBeGreaterThan(core.gradients)
  })
})
