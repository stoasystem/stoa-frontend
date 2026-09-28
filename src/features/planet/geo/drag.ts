/*
 * Versor dragging (#11 point 7): the point of the sphere grabbed at the start
 * of a drag stays under the pointer for the whole drag.
 *
 * At the start we note the grabbed point `v0` (in the sphere's own frame,
 * through the projection as it was then) and the orientation `q0`. For every
 * move, the pointer's point `v1` through that same projection gives the turn
 * `delta(v0, v1)`, and the new orientation is `q0 * delta`.
 */
import type { GeoProjection } from 'd3-geo'
import { invertOnSphere } from '@/features/planet/geo/projection'
import { cartesian, conjugate, delta, multiply, normalize, type Quat, type Vec3 } from '@/features/planet/geo/quaternion'

export type DragMove = {
  /** The orientation to show now. */
  q: Quat
  /** The turn since the previous move, for the inertia's velocity. */
  step: Quat
}

export type SphereDrag = {
  move(x: number, y: number): DragMove | null
}

/**
 * Start a drag at `(x, y)`. `projection` must be the one on screen at that
 * moment; it is used, unchanged, for every later move of this drag.
 */
export function startDrag(projection: GeoProjection, q0: Quat, x: number, y: number): SphereDrag | null {
  const grabbed = invertOnSphere(projection, x, y)
  if (!grabbed) return null
  const v0: Vec3 = cartesian(grabbed)
  let previous: Quat = [1, 0, 0, 0]

  return {
    move(mx, my) {
      const now = invertOnSphere(projection, mx, my)
      if (!now) return null
      const turn = delta(v0, cartesian(now))
      const step = normalize(multiply(conjugate(previous), turn))
      previous = turn
      return { q: normalize(multiply(q0, turn)), step }
    },
  }
}
