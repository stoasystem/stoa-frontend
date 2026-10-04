/**
 * Semantic zoom (#134): the star map zooms continuously -- the wheel by how
 * far it scrolls, around the pointer; a pinch around its midpoint, gliding
 * on after release; + / - by ×1.5; a double tap by ×2 -- between the
 * panorama (and #120's ring-safe zoom) and a 40 px glyph. What it shows is a
 * continuous function of the zoom; the route follows what is chosen, never
 * the zoom, except that zooming out past a choice lets it go.
 */
import { act, fireEvent, render } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { StarMapView } from '@/features/starmap/components/StarMapView'
import { StarMapEngine } from '@/features/starmap/engine/starMapEngine'
import { orderedNebulae, orderedStars, type Star, type StarMap } from '@/features/starmap/model/starMap'
import type { LayerTarget } from '@/features/starmap/view/layers'
import {
  lineReveal,
  nebulaNameAlpha,
  ramp,
  REVEAL,
  skillAlpha,
  starFocusAmount,
  starNameAlpha,
  starNameReach,
  ZOOM,
  zoomBand,
} from '@/features/starmap/view/semanticZoom'
import { ringSafeZoom, skyGalaxies } from '@/features/starmap/view/sky'
import i18n from '@/i18n'
import { fakeClock, recordingRenderer, skyMap, THEME, type RecordedFrame } from './starmapHarness'

const BANDS = { top: 120, bottom: 90 }

function session(width: number, height: number, options: { reducedMotion?: boolean; points?: 1000 | 2000; subjectId?: string; target?: LayerTarget } = {}) {
  const clock = fakeClock()
  const renderer = recordingRenderer()
  const navigate = vi.fn()
  const map = skyMap(options.points ?? 1000, options.subjectId ?? 'math')
  const engine = new StarMapEngine({
    renderer,
    theme: THEME,
    reducedMotion: options.reducedMotion ?? false,
    scheduler: clock,
    now: clock.now,
    galaxy: true,
    onRequestTarget: navigate,
  })
  engine.setViewport(width, height, 1, BANDS)
  engine.setData(map, options.target ?? { layer: 'map' })
  clock.advance(20)
  return { clock, renderer, engine, navigate, map, width, height }
}
type Session = ReturnType<typeof session>

/** Wheel `steps` notches of `delta` px at (x, y), `gap` ms apart, then let it settle. */
function wheel(s: Session, delta: number, steps: number, x = s.width / 2, y = s.height / 2, gap = 30) {
  for (let i = 0; i < steps; i += 1) {
    s.engine.wheelBy(delta, x, y)
    s.clock.advance(gap)
  }
  s.clock.advance(1000)
}

/** The star drawn nearest (x, y) in a frame. */
function nearest(frame: RecordedFrame, x: number, y: number): number {
  let best = 0
  for (let i = 1; i < frame.x.length; i += 1) {
    if (Math.hypot(frame.x[i] - x, frame.y[i] - y) < Math.hypot(frame.x[best] - x, frame.y[best] - y)) best = i
  }
  return best
}

/** A star in the middle of the galaxy's biggest nebula. */
function middleStar(map: StarMap, subjectId = 'math'): Star {
  const stars = orderedStars(map)
  const size = (id: string) => stars.filter((s) => s.nebulaId === id).length
  const nebula = orderedNebulae(map).filter((n) => n.subjectId === subjectId).sort((a, b) => size(b.topicId) - size(a.topicId))[0]
  const own = stars.filter((s) => s.nebulaId === nebula.topicId)
  return own[Math.floor(own.length / 2)]
}

