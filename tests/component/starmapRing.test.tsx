/**
 * One sky's band is a ring (#120, #117 B3): drag right long enough and the
 * first galaxy comes round again. Only x wraps; y stays bounded. Each frame
 * every galaxy sits at its copy nearest the view, so there is never a seam,
 * a jump, a galaxy seen twice, or a star that taps, focuses or lights up at
 * a copy other than the drawn one.
 */
import { act, fireEvent, render } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { StarMapView } from '@/features/starmap/components/StarMapView'
import { StarMapEngine } from '@/features/starmap/engine/starMapEngine'
import { orderedNebulae, orderedStars, type StarMap } from '@/features/starmap/model/starMap'
import { galaxyHazeBox } from '@/features/starmap/render/galaxy'
import { baseScale, clampView, nearestCopy, panBy, turnsToward, wrapX } from '@/features/starmap/view/camera'
import { nebulaDiscs } from '@/features/starmap/view/geometry'
import type { LayerTarget } from '@/features/starmap/view/layers'
import {
  galaxyAt,
  galaxyReach,
  galaxyTurns,
  ringNeighbour,
  ringSafeZoom,
  SKY_WRAP,
  skyBounds,
  skyGalaxies,
} from '@/features/starmap/view/sky'
import i18n from '@/i18n'
import { fakeClock, recordingRenderer, skyMap, THEME, type RecordedFrame } from './starmapHarness'

describe('ring arithmetic', () => {
  it('brings x into the first turn, and leaves it alone without a ring', () => {
    expect(wrapX(0.25, 1)).toBeCloseTo(0.25)
    expect(wrapX(1.25, 1)).toBeCloseTo(0.25)
    expect(wrapX(-0.25, 1)).toBeCloseTo(0.75)
    expect(wrapX(-3.75, 1)).toBeCloseTo(0.25)
    expect(wrapX(1, 1)).toBe(0)
    expect(wrapX(-1.5, 0)).toBe(-1.5)
  })

  it('picks the copy nearest a reference: the shorter way round', () => {
    expect(nearestCopy(0.9, 0.1, 1)).toBeCloseTo(-0.1)
    expect(nearestCopy(0.1, 0.9, 1)).toBeCloseTo(1.1)
    expect(nearestCopy(0.3, 0.5, 1)).toBeCloseTo(0.3)
    expect(nearestCopy(0.2, 7.9, 1)).toBeCloseTo(8.2)
    expect(nearestCopy(0.2, -4.1, 1)).toBeCloseTo(-3.8)
    expect(turnsToward(0.9, 0.1, 1)).toBe(-1)
    // Exactly half a turn apart: one fixed side, never a flip-flop.
    expect(turnsToward(0, 0.5, 1)).toBe(0)
    expect(turnsToward(0.5, 0, 1)).toBe(-1)
    expect(nearestCopy(0.9, 0.1, 0)).toBe(0.9)
  })

  it('pans x without bound on a ring, and keeps y inside the band', () => {
    const bounds = { minX: 0.02, minY: 0.4, maxX: 0.98, maxY: 0.6 }
    expect(clampView({ cx: 3.4, cy: 0.9, k: 2, fx: 0.5, fy: 0.5 }, bounds, 1)).toMatchObject({ cx: 3.4, cy: 0.6 })
    expect(clampView({ cx: 3.4, cy: 0.1, k: 2, fx: 0.5, fy: 0.5 }, bounds)).toMatchObject({ cx: 0.98, cy: 0.4 })
    const viewport = { width: 1000, height: 600 }
    const scale = baseScale(viewport, bounds) * 2
    const moved = panBy({ cx: 0.1, cy: 0.5, k: 2, fx: 0.5, fy: 0.5 }, scale * 0.3, 0, viewport, bounds, 1)
    expect(moved.cx).toBeCloseTo(-0.2)
  })

  it('names the galaxy at the centre across the seam, by the shorter gap', () => {
    const galaxies = skyGalaxies(skyMap(1000))
    const [first, , last] = galaxies
    // Just past the last galaxy's right edge, in the seam: still the last one.
    expect(galaxyAt(galaxies, last.x1 + 0.005, 1)?.subjectId).toBe(last.subjectId)
    // Just before the first galaxy's left edge, a turn later: the first one.
    expect(galaxyAt(galaxies, 1 + first.x0 - 0.005, 1)?.subjectId).toBe(first.subjectId)
    expect(galaxyAt(galaxies, -1 + (first.x0 + first.x1) / 2, 1)?.subjectId).toBe(first.subjectId)
  })

  it('turns each galaxy to its copy nearest the view', () => {
    const galaxies = skyGalaxies(skyMap(1000))
    expect(Array.from(galaxyTurns(galaxies, 0.5, 1))).toEqual([0, 0, 0])
    // Looking at the seam from the right: the last galaxy comes round from the left.
    expect(Array.from(galaxyTurns(galaxies, 0.1, 1))).toEqual([0, 0, -1])
    expect(Array.from(galaxyTurns(galaxies, 0.98, 1))).toEqual([1, 0, 0])
    expect(Array.from(galaxyTurns(galaxies, 5.5, 1))).toEqual([5, 5, 5])
  })

  it('steps round the ring by position along the band', () => {
    const xs = [0.5, 0.1, 0.9, 0.3]
    expect(ringNeighbour(xs, 1, 1)).toBe(3)
    expect(ringNeighbour(xs, 2, 1)).toBe(1) // the rightmost, then across the seam
    expect(ringNeighbour(xs, 1, -1)).toBe(2)
    expect(ringNeighbour([0.4], 0, 1)).toBe(0)
  })

  it('has no safe zoom where a galaxy reaches past half the ring', () => {
    const viewport = { width: 1440, height: 900 }
    const bounds = { minX: 0, minY: 0.4, maxX: 1, maxY: 0.6 }
    expect(ringSafeZoom(0.5, 1, viewport, bounds)).toBe(0)
    expect(ringSafeZoom(0.2, 0, viewport, bounds)).toBe(0)
    expect(ringSafeZoom(0.2, 1, viewport, bounds)).toBeGreaterThan(ringSafeZoom(0.1, 1, viewport, bounds))
  })
})

