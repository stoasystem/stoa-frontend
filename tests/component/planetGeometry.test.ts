/**
 * The planet's hand-written rotation math (#47): quaternions that agree with
 * d3-geo's rotation, versor dragging that keeps the grabbed point under the
 * pointer, exponential inertia, and the zoom flight between layers.
 */
import { geoRotation } from 'd3-geo'
import { describe, expect, it } from 'vitest'
import { startDrag } from '@/features/planet/geo/drag'
import { createInertia, DEFAULT_INERTIA } from '@/features/planet/geo/inertia'
import { invertOnSphere, projectionFor, type ViewPlacement } from '@/features/planet/geo/projection'
import {
  angleBetween,
  angleOf,
  cartesian,
  facing,
  fromAxisAngle,
  fromEuler,
  multiply,
  slerp,
  toEuler,
  type Quat,
} from '@/features/planet/geo/quaternion'
import { interpolateView } from '@/features/planet/geo/zoom'

const viewport = { width: 1000, height: 800 }
const view = (q: Quat, k = 1): ViewPlacement => ({ q, k, cx: 0.5, cy: 0.5 })

describe('quaternions follow d3-geo rotation', () => {
  it.each([
    [[0, 0, 0]],
    [[30, -20, 0]],
    [[-120, 45, 10]],
    [[170, -80, -35]],
  ] as const)('round-trips the Euler angles %j', (euler) => {
    const back = toEuler(fromEuler(euler))
    for (let i = 0; i < 3; i += 1) expect(back[i]).toBeCloseTo(euler[i], 6)
  })

  it('rotates a point exactly as d3 does', () => {
    const euler = [40, -25, 15] as const
    const rotate = geoRotation([...euler])
    const projection = projectionFor(view(fromEuler(euler)), viewport)
    const [lng, lat] = rotate([12, 34])
    const expected = projection([12, 34])!
    const r = projection.scale()
    // Orthographic: the rotated point lands at (cos φ sin λ, -sin φ) * r from the centre.
    expect(expected[0]).toBeCloseTo(500 + r * Math.cos((lat * Math.PI) / 180) * Math.sin((lng * Math.PI) / 180), 6)
    expect(expected[1]).toBeCloseTo(400 - r * Math.sin((lat * Math.PI) / 180), 6)
  })

  it('facing(lng, lat) puts that point in the middle of the disc', () => {
    const projection = projectionFor(view(facing(-73, 41)), viewport)
    const [x, y] = projection([-73, 41])!
    expect(x).toBeCloseTo(500, 6)
    expect(y).toBeCloseTo(400, 6)
  })

  it('slerps along the short arc and hits both ends', () => {
    const a = facing(0, 0)
    const b = facing(90, 30)
    expect(angleBetween(slerp(a, b, 0), a)).toBeCloseTo(0, 6)
    expect(angleBetween(slerp(a, b, 1), b)).toBeCloseTo(0, 6)
    const mid = slerp(a, b, 0.5)
    expect(angleBetween(a, mid)).toBeCloseTo(angleBetween(mid, b), 6)
  })

  it('cartesian gives unit vectors on the axes d3 uses', () => {
    expect(cartesian([0, 0])).toEqual([1, 0, 0])
    const east = cartesian([90, 0])
    expect(east[0]).toBeCloseTo(0, 12)
    expect(east[1]).toBeCloseTo(1, 12)
    expect(cartesian([0, 90])[2]).toBeCloseTo(1, 12)
  })
})