describe('the wheel zooms continuously (#134 Z3)', () => {
  it('a small scroll zooms a little, at once and by how far it scrolled: no step, no cooldown', () => {
    const s = session(1440, 900, { reducedMotion: true })
    const k0 = s.engine.currentView.k
    s.engine.wheelBy(-10, 700, 450)
    s.clock.advance(20)
    expect(Math.log2(s.engine.currentView.k / k0)).toBeCloseTo(10 * ZOOM.wheelPerPx, 6)
    // A second scroll right after is not swallowed by a cooldown.
    s.engine.wheelBy(-10, 700, 450)
    s.clock.advance(20)
    expect(Math.log2(s.engine.currentView.k / k0)).toBeCloseTo(20 * ZOOM.wheelPerPx, 6)
    s.engine.destroy()
  })

  it('glides: a notch arrives over a few frames, in total exactly as far as it scrolled', () => {
    const s = session(1440, 900)
    const k0 = s.engine.currentView.k
    s.engine.wheelBy(-100, 700, 450)
    const start = s.renderer.frames.length
    s.clock.advance(1000)
    const ks = s.renderer.frames.slice(start).map((f) => f.scale)
    const steps = ks.slice(1).map((k, i) => k / ks[i])
    // Several frames, each growing, none a jump of more than a third of the way.
    expect(ks.length).toBeGreaterThan(4)
    for (const step of steps) expect(step).toBeGreaterThanOrEqual(1 - 1e-9)
    expect(Math.max(...steps)).toBeLessThan(2 ** (100 * ZOOM.wheelPerPx * 0.34))
    expect(Math.log2(s.engine.currentView.k / k0)).toBeCloseTo(100 * ZOOM.wheelPerPx, 4)
    s.engine.destroy()
  })

  for (const [width, height] of [[1440, 900], [390, 844]] as const) {
    it(`${width}×${height}: the map point under the pointer stays under it`, () => {
      const s = session(width, height)
      const [px, py] = [width * 0.3, height * 0.55]
      const before = s.renderer.last()
      const i = nearest(before, px, py)
      wheel(s, -100, 6, px, py)
      const after = s.renderer.last()
      const ratio = after.scale / before.scale
      expect(ratio).toBeGreaterThan(2)
      // Every star moves straight away from the pointer, by the zoom's ratio.
      expect(after.x[i] - px).toBeCloseTo((before.x[i] - px) * ratio, 1)
      expect(after.y[i] - py).toBeCloseTo((before.y[i] - py) * ratio, 1)
      s.engine.destroy()
    })
  }

  it('is clamped: out to the panorama (never under the ring-safe zoom), in to a 40 px glyph', () => {
    for (const [width, height] of [[1440, 900], [390, 844], [3440, 1440]] as const) {
      const s = session(width, height)
      const { min, max } = s.engine.zoomRange
      // Already at the panorama: scrolling out does nothing.
      const k0 = s.engine.currentView.k
      expect(k0).toBeCloseTo(min, 6)
      expect(s.engine.zoom.atMin).toBe(true)
      wheel(s, 400, 5)
      expect(s.engine.currentView.k).toBeCloseTo(min, 6)
      const engine = s.engine as unknown as { ringReach: number; wrap: number; bounds: never }
      expect(min).toBeGreaterThanOrEqual(ringSafeZoom(engine.ringReach, engine.wrap, { width, height, ...BANDS }, engine.bounds, 0.5) - 1e-9)
      wheel(s, -400, 20)
      expect(s.engine.currentView.k).toBeCloseTo(max, 6)
      expect(s.engine.zoom.atMax).toBe(true)
      expect(s.engine.zoom.starPx).toBeCloseTo(ZOOM.maxGlyph, 3)
      expect(s.renderer.last().glyphSize).toBeCloseTo(40, 3)
      s.engine.destroy()
    }
  })

  it('never shows a galaxy twice: the least zoom keeps to the ring-safe zoom wherever the zoom is anchored', () => {
    const s = session(3440, 1440)
    wheel(s, -100, 8, 200, 700)
    wheel(s, 100, 30, 3300, 700)
    const engine = s.engine as unknown as { ringReach: number; wrap: number; bounds: never }
    const safe = ringSafeZoom(engine.ringReach, engine.wrap, { width: 3440, height: 1440, ...BANDS }, engine.bounds, s.engine.currentView.fx)
    expect(s.engine.currentView.k).toBeGreaterThanOrEqual(safe - 1e-9)
    s.engine.destroy()
  })

  it('zooming changes no route while nothing is chosen, all the way in and back out', () => {
    const s = session(1440, 900)
    wheel(s, -100, 30, 600, 420)
    wheel(s, 100, 40, 600, 420)
    expect(s.navigate).not.toHaveBeenCalled()
    expect(s.engine.zoom.atMin).toBe(true)
    s.engine.destroy()
  })

  it('crosses the seam while zooming without a jump: every star moves with the zoom, frame by frame', () => {
    const s = session(1440, 900, { subjectId: 'chemistry' })
    // Pan the seam to the middle of the screen, then zoom around it, in and out.
    const galaxies = skyGalaxies(s.map)
    const last = galaxies[galaxies.length - 1]
    const f0 = s.renderer.last()
    const seamX = f0.ox + (last.x1 + 0.02) * f0.scale
    s.engine.pointerDown(1, seamX, 450)
    for (let k = 1; k <= 20; k += 1) {
      s.engine.pointerMove(1, seamX + ((720 - seamX) * k) / 20, 450)
      s.clock.advance(16)
    }
    s.clock.advance(200)
    s.engine.pointerUp(1, 720, 450)
    s.clock.advance(500)
    const start = s.renderer.frames.length
    wheel(s, -100, 8, 900, 450)
    wheel(s, 100, 8, 500, 450)
    const frames = s.renderer.frames.slice(start)
    for (let f = 1; f < frames.length; f += 1) {
      const [a, b] = [frames[f - 1], frames[f]]
      const ratio = b.scale / a.scale
      // Where the zoom was anchored this frame: any star's motion says it.
      const shift = (i: number) => b.x[i] - a.x[i] * ratio
      const inView = a.x.map((x, i) => x > -50 && x < 1490 && b.x[i] > -50 && b.x[i] < 1490)
      const ref = inView.indexOf(true)
      if (ref < 0) continue
      for (let i = 0; i < a.x.length; i += 1) if (inView[i]) expect(Math.abs(shift(i) - shift(ref))).toBeLessThan(0.05)
    }
    s.engine.destroy()
  })
})