type Session = ReturnType<typeof session>

function session(
  width: number,
  height: number,
  points: 10 | 1000 | 2000 = 1000,
  subjectId = 'math',
  reducedMotion = true,
  target: LayerTarget = { layer: 'map' },
) {
  const clock = fakeClock()
  const renderer = recordingRenderer()
  const navigate = vi.fn()
  const centred = vi.fn()
  const engine = new StarMapEngine({
    renderer,
    theme: THEME,
    reducedMotion,
    scheduler: clock,
    now: clock.now,
    galaxy: true,
    onRequestTarget: navigate,
    onCentreGalaxy: centred,
  })
  const map = skyMap(points, subjectId)
  engine.setViewport(width, height, 1, { top: 120, bottom: 90 })
  engine.setData(map, target)
  clock.advance(20)
  return { clock, renderer, engine, map, navigate, centred, width, height }
}

/** Drag by `dx` px in steps of `step`, holding still before letting go (no glide). Returns the frames drawn. */
function drag(s: Session, dx: number, step = 40): RecordedFrame[] {
  const start = s.renderer.frames.length
  const y = s.height / 2
  let x = dx < 0 ? s.width * 0.8 : s.width * 0.2
  s.engine.pointerDown(1, x, y)
  // Past the tap slop first.
  x += Math.sign(dx) * 10
  s.engine.pointerMove(1, x, y)
  s.clock.advance(16)
  let left = dx - Math.sign(dx) * 10
  while (Math.abs(left) > 0) {
    const move = Math.sign(left) * Math.min(Math.abs(left), step)
    x += move
    left -= move
    s.engine.pointerMove(1, x, y)
    s.clock.advance(16)
    // Pointer back where it started for the next stroke: keep the hand on screen.
    if (x < 20 || x > s.width - 20) {
      s.clock.advance(200)
      s.engine.pointerUp(1, x, y)
      x = dx < 0 ? s.width * 0.8 : s.width * 0.2
      s.engine.pointerDown(1, x, y)
      x += Math.sign(dx) * 10
      s.engine.pointerMove(1, x, y)
      s.clock.advance(16)
      left -= Math.sign(dx) * 10
      if (Math.sign(left) !== Math.sign(dx)) left = 0
    }
  }
  s.clock.advance(200)
  s.engine.pointerUp(1, x, y)
  s.clock.advance(100)
  return s.renderer.frames.slice(start)
}

