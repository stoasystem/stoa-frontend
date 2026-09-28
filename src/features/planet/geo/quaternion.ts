/*
 * Rotation as a unit quaternion (a versor), written by hand (#11 point 7).
 *
 * Dragging a globe by turning `[λ, φ, γ]` degrees per pixel drifts and
 * gimbal-locks near the poles; composing quaternions keeps the grabbed point
 * under the pointer everywhere. The conventions follow d3-geo's
 * `projection.rotate([λ, φ, γ])`, so a quaternion converts to exactly the
 * rotation d3 applies (the formulas are the ones Jason Davies and Mike
 * Bostock published for "versor dragging").
 *
 * Quaternions are `[w, x, y, z]`; Euler angles are d3's, in degrees.
 */

export type Vec3 = readonly [number, number, number]
export type Quat = readonly [number, number, number, number]
export type Euler = readonly [number, number, number]

const RADIANS = Math.PI / 180
const DEGREES = 180 / Math.PI

export const IDENTITY: Quat = [1, 0, 0, 0]

const clampUnit = (value: number) => Math.max(-1, Math.min(1, value))

/** A point `[lng, lat]` in degrees as a unit vector. */
export function cartesian([lng, lat]: readonly [number, number]): Vec3 {
  const lambda = lng * RADIANS
  const phi = lat * RADIANS
  const cosPhi = Math.cos(phi)
  return [cosPhi * Math.cos(lambda), cosPhi * Math.sin(lambda), Math.sin(phi)]
}

export function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}

export function cross(a: Vec3, b: Vec3): Vec3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
}

/** The quaternion of d3's rotation `[λ, φ, γ]`. */
export function fromEuler([lambda, phi, gamma]: Euler): Quat {
  const l = (lambda / 2) * RADIANS
  const p = (phi / 2) * RADIANS
  const g = (gamma / 2) * RADIANS
  const sl = Math.sin(l)
  const cl = Math.cos(l)
  const sp = Math.sin(p)
  const cp = Math.cos(p)
  const sg = Math.sin(g)
  const cg = Math.cos(g)
  return [
    cl * cp * cg + sl * sp * sg,
    sl * cp * cg - cl * sp * sg,
    cl * sp * cg + sl * cp * sg,
    cl * cp * sg - sl * sp * cg,
  ]
}

/** d3's rotation `[λ, φ, γ]` for a unit quaternion. */
export function toEuler([a, b, c, d]: Quat): [number, number, number] {
  return [
    Math.atan2(2 * (a * b + c * d), 1 - 2 * (b * b + c * c)) * DEGREES,
    Math.asin(clampUnit(2 * (a * c - d * b))) * DEGREES,
    Math.atan2(2 * (a * d + b * c), 1 - 2 * (c * c + d * d)) * DEGREES,
  ]
}

export function multiply(a: Quat, b: Quat): Quat {
  const [a0, a1, a2, a3] = a
  const [b0, b1, b2, b3] = b
  return [
    a0 * b0 - a1 * b1 - a2 * b2 - a3 * b3,
    a0 * b1 + a1 * b0 + a2 * b3 - a3 * b2,
    a0 * b2 - a1 * b3 + a2 * b0 + a3 * b1,
    a0 * b3 + a1 * b2 - a2 * b1 + a3 * b0,
  ]
}

export function conjugate([w, x, y, z]: Quat): Quat {
  return [w, -x, -y, -z]
}

export function normalize(q: Quat): Quat {
  const length = Math.hypot(q[0], q[1], q[2], q[3])
  if (!length) return IDENTITY
  return [q[0] / length, q[1] / length, q[2] / length, q[3] / length]
}

/**
 * The rotation that carries unit vector `v0` onto `v1` along the great circle
 * between them, scaled by `alpha`, in the frame `multiply(q0, delta)` expects.
 */
export function delta(v0: Vec3, v1: Vec3, alpha = 1): Quat {
  const w = cross(v0, v1)
  const length = Math.sqrt(dot(w, w))
  if (!length) return IDENTITY
  const t = (alpha * Math.acos(clampUnit(dot(v0, v1)))) / 2
  const s = Math.sin(t)
  return [Math.cos(t), (w[2] / length) * s, (-w[1] / length) * s, (w[0] / length) * s]
}

/** The rotation angle of a unit quaternion, radians in [0, π]. */
export function angleOf(q: Quat): number {
  return 2 * Math.acos(Math.min(1, Math.abs(q[0])))
}

/** Axis (unit vector, in quaternion space) and angle of a unit quaternion. */
export function toAxisAngle(q: Quat): { axis: Vec3; angle: number } {
  const sign = q[0] < 0 ? -1 : 1
  const w = q[0] * sign
  const angle = 2 * Math.acos(Math.min(1, w))
  const s = Math.sqrt(Math.max(0, 1 - w * w))
  if (s < 1e-9) return { axis: [1, 0, 0], angle: 0 }
  return { axis: [(q[1] * sign) / s, (q[2] * sign) / s, (q[3] * sign) / s], angle }
}

export function fromAxisAngle(axis: Vec3, angle: number): Quat {
  const half = angle / 2
  const s = Math.sin(half)
  return [Math.cos(half), axis[0] * s, axis[1] * s, axis[2] * s]
}

/** Spherical interpolation between two unit quaternions, the short way round. */
export function slerp(a: Quat, b: Quat, t: number): Quat {
  let cos = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3]
  let end = b
  if (cos < 0) {
    cos = -cos
    end = [-b[0], -b[1], -b[2], -b[3]]
  }
  if (cos > 0.9995) {
    return normalize([
      a[0] + (end[0] - a[0]) * t,
      a[1] + (end[1] - a[1]) * t,
      a[2] + (end[2] - a[2]) * t,
      a[3] + (end[3] - a[3]) * t,
    ])
  }
  const theta = Math.acos(cos)
  const sin = Math.sin(theta)
  const s0 = Math.sin((1 - t) * theta) / sin
  const s1 = Math.sin(t * theta) / sin
  return [a[0] * s0 + end[0] * s1, a[1] * s0 + end[1] * s1, a[2] * s0 + end[2] * s1, a[3] * s0 + end[3] * s1]
}

/** The angle between two orientations, radians in [0, π]. */
export function angleBetween(a: Quat, b: Quat): number {
  const cos = Math.abs(a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3])
  return 2 * Math.acos(Math.min(1, cos))
}

/** The orientation that puts `[lng, lat]` at the centre of the disc, north up. */
export function facing(lng: number, lat: number): Quat {
  return fromEuler([-lng, -lat, 0])
}
