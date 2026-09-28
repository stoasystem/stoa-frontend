/**
 * What moves on the star map (#72 points 5 and 6). Nothing moves by itself
 * but the recommended star, which breathes; a pan glides a little; a layer
 * change flies. Under prefers-reduced-motion there is no glide and no
 * breathing, a layer change is a crossfade, and a still map asks for no
 * frames at all. A hidden or inert map holds still too.
 */
import { describe, expect, it } from 'vitest'
import { StarMapEngine } from '@/features/starmap/engine/starMapEngine'
import { starMapFixture } from '@/features/starmap/fixtures/starMapFixtures'
import { orderedStars } from '@/features/starmap/model/starMap'
import { CROSSFADE_MS, motionPolicy, ZOOM_MS } from '@/features/starmap/motion/motionPolicy'
import type { View } from '@/features/starmap/view/camera'
import { fakeClock, recordingRenderer, THEME } from './starmapHarness'

function starMap(reducedMotion: boolean, size: 10 | 500 = 10) {
  const clock = fakeClock()
  const renderer = recordingRenderer()
  const engine = new StarMapEngine({ renderer, theme: THEME, reducedMotion, scheduler: clock, now: clock.now })
  engine.setViewport(1280, 776, 2)
  engine.setData(starMapFixture(size), { layer: 'map' })
  return { clock, renderer, engine }
}

const moved = (a: View, b: View) => Math.hypot(a.cx - b.cx, a.cy - b.cy) + Math.abs(a.k - b.k)

function throwRight(engine: StarMapEngine, clock: ReturnType<typeof fakeClock>) {
  engine.pointerDown(1, 640, 388)
  for (let i = 1; i <= 10; i += 1) {
    engine.pointerMove(1, 640 + i * 12, 388)
    clock.advance(16)
  }
  const released = engine.currentView
  engine.pointerUp(1, 760, 388)
  return released
}

describe('reduced motion', () => {
  it('draws once and then asks for no frames: nothing breathes, nothing drifts', () => {
    const { clock, renderer, engine } = starMap(true)
    clock.advance(20)
    const opened = engine.currentView
    expect(renderer.frames).toHaveLength(1)
    expect(renderer.last().breath).toBeNull()
    clock.advance(10_000)
    expect(renderer.frames).toHaveLength(1)
    expect(clock.pending).toBe(0)
    expect(engine.animating).toBe(false)
    expect(moved(opened, engine.currentView)).toBe(0)
  })

  it('stops a pan dead on release: no glide', () => {
    const { clock, engine } = starMap(true)
    clock.advance(20)
    const released = throwRight(engine, clock)
    clock.advance(2000)
    expect(moved(released, engine.currentView)).toBe(0)
    expect(clock.pending).toBe(0)
  })

  it('crossfades between layers instead of flying', () => {
    const { clock, renderer, engine } = starMap(true)
    clock.advance(20)
    renderer.frames.length = 0
    engine.setTarget({ layer: 'nebula', nebulaId: 'algebra' })
    clock.advance(20)
    expect(renderer.snapshots).toBe(1)
    expect(renderer.frames[0].crossfade).toBeGreaterThan(0.8)
    // The view is the nebula's from the first frame; only the old frame fades.
    expect(engine.currentView.k).toBeGreaterThan(1.3)
    clock.advance(CROSSFADE_MS + 50)
    expect(renderer.last().crossfade).toBe(0)
    expect(clock.pending).toBe(0)
  })

  it('turns motion off the moment the setting changes', () => {
    const { clock, renderer, engine } = starMap(false)
    clock.advance(500)
    engine.setReducedMotion(true)
    clock.advance(20)
    const count = renderer.frames.length
    clock.advance(5000)
    expect(renderer.frames.length).toBe(count)
  })

  it('is the policy', () => {
    expect(motionPolicy(true)).toEqual({ inertia: false, breathing: false, layerTransition: 'crossfade', layerMs: CROSSFADE_MS })
    expect(motionPolicy(false)).toEqual({ inertia: true, breathing: true, layerTransition: 'zoom', layerMs: ZOOM_MS })
  })
})

describe('without reduced motion', () => {
  it('breathes the recommended star, and only that one', () => {
    const { clock, renderer } = starMap(false)
    clock.advance(1000)
    const recommended = orderedStars(starMapFixture(10)).findIndex((star) => star.recommendation)
    const breaths = renderer.frames.map((frame) => frame.breath)
    expect(breaths.every((breath) => breath?.index === recommended)).toBe(true)
    expect(Math.max(...breaths.map((breath) => breath!.scale))).toBeGreaterThan(1.02)
  })

  it('asks for no frames once the star layer is open: nothing breathes there', () => {
    const { clock, renderer, engine } = starMap(false)
    clock.advance(20)
    engine.setTarget({ layer: 'star', nebulaId: 'geometry', unitId: 'u-7' })
    clock.advance(ZOOM_MS + 100)
    const count = renderer.frames.length
    expect(renderer.last().breath).toBeNull()
    clock.advance(3000)
    expect(renderer.frames.length).toBe(count)
  })

  it('lets a pan glide on a little', () => {
    const { clock, engine } = starMap(false)
    clock.advance(20)
    const released = throwRight(engine, clock)
    clock.advance(1500)
    expect(moved(released, engine.currentView)).toBeGreaterThan(0.01)
  })

  it('flies between layers', () => {
    const { clock, renderer, engine } = starMap(false)
    clock.advance(20)
    engine.setTarget({ layer: 'nebula', nebulaId: 'algebra' })
    clock.advance(ZOOM_MS / 2)
    const midway = engine.currentView.k
    expect(midway).toBeGreaterThan(1)
    clock.advance(ZOOM_MS)
    expect(engine.currentView.k).toBeGreaterThan(midway)
    expect(renderer.snapshots).toBe(0)
  })
})

describe('a map that cannot be used holds still', () => {
  it('stops breathing while paused (hidden tab, the Ask sheet over it), and picks up again', () => {
    const { clock, renderer, engine } = starMap(false)
    clock.advance(500)
    engine.setPaused(true)
    clock.advance(20)
    const count = renderer.frames.length
    clock.advance(3000)
    expect(renderer.frames.length).toBe(count)
    engine.setPaused(false)
    clock.advance(500)
    expect(renderer.frames.length).toBeGreaterThan(count + 10)
  })

  it('stops a glide in flight when paused', () => {
    const { clock, engine } = starMap(false)
    clock.advance(20)
    throwRight(engine, clock)
    clock.advance(30)
    engine.setPaused(true)
    const view = engine.currentView
    clock.advance(1500)
    expect(moved(view, engine.currentView)).toBe(0)
  })

  it('re-centres on its layer when the page area narrows (the Ask panel opens)', () => {
    const { clock, engine } = starMap(true)
    clock.advance(20)
    engine.setTarget({ layer: 'nebula', nebulaId: 'algebra' })
    clock.advance(300)
    const wide = engine.currentView
    engine.setViewport(860, 776, 2)
    clock.advance(20)
    expect(engine.currentView.cx).toBeCloseTo(wide.cx, 9)
    expect(engine.currentView.cy).toBeCloseTo(wide.cy, 9)
    expect(engine.currentView.fx).toBe(0.5)
  })
})