describe('a pinch zooms around its midpoint (#134 Z3)', () => {
  function pinch(s: Session, cx: number, cy: number, from: number, to: number, steps = 20, holdBeforeRelease = 0) {
    s.engine.pointerDown(1, cx - from / 2, cy)
    s.engine.pointerDown(2, cx + from / 2, cy)
    for (let i = 1; i <= steps; i += 1) {
      const spread = from + ((to - from) * i) / steps
      s.engine.pointerMove(1, cx - spread / 2, cy)
      s.engine.pointerMove(2, cx + spread / 2, cy)
      s.clock.advance(16)
    }
    s.clock.advance(holdBeforeRelease)
    s.engine.pointerUp(1, cx - to / 2, cy)
    s.engine.pointerUp(2, cx + to / 2, cy)
  }

  it('zooms by the fingers’ spread, keeping the point between them where it is', () => {
    const s = session(390, 844, { reducedMotion: true })
    const before = s.renderer.last()
    const i = nearest(before, 180, 420)
    pinch(s, 180, 420, 80, 240)
    s.clock.advance(20)
    const after = s.renderer.last()
    expect(after.scale / before.scale).toBeCloseTo(3, 3)
    expect(after.x[i] - 180).toBeCloseTo((before.x[i] - 180) * 3, 1)
    expect(after.y[i] - 420).toBeCloseTo((before.y[i] - 420) * 3, 1)
    expect(s.navigate).not.toHaveBeenCalled()
    s.engine.destroy()
  })

  it('glides on after a quick release, and not under reduced motion', () => {
    const moving = session(390, 844)
    pinch(moving, 200, 400, 80, 200)
    const released = moving.engine.currentView.k
    moving.clock.advance(1000)
    expect(moving.engine.currentView.k).toBeGreaterThan(released * 1.05)
    moving.engine.destroy()
    const still = session(390, 844, { reducedMotion: true })
    pinch(still, 200, 400, 80, 200)
    const at = still.engine.currentView.k
    still.clock.advance(1000)
    expect(still.engine.currentView.k).toBe(at)
    still.engine.destroy()
    // Held still before letting go: nothing to carry on.
    const held = session(390, 844)
    pinch(held, 200, 400, 80, 200, 20, 300)
    const kept = held.engine.currentView.k
    held.clock.advance(1000)
    expect(held.engine.currentView.k).toBeCloseTo(kept, 9)
    held.engine.destroy()
  })
})

