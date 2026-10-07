/**
 * Dragging a star (#136): a press on a star (mouse), or a hold on it (touch),
 * drags it; its linked stars -- one hop, across subjects too -- follow on
 * springs, a share of the way and a little behind; let go, everything springs
 * back to exactly where it was. A drag is never a tap; empty space and a
 * swipe still pan; far out, where single stars cannot be picked, it is always
 * a pan. The lines of the dragged star light up, the rest dims; its
 * off-screen linked stars are named at the edge.
 */
import { act, fireEvent, render } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { StarMapView } from '@/features/starmap/components/StarMapView'
import { StarMapEngine } from '@/features/starmap/engine/starMapEngine'
import { starLineLook, UNDRAGGED_LINE, type LinkView, type StarLine } from '@/features/starmap/model/linkTiers'
import { orderedStars, type StarMap } from '@/features/starmap/model/starMap'
import { drawLinks } from '@/features/starmap/render/links'
import type { SceneData, SceneFrame } from '@/features/starmap/render/types'
import type { LayerTarget } from '@/features/starmap/view/layers'
import { DRAG } from '@/features/starmap/view/semanticZoom'
import { linkedStars, springStep } from '@/features/starmap/view/starDrag'
import { DEMO_BRIDGE_STAR } from '@/dev/demo/sky/demoSky'
import i18n from '@/i18n'
import { fakeClock, fakeContext, recordingRenderer, skyMap, THEME, type CanvasCounter } from './starmapHarness'

const DEMO = 'demo-sine-cosine'
const REFRACTION = DEMO_BRIDGE_STAR

function sky(): StarMap {
  return skyMap(1000, 'math', { relations: true })
}

function session(target: LayerTarget, { width = 1440, height = 900, reducedMotion = false, map = sky() } = {}) {
  const clock = fakeClock()
  const renderer = recordingRenderer()
  let scene: SceneData | null = null
  const setData = renderer.setData
  renderer.setData = (data) => {
    scene = data
    setData(data)
  }
  const navigate = vi.fn()
  const engine = new StarMapEngine({ renderer, theme: THEME, reducedMotion, scheduler: clock, now: clock.now, galaxy: true, onRequestTarget: navigate })
  engine.setViewport(width, height, 1, { top: 120, bottom: 90 })
  engine.setData(map, target)
  clock.advance(2000)
  const stars = orderedStars(map)
  const index = (unitId: string) => stars.findIndex((star) => star.unitId === unitId)
  return { clock, renderer, engine, navigate, map, stars, index, scene: () => scene!, width, height }
}
type Session = ReturnType<typeof session>

const nebulaOf = (map: StarMap, unitId: string) => map.stars.find((star) => star.unitId === unitId)!.nebulaId
const trig = (map: StarMap): LayerTarget => ({ layer: 'nebula', nebulaId: nebulaOf(map, DEMO) })

/** The demo star's linked stars, by index. */
function followersOf(s: Session, unitId = DEMO): number[] {
  return linkedStars(s.scene().starLinks, s.index(unitId))
}

/** Press the star `i` with the mouse and move it by `(dx, dy)` in `steps` moves, a frame apart. */
function mouseDrag(s: Session, i: number, dx: number, dy: number, steps = 10, kind: 'mouse' | 'touch' = 'mouse') {
  const f = s.renderer.last()
  const x0 = f.x[i]
  const y0 = f.y[i]
  s.engine.pointerDown(1, x0, y0, kind)
  if (kind === 'touch') s.clock.advance(DRAG.longPressMs + 40)
  for (let k = 1; k <= steps; k += 1) {
    s.engine.pointerMove(1, x0 + (dx * k) / steps, y0 + (dy * k) / steps)
    s.clock.advance(16)
  }
  return { x: x0 + dx, y: y0 + dy }
}

