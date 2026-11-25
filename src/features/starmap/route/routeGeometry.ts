/*
 * Where a cluster's route scene draws things (#747): the stars by column and
 * lane, the entrance chips stacked in a column left of the route, the lines,
 * and on which side of its star each name goes. Pure, so the scene and its
 * tests read the same picture.
 *
 * A star's name goes on the side of its glyph where fewer of the lines drawn
 * by default meet it; a tie puts a side lane's name away from the main line
 * and the main line's below it. Lines leave and arrive level and bend in one
 * gap between two columns, the first gap where the bend crosses no name and
 * no other star (`linePath`), so a name does not sit on a line drawn by
 * default.
 */
import { laneRow, type RouteEdge, type RouteLayout, type RouteStarNode } from '@/features/starmap/route/routeLayout'

export type RouteGeometryConfig = {
  colW: number
  laneH: number
  padX: number
  padTop: number
  padBottom: number
  mainGlyph: number
  sideGlyph: number
  /** The entrance chips: their width, the room from the screen's edge, and from one chip to the next. */
  chipW: number
  chipLeft: number
  chipStep: number
}

export const WIDE: RouteGeometryConfig = { colW: 164, laneH: 118, padX: 96, padTop: 52, padBottom: 72, mainGlyph: 40, sideGlyph: 28, chipW: 150, chipLeft: 16, chipStep: 58 }
export const COMPACT: RouteGeometryConfig = { colW: 116, laneH: 84, padX: 60, padTop: 44, padBottom: 64, mainGlyph: 34, sideGlyph: 24, chipW: 112, chipLeft: 12, chipStep: 50 }

export type Point = { x: number; y: number }
export type LabelSide = 'above' | 'below'
export type LabelAlign = 'center' | 'start' | 'end' | 'narrow'

/** A name drawn `narrow`: this share of the column, up to three lines. */
export const NARROW_NAME = { share: 0.6, lines: 3 }

export type Box = { x0: number; y0: number; x1: number; y1: number }

/** A drawn line: its SVG path, and points along it for measuring. */
export type LinePath = { d: string; points: Point[] }

export type RouteGeometry = {
  width: number
  height: number
  /** Every node's centre: stars and chips. */
  position: Map<string, Point>
  /** Where the main line's faint track runs. */
  mainY: number
  labelSide: Map<string, LabelSide>
  /** Each star's name, as far as its estimated size goes. */
  labelBox: Map<string, Box>
  /**
   * How a name sits along its glyph: centred, or `end` (ending at the glyph's
   * right edge, so a line forking out to that side passes clear of it), or
   * `start` (starting at its left edge, for a line coming in from that side),
   * or `narrow` (centred, narrower and up to three lines) where moving aside
   * would cover another name.
   */
  labelAlign: Map<string, LabelAlign>
  glyph: (node: RouteStarNode) => number
  /** The centre of a column of stars. */
  colX: (col: number) => number
  /** The line between two nodes, routed clear of names and other stars where it can be. */
  line: (from: string, to: string) => LinePath
}

/** Name type sizes, as the scene sets them; widths are estimated, at most two lines. */
const NAME = { charPx: 7.2, linePx: 17, gap: 6 }

/** How wide a name is drawn, estimated from its length: at most the column less a margin. */
export function nameWidth(text: string, g: RouteGeometryConfig): { width: number; lines: number } {
  const full = text.length * NAME.charPx
  const max = g.colW - 12
  return { width: Math.min(full, max), lines: full > max ? 2 : 1 }
}