describe('buttons, keys and a double tap (#134 Z3)', () => {
  it('+ and - glide ×1.5 around the focus point; reduced motion jumps there', () => {
    const s = session(1440, 900)
    const k0 = s.engine.currentView.k
    s.engine.step('in')
    s.clock.advance(17)
    // Not there in one frame...
    expect(s.engine.currentView.k).toBeLessThan(k0 * 1.5 * 0.99)
    s.clock.advance(1000)
    expect(s.engine.currentView.k).toBeCloseTo(k0 * 1.5, 6)
    s.engine.step('in')
    s.engine.step('in')
    s.clock.advance(1000)
    expect(s.engine.currentView.k).toBeCloseTo(k0 * 1.5 ** 3, 5)
    s.engine.step('out')
    s.clock.advance(1000)
    expect(s.engine.currentView.k).toBeCloseTo(k0 * 1.5 ** 2, 5)
    s.engine.destroy()
    const r = session(1440, 900, { reducedMotion: true })
    const r0 = r.engine.currentView.k
    r.engine.step('in')
    r.clock.advance(17)
    expect(r.engine.currentView.k).toBeCloseTo(r0 * 1.5, 9)
    r.engine.destroy()
  })

  it('a double tap on empty sky zooms ×2 around it', () => {
    const s = session(1440, 900, { reducedMotion: true })
    const k0 = s.engine.currentView.k
    // Far below the galaxy: empty sky.
    const [x, y] = [720, 880]
    s.engine.pointerDown(1, x, y)
    s.engine.pointerUp(1, x, y)
    s.clock.advance(100)
    s.engine.pointerDown(1, x, y)
    s.engine.pointerUp(1, x, y)
    s.clock.advance(50)
    expect(s.navigate).not.toHaveBeenCalled()
    expect(s.engine.currentView.k).toBeCloseTo(Math.min(k0 * 2, s.engine.zoomRange.max), 6)
    s.engine.destroy()
  })
})