describe('dragging a star (#136)', () => {
  it('pulls one hop: the prerequisites and successors, across subjects too, never two hops', () => {
    const s = session(trig(sky()))
    const demo = s.index(DEMO)
    const followers = followersOf(s)
    const links = s.scene().starLinks
    const direct = new Set(links.flatMap(({ from, to }) => (from === demo ? [to] : to === demo ? [from] : [])))
    expect(new Set(followers)).toEqual(direct)
    // Its successor "Refraction" is in physics.
    expect(followers).toContain(s.index(REFRACTION))
    expect(s.map.stars.find((star) => star.unitId === REFRACTION)!.nebulaId).not.toBe(nebulaOf(s.map, DEMO))
    // A star two hops away does not move.
    const twoHops = links.find(({ from, to }) => followers.includes(from) && to !== demo && !followers.includes(to))
    expect(twoHops).toBeDefined()
    expect(followers).not.toContain(twoHops!.to)
    s.engine.destroy()
  })

  it('the grabbed star follows the hand exactly; linked stars follow a share of the way, behind; no other star moves', () => {
    const s = session(trig(sky()))
    const demo = s.index(DEMO)
    const followers = followersOf(s)
    const before = s.renderer.last()
    mouseDrag(s, demo, 160, -90, 4)
    const moving = s.renderer.last()
    expect(moving.x[demo] - before.x[demo]).toBeCloseTo(160, 3)
    expect(moving.y[demo] - before.y[demo]).toBeCloseTo(-90, 3)
    // Behind: right after the hand, a linked star has not yet caught up with its share.
    for (const f of followers) expect(moving.x[f] - before.x[f]).toBeLessThan(160 * DRAG.followRatio - 5)
    for (const f of followers) expect(moving.x[f] - before.x[f]).toBeGreaterThan(0)
    // Held still, it settles at its share.
    s.clock.advance(1500)
    const held = s.renderer.last()
    for (const f of followers) {
      expect(held.x[f] - before.x[f]).toBeCloseTo(160 * DRAG.followRatio, 0)
      expect(held.y[f] - before.y[f]).toBeCloseTo(-90 * DRAG.followRatio, 0)
    }
    const related = new Set([demo, ...followers])
    for (let k = 0; k < before.x.length; k += 1) {
      if (related.has(k)) continue
      expect(held.x[k]).toBe(before.x[k])
      expect(held.y[k]).toBe(before.y[k])
    }
    expect(held.drag?.star).toBe(demo)
    expect(held.drag?.amount).toBe(1)
    expect(held.drag?.grow).toBeCloseTo(DRAG.grow, 3)
    expect([...held.drag!.related].reduce((sum, v) => sum + v, 0)).toBe(related.size)
    // The lighting layer is told where the star is drawn now.
    const spot = s.engine.starOnScreen(DEMO)!
    expect(spot.x).toBeCloseTo(held.x[demo], 3)
    expect(spot.y).toBeCloseTo(held.y[demo], 3)
    s.engine.destroy()
  })

  it('a linked star settles with a small wobble: it overshoots its share a little when the hand stops', () => {
    const s = session(trig(sky()))
    const demo = s.index(DEMO)
    const f = followersOf(s)[0]
    const x0 = s.renderer.last().x[f]
    mouseDrag(s, demo, 200, 0, 3)
    const start = s.renderer.frames.length
    s.clock.advance(1200)
    const path = s.renderer.frames.slice(start).map((frame) => frame.x[f] - x0)
    const share = 200 * DRAG.followRatio
    const peak = Math.max(...path)
    expect(peak).toBeGreaterThan(share + 1)
    expect(peak).toBeLessThan(share * 1.35)
    expect(path[path.length - 1]).toBeCloseTo(share, 0)
    s.engine.destroy()
  })

  it('let go, everything springs back with a little overshoot, to exactly where it was', () => {
    const s = session(trig(sky()))
    const demo = s.index(DEMO)
    const before = s.renderer.last()
    mouseDrag(s, demo, -150, 80, 5)
    s.clock.advance(800)
    const at = s.renderer.last()
    s.engine.pointerUp(1, at.x[demo], at.y[demo])
    const start = s.renderer.frames.length
    s.clock.advance(2500)
    const back = s.renderer.frames.slice(start)
    // Past its place and back: the grabbed star overshoots a little (x went negative, so it passes to positive).
    const path = back.map((frame) => frame.x[demo] - before.x[demo])
    expect(Math.max(...path)).toBeGreaterThan(1)
    expect(Math.max(...path)).toBeLessThan(150 * 0.25)
    const last = s.renderer.last()
    expect(last.x).toEqual(before.x)
    expect(last.y).toEqual(before.y)
    expect(last.drag).toBeUndefined()
    // Never a tap: no choice, no route change.
    expect(s.navigate).not.toHaveBeenCalled()
    expect(s.engine.layer).toBe('nebula')
    // The keyboard is as it was: focus on a star picks it out.
    s.engine.setFocusStar(demo)
    s.clock.advance(17)
    expect(s.renderer.last().focusStar).toBe(demo)
    s.engine.destroy()
  })

  it('a click on a star still chooses it; a drag past a few pixels never does', () => {
    const s = session(trig(sky()))
    const demo = s.index(DEMO)
    const f = s.renderer.last()
    s.engine.pointerDown(1, f.x[demo], f.y[demo])
    s.engine.pointerMove(1, f.x[demo] + 2, f.y[demo] + 1)
    s.engine.pointerUp(1, f.x[demo] + 2, f.y[demo] + 1)
    expect(s.navigate).toHaveBeenCalledWith(expect.objectContaining({ layer: 'star', unitId: DEMO }))
    s.engine.destroy()
    const t = session(trig(sky()))
    const end = mouseDrag(t, t.index(DEMO), 12, 0, 2)
    t.engine.pointerUp(1, end.x, end.y)
    t.clock.advance(300)
    expect(t.navigate).not.toHaveBeenCalled()
    t.engine.destroy()
  })

  it('a press on empty space pans the map, as before', () => {
    const s = session(trig(sky()))
    const before = s.renderer.last()
    // A point well clear of every star.
    let at = { x: 0, y: 0 }
    for (let y = 200; y < 800 && !at.x; y += 7) for (let x = 200; x < 1200; x += 7) {
      if (before.x.every((sx, k) => Math.hypot(sx - x, before.y[k] - y) > 40)) {
        at = { x, y }
        break
      }
    }
    s.engine.pointerDown(1, at.x, at.y)
    for (let k = 1; k <= 5; k += 1) {
      s.engine.pointerMove(1, at.x + k * 20, at.y)
      s.clock.advance(16)
    }
    const after = s.renderer.last()
    expect(after.drag).toBeUndefined()
    for (const k of [0, 10, 100, s.index(DEMO)]) expect(after.x[k] - before.x[k]).toBeCloseTo(100, 3)
    s.engine.destroy()
  })

  it('zoomed out past where single stars can be picked, a press on a star always pans', () => {
    const s = session({ layer: 'map' })
    expect(s.engine.zoom.starPx).toBeLessThan(DRAG.grabFromGlyph)
    const demo = s.index(DEMO)
    const before = s.renderer.last()
    mouseDrag(s, demo, 100, 0, 5)
    const after = s.renderer.last()
    expect(after.drag).toBeUndefined()
    expect(after.x[demo] - before.x[demo]).toBeCloseTo(after.x[0] - before.x[0], 3)
    s.engine.destroy()
  })

  it('touch: a swipe pans; a hold of about 300 ms grabs the star (it grows), then it drags', () => {
    const s = session(trig(sky()), { width: 390, height: 844 })
    const demo = s.index(DEMO)
    const before = s.renderer.last()
    // A swipe straight away: the map pans.
    s.engine.pointerDown(1, before.x[demo], before.y[demo], 'touch')
    for (let k = 1; k <= 5; k += 1) {
      s.engine.pointerMove(1, before.x[demo] - k * 10, before.y[demo])
      s.clock.advance(16)
    }
    s.engine.pointerUp(1, before.x[demo] - 50, before.y[demo])
    s.clock.advance(16)
    let after = s.renderer.last()
    expect(after.drag).toBeUndefined()
    expect(after.x[0] - before.x[0]).toBeLessThan(-40)
    s.engine.destroy()

    const t = session(trig(sky()), { width: 390, height: 844 })
    const i = t.index(DEMO)
    const start = t.renderer.last()
    t.engine.pointerDown(1, start.x[i], start.y[i], 'touch')
    t.clock.advance(DRAG.longPressMs - 60)
    expect(t.renderer.last().drag).toBeUndefined()
    expect(t.engine.holdingStar).toBe(false)
    t.clock.advance(120)
    after = t.renderer.last()
    expect(after.drag?.star).toBe(i)
    expect(t.engine.holdingStar).toBe(true)
    t.clock.advance(200)
    expect(t.renderer.last().drag!.grow).toBeGreaterThan(1.1)
    t.engine.pointerMove(1, start.x[i] - 60, start.y[i] + 40)
    t.clock.advance(16)
    after = t.renderer.last()
    expect(after.x[i] - start.x[i]).toBeCloseTo(-60, 3)
    expect(after.x[0]).toBe(start.x[0])
    t.engine.pointerUp(1, start.x[i] - 60, start.y[i] + 40)
    t.clock.advance(2500)
    expect(t.renderer.last().x).toEqual(start.x)
    expect(t.navigate).not.toHaveBeenCalled()
    t.engine.destroy()
  })

  it('touch: a quick tap on a star still chooses it', () => {
    const s = session(trig(sky()), { width: 390, height: 844 })
    const i = s.index(DEMO)
    const f = s.renderer.last()
    s.engine.pointerDown(1, f.x[i], f.y[i], 'touch')
    s.clock.advance(80)
    s.engine.pointerUp(1, f.x[i], f.y[i])
    expect(s.navigate).toHaveBeenCalledWith(expect.objectContaining({ layer: 'star', unitId: DEMO }))
    s.engine.destroy()
  })

  it('the wheel still zooms while a star is held, and the star stays under the hand', () => {
    const s = session(trig(sky()))
    const demo = s.index(DEMO)
    const hand = mouseDrag(s, demo, 80, 40, 4)
    const k = s.engine.currentView.k
    s.engine.wheelBy(-200, 700, 450)
    s.clock.advance(600)
    expect(s.engine.currentView.k).toBeGreaterThan(k * 1.2)
    const f = s.renderer.last()
    expect(f.x[demo]).toBeCloseTo(hand.x, 3)
    expect(f.y[demo]).toBeCloseTo(hand.y, 3)
    expect(f.drag?.star).toBe(demo)
    s.engine.destroy()
  })

  it('reduced motion: no wobble, and let go it is back at once', () => {
    const s = session(trig(sky()), { reducedMotion: true })
    const demo = s.index(DEMO)
    const followers = followersOf(s)
    const before = s.renderer.last()
    const end = mouseDrag(s, demo, 100, 0, 1)
    const f = s.renderer.last()
    for (const k of followers) expect(f.x[k] - before.x[k]).toBeCloseTo(100 * DRAG.followRatio, 3)
    expect(f.drag?.amount).toBe(1)
    s.engine.pointerUp(1, end.x, end.y)
    s.clock.advance(17)
    expect(s.renderer.last().x).toEqual(before.x)
    expect(s.renderer.last().drag).toBeUndefined()
    s.engine.destroy()
  })

  it('a second finger lets the star go and pinches instead', () => {
    const s = session(trig(sky()), { width: 390, height: 844 })
    const demo = s.index(DEMO)
    const before = s.renderer.last()
    mouseDrag(s, demo, 30, 30, 2, 'touch')
    expect(s.engine.holdingStar).toBe(true)
    s.engine.pointerDown(2, 200, 600, 'touch')
    expect(s.engine.holdingStar).toBe(false)
    s.engine.pointerUp(1, 0, 0)
    s.engine.pointerUp(2, 0, 0)
    s.clock.advance(2500)
    expect(s.renderer.last().x).toEqual(before.x)
    s.engine.destroy()
  })
})

