/*
 * A little inertia after a pan (#72 point 5), written by hand: the map keeps
 * the velocity the pointer had when it let go and slows exponentially.
 *
 * While dragging, the velocity is an exponentially weighted average of the
 * moves, so one jittery move does not decide the throw. After release the
 * speed falls as `v(t) = v0 * e^(-t / decayMs)`, so the extra travel is
 * `v0 * decayMs` whatever the frame rate -- the curve d3-inertia and
 * OrbitControls' damping draw. A pointer held still for `holdMs` before
 * letting go throws nothing.
 */

export type InertiaOptions = {
  /** Time constant of the decay, ms ("a little": short). */
  decayMs: number
  /** Time constant of the velocity average while dragging, ms. */
  smoothingMs: number
  /** A pause at least this long before release means "put it down". */
  holdMs: number
  /** Below this speed (px per ms) the map has stopped. */
  restSpeed: number
}

export const DEFAULT_INERTIA: InertiaOptions = {
  decayMs: 220,
  smoothingMs: 40,
  holdMs: 100,
  restSpeed: 0.01,
}

export type Inertia = {
  /** A drag moved by `(dx, dy)` px over `dtMs`, ending at `atMs`. */
  sample(dx: number, dy: number, dtMs: number, atMs: number): void
  /** The pointer let go at `atMs`. Returns whether there is a glide to carry on. */
  release(atMs: number): boolean
  /** The glide's move over the next `dtMs`, in px; `null` once at rest. */
  advance(dtMs: number): [number, number] | null
  /** Px per ms right now. */
  readonly speed: number
  readonly moving: boolean
  stop(): void
}

export function createInertia(options: InertiaOptions = DEFAULT_INERTIA): Inertia {
  let vx = 0
  let vy = 0
  let lastSampleAt = Number.NEGATIVE_INFINITY
  let moving = false

  return {
    sample(dx, dy, dtMs, atMs) {
      if (dtMs <= 0) return
      const weight = 1 - Math.exp(-dtMs / options.smoothingMs)
      vx += (dx / dtMs - vx) * weight
      vy += (dy / dtMs - vy) * weight
      lastSampleAt = atMs
      moving = false
    },
    release(atMs) {
      moving = atMs - lastSampleAt < options.holdMs && Math.hypot(vx, vy) > options.restSpeed
      if (!moving) vx = vy = 0
      return moving
    },
    advance(dtMs) {
      if (!moving) return null
      // The exact integral of the decaying velocity over this step.
      const decay = Math.exp(-dtMs / options.decayMs)
      const travel = options.decayMs * (1 - decay)
      const step: [number, number] = [vx * travel, vy * travel]
      vx *= decay
      vy *= decay
      if (Math.hypot(vx, vy) < options.restSpeed) moving = false
      return step
    },
    get speed() {
      return moving ? Math.hypot(vx, vy) : 0
    },
    get moving() {
      return moving
    },
    stop() {
      moving = false
      vx = vy = 0
    },
  }
}