describe('the route follows what is chosen (#134 Z2)', () => {
  it('a tap on a nebula asks for it and flies in, continuously; a tap on a star asks for it and its card opens closer in', () => {
    const s = session(1440, 900)
    const star = middleStar(s.map)
    const i = orderedStars(s.map).findIndex((st) => st.unitId === star.unitId)
    const f = s.renderer.last()
    s.engine.pointerDown(1, f.x[i], f.y[i])
    s.engine.pointerUp(1, f.x[i], f.y[i])
    // Far out a tap picks the nebula, not the star.
    expect(s.navigate).toHaveBeenLastCalledWith({ layer: 'nebula', nebulaId: star.nebulaId })
    const start = s.renderer.frames.length
    s.engine.setTarget({ layer: 'nebula', nebulaId: star.nebulaId })
    s.clock.advance(ZOOM.flightMs + 200)
    const flight = s.renderer.frames.slice(start)
    expect(flight.length).toBeGreaterThan(20)
    for (let k = 1; k < flight.length; k += 1) expect(flight[k].scale / flight[k - 1].scale).toBeLessThan(1.25)
    expect(s.engine.zoom.starPx).toBeGreaterThanOrEqual(ZOOM.nebulaGlyph - 0.01)
    expect(s.engine.zoom.pickable).toBe(true)
    // Now the star can be picked.
    const g = s.renderer.last()
    s.engine.pointerDown(1, g.x[i], g.y[i])
    s.engine.pointerUp(1, g.x[i], g.y[i])
    expect(s.navigate).toHaveBeenLastCalledWith({ layer: 'star', nebulaId: star.nebulaId, unitId: star.unitId })
    s.engine.setTarget({ layer: 'star', nebulaId: star.nebulaId, unitId: star.unitId })
    s.clock.advance(ZOOM.flightMs + 400)
    expect(s.engine.zoom.starPx).toBeCloseTo(ZOOM.starGlyph, 3)
    expect(s.renderer.last().starFocus).toBe(1)
    expect(s.renderer.last().focusStar).toBe(i)
    s.engine.destroy()
  })

  it('zooming out closes the card once the star is too small to read, then lets the nebula go on the panorama; the camera stays', () => {
    const s = session(1440, 900)
    const star = middleStar(s.map)
    s.engine.setTarget({ layer: 'star', nebulaId: star.nebulaId, unitId: star.unitId })
    s.clock.advance(ZOOM.flightMs + 400)
    // Zooming in, or out but still readable: the card stays.
    wheel(s, -100, 3, 500, 450)
    wheel(s, 100, 4, 500, 450)
    expect(s.engine.zoom.starPx).toBeGreaterThan(REVEAL.cardClosesBelow)
    expect(s.navigate).not.toHaveBeenCalled()
    while (s.engine.zoom.starPx >= REVEAL.cardClosesBelow) wheel(s, 50, 1, 500, 450, 16)
    expect(s.navigate).toHaveBeenCalledTimes(1)
    expect(s.navigate).toHaveBeenLastCalledWith({ layer: 'nebula', nebulaId: star.nebulaId })
    const view = s.engine.currentView
    s.engine.setTarget({ layer: 'nebula', nebulaId: star.nebulaId })
    s.clock.advance(1000)
    // Letting go never moves the camera.
    expect(s.engine.currentView).toEqual(view)
    wheel(s, 100, 30, 500, 450)
    expect(s.navigate).toHaveBeenCalledTimes(2)
    expect(s.navigate).toHaveBeenLastCalledWith({ layer: 'map' })
    s.engine.destroy()
  })

  it('a tap on empty sky with a card open closes it, where the map is', () => {
    const s = session(1440, 900, { reducedMotion: true })
    const star = middleStar(s.map)
    s.engine.setTarget({ layer: 'star', nebulaId: star.nebulaId, unitId: star.unitId })
    s.clock.advance(400)
    const view = s.engine.currentView
    s.engine.pointerDown(1, 1400, 880)
    s.engine.pointerUp(1, 1400, 880)
    expect(s.navigate).toHaveBeenLastCalledWith({ layer: 'nebula', nebulaId: star.nebulaId })
    s.engine.setTarget({ layer: 'nebula', nebulaId: star.nebulaId })
    s.clock.advance(400)
    expect(s.engine.currentView).toEqual(view)
    s.engine.destroy()
  })

  it('an old link opens on its star at a readable zoom, beside the card', () => {
    for (const [width, height] of [[1440, 900], [390, 844]] as const) {
      const map = skyMap(1000)
      const star = middleStar(map)
      const s = session(width, height, { target: { layer: 'star', nebulaId: star.nebulaId, unitId: star.unitId } })
      expect(s.engine.zoom.starPx).toBeCloseTo(ZOOM.starGlyph, 3)
      const spot = s.engine.starOnScreen(star.unitId)!
      expect(spot.x).toBeCloseTo(width * (width >= 768 ? 0.34 : 0.5), 0)
      s.engine.destroy()
    }
  })

  it('the lighting layer is told where the star is drawn while the map zooms', () => {
    const s = session(1440, 900)
    const star = middleStar(s.map)
    const i = orderedStars(s.map).findIndex((st) => st.unitId === star.unitId)
    s.engine.wheelBy(-100, 300, 300)
    for (let k = 0; k < 10; k += 1) {
      s.clock.advance(16)
      const spot = s.engine.starOnScreen(star.unitId)!
      expect(spot.x).toBeCloseTo(s.renderer.last().x[i], 3)
      expect(spot.y).toBeCloseTo(s.renderer.last().y[i], 3)
    }
    s.engine.destroy()
  })
})

