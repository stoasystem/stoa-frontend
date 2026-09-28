/**
 * Under prefers-reduced-motion nothing on the planet moves by itself (#11
 * point 6, #47): no idle drift, no inertia, no breathing, and a layer change
 * is a crossfade. Rotation that follows the student's own hand stays.
 *
 * Poison (#47): start the idle drift under reduced motion and the first test
 * here goes red.
 */
import { describe, expect, it } from 'vitest'
import { PlanetEngine } from '@/features/planet/engine/planetEngine'
import { planetFixture } from '@/features/planet/fixtures/planetFixtures'
import { angleBetween, type Quat } from '@/features/planet/geo/quaternion'
import { CROSSFADE_MS, motionPolicy, ZOOM_MS } from '@/features/planet/motion/motionPolicy'
import type { PlanetTheme } from '@/features/planet/render/types'
import { fakeClock, recordingRenderer } from './planetHarness'

const theme: PlanetTheme = {
  sky: '#0A1020',
  sphere0: '#2A3A64',
  sphere1: '#152040',
  sphere2: '#080C1A',
  atmosphere: 'rgba(120, 160, 255, 0.16)',
  lit: '#F2C572',
  litCore: '#FFF8EA',
  text: '#FFFFFF',
  textBody: 'rgba(255, 255, 255, 0.75)',
  textCaption: 'rgba(255, 255, 255, 0.65)',
  fontFamily: 'sans-serif',
}

function planet(reducedMotion: boolean) {
  const clock = fakeClock()
  const renderer = recordingRenderer()
  const engine = new PlanetEngine({ renderer, theme, reducedMotion, scheduler: clock, now: clock.now })
  engine.setViewport(1280, 776, 2)
  engine.setData(planetFixture(10), { layer: 'planet' })
  return { clock, renderer, engine }
}

// Degrees between two orientations; acos near 1 leaves ~1e-6 of float noise.
const turnedBy = (a: Quat, b: Quat) => (angleBetween(a, b) * 180) / Math.PI
const STILL = 1e-4