export function routeGeometry(
  route: Pick<RouteLayout, 'nodes' | 'edges' | 'columns'>,
  g: RouteGeometryConfig,
  nameOf: (unitId: string) => string = () => '',
): RouteGeometry {
  const stars = route.nodes.filter((n): n is RouteStarNode => n.kind === 'star')
  const chips = route.nodes.filter((n) => n.kind === 'entrance')
  const rows = stars.map((n) => laneRow(n.lane))
  const topRow = Math.min(0, ...rows)
  const bottomRow = Math.max(0, ...rows)
  const x0 = chips.length > 0 ? g.chipLeft + g.chipW + Math.round(g.colW * 0.55) : g.padX
  const position = new Map<string, Point>()
  for (const n of stars) position.set(n.id, { x: x0 + n.col * g.colW, y: g.padTop + (laneRow(n.lane) - topRow) * g.laneH })
  for (const n of chips) if (n.kind === 'entrance') position.set(n.id, { x: g.chipLeft + g.chipW / 2, y: g.padTop + n.row * g.chipStep })
  const lanesBottom = g.padTop + (bottomRow - topRow) * g.laneH
  const chipsBottom = g.padTop + Math.max(0, chips.length - 1) * g.chipStep
  const width = x0 + Math.max(0, route.columns - 1) * g.colW + g.padX
  const height = Math.max(lanesBottom, chipsBottom) + g.padBottom

  const row = new Map(stars.map((n) => [n.id, laneRow(n.lane)]))
  const up = new Map<string, number>()
  const down = new Map<string, number>()
  const count = (at: string, other: string) => {
    const d = (row.get(other) ?? 0) - (row.get(at) ?? 0)
    if (d < 0) up.set(at, (up.get(at) ?? 0) + 1)
    if (d > 0) down.set(at, (down.get(at) ?? 0) + 1)
  }
  for (const e of route.edges) {
    count(e.from, e.to)
    count(e.to, e.from)
  }
  const labelSide = new Map<string, LabelSide>()
  for (const n of stars) {
    const u = up.get(n.id) ?? 0
    const d = down.get(n.id) ?? 0
    const r = laneRow(n.lane)
    labelSide.set(n.id, u < d ? 'above' : d < u ? 'below' : r < 0 ? 'above' : 'below')
  }
  const glyph = (node: RouteStarNode) => (node.main ? g.mainGlyph : g.sideGlyph)
  // A line bending to the name's side, out to the right or in from the left: the name moves out of its way.
  const sideOf = (at: string, other: string): LabelSide | null => {
    const d = (row.get(other) ?? 0) - (row.get(at) ?? 0)
    return d < 0 ? 'above' : d > 0 ? 'below' : null
  }
  const labelAlign = new Map<string, LabelAlign>()
  const labelBox = new Map<string, Box>()
  const glyphBox = new Map<string, Box>()
  const boxOf = (n: RouteStarNode, align: LabelAlign): Box => {
    const p = position.get(n.id)!
    const half = glyph(n) / 2
    const text = nameOf(n.unitId)
    const narrowMax = (g.colW - 12) * NARROW_NAME.share
    const { width: w, lines } =
      align === 'narrow'
        ? { width: Math.min(text.length * NAME.charPx, narrowMax), lines: Math.min(NARROW_NAME.lines, Math.max(1, Math.ceil((text.length * NAME.charPx) / narrowMax))) }
        : nameWidth(text, g)
    const h = lines * NAME.linePx
    const above = labelSide.get(n.id) === 'above'
    return {
      x0: align === 'end' ? p.x + half - w : align === 'start' ? p.x - half : p.x - w / 2,
      x1: align === 'end' ? p.x + half : align === 'start' ? p.x - half + w : p.x + w / 2,
      y0: above ? p.y - half - NAME.gap - h : p.y + half + NAME.gap,
      y1: above ? p.y - half - NAME.gap : p.y + half + NAME.gap + h,
    }
  }
  for (const n of stars) {
    const p = position.get(n.id)!
    const half = glyph(n) / 2
    labelAlign.set(n.id, 'center')
    labelBox.set(n.id, boxOf(n, 'center'))
    glyphBox.set(n.id, { x0: p.x - half - 2, x1: p.x + half + 2, y0: p.y - half - 2, y1: p.y + half + 2 })
  }
  // Moved aside only where it then covers no other name.
  for (const n of stars) {
    const side = labelSide.get(n.id)
    const out = route.edges.some((e) => e.from === n.id && sideOf(n.id, e.to) === side)
    const inn = route.edges.some((e) => e.to === n.id && sideOf(n.id, e.from) === side)
    const align: LabelAlign = out && !inn ? 'end' : inn && !out ? 'start' : 'center'
    if (align === 'center') continue
    for (const tried of [align, 'narrow'] as const) {
      const moved = boxOf(n, tried)
      if ([...labelBox].some(([id, box]) => id !== n.id && overlaps(moved, box))) continue
      labelAlign.set(n.id, tried)
      labelBox.set(n.id, moved)
      break
    }
  }

  /** What a line would cross: a name counts ten, another star one. */
  const cost = (points: readonly Point[], from: string, to: string) => {
    let total = 0
    for (const box of labelBox.values()) if (points.some((q) => inBox(q, box))) total += 10
    for (const [id, box] of glyphBox) if (id !== from && id !== to && points.some((q) => inBox(q, box))) total += 1
    return total
  }
  const line = (from: string, to: string): LinePath => {
    const a = position.get(from)!
    const b = position.get(to)!
    if (a.y === b.y || b.x <= a.x) return { d: curve(a, b), points: curvePoints(a, b) }
    // Level out of `a` and into `b`, bending in one column gap: the first that crosses nothing.
    const gaps = Math.max(1, Math.round((b.x - a.x) / g.colW))
    const step = (b.x - a.x) / gaps
    let best: { path: LinePath; cost: number } | null = null
    for (let i = 0; i < gaps; i += 1) {
      // Last, the steepest bend that still clears the two ends' own names.
      const tight = {
        s: i === 0 ? Math.max(a.x + 8, (labelBox.get(from)?.x1 ?? a.x) + 3) : a.x + i * step + 8,
        e: i === gaps - 1 ? Math.min(b.x - 8, (labelBox.get(to)?.x0 ?? b.x) - 3) : a.x + (i + 1) * step - 8,
      }
      const bends = [0.34, 0.24, 0.14].map((inset) => ({ s: a.x + i * step + step * inset, e: a.x + (i + 1) * step - step * inset }))
      if (tight.e - tight.s >= 8) bends.push(tight)
      for (const bend of bends) {
        const s = { x: bend.s, y: a.y }
        const e = { x: bend.e, y: b.y }
        const path = { d: `M ${a.x} ${a.y} L ${s.x} ${s.y} ${curve(s, e).slice(curve(s, e).indexOf('C'))} L ${b.x} ${b.y}`, points: [a, ...curvePoints(s, e), b, ...levelPoints(a, s), ...levelPoints(e, b)] }
        const crossed = cost(path.points, from, to)
        if (crossed === 0) return path
        if (!best || crossed < best.cost) best = { path, cost: crossed }
      }
    }
    return best!.path
  }

  return {
    width,
    height,
    position,
    mainY: g.padTop - topRow * g.laneH,
    labelSide,
    labelBox,
    labelAlign,
    colX: (col) => x0 + col * g.colW,
    glyph,
    line,
  }
}