describe('the dragged star\'s lines (#136)', () => {
  const line = (from: number, to: number, tier: 1 | 2 | 3 | 4): StarLine => ({ from, to, fromNebula: 0, toNebula: 1, tier })
  const view = (drag: number): LinkView => ({ bridges: 0, tiers: [0, 1, 1, 0.5, 0], star: 0, chosen: -1, focusStar: -1, dragStar: 7, drag })

  it('light up whatever their tier, drawn to the other star; every other line dims; all restored after', () => {
    for (const tier of [1, 2, 3, 4] as const) {
      expect(starLineLook(line(7, 9, tier), view(1))).toEqual({ strength: 1, reach: 1, lit: 1 })
      expect(starLineLook(line(9, 7, tier), view(1))).toEqual({ strength: 1, reach: 1, lit: 1 })
    }
    expect(starLineLook(line(1, 2, 1), view(1)).strength).toBeCloseTo(UNDRAGGED_LINE)
    expect(starLineLook(line(1, 2, 3), view(1)).strength).toBeCloseTo(0.5 * UNDRAGGED_LINE)
    // Eased: halfway in, halfway lit.
    expect(starLineLook(line(7, 9, 4), view(0.5))).toEqual({ strength: 0.5, reach: 0.5, lit: 0.5 })
    // Over: as before.
    expect(starLineLook(line(1, 2, 3), view(0))).toEqual({ strength: 0.5, reach: 0, lit: 0 })
    expect(starLineLook(line(7, 9, 4), view(0)).strength).toBe(0)
  })

  it('a linked star off screen still moves; its line runs to the edge, which names its nebula and subject', () => {
    const s = session(trig(sky()))
    const demo = s.index(DEMO)
    const refraction = s.index(REFRACTION)
    const before = s.renderer.last()
    // Refraction (physics) is off screen.
    expect(before.x[refraction] > s.width || before.x[refraction] < 0 || before.y[refraction] < 0 || before.y[refraction] > s.height).toBe(true)
    mouseDrag(s, demo, 0, 120, 4)
    s.clock.advance(1500)
    const f = s.renderer.last()
    expect(f.y[refraction] - before.y[refraction]).toBeCloseTo(120 * DRAG.followRatio, 0)
    const counter: CanvasCounter = { drawImage: 0, filterSets: 0, texts: [] }
    const frame = {
      ...f,
      x: Float32Array.from(f.x),
      y: Float32Array.from(f.y),
      nebulaX: Float32Array.from(f.nebulaX),
      nebulaY: Float32Array.from(f.nebulaY),
      nebulaR: Float32Array.from(f.nebulaR),
      starAlpha: Float32Array.from(f.starAlpha),
      sharpness: Float32Array.from(f.sharpness),
    } as unknown as SceneFrame
    const stats = drawLinks(fakeContext(counter), s.scene(), frame, THEME, { segments: [], boxes: [] }, { wrap: true })
    expect(stats.dragLabels).toBeGreaterThan(0)
    const physics = s.scene().galaxies!.find((g) => g.subjectId === 'physics')!.name
    const optics = s.scene().nebulae[s.scene().nebula[refraction]].name
    expect(counter.texts!.map((t) => t.text)).toContainEqual(expect.stringMatching(new RegExp(`^[↗↘↙↖] ${optics} · ${physics}$`)))
    s.engine.destroy()
  })

  it('across the seam a line takes the shorter side, between where the moved stars are drawn', () => {
    // Two stars either side of the seam, linked; star 0 dragged.
    const scene = {
      mapKey: 'seam',
      count: 2,
      mapX: Float32Array.from([0.02, 0.98]),
      mapY: Float32Array.from([0.5, 0.5]),
      state: Uint8Array.from([1, 0]),
      progress: Float32Array.from([0, 0]),
      reviewDue: Uint8Array.from([0, 0]),
      recommended: -1,
      nebula: Uint16Array.from([0, 0]),
      names: ['a', 'b'],
      skills: [[], []],
      nebulae: [{ topicId: 'n', name: 'N', x: 0.5, y: 0.5, r: 0.1, lit: 0, total: 2 }],
      links: [],
      starLinks: [{ from: 0, to: 1 }],
    } as unknown as SceneData
    const segments: { x0: number; x1: number }[] = []
    const ctx = fakeContext({ drawImage: 0, filterSets: 0 })
    let moveX = 0
    ;(ctx as unknown as Record<string, unknown>).moveTo = (x: number) => (moveX = x)
    ;(ctx as unknown as Record<string, unknown>).lineTo = (x: number) => segments.push({ x0: moveX, x1: x })
    const scale = 1000
    const frame = {
      viewport: { width: 800, height: 600 },
      scale,
      ox: 300,
      oy: 0,
      // Star 0 moved 40 px right, star 1 (drawn at its copy one turn left) 24 px.
      x: Float32Array.from([300 + 20 + 40, 300 - 20 + 24]),
      y: Float32Array.from([500, 500]),
      starAlpha: Float32Array.from([1, 1]),
      nebulaX: Float32Array.from([800]),
      nebulaY: Float32Array.from([500]),
      nebulaR: Float32Array.from([100]),
      sharpness: Float32Array.from([1]),
      glyphSize: 20,
      dotBlend: 0,
      dotRadius: 1.5,
      breath: null,
      starLabelAlpha: 0,
      nebulaLabelAlpha: 0,
      lineReveal: { bridges: 0, tiers: [0, 1, 1, 1, 1] },
      chosenNebula: -1,
      focusStar: -1,
      highlightNebula: -1,
      dim: 1,
      showSkills: 0,
      crossfade: 0,
      drag: { star: 0, related: Uint8Array.from([1, 1]), offsetX: Float32Array.from([40, 24]), offsetY: Float32Array.from([0, 0]), amount: 1, grow: 1 },
    } as unknown as SceneFrame
    drawLinks(ctx, scene, frame, THEME, { segments: [], boxes: [] }, {})
    expect(segments.length).toBeGreaterThan(0)
    // Leftwards from star 0 (the shorter way), towards where star 1 is drawn: 40 px apart, less the trims.
    for (const s of segments) {
      expect(s.x1).toBeLessThan(s.x0)
      expect(s.x0).toBeLessThanOrEqual(360)
      expect(s.x1).toBeGreaterThanOrEqual(304 - 1)
    }
  })
})