/** A change of `cx` read round the ring: a whole turn taken off at rest is no move. */
const ringStep = (d: number) => d - Math.round(d / SKY_WRAP) * SKY_WRAP

/** Px per turn of the ring in a frame. */
const turnPx = (frame: RecordedFrame) => frame.scale * SKY_WRAP

describe('dragging round the ring (#120)', () => {
  for (const [width, height] of [[1440, 900], [390, 844]] as const) {
    for (const direction of [-1, 1]) {
      it(`${width}×${height}: a full turn and more ${direction < 0 ? 'left' : 'right'} -- no seam, no jump, no galaxy twice`, () => {
        const s = session(width, height)
        const first = s.renderer.last()
        const galaxies = skyGalaxies(s.map)
        const nebulae = orderedNebulae(s.map)
        const galaxyOf = nebulae.map((n) => galaxies.findIndex((g) => g.subjectId === n.subjectId))
        const stars = orderedStars(s.map)
        const frames = drag(s, direction * turnPx(first) * 1.3)
        expect(frames.length).toBeGreaterThan(20)
        let turned = 0
        for (let f = 1; f < frames.length; f += 1) {
          const [a, b] = [frames[f - 1], frames[f]]
          expect(b.scale).toBe(a.scale)
          // How far the map moved this frame: the median star step.
          const steps = a.x.map((x, i) => b.x[i] - x).sort((p, q) => p - q)
          const moved = steps[Math.floor(steps.length / 2)]
          for (let g = 0; g < galaxies.length; g += 1) {
            // Where the galaxy's haze is drawn in each frame.
            const haze = galaxyHazeBox(galaxies[g])
            const span = (frame: RecordedFrame) => {
              const shift = frame.galaxyShift?.[g] ?? 0
              return [frame.ox + (haze.x0 + shift) * frame.scale, frame.ox + (haze.x1 + shift) * frame.scale] as const
            }
            const [a0, a1] = span(a)
            const [b0, b1] = span(b)
            if (Math.abs(b0 - a0 - moved) < 0.01) continue
            // It went to its other copy: only while all of it -- haze, clouds -- was off screen, before and after.
            turned += 1
            expect(a1 < 0 || a0 > width).toBe(true)
            expect(b1 < 0 || b0 > width).toBe(true)
            for (const frame of [a, b]) {
              for (let n = 0; n < nebulae.length; n += 1) {
                if (galaxyOf[n] !== g) continue
                const reach = frame.nebulaR[n] * 1.35
                expect(frame.nebulaX[n] + reach < 0 || frame.nebulaX[n] - reach > width).toBe(true)
              }
            }
          }
          // Every star seen in both frames moved with the map, exactly.
          for (let i = 0; i < stars.length; i += 1) {
            const seen = (frame: RecordedFrame) => frame.x[i] > -20 && frame.x[i] < width + 20
            if (!seen(a) || !seen(b)) continue
            expect(Math.abs(b.x[i] - a.x[i] - moved)).toBeLessThan(0.01)
          }
        }
        // It really went round: every galaxy changed copy along the way.
        expect(turned).toBeGreaterThanOrEqual(galaxies.length)
        // Every frame is at least the safe zoom: no galaxy ever on screen twice.
        const bounds = skyBounds(galaxies)
        const discs = nebulaDiscs(s.map)
        const reach = Math.max(
          ...galaxies.map((g) => galaxyReach(g, nebulae.filter((n) => n.subjectId === g.subjectId).map((n) => discs.get(n.topicId)!))),
        )
        const least = ringSafeZoom(reach, SKY_WRAP, { width, height, top: 120, bottom: 90 }, bounds)
        expect(least).toBeGreaterThan(0)
        for (const frame of frames) expect(frame.scale).toBeGreaterThanOrEqual(least * baseScale({ width, height, top: 120, bottom: 90 }, bounds) - 1e-6)
        // At rest the view is back on the first turn; nothing on screen moved for it.
        expect(s.engine.currentView.cx).toBeGreaterThanOrEqual(0)
        expect(s.engine.currentView.cx).toBeLessThan(SKY_WRAP)
        s.engine.destroy()
      })
    }
  }

  it('wraps at the nebula layer too: from the last galaxy across the seam into the first, without a jump', () => {
    for (const [width, height] of [[1440, 900], [390, 844]] as const) {
      const map = skyMap(1000, 'chemistry')
      const nebulae = orderedNebulae(map)
      const discs = nebulaDiscs(map)
      // The nebula nearest the seam, on its left.
      const last = nebulae.filter((n) => n.subjectId === 'chemistry').sort((a, b) => discs.get(b.topicId)!.x - discs.get(a.topicId)!.x)[0]
      const s = session(width, height, 1000, 'chemistry', true, { layer: 'nebula', nebulaId: last.topicId })
      const galaxies = skyGalaxies(map)
      const toMath = (galaxies[0].x0 + 1 - discs.get(last.topicId)!.x) + 0.01
      const frames = drag(s, -toMath * s.renderer.last().scale, 60)
      const stars = orderedStars(map)
      const mathStar = stars.map((star) => nebulae.find((n) => n.topicId === star.nebulaId)!.subjectId === 'math')
      for (let f = 1; f < frames.length; f += 1) {
        const [a, b] = [frames[f - 1], frames[f]]
        const steps = a.x.map((x, i) => b.x[i] - x).sort((p, q) => p - q)
        const moved = steps[Math.floor(steps.length / 2)]
        for (let i = 0; i < stars.length; i += 1) {
          if (a.x[i] > -20 && a.x[i] < width + 20 && b.x[i] > -20 && b.x[i] < width + 20) expect(Math.abs(b.x[i] - a.x[i] - moved)).toBeLessThan(0.01)
        }
      }
      // Mathematics came round from the right.
      const end = s.renderer.last()
      expect(stars.some((_, i) => mathStar[i] && end.x[i] > 0 && end.x[i] < width)).toBe(true)
      expect(s.engine.layer).toBe('nebula')
      s.engine.destroy()
    }
  })

  it('keeps the band bounded vertically: a drag down stops at the band', () => {
    const s = session(1440, 900)
    const before = s.engine.currentView.cy
    s.engine.pointerDown(1, 700, 200)
    for (let y = 210; y <= 2000; y += 30) {
      s.engine.pointerMove(1, 700, y)
      s.clock.advance(16)
    }
    s.clock.advance(200)
    s.engine.pointerUp(1, 700, 2000)
    const galaxies = skyGalaxies(s.map)
    expect(s.engine.currentView.cy).toBeLessThan(before)
    expect(s.engine.currentView.cy).toBeGreaterThanOrEqual(skyBounds(galaxies).minY - 1e-9)
    s.engine.destroy()
  })

  it('carries the glide over the seam too', () => {
    const s = session(1440, 900, 1000, 'chemistry', false)
    s.clock.advance(1000)
    s.engine.pointerDown(1, 300, 450)
    for (let x = 310; x >= 100; x -= 30) {
      s.engine.pointerMove(1, x, 450)
      s.clock.advance(16)
    }
    s.engine.pointerUp(1, 100, 450)
    s.clock.advance(3000)
    // Thrown right past chemistry's end and round to mathematics.
    expect(s.centred).toHaveBeenLastCalledWith('math')
    s.engine.destroy()
  })
})

