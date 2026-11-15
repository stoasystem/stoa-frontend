/*
 * The shapes of a found path's lines (#489): a line between two stars in
 * different nebulae is one smooth cubic Bézier pulled toward a bundle point
 * on each nebula's side facing the other (`bundlePoint`, `bundleCubic`), so
 * every line between the same two nebulae merges into one trunk; a line
 * inside one nebula stays straight. Only the path drawn from Ask uses these:
 * the star map's own lines between stars (`drawLinks`) stay straight segments.
 *
 * All of it in screen px, on one end's screen position: the caller puts both
 * stars and both nebula centres on the same side of the seam (`shortestDx`,
 * #120), and shifts the finished curve by a band for the other copies.
 */
import type { Segment } from '@/features/starmap/render/labels'

export type Pt = { x: number; y: number }
/** A cubic Bézier: start, two controls, end. */
export type Cubic = [Pt, Pt, Pt, Pt]

/** Bundling: how far the controls are pulled toward the bundle points (0 straight .. 1 on them). */
export const BUNDLE_STRENGTH = 0.7
/** Where a nebula's bundle point sits: this share of its radius out from its centre, toward the other nebula. */
export const BUNDLE_FACING = 0.85

const lerp = (a: Pt, b: Pt, t: number): Pt => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t })

/** A straight line as a cubic: the controls on it, a third of the way from either end. */
export function straightCubic(a: Pt, b: Pt): Cubic {
  return [a, lerp(a, b, 1 / 3), lerp(a, b, 2 / 3), b]
}

/**
 * Where lines leave a nebula of centre `c`, radius `r` (screen px) toward the
 * nebula at `toward`: on its rim's side facing that one, `BUNDLE_FACING` of
 * the radius out -- not its centre, which pulled a line's ends back across
 * the cluster's other stars. Its centre when the two centres coincide.
 */
export function bundlePoint(c: Pt, r: number, toward: Pt, facing = BUNDLE_FACING): Pt {
  const dx = toward.x - c.x
  const dy = toward.y - c.y
  const d = Math.hypot(dx, dy)
  if (d < 1e-6) return { x: c.x, y: c.y }
  return { x: c.x + (dx / d) * r * facing, y: c.y + (dy / d) * r * facing }
}

/**
 * From `a` to `b`, its controls pulled from the straight line toward the
 * bundle points `pa` (by `a`'s nebula) and `pb` (by `b`'s) by `strength`
 * (Holten's bundling): the lines between two nebulae share their middle.
 */
export function bundleCubic(a: Pt, pa: Pt, pb: Pt, b: Pt, strength = BUNDLE_STRENGTH): Cubic {
  return [a, lerp(lerp(a, b, 1 / 3), pa, strength), lerp(lerp(a, b, 2 / 3), pb, strength), b]
}

export function pointAt([p0, p1, p2, p3]: Cubic, t: number): Pt {
  const u = 1 - t
  const a = u * u * u
  const b = 3 * u * u * t
  const c = 3 * u * t * t
  const d = t * t * t
  return { x: a * p0.x + b * p1.x + c * p2.x + d * p3.x, y: a * p0.y + b * p1.y + c * p2.y + d * p3.y }
}

function split([p0, p1, p2, p3]: Cubic, t: number): [Cubic, Cubic] {
  const a = lerp(p0, p1, t)
  const b = lerp(p1, p2, t)
  const c = lerp(p2, p3, t)
  const d = lerp(a, b, t)
  const e = lerp(b, c, t)
  const f = lerp(d, e, t)
  return [[p0, a, d, f], [f, e, c, p3]]
}

/** The part of `curve` between t0 and t1 (de Casteljau). */
export function subCubic(curve: Cubic, t0: number, t1: number): Cubic {
  const right = t0 > 0 ? split(curve, t0)[1] : curve
  const t = t1 >= 1 ? 1 : (t1 - t0) / (1 - t0)
  return t >= 1 ? right : split(right, t)[0]
}

const SAMPLES = 16

/** Cumulative arc length at `SAMPLES + 1` evenly spaced t. */
export function arcLengths(curve: Cubic): number[] {
  const out = [0]
  let prev = curve[0]
  for (let i = 1; i <= SAMPLES; i += 1) {
    const p = pointAt(curve, i / SAMPLES)
    out.push(out[i - 1] + Math.hypot(p.x - prev.x, p.y - prev.y))
    prev = p
  }
  return out
}

/** Its length along the curve, px. */
export function cubicLength(curve: Cubic): number {
  const lengths = arcLengths(curve)
  return lengths[lengths.length - 1]
}

/** The t at arc length `s` along a curve of `lengths` (`arcLengths`). */
function tAtLength(lengths: readonly number[], s: number): number {
  const total = lengths[lengths.length - 1]
  if (s <= 0) return 0
  if (s >= total) return 1
  let i = 1
  while (lengths[i] < s) i += 1
  const span = lengths[i] - lengths[i - 1]
  return (i - 1 + (span > 0 ? (s - lengths[i - 1]) / span : 0)) / SAMPLES
}

/** The curve less `trim` px of arc at either end (clear of both glyphs); null when nothing is left. */
export function trimCubic(curve: Cubic, trim: number): Cubic | null {
  const lengths = arcLengths(curve)
  const total = lengths[lengths.length - 1]
  if (total <= trim * 2) return null
  return subCubic(curve, tAtLength(lengths, trim), tAtLength(lengths, total - trim))
}

/** The curve shifted `dx` px across (another copy of the band, #120). */
export function shiftCubic(curve: Cubic, dx: number): Cubic {
  return dx === 0 ? curve : (curve.map((p) => ({ x: p.x + dx, y: p.y })) as Cubic)
}

/** Its bounding box: the hull of its four points holds the curve. */
export function cubicBounds(curve: Cubic): { x0: number; y0: number; x1: number; y1: number } {
  let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity]
  for (const p of curve) {
    x0 = Math.min(x0, p.x)
    y0 = Math.min(y0, p.y)
    x1 = Math.max(x1, p.x)
    y1 = Math.max(y1, p.y)
  }
  return { x0, y0, x1, y1 }
}

/** The curve as `pieces` straight segments, for names to keep clear of. */
export function cubicSegments(curve: Cubic, pieces = 6): Segment[] {
  const out: Segment[] = []
  let prev = curve[0]
  for (let i = 1; i <= pieces; i += 1) {
    const p = pointAt(curve, i / pieces)
    out.push({ x0: prev.x, y0: prev.y, x1: p.x, y1: p.y })
    prev = p
  }
  return out
}
