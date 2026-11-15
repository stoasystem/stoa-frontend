/*
 * PROTOTYPE (proto/starmap-line-styles): the shape a line between two stars
 * takes. Only the design preview sets a style (`?lineStyle=`); the app never
 * calls `setLineStyle`, so it draws `straight`, as before.
 *
 *   straight  the line as it was.
 *   arc       a gentle quadratic bow (`ARC_BOW` of its length), always to
 *             the left of prerequisite -> dependent, so lines between the
 *             same two clusters fan apart instead of stacking.
 *   bundle    across nebulae: a cubic pulled through the two nebula centres
 *             (Holten's bundling, strength `BUNDLE`), so many lines between
 *             two clusters merge into one trunk; inside a nebula: an arc.
 *   chain     the find-star path's main chain only, numbered; other lines as arc.
 *
 * Every shape is a cubic Bézier from the prerequisite to the dependent, cut
 * to the part drawn (`subCubic`).
 */
import type { Segment } from '@/features/starmap/render/labels'

export type LineStyle = 'straight' | 'arc' | 'bundle' | 'chain'
export const LINE_STYLES: readonly LineStyle[] = ['straight', 'arc', 'bundle', 'chain']

let style: LineStyle = 'straight'

export function setLineStyle(next: string | null | undefined) {
  style = LINE_STYLES.includes(next as LineStyle) ? (next as LineStyle) : 'straight'
}

export function lineStyle(): LineStyle {
  return style
}

/** How far an arc bows out at its middle, share of its length. */
export const ARC_BOW = 0.15
/** How strongly a bundled line is pulled through the nebula centres (0 straight .. 1 through them). */
export const BUNDLE = 0.7
/** The direction cue on arc / bundle lines: alpha at the prerequisite's end (the dependent's is 1). */
export const CUE_FROM = 0.35

export type Pt = { x: number; y: number }
/** A cubic Bézier: start, two controls, end. */
export type Cubic = [Pt, Pt, Pt, Pt]

const lerp = (a: Pt, b: Pt, t: number): Pt => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t })

export function straightCubic(a: Pt, b: Pt): Cubic {
  return [a, lerp(a, b, 1 / 3), lerp(a, b, 2 / 3), b]
}

/** A quadratic bow from `a` to `b`, `bow` of its length to the left of a -> b (screen y down), as a cubic. */
export function arcCubic(a: Pt, b: Pt, bow = ARC_BOW): Cubic {
  const dx = b.x - a.x
  const dy = b.y - a.y
  // Left of the direction on screen (y down): (dy, -dx). The quadratic's control sits twice the bow out.
  const c = { x: (a.x + b.x) / 2 + dy * bow * 2, y: (a.y + b.y) / 2 - dx * bow * 2 }
  return [a, lerp(a, c, 2 / 3), lerp(b, c, 2 / 3), b]
}

/** Through the two nebula centres, blended with the straight line by `beta`. */
export function bundleCubic(a: Pt, ca: Pt, cb: Pt, b: Pt, beta = BUNDLE): Cubic {
  const s1 = lerp(a, b, 1 / 3)
  const s2 = lerp(a, b, 2 / 3)
  return [a, lerp(s1, ca, beta), lerp(s2, cb, beta), b]
}

export function pointAt([p0, p1, p2, p3]: Cubic, t: number): Pt {
  const u = 1 - t
  const a = u * u * u
  const b = 3 * u * u * t
  const c = 3 * u * t * t
  const d = t * t * t
  return { x: a * p0.x + b * p1.x + c * p2.x + d * p3.x, y: a * p0.y + b * p1.y + c * p2.y + d * p3.y }
}

/** The part of `curve` between t0 and t1 (de Casteljau). */
export function subCubic(curve: Cubic, t0: number, t1: number): Cubic {
  const split = ([p0, p1, p2, p3]: Cubic, t: number): [Cubic, Cubic] => {
    const a = lerp(p0, p1, t)
    const b = lerp(p1, p2, t)
    const c = lerp(p2, p3, t)
    const d = lerp(a, b, t)
    const e = lerp(b, c, t)
    const f = lerp(d, e, t)
    return [[p0, a, d, f], [f, e, c, p3]]
  }
  const [, right] = split(curve, t0)
  const t = t1 >= 1 ? 1 : (t1 - t0) / (1 - t0)
  return t >= 1 ? right : split(right, t)[0]
}

export function reverseCubic([a, b, c, d]: Cubic): Cubic {
  return [d, c, b, a]
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

/** The t at arc length `s` along the curve. */
export function tAtLength(lengths: number[], s: number): number {
  const total = lengths[lengths.length - 1]
  if (s <= 0) return 0
  if (s >= total) return 1
  let i = 1
  while (lengths[i] < s) i += 1
  const span = lengths[i] - lengths[i - 1]
  return (i - 1 + (span > 0 ? (s - lengths[i - 1]) / span : 0)) / SAMPLES
}

/**
 * The drawn part of a curve from its anchor end: `trim` px off the start,
 * then `length` px of it (at most up to `trim` px before the end). Null when
 * nothing is left.
 */
export function drawnPart(curve: Cubic, trim: number, length: number): Cubic | null {
  const lengths = arcLengths(curve)
  const total = lengths[lengths.length - 1]
  if (total <= trim * 2) return null
  const end = Math.min(total - trim, trim + length)
  return subCubic(curve, tAtLength(lengths, trim), tAtLength(lengths, end))
}

export function strokeCubic(ctx: CanvasRenderingContext2D, [p0, p1, p2, p3]: Cubic) {
  ctx.beginPath()
  ctx.moveTo(p0.x, p0.y)
  // The default style draws exactly what it drew before: a straight segment.
  if (style === 'straight') ctx.lineTo(p3.x, p3.y)
  else ctx.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y)
  ctx.stroke()
}

/** The curve as a few straight segments, for the names to keep clear of. */
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

export function isStraight(curve: Cubic): boolean {
  const [a, b, c, d] = curve
  const cross = (p: Pt) => Math.abs((d.x - a.x) * (p.y - a.y) - (d.y - a.y) * (p.x - a.x))
  return cross(b) < 1e-6 && cross(c) < 1e-6
}