describe('across the seam: taps, the lighting overlay, the switcher, keyboard focus (#120)', () => {
  /** Put the seam -- the gap between the last galaxy and the first -- at the centre of the screen. */
  function atSeam(width = 1440, height = 900) {
    const s = session(width, height, 1000, 'chemistry')
    const galaxies = skyGalaxies(s.map)
    const seam = (galaxies[galaxies.length - 1].x1 + 1 + galaxies[0].x0) / 2
    const frame = s.renderer.last()
    drag(s, -(seam - s.engine.currentView.cx) * frame.scale)
    return { ...s, galaxies }
  }

  it('shows the last galaxy left of the seam and the first right of it, each once', () => {
    const s = atSeam()
    const f = s.renderer.last()
    const nebulae = orderedNebulae(s.map)
    const xsOf = (subjectId: string) => nebulae.flatMap((n, i) => (n.subjectId === subjectId ? [f.nebulaX[i]] : []))
    const last = xsOf(s.galaxies[2].subjectId)
    const first = xsOf(s.galaxies[0].subjectId)
    expect(Math.max(...last)).toBeLessThan(720)
    expect(Math.min(...first)).toBeGreaterThan(720)
    // Both are on screen at once, at their copies either side of the seam.
    expect(last.some((x) => x > 0)).toBe(true)
    expect(first.some((x) => x < 1440)).toBe(true)
    s.engine.destroy()
  })

  it('taps the copy that is drawn, on either side of the seam', () => {
    const s = atSeam()
    const f = s.renderer.last()
    const stars = orderedStars(s.map)
    const nebulaOf = new Map(s.map.nebulae.map((n) => [n.topicId, n.subjectId]))
    for (const subjectId of [s.galaxies[2].subjectId, s.galaxies[0].subjectId]) {
      const i = stars.findIndex((star, k) => nebulaOf.get(star.nebulaId) === subjectId && f.x[k] > 60 && f.x[k] < 1380 && f.y[k] > 200 && f.y[k] < 760)
      expect(i).toBeGreaterThanOrEqual(0)
      s.navigate.mockClear()
      s.engine.pointerDown(2, f.x[i], f.y[i])
      s.engine.pointerUp(2, f.x[i], f.y[i])
      expect(s.navigate).toHaveBeenCalledWith({ layer: 'nebula', nebulaId: stars[i].nebulaId })
    }
    s.engine.destroy()
  })

  it('tells the lighting overlay where the drawn copy of a star is', () => {
    const s = atSeam()
    const f = s.renderer.last()
    const stars = orderedStars(s.map)
    const nebulaOf = new Map(s.map.nebulae.map((n) => [n.topicId, n.subjectId]))
    for (const subjectId of [s.galaxies[2].subjectId, s.galaxies[0].subjectId]) {
      const i = stars.findIndex((star, k) => nebulaOf.get(star.nebulaId) === subjectId && f.x[k] > 0 && f.x[k] < 1440)
      const spot = s.engine.starOnScreen(stars[i].unitId)!
      expect(spot.x).toBeCloseTo(f.x[i])
      expect(spot.x).toBeGreaterThan(0)
      expect(spot.x).toBeLessThan(1440)
    }
    s.engine.destroy()
  })

  it('flies to a galaxy the shorter way round, and lands on it', () => {
    for (const [from, to, way] of [['math', 'chemistry', -1], ['chemistry', 'math', 1], ['math', 'physics', 1]] as const) {
      const s = session(1440, 900, 1000, from, false)
      s.clock.advance(100)
      const start = s.engine.currentView.cx
      const views: number[] = []
      const frames = s.renderer.frames.length
      s.engine.setData(skyMap(1000, to), { layer: 'map' })
      for (let t = 0; t < 2000; t += 16) {
        s.clock.advance(16)
        views.push(s.engine.currentView.cx)
      }
      expect(s.renderer.frames.length - frames).toBeGreaterThan(10)
      // Every step goes one way (the view may come back to the first turn
      // once at rest: steps are read round the ring); the trip is under half a turn.
      let travelled = 0
      let previous = start
      for (const cx of views) {
        const step = ringStep(cx - previous)
        expect(step * way).toBeGreaterThanOrEqual(-1e-9)
        travelled += step
        previous = cx
      }
      const galaxy = skyGalaxies(s.map).find((g) => g.subjectId === to)!
      expect(Math.sign(travelled)).toBe(way)
      expect(Math.abs(travelled)).toBeLessThan(SKY_WRAP / 2)
      expect(wrapX(views[views.length - 1], SKY_WRAP)).toBeCloseTo((galaxy.x0 + galaxy.x1) / 2, 5)
      // Landed: the galaxy is centred on screen.
      const f = s.renderer.last()
      const own = orderedNebulae(s.map).flatMap((n, i) => (n.subjectId === to ? [f.nebulaX[i]] : []))
      expect(Math.abs(own.reduce((a, b) => a + b, 0) / own.length - 720)).toBeLessThan(1440 * 0.12)
      s.engine.destroy()
    }
  })

  it('pans to a focused nebula the shorter way round', () => {
    const s = session(1440, 900, 1000, 'chemistry')
    const nebulae = orderedNebulae(s.map)
    const firstOfMath = nebulae.findIndex((n) => n.subjectId === 'math')
    const disc = nebulaDiscs(s.map).get(nebulae[firstOfMath].topicId)!
    let previous = s.engine.currentView.cx
    let travelled = 0
    s.engine.setFocusNebula(firstOfMath)
    for (let t = 0; t < 1000; t += 16) {
      s.clock.advance(16)
      const step = ringStep(s.engine.currentView.cx - previous)
      expect(step).toBeGreaterThanOrEqual(-1e-9)
      travelled += step
      previous = s.engine.currentView.cx
    }
    // Rightwards across the seam, not back left across the whole band.
    expect(travelled).toBeGreaterThan(0)
    expect(travelled).toBeLessThan(SKY_WRAP / 2)
    expect(wrapX(s.engine.currentView.cx, SKY_WRAP)).toBeCloseTo(disc.x, 5)
    s.engine.destroy()
  })
})

