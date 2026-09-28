/*
 * Inertia after a drag, written by hand (#11 point 7): the spin the pointer
 * had when it let go keeps going and dies away exponentially.
 *
 * While dragging, each move reports the small rotation since the last one.
 * The angular velocity is an exponentially weighted average of those, so one
 * jittery move does not decide the throw. After release the speed falls as
 * `v(t) = v0 * e^(-t / decayMs)`; the total extra turn is therefore
 * `v0 * decayMs`, the same curve d3-inertia and OrbitControls' damping draw.
 * A pointer held still for `holdMs` before letting go throws nothing.
 */
import { fromAxisAngle, multiply, toAxisAngle, type Quat, type Vec3 } from '@/features/planet/geo/quaternion'

export type InertiaOptions = {
  /** Time constant of the decay, ms. */
  decayMs: number
  /** Time constant of the velocity average while dragging, ms. */
  smoothingMs: number
  /** A pause at least this long before release means "put it down". */
  holdMs: number
  /** Below this speed (radians per ms) the spin has stopped. */
  restSpeed: number
}

export const DEFAULT_INERTIA: InertiaOptions = {
  decayMs: 450,
  smoothingMs: 40,
  holdMs: 100,
  restSpeed: 0.00002,
}

export type Inertia = {
  /** A drag move rotated by `step` over `dtMs`, ending at `atMs`. */
  sample(step: Quat, dtMs: number, atMs: number): void
  /** The pointer let go at `atMs`. Returns whether there is a spin to carry on. */
  release(atMs: number): boolean
  /** Advance `q` by `dtMs` of the spin; `null` once it has come to rest. */
  advance(q: Quat, dtMs: number): Quat | null
  /** Radians per ms right now. */
  readonly speed: number
  readonly spinning: boolean
  stop(): void
}

export function createInertia(options: InertiaOptions = DEFAULT_INERTIA): Inertia {
  // Angular velocity as a vector: axis times radians per ms.
  let velocity: [number, number, number] = [0, 0, 0]
  let lastSampleAt = Number.NEGATIVE_INFINITY
  let spinning = false

  const speedOf = (v: Vec3) => Math.hypot(v[0], v[1], v[2])

  return {
    sample(step, dtMs, atMs) {
      if (dtMs <= 0) return
      const { axis, angle } = toAxisAngle(step)
      const rate = angle / dtMs
      const weight = 1 - Math.exp(-dtMs / options.smoothingMs)
      velocity = [
        velocity[0] + (axis[0] * rate - velocity[0]) * weight,
        velocity[1] + (axis[1] * rate - velocity[1]) * weight,
        velocity[2] + (axis[2] * rate - velocity[2]) * weight,
      ]
      lastSampleAt = atMs
      spinning = false
    },
    release(atMs) {
      spinning = atMs - lastSampleAt < options.holdMs && speedOf(velocity) > options.restSpeed
      if (!spinning) velocity = [0, 0, 0]
      return spinning
    },
    advance(q, dtMs) {
      if (!spinning) return null
      const speed = speedOf(velocity)
      // The exact integral of the decaying speed over this step, so the
      // total turn does not depend on the frame rate.
      const decay = Math.exp(-dtMs / options.decayMs)
      const angle = speed * options.decayMs * (1 - decay)
      velocity = [velocity[0] * decay, velocity[1] * decay, velocity[2] * decay]
      if (speed * decay < options.restSpeed) spinning = false
      if (angle === 0) return spinning ? q : null
      const axis: Vec3 = [velocity[0] / (speed * decay), velocity[1] / (speed * decay), velocity[2] / (speed * decay)]
      const next = multiply(q, fromAxisAngle(axis, angle))
      return next
    },
    get speed() {
      return spinning ? speedOf(velocity) : 0
    },
    get spinning() {
      return spinning
    },
    stop() {
      spinning = false
      velocity = [0, 0, 0]
    },
  }
}