describe('versor dragging', () => {
  it.each([
    [[500, 400], [620, 340]],
    [[430, 500], [300, 250]],
    [[520, 150], [540, 690]],
  ] as const)('keeps the point grabbed at %j under the pointer at %j', (from, to) => {
    const q0 = fromEuler([25, -10, 0])
    const projection = projectionFor(view(q0), viewport)
    const grabbed = invertOnSphere(projection, from[0], from[1])!
    const drag = startDrag(projection, q0, from[0], from[1])!

    // A few moves on the way, as a real pointer sends them.
    let q = q0
    for (let i = 1; i <= 5; i += 1) {
      const t = i / 5
      q = drag.move(from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t)!.q
    }

    const landed = projectionFor(view(q), viewport)(grabbed)!
    expect(landed[0]).toBeCloseTo(to[0], 3)
    expect(landed[1]).toBeCloseTo(to[1], 3)
  })

  it('reports steps that compose to the whole turn', () => {
    const q0 = fromEuler([0, 0, 0])
    const projection = projectionFor(view(q0), viewport)
    const drag = startDrag(projection, q0, 500, 400)!
    let composed = q0
    let last = q0
    for (const x of [520, 560, 610, 640]) {
      const move = drag.move(x, 400)!
      composed = multiply(composed, move.step)
      last = move.q
    }
    expect(angleBetween(composed, last)).toBeCloseTo(0, 6)
  })

  it('keeps turning when the pointer leaves the disc', () => {
    const q0 = fromEuler([0, 0, 0])
    const projection = projectionFor(view(q0), viewport)
    const drag = startDrag(projection, q0, 500, 400)!
    const move = drag.move(990, 400)
    expect(move).not.toBeNull()
    expect(angleOf(move!.q)).toBeGreaterThan(1.4)
  })
})

describe('inertia decays exponentially', () => {
  // A steady spin of 0.002 rad/ms about one axis, sampled every 16 ms.
  function thrown(options = DEFAULT_INERTIA) {
    const inertia = createInertia(options)
    const step = fromAxisAngle([0, 0, 1], 0.002 * 16)
    for (let t = 16; t <= 160; t += 16) inertia.sample(step, 16, t)
    return inertia
  }

  it('carries on after release and adds up to speed x decay time', () => {
    const inertia = thrown()
    expect(inertia.release(165)).toBe(true)
    const start: Quat = [1, 0, 0, 0]
    let q: Quat = start
    let frames = 0
    for (;;) {
      const next = inertia.advance(q, 16)
      if (!next) break
      q = next
      frames += 1
      if (frames > 10_000) throw new Error('never came to rest')
    }
    // v0 * decayMs = 0.002 * 450 = 0.9 rad, whatever the frame rate.
    expect(angleOf(q)).toBeCloseTo(0.9, 1)
  })

  it('loses 1/e of its speed per decay time constant', () => {
    const inertia = thrown()
    inertia.release(165)
    const v0 = inertia.speed
    inertia.advance([1, 0, 0, 0], DEFAULT_INERTIA.decayMs)
    expect(inertia.speed / v0).toBeCloseTo(Math.exp(-1), 6)
  })

  it('does not depend on the frame rate', () => {
    const turn = (dt: number) => {
      const inertia = thrown()
      inertia.release(165)
      let q: Quat = [1, 0, 0, 0]
      for (let t = 0; t < 600; t += dt) q = inertia.advance(q, dt) ?? q
      return angleOf(q)
    }
    expect(turn(8)).toBeCloseTo(turn(40), 6)
  })

  it('throws nothing when the pointer was held still before letting go', () => {
    const inertia = thrown()
    expect(inertia.release(160 + DEFAULT_INERTIA.holdMs + 1)).toBe(false)
    expect(inertia.advance([1, 0, 0, 0], 16)).toBeNull()
  })
})

describe('the zoom flight between layers', () => {
  const size = 800
  const radius = 300

  it('starts and ends exactly on the two views', () => {
    const from = view(facing(0, 0), 1)
    const to = { ...view(facing(80, 20), 3), cx: 0.35 }
    const flight = interpolateView(from, to, size, radius)
    const start = flight(0)
    const end = flight(1)
    expect(angleBetween(start.q, from.q)).toBeCloseTo(0, 6)
    expect(start.k).toBeCloseTo(1, 6)
    expect(angleBetween(end.q, to.q)).toBeCloseTo(0, 6)
    expect(end.k).toBeCloseTo(3, 6)
    expect(end.cx).toBeCloseTo(0.35, 6)
  })

  it('pulls back mid-flight on a long move, as d3-zoom does', () => {
    const from = view(facing(0, 0), 3)
    const to = view(facing(170, 0), 3)
    const flight = interpolateView(from, to, size, radius)
    expect(flight(0.5).k).toBeLessThan(3)
  })

  it('zooms straight in when the centre does not move', () => {
    const from = view(facing(10, 10), 1)
    const to = view(facing(10, 10), 4)
    const flight = interpolateView(from, to, size, radius)
    let previous = 0
    for (let t = 0; t <= 1; t += 0.1) {
      const { k } = flight(t)
      expect(k).toBeGreaterThanOrEqual(previous - 1e-9)
      previous = k
    }
  })
})