describe('springs (#136)', () => {
  it('a damped spring settles on its target and is stable on a long frame', () => {
    let [x, v] = [0, 0]
    for (let k = 0; k < 120; k += 1) [x, v] = springStep(x, v, 100, 16, DRAG.follow)
    expect(x).toBeCloseTo(100, 1)
    ;[x, v] = springStep(0, 0, 100, 64, DRAG.release)
    expect(Number.isFinite(x) && x > 0 && x < 100).toBe(true)
  })
})

describe('the stage (#136)', () => {
  it('passes the pointer kind, a touch drag of a star changes no route, and a held star gets no context menu', async () => {
    await i18n.changeLanguage('en')
    const rect = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      x: 0, y: 0, left: 0, top: 0, width: 1280, height: 776, right: 1280, bottom: 776, toJSON: () => ({}),
    } as DOMRect)
    const map = sky()
    const clock = fakeClock()
    const renderer = recordingRenderer()
    const navigate = vi.fn()
    const view = render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <div data-surface="sky" className="flex">
            <StarMapView map={map} target={trig(map)} onNavigate={navigate} scheduler={clock} createRendererFor={() => renderer} />
          </div>
        </MemoryRouter>
      </I18nextProvider>,
    )
    act(() => clock.advance(2000))
    const stage = view.container.querySelector<HTMLElement>('[data-starmap-stage]')!
    const i = orderedStars(map).findIndex((star) => star.unitId === DEMO)
    const f = renderer.last()
    const down = vi.spyOn(StarMapEngine.prototype, 'pointerDown')
    act(() => {
      fireEvent.pointerDown(stage, { pointerId: 1, clientX: f.x[i], clientY: f.y[i], button: 0, pointerType: 'touch' })
    })
    expect(down).toHaveBeenLastCalledWith(1, expect.any(Number), expect.any(Number), 'touch')
    act(() => clock.advance(DRAG.longPressMs + 50))
    const menu = new MouseEvent('contextmenu', { bubbles: true, cancelable: true })
    stage.dispatchEvent(menu)
    expect(renderer.last().drag?.star).toBe(i)
    expect(menu.defaultPrevented).toBe(true)
    act(() => {
      for (let k = 1; k <= 6; k += 1) {
        fireEvent.pointerMove(stage, { pointerId: 1, clientX: f.x[i] + k * 15, clientY: f.y[i], pointerType: 'touch' })
        clock.advance(16)
      }
      fireEvent.pointerUp(stage, { pointerId: 1, clientX: f.x[i] + 90, clientY: f.y[i], pointerType: 'touch' })
      clock.advance(2500)
    })
    expect(navigate).not.toHaveBeenCalled()
    down.mockRestore()
    rect.mockRestore()
    view.unmount()
  })
})