describe('what appears, by zoom (#134 Z1, Z4)', () => {
  const samples = Array.from({ length: 6001 }, (_, k) => k / 100)

  it('every reveal is continuous: no step anywhere, so none at a band’s edge', () => {
    const fns: [string, (px: number) => number][] = [
      ['star names', starNameAlpha],
      ['bridges', (px) => lineReveal(px).bridges],
      ...[1, 2, 3, 4].map((t) => [`tier ${t}`, (px: number) => lineReveal(px).tiers[t]] as [string, (px: number) => number]),
      ['star focus', starFocusAmount],
      ['skills', skillAlpha],
      ['nebula name (by zoom)', (px) => nebulaNameAlpha(200, px, 2)],
      ['nebula name (by radius)', (px) => nebulaNameAlpha(px * 5, 10, 2)],
      ['nebula name (past the panorama)', (px) => nebulaNameAlpha(200, 10, 1 + px / 60)],
      ['name reach', (px) => starNameReach(px, 800).radius / 800],
    ]
    for (const [name, fn] of fns) {
      for (let k = 1; k < samples.length; k += 1) {
        expect(Math.abs(fn(samples[k]) - fn(samples[k - 1])), `${name} at ${samples[k]}`).toBeLessThan(0.02)
      }
    }
  })

  it('fades are monotone: things come in as the zoom grows and the bridges and nebula names give way', () => {
    const rising = [starNameAlpha, starFocusAmount, skillAlpha, ...[1, 2, 3, 4].map((t) => (px: number) => lineReveal(px).tiers[t])]
    for (const fn of rising) for (let k = 1; k < samples.length; k += 1) expect(fn(samples[k])).toBeGreaterThanOrEqual(fn(samples[k - 1]))
    for (let k = 1; k < samples.length; k += 1) {
      expect(lineReveal(samples[k]).bridges).toBeLessThanOrEqual(lineReveal(samples[k - 1]).bridges)
      expect(starNameReach(samples[k], 800).radius).toBeGreaterThanOrEqual(starNameReach(samples[k - 1], 800).radius)
    }
  })

  it('in the right order: bridges, then tiers 1-2, star names, tier 3; tier 4 only very close; nebula names give way to star names', () => {
    expect(lineReveal(4).bridges).toBe(1)
    expect(lineReveal(4).tiers.slice(1)).toEqual([0, 0, 0, 0])
    expect(lineReveal(13).tiers[1]).toBe(1)
    expect(lineReveal(13).bridges).toBe(0)
    expect(starNameAlpha(13)).toBe(0)
    expect(starNameAlpha(18)).toBe(1)
    expect(lineReveal(18).tiers[3]).toBe(1)
    expect(lineReveal(ZOOM.nebulaGlyph).tiers[4]).toBe(0)
    expect(lineReveal(ZOOM.maxGlyph).tiers[4]).toBe(1)
    expect(nebulaNameAlpha(400, 10, 3)).toBe(1)
    expect(nebulaNameAlpha(400, 30, 3)).toBe(0)
    // Far out only the hovered nebula is named (#123): none by size on the panorama.
    expect(nebulaNameAlpha(400, 4, 1)).toBe(0)
    expect(zoomBand(4)).toBe('panorama')
    expect(zoomBand(10)).toBe('nebula')
    expect(zoomBand(20)).toBe('star')
    expect(ramp(5, [5, 6])).toBe(0)
  })

  it('in a real zoom from the panorama to the closest, even a hard flick, every frame’s reveal moves little', () => {
    const s = session(1440, 900)
    const start = s.renderer.frames.length
    wheel(s, -100, 40, 700, 450, 16)
    expect(s.engine.zoom.atMax).toBe(true)
    const frames = s.renderer.frames.slice(start)
    const pick: [string, (f: RecordedFrame) => number][] = [
      ['star names', (f) => f.starLabelAlpha],
      ['bridges', (f) => f.lineReveal.bridges],
      ['tier 1', (f) => f.lineReveal.tiers[1]],
      ['tier 3', (f) => f.lineReveal.tiers[3]],
      ['tier 4', (f) => f.lineReveal.tiers[4]],
      ['dots', (f) => f.dotBlend],
      ['glyph', (f) => f.glyphSize / 40],
    ]
    for (const [name, fn] of pick) {
      // At the speed cap a fade still spans three frames or more.
      for (let k = 1; k < frames.length; k += 1) expect(Math.abs(fn(frames[k]) - fn(frames[k - 1])), name).toBeLessThan(0.4)
    }
    s.engine.destroy()
  })

})

