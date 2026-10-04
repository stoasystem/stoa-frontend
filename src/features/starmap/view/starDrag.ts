/*
 * Dragging a star (#136): the grabbed star follows the hand exactly; the
 * stars directly linked to it -- its prerequisites and successors, one hop,
 * across subjects too -- are pulled after it by springs, a share of the way
 * (`DRAG.followRatio`), a little behind, settling with a small wobble. Let go,
 * every moved star springs back to its place with a little overshoot.
 *
 * Pure: displacements are screen px, kept apart from the layout (the stars'
 * map coordinates are the backend's and never change, #72). The engine adds
 * them to the screen positions each frame, so everything that reads those --
 * drawing, hit tests, the lines, `starOnScreen` -- sees the dragged star
 * where it is drawn. Displacements in px also survive a zoom during the drag:
 * the grabbed star stays under the hand, the others keep their pull.
 */
import { DRAG } from '@/features/starmap/view/semanticZoom'

/** The stars one hop from `star` along the prerequisites, either way, each once, in index order. */
export function linkedStars(links: readonly { from: number; to: number }[], star: number): number[] {
  const out = new Set<number>()
  for (const { from, to } of links) {
    if (from === star && to !== star) out.add(to)
    else if (to === star && from !== star) out.add(from)
  }
  return [...out].sort((a, b) => a - b)
}

export type Spring = { stiffness: number; damping: number }

/**
 * One step of a damped spring pulling `x` (moving at `v`) towards `target`,
 * over `dtMs`: semi-implicit Euler in sub-steps of at most 4 ms, so a slow
 * frame is still a stable step. Returns `[x, v]`, v in px/s.
 */
export function springStep(x: number, v: number, target: number, dtMs: number, spring: Spring): [number, number] {
  const k = spring.stiffness
  const c = 2 * spring.damping * Math.sqrt(k)
  let left = Math.max(0, dtMs) / 1000
  while (left > 1e-9) {
    const h = Math.min(left, 0.004)
    v += (-k * (x - target) - c * v) * h
    x += v * h
    left -= h
  }
  return [x, v]
}

export type StarDrag = {
  /** The grabbed star. */
  star: number
  /** The stars linked to it, and how stiffly each follows (further ones lag more). */
  followers: Int32Array
  stiffness: Float32Array
  /** Each follower's displacement (px) and speed (px/s). */
  fx: Float32Array
  fy: Float32Array
  vx: Float32Array
  vy: Float32Array
  /** The grabbed star's displacement and speed (it follows the hand exactly while held). */
  gx: number
  gy: number
  gvx: number
  gvy: number
  /** Still held by the hand; false once let go (springing back). */
  held: boolean
  /** The grabbed star's growth (1 = its size) and the emphasis (0..1: lines lit, the rest dimmed), eased. */
  grow: number
  amount: number
}

/**
 * A drag of `star`, its followers `linked`; `distance(i)` is how far a
 * follower is from the grabbed star on screen now, px (it sets the lag).
 */
export function createStarDrag(star: number, linked: readonly number[], distance: (i: number) => number): StarDrag {
  const n = linked.length
  const stiffness = new Float32Array(n)
  linked.forEach((i, k) => {
    const far = Math.min(1, Math.max(0, distance(i)) / DRAG.lagReachPx)
    stiffness[k] = DRAG.follow.stiffness * (1 - DRAG.lagSpread * far)
  })
  return {
    star,
    followers: Int32Array.from(linked),
    stiffness,
    fx: new Float32Array(n),
    fy: new Float32Array(n),
    vx: new Float32Array(n),
    vy: new Float32Array(n),
    gx: 0,
    gy: 0,
    gvx: 0,
    gvy: 0,
    held: true,
    grow: 1,
    amount: 0,
  }
}

/**
 * Advance the drag by `dtMs`. Held: followers chase `DRAG.followRatio` of the
 * grabbed star's displacement. Let go: everything springs back to 0. With
 * `instant` (reduced motion) there is no spring: followers sit at their share
 * at once, and a let-go drag is back at once. Returns whether anything still
 * moves (false: the drag is over and can be dropped).
 */
export function stepStarDrag(drag: StarDrag, dtMs: number, instant: boolean): boolean {
  const ease = (value: number, to: number, tau: number) => {
    if (instant || Math.abs(to - value) < 0.002) return to
    return value + (to - value) * (1 - Math.exp(-dtMs / tau))
  }
  drag.grow = ease(drag.grow, drag.held ? DRAG.grow : 1, DRAG.growMs)
  drag.amount = ease(drag.amount, drag.held ? 1 : 0, drag.held ? DRAG.emphasisMs : DRAG.emphasisOutMs)
  const n = drag.followers.length
  if (drag.held) {
    const tx = drag.gx * DRAG.followRatio
    const ty = drag.gy * DRAG.followRatio
    for (let k = 0; k < n; k += 1) {
      if (instant) {
        drag.fx[k] = tx
        drag.fy[k] = ty
        drag.vx[k] = 0
        drag.vy[k] = 0
        continue
      }
      const spring = { stiffness: drag.stiffness[k], damping: DRAG.follow.damping }
      ;[drag.fx[k], drag.vx[k]] = springStep(drag.fx[k], drag.vx[k], tx, dtMs, spring)
      ;[drag.fy[k], drag.vy[k]] = springStep(drag.fy[k], drag.vy[k], ty, dtMs, spring)
    }
    return true
  }
  if (instant) {
    drag.gx = drag.gy = drag.gvx = drag.gvy = 0
    drag.fx.fill(0)
    drag.fy.fill(0)
    drag.vx.fill(0)
    drag.vy.fill(0)
    return drag.amount > 0 || drag.grow > 1
  }
  const spring = DRAG.release
  ;[drag.gx, drag.gvx] = springStep(drag.gx, drag.gvx, 0, dtMs, spring)
  ;[drag.gy, drag.gvy] = springStep(drag.gy, drag.gvy, 0, dtMs, spring)
  let moving = !settled(drag.gx, drag.gvx) || !settled(drag.gy, drag.gvy)
  for (let k = 0; k < n; k += 1) {
    ;[drag.fx[k], drag.vx[k]] = springStep(drag.fx[k], drag.vx[k], 0, dtMs, spring)
    ;[drag.fy[k], drag.vy[k]] = springStep(drag.fy[k], drag.vy[k], 0, dtMs, spring)
    if (!settled(drag.fx[k], drag.vx[k]) || !settled(drag.fy[k], drag.vy[k])) moving = true
  }
  if (!moving) {
    // At rest: exactly back in place, not a hair off.
    drag.gx = drag.gy = drag.gvx = drag.gvy = 0
    drag.fx.fill(0)
    drag.fy.fill(0)
    drag.vx.fill(0)
    drag.vy.fill(0)
  }
  return moving || drag.amount > 0 || drag.grow > 1
}

const settled = (x: number, v: number) => Math.abs(x) < DRAG.restPx && Math.abs(v) < DRAG.restSpeed