function overlaps(a: Box, b: Box) {
  return a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1
}

function inBox(q: Point, box: Box) {
  return q.x > box.x0 && q.x < box.x1 && q.y > box.y0 && q.y < box.y1
}

function levelPoints(a: Point, b: Point, steps = 16): Point[] {
  return Array.from({ length: steps + 1 }, (_, i) => ({ x: a.x + ((b.x - a.x) * i) / steps, y: a.y + ((b.y - a.y) * i) / steps }))
}

/** A line between two nodes: straight along a lane, else bending between them, level at both ends. */
export function curve(a: Point, b: Point): string {
  if (a.y === b.y) return `M ${a.x} ${a.y} L ${b.x} ${b.y}`
  const dx = (b.x - a.x) / 2
  return `M ${a.x} ${a.y} C ${a.x + dx} ${a.y}, ${b.x - dx} ${b.y}, ${b.x} ${b.y}`
}

/** Points along `curve(a, b)`, for measuring. */
export function curvePoints(a: Point, b: Point, steps = 32): Point[] {
  if (a.y === b.y) return Array.from({ length: steps + 1 }, (_, i) => ({ x: a.x + ((b.x - a.x) * i) / steps, y: a.y }))
  const dx = (b.x - a.x) / 2
  const c1 = { x: a.x + dx, y: a.y }
  const c2 = { x: b.x - dx, y: b.y }
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps
    const u = 1 - t
    return {
      x: u * u * u * a.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * b.x,
      y: u * u * u * a.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * b.y,
    }
  })
}

/** The lines and nodes the star or chip picked out brings forward: every prerequisite into and out of it, and its entrances. */
export function contextOf(route: Pick<RouteLayout, 'context'>, id: string | null): { edges: RouteEdge[]; nodes: Set<string> } {
  if (id === null) return { edges: [], nodes: new Set() }
  const edges = route.context.filter((e) => e.from === id || e.to === id)
  return { edges, nodes: new Set([id, ...edges.flatMap((e) => [e.from, e.to])]) }
}