describe('reduced motion turns every automatic animation off', () => {
  it('draws once and then asks for no frames: no idle drift, no breathing', () => {
    const { clock, renderer, engine } = planet(true)
    clock.advance(20)
    const opened = engine.currentView.q
    expect(renderer.frames).toHaveLength(1)

    clock.advance(10_000)
    expect(renderer.frames).toHaveLength(1)
    expect(clock.pending).toBe(0)
    expect(engine.animating).toBe(false)
    expect(turnedBy(opened, engine.currentView.q)).toBeLessThan(STILL)
    expect(renderer.lastBreathScale.every((scale) => scale === 1)).toBe(true)
  })

  it('without it, the planet drifts for a few seconds and the lit stars breathe', () => {
    const { clock, renderer, engine } = planet(false)
    clock.advance(20)
    const opened = engine.currentView.q
    clock.advance(3000)
    expect(turnedBy(opened, engine.currentView.q)).toBeGreaterThan(5)
    expect(renderer.frames.length).toBeGreaterThan(100)
    expect(renderer.lastBreathScale.some((scale) => scale > 1.001)).toBe(true)
    // The drift stops by itself (WCAG 2.2.2); breathing keeps the frames coming.
    clock.advance(6000)
    const settled = engine.currentView.q
    clock.advance(2000)
    expect(turnedBy(settled, engine.currentView.q)).toBeLessThan(STILL)
  })

  it('stops a drag dead on release: no inertia', () => {
    const { clock, renderer, engine } = planet(true)
    clock.advance(20)
    engine.pointerDown(1, 640, 388)
    for (let i = 1; i <= 10; i += 1) {
      engine.pointerMove(1, 640 + i * 20, 388)
      clock.advance(16)
    }
    const released = engine.currentView.q
    engine.pointerUp(1, 840, 388)
    clock.advance(2000)
    expect(turnedBy(released, engine.currentView.q)).toBeLessThan(STILL)
    expect(clock.pending).toBe(0)
    // The drag itself did turn the planet: the hand still drives it.
    expect(renderer.frames.length).toBeGreaterThan(1)
  })

  it('lets the same throw spin on with inertia when motion is allowed', () => {
    const { clock, engine } = planet(false)
    clock.advance(20)
    engine.pointerDown(1, 640, 388)
    for (let i = 1; i <= 10; i += 1) {
      engine.pointerMove(1, 640 + i * 20, 388)
      clock.advance(16)
    }
    const released = engine.currentView.q
    engine.pointerUp(1, 840, 388)
    clock.advance(1500)
    expect(turnedBy(released, engine.currentView.q)).toBeGreaterThan(3)
  })

  it('crossfades between layers instead of flying', () => {
    const { clock, renderer, engine } = planet(true)
    clock.advance(20)
    renderer.frames.length = 0
    engine.setTarget({ layer: 'region', regionId: 'algebra' })
    clock.advance(20)
    // The view is the region's from the first frame; only the old frame fades.
    const first = renderer.frames[0]
    expect(renderer.snapshots).toBe(1)
    expect(first.crossfade).toBeGreaterThan(0.8)
    expect(engine.currentView.k).toBeGreaterThan(1.5)
    clock.advance(CROSSFADE_MS + 50)
    expect(renderer.frames[renderer.frames.length - 1].crossfade).toBe(0)
    expect(clock.pending).toBe(0)
  })

  it('flies between layers when motion is allowed', () => {
    const { clock, renderer, engine } = planet(false)
    clock.advance(20)
    engine.setTarget({ layer: 'region', regionId: 'algebra' })
    clock.advance(ZOOM_MS / 2)
    const midway = engine.currentView.k
    expect(midway).toBeGreaterThan(1)
    clock.advance(ZOOM_MS)
    expect(engine.currentView.k).toBeGreaterThan(midway)
    expect(renderer.snapshots).toBe(0)
  })

  it('turns motion off the moment the setting changes', () => {
    const { clock, renderer, engine } = planet(false)
    clock.advance(500)
    engine.setReducedMotion(true)
    clock.advance(20)
    const count = renderer.frames.length
    const q = engine.currentView.q
    clock.advance(5000)
    expect(renderer.frames.length).toBe(count)
    expect(turnedBy(q, engine.currentView.q)).toBeLessThan(STILL)
  })

  it('the policy itself', () => {
    expect(motionPolicy(true)).toEqual({
      inertia: false,
      autoRotate: false,
      breathing: false,
      layerTransition: 'crossfade',
      layerMs: CROSSFADE_MS,
    })
    expect(motionPolicy(false)).toMatchObject({ inertia: true, autoRotate: true, breathing: true, layerTransition: 'zoom' })
  })
})

describe('a planet that cannot be used holds still', () => {
  it('stops drifting and breathing while paused (the Ask sheet over it), and picks up again', () => {
    const { clock, renderer, engine } = planet(false)
    clock.advance(500)
    engine.setPaused(true)
    clock.advance(20)
    const q = engine.currentView.q
    const count = renderer.frames.length
    clock.advance(3000)
    expect(renderer.frames.length).toBe(count)
    expect(turnedBy(q, engine.currentView.q)).toBeLessThan(STILL)
    engine.setPaused(false)
    clock.advance(500)
    expect(renderer.frames.length).toBeGreaterThan(count + 10)
  })

  it('stops a spin in flight when paused', () => {
    const { clock, engine } = planet(false)
    clock.advance(20)
    engine.pointerDown(1, 640, 388)
    for (let i = 1; i <= 10; i += 1) {
      engine.pointerMove(1, 640 + i * 20, 388)
      clock.advance(16)
    }
    engine.pointerUp(1, 840, 388)
    clock.advance(50)
    engine.setPaused(true)
    const q = engine.currentView.q
    clock.advance(1500)
    expect(turnedBy(q, engine.currentView.q)).toBeLessThan(STILL)
  })
})
