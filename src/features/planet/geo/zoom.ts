/*
 * The three zoom layers (#11 point 4) and the flight between them.
 *
 *   planet  the whole sphere, points as specks, turn it freely;
 *   region  one continent (a topic) fills the view, points get names;
 *   point   one knowledge point, drawn in SVG/HTML beside the sphere.
 *
 * The flight is d3-zoom's smooth zoom (van Wijk & Nuij, rho = sqrt 2), run
 * along the great circle between the two view centres: a long move pulls back
 * first, a short one zooms straight in. It is written out here because the
 * decision takes nothing from d3 but d3-geo.
 */
import { orderedPoints, type KnowledgeMap, type KnowledgePoint } from '@/features/planet/model/knowledgeMap'
import { baseRadius, type ViewPlacement, type Viewport } from '@/features/planet/geo/projection'
import { angleBetween, facing, slerp } from '@/features/planet/geo/quaternion'

export type PlanetLayer = 'planet' | 'region' | 'point'

export type LayerTarget =
  | { layer: 'planet' }
  | { layer: 'region'; regionId: string }
  | { layer: 'point'; regionId: string; pointId: string }

export const LAYER_DEPTH: Record<PlanetLayer, number> = { planet: 0, region: 1, point: 2 }

const RHO = Math.SQRT2
const RHO2 = 2
const RHO4 = 4
const EPSILON2 = 1e-12

const cosh = (x: number) => ((x = Math.exp(x)) + 1 / x) / 2
const sinh = (x: number) => ((x = Math.exp(x)) - 1 / x) / 2
const tanh = (x: number) => ((x = Math.exp(2 * x)) - 1) / (x + 1)

/**
 * `size`: the viewport's shorter side; `radius`: the sphere's radius at k = 1.
 * Returns the view at `t` in [0, 1] (the caller applies the easing).
 */
export function interpolateView(from: ViewPlacement, to: ViewPlacement, size: number, radius: number) {
  // Distance travelled over the surface at zoom 1, and the width of the view
  // in the same units, as d3.interpolateZoom takes them.
  const d1 = angleBetween(from.q, to.q) * radius
  const w0 = size / from.k
  const w1 = size / to.k
  const d2 = d1 * d1
  let path: (t: number) => { u: number; w: number }

  if (d2 < EPSILON2) {
    const S = Math.log(w1 / w0) / RHO
    path = (t) => ({ u: t, w: w0 * Math.exp(RHO * t * S) })
  } else {
    const b0 = (w1 * w1 - w0 * w0 + RHO4 * d2) / (2 * w0 * RHO2 * d1)
    const b1 = (w1 * w1 - w0 * w0 - RHO4 * d2) / (2 * w1 * RHO2 * d1)
    const r0 = Math.log(Math.sqrt(b0 * b0 + 1) - b0)
    const r1 = Math.log(Math.sqrt(b1 * b1 + 1) - b1)
    const S = (r1 - r0) / RHO
    path = (t) => {
      const s = t * S
      const coshr0 = cosh(r0)
      const u = (w0 / (RHO2 * d1)) * (coshr0 * tanh(RHO * s + r0) - sinh(r0))
      return { u, w: (w0 * coshr0) / cosh(RHO * s + r0) }
    }
  }

  return (t: number): ViewPlacement => {
    if (t <= 0) return from
    if (t >= 1) return to
    const { u, w } = path(t)
    return {
      q: slerp(from.q, to.q, Math.max(0, Math.min(1, u))),
      k: size / w,
      cx: from.cx + (to.cx - from.cx) * t,
      cy: from.cy + (to.cy - from.cy) * t,
    }
  }
}

/** Angular distance, degrees, between two `[lng, lat]` points. */
function degreesApart(aLng: number, aLat: number, bLng: number, bLat: number): number {
  const r = Math.PI / 180
  const cos =
    Math.sin(aLat * r) * Math.sin(bLat * r) + Math.cos(aLat * r) * Math.cos(bLat * r) * Math.cos((aLng - bLng) * r)
  return Math.acos(Math.max(-1, Math.min(1, cos))) / r
}

/** How far a region's points reach from its centre, degrees (at least 6). */
export function regionExtent(map: KnowledgeMap, regionId: string): number {
  const region = map.regions.find((candidate) => candidate.topicId === regionId)
  if (!region) return 30
  let extent = 6
  for (const point of map.points) {
    if (point.regionId !== regionId) continue
    extent = Math.max(extent, degreesApart(region.lng, region.lat, point.lng, point.lat))
  }
  return extent
}