describe('the page (#134)', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      x: 0, y: 0, left: 0, top: 0, width: 1280, height: 776, right: 1280, bottom: 776, toJSON: () => ({}),
    } as DOMRect)
  })
  afterEach(() => vi.restoreAllMocks())

  function show(target: LayerTarget = { layer: 'map' }) {
    const clock = fakeClock()
    const renderer = recordingRenderer()
    const navigate = vi.fn()
    const map = skyMap(1000)
    const view = render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <div data-surface="sky" className="flex">
            <StarMapView map={map} target={target} onNavigate={navigate} scheduler={clock} createRendererFor={() => renderer} />
          </div>
        </MemoryRouter>
      </I18nextProvider>,
    )
    act(() => clock.advance(20))
    const stage = view.container.querySelector<HTMLElement>('[data-starmap-stage]')!
    const buttons = () => [...view.container.querySelectorAll<HTMLButtonElement>('[role="group"] button')]
    return { clock, renderer, navigate, map, stage, buttons, ...view }
  }

  it('the wheel zooms the map around the pointer and changes no route; the parallel DOM follows at rest', () => {
    const { clock, renderer, navigate, stage, container } = show()
    const tabbable = () => [...container.querySelectorAll('a[data-unit]')].filter((a) => a.getAttribute('tabindex') !== '-1').length
    const far = tabbable()
    expect(stage).toHaveAttribute('data-zoom-band', 'panorama')
    const k0 = renderer.last().scale
    act(() => {
      for (let i = 0; i < 12; i += 1) {
        fireEvent.wheel(stage, { deltaY: -100, clientX: 640, clientY: 400 })
        clock.advance(30)
      }
      clock.advance(1500)
    })
    expect(renderer.last().scale).toBeGreaterThan(k0 * 4)
    expect(navigate).not.toHaveBeenCalled()
    expect(stage).toHaveAttribute('data-zoom-band', 'star')
    // Zoomed in: every star on screen is a Tab stop, not only the recommended ones.
    const links = container.querySelectorAll('a[data-unit]')
    expect(tabbable()).toBe(links.length)
    expect(tabbable()).toBeGreaterThan(far)
  })

  it('keyboard + and - zoom, the buttons say when a limit is reached, and arrows still step round the ring', () => {
    const { clock, renderer, stage, buttons, container } = show()
    const [zoomIn, zoomOut] = buttons()
    expect(zoomOut).toBeDisabled()
    expect(zoomIn).not.toBeDisabled()
    const k0 = renderer.last().scale
    act(() => {
      fireEvent.keyDown(stage, { key: '+' })
      clock.advance(1000)
    })
    expect(renderer.last().scale / k0).toBeCloseTo(1.5, 4)
    expect(zoomOut).not.toBeDisabled()
    act(() => {
      fireEvent.keyDown(stage, { key: '-' })
      clock.advance(1000)
    })
    expect(renderer.last().scale / k0).toBeCloseTo(1, 4)
    expect(zoomOut).toBeDisabled()
    // The nebula links still go round the ring by arrows.
    const links = [...container.querySelectorAll<HTMLAnchorElement>('a[data-nebula-link]')]
    act(() => links[0].focus())
    fireEvent.keyDown(links[0], { key: 'ArrowRight' })
    expect(document.activeElement).not.toBe(links[0])
    expect(document.activeElement?.hasAttribute('data-nebula-link')).toBe(true)
  })

  it('Escape closes the card even with nothing focused, and lets a nebula go', () => {
    const map = skyMap(1000)
    const star = middleStar(map)
    const { navigate } = show({ layer: 'star', nebulaId: star.nebulaId, unitId: star.unitId })
    ;(document.activeElement as HTMLElement | null)?.blur()
    fireEvent.keyDown(document.body, { key: 'Escape' })
    expect(navigate).toHaveBeenLastCalledWith({ layer: 'nebula', nebulaId: star.nebulaId })
  })
})
