/*
 * The sphere on screen: d3-geo's orthographic projection (#11 point 7), the
 * only part of d3 the planet takes. Rotation comes in as a quaternion and is
 * handed to d3 as its Euler angles, so d3 alone decides where a point lands.
 */
import { geoOrthographic, geoRotation, type GeoProjection } from 'd3-geo'
import { toEuler, type Quat } from '@/features/planet/geo/quaternion'

export type Viewport = { width: number; height: number }

/** The drawn sphere: centre and radius in CSS pixels. */
export type Disc = { cx: number; cy: number; r: number }

/**
 * Radius of the whole planet at zoom 1. The canvas board draws a 300 radius
 * sphere in a 1280 x 776 page area; a phone gets most of its width.
 */
export function baseRadius({ width, height }: Viewport): number {
  return Math.max(40, Math.min(width * 0.42, height * 0.39))
}

export type ViewPlacement = {
  q: Quat
  /** Zoom: the sphere's radius is `baseRadius * k`. */
  k: number
  /** Where the disc centre sits, as a fraction of the viewport (0.5 = middle). */
  cx: number
  cy: number
}

export function discOf(view: ViewPlacement, viewport: Viewport): Disc {
  return { cx: viewport.width * view.cx, cy: viewport.height * view.cy, r: baseRadius(viewport) * view.k }
}

/** A d3 orthographic projection for this view; clips to the front hemisphere. */
export function projectionFor(view: ViewPlacement, viewport: Viewport): GeoProjection {
  const disc = discOf(view, viewport)
  return geoOrthographic()
    .rotate(toEuler(view.q))
    .scale(disc.r)
    .translate([disc.cx, disc.cy])
    .clipAngle(90)
    .precision(0.5)
}

export type ProjectedPoints = {
  x: Float32Array
  y: Float32Array
  /** Cosine of the angle from the view centre: 1 facing us, 0 at the limb, < 0 behind. */
  depth: Float32Array
}

export function allocateProjected(count: number): ProjectedPoints {
  return { x: new Float32Array(count), y: new Float32Array(count), depth: new Float32Array(count) }
}

/**
 * Project `lngLat` (pairs, degrees) into `out`. The facing test uses d3's own
 * rotation, so "visible" means exactly what the projection's clip means.
 */
export function projectPoints(
  projection: GeoProjection,
  lngLat: Float64Array,
  out: ProjectedPoints,
): void {
  const rotate = geoRotation(projection.rotate() as [number, number, number])
  const count = lngLat.length / 2
  const point: [number, number] = [0, 0]
  const RADIANS = Math.PI / 180
  for (let i = 0; i < count; i += 1) {
    point[0] = lngLat[i * 2]
    point[1] = lngLat[i * 2 + 1]
    const [lng, lat] = rotate(point)
    const depth = Math.cos(lat * RADIANS) * Math.cos(lng * RADIANS)
    out.depth[i] = depth
    if (depth <= 0) continue
    const xy = projection(point)
    if (!xy) {
      out.depth[i] = -1
      continue
    }
    out.x[i] = xy[0]
    out.y[i] = xy[1]
  }
}

/**
 * The point on the sphere under a screen position, `[lng, lat]`. Positions
 * off the disc are pulled onto its rim, so a drag that leaves the sphere keeps
 * turning it instead of stopping dead.
 */
export function invertOnSphere(
  projection: GeoProjection,
  x: number,
  y: number,
): [number, number] | null {
  const [cx, cy] = projection.translate()
  const r = projection.scale()
  let dx = x - cx
  let dy = y - cy
  const distance = Math.hypot(dx, dy)
  const limit = r * 0.999
  if (distance > limit) {
    dx *= limit / distance
    dy *= limit / distance
  }
  const geo = projection.invert?.([cx + dx, cy + dy])
  if (!geo || !Number.isFinite(geo[0]) || !Number.isFinite(geo[1])) return null
  return [geo[0], geo[1]]
}