/** A wide screen keeps the point card beside the sphere; a phone puts it below. */
export function isWide(viewport: Viewport): boolean {
  return viewport.width >= 768
}

/**
 * The view a layer asks for. The planet layer keeps whatever orientation the
 * student turned it to; the other two turn their subject to the middle.
 */
export function viewForTarget(
  target: LayerTarget,
  map: KnowledgeMap,
  viewport: Viewport,
  current: ViewPlacement,
): ViewPlacement {
  if (target.layer === 'planet') return { q: current.q, k: 1, cx: 0.5, cy: 0.5 }

  const region = map.regions.find((candidate) => candidate.topicId === target.regionId)
  const shorter = Math.min(viewport.width, viewport.height)
  const r0 = baseRadius(viewport)
  const extent = regionExtent(map, target.regionId)
  // The region's half-width on screen, R sin(extent), should fill ~36% of the
  // shorter side.
  const regionK = Math.max(1.6, Math.min(5, (0.36 * shorter) / (r0 * Math.sin((Math.min(extent, 80) * Math.PI) / 180))))

  if (target.layer === 'region') {
    if (!region) return { q: current.q, k: 1, cx: 0.5, cy: 0.5 }
    return { q: facing(region.lng, region.lat), k: regionK, cx: 0.5, cy: 0.5 }
  }

  const point = map.points.find((candidate) => candidate.unitId === target.pointId)
  if (!point) return region ? { q: facing(region.lng, region.lat), k: regionK, cx: 0.5, cy: 0.5 } : current
  const wide = isWide(viewport)
  return {
    q: facing(point.lng, point.lat),
    k: Math.min(12, regionK * 1.6),
    cx: wide ? 0.34 : 0.5,
    cy: wide ? 0.5 : 0.3,
  }
}

/**
 * The layer a route asks for, made safe: a region or point the planet does
 * not have falls back to the nearest layer it does have.
 */
export function resolveTarget(
  map: KnowledgeMap,
  topicId: string | undefined,
  unitId: string | undefined,
): LayerTarget {
  const region = topicId ? map.regions.find((candidate) => candidate.topicId === topicId) : undefined
  if (!region) return { layer: 'planet' }
  const point = unitId
    ? map.points.find((candidate) => candidate.unitId === unitId && candidate.regionId === region.topicId)
    : undefined
  if (!point) return { layer: 'region', regionId: region.topicId }
  return { layer: 'point', regionId: region.topicId, pointId: point.unitId }
}

/** One layer out: point to its region, region to the planet. */
export function outerTarget(target: LayerTarget): LayerTarget {
  if (target.layer === 'point') return { layer: 'region', regionId: target.regionId }
  return { layer: 'planet' }
}

/** One layer in, around `regionId` (or the point nearest the middle). */
export function innerTarget(target: LayerTarget, map: KnowledgeMap, nearestPoint: KnowledgePoint | null): LayerTarget {
  if (target.layer === 'planet') {
    const regionId = nearestPoint?.regionId ?? orderedPoints(map)[0]?.regionId
    return regionId ? { layer: 'region', regionId } : target
  }
  if (target.layer === 'region') {
    const inRegion = nearestPoint && nearestPoint.regionId === target.regionId ? nearestPoint : null
    const fallback = orderedPoints(map).find((point) => point.regionId === target.regionId)
    const point = inRegion ?? fallback
    return point ? { layer: 'point', regionId: target.regionId, pointId: point.unitId } : target
  }
  return target
}

/** The route a layer lives at (#13, #45). */
export function pathForTarget(subjectId: string, target: LayerTarget): string {
  const subject = `/planet/${encodeURIComponent(subjectId)}`
  if (target.layer === 'planet') return subject
  const region = `${subject}/${encodeURIComponent(target.regionId)}`
  if (target.layer === 'region') return region
  return `${region}/${encodeURIComponent(target.pointId)}`
}

export function sameTarget(a: LayerTarget, b: LayerTarget): boolean {
  if (a.layer !== b.layer) return false
  if (a.layer === 'planet') return true
  if (a.layer === 'region') return a.regionId === (b as typeof a).regionId
  return a.regionId === (b as typeof a).regionId && a.pointId === (b as typeof a).pointId
}