describe('keyboard across the seam (#120)', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      x: 0, y: 0, left: 0, top: 0, width: 1280, height: 776, right: 1280, bottom: 776, toJSON: () => ({}),
    } as DOMRect)
  })
  afterEach(() => vi.restoreAllMocks())

  function show(map: StarMap) {
    const clock = fakeClock()
    const renderer = recordingRenderer()
    const view = render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <div data-surface="sky" className="flex">
            <StarMapView map={map} target={{ layer: 'map' }} onNavigate={vi.fn()} scheduler={clock} createRendererFor={() => renderer} />
          </div>
        </MemoryRouter>
      </I18nextProvider>,
    )
    act(() => clock.advance(20))
    return { clock, renderer, ...view }
  }

  it('lists every nebula once, whichever copy is drawn', () => {
    const map = skyMap(1000, 'chemistry')
    const { container } = show(map)
    const links = [...container.querySelectorAll<HTMLAnchorElement>('a[data-nebula-link]')].map((a) => a.dataset.nebulaLink)
    expect(links).toEqual(orderedNebulae(map).map((n) => n.topicId))
    expect(new Set(links).size).toBe(links.length)
  })

  it('arrows step to the next nebula along the band, round the seam both ways', () => {
    const map = skyMap(1000, 'chemistry')
    const { container, clock } = show(map)
    const discs = nebulaDiscs(map)
    const along = orderedNebulae(map).map((n) => n.topicId).sort((a, b) => discs.get(a)!.x - discs.get(b)!.x)
    const link = (id: string) => container.querySelector<HTMLAnchorElement>(`a[data-nebula-link="${id}"]`)!
    const rightmost = along[along.length - 1]
    act(() => link(rightmost).focus())
    act(() => {
      fireEvent.keyDown(link(rightmost), { key: 'ArrowRight' })
      clock.advance(1000)
    })
    expect(document.activeElement).toBe(link(along[0]))
    act(() => {
      fireEvent.keyDown(link(along[0]), { key: 'ArrowLeft' })
      clock.advance(1000)
    })
    expect(document.activeElement).toBe(link(rightmost))
    act(() => {
      fireEvent.keyDown(link(rightmost), { key: 'ArrowLeft' })
      clock.advance(1000)
    })
    expect(document.activeElement).toBe(link(along[along.length - 2]))
  })
})
