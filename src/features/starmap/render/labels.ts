/*
 * Where names go on the star map (#72; review of #71): each name sits by its
 * own nebula or star, never pushed away from it, and never on top of another
 * name, a nebula's core, a line between nebulae, or another star's glyph.
 * A name with nowhere free to go is left out -- the parallel DOM still has it.
 */

export type Box = { x0: number; y0: number; x1: number; y1: number }
export type Circle = { x: number; y: number; r: number }
export type Segment = { x0: number; y0: number; x1: number; y1: number }

export function boxesOverlap(a: Box, b: Box): boolean {
  return a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0
}

export function boxHitsCircle(box: Box, c: Circle): boolean {
  const nx = Math.max(box.x0, Math.min(c.x, box.x1))
  const ny = Math.max(box.y0, Math.min(c.y, box.y1))
  return (nx - c.x) ** 2 + (ny - c.y) ** 2 < c.r * c.r
}

/** Whether a segment crosses (or lies inside) a box: Liang-Barsky clipping. */
export function boxHitsSegment(box: Box, s: Segment): boolean {
  const dx = s.x1 - s.x0
  const dy = s.y1 - s.y0
  let t0 = 0
  let t1 = 1
  const clip = (p: number, q: number) => {
    if (p === 0) return q >= 0
    const t = q / p
    if (p < 0) {
      if (t > t1) return false
      if (t > t0) t0 = t
    } else {
      if (t < t0) return false
      if (t < t1) t1 = t
    }
    return true
  }
  return (
    clip(-dx, s.x0 - box.x0) && clip(dx, box.x1 - s.x0) && clip(-dy, s.y0 - box.y0) && clip(dy, box.y1 - s.y0) && t0 <= t1
  )
}

export type Obstacles = {
  boxes: Box[]
  circles: readonly Circle[]
  segments: readonly Segment[]
}

/**
 * The first free box among `candidates` (in order of preference): none may
 * overlap a placed name or a line; the least in the way of cores wins.
 * A candidate outside `area` does not count, so a name near a control band
 * moves to the side of its nebula that is clear of it. `null`: leave the
 * name out.
 */
export function placeLabel(
  candidates: readonly Box[],
  obstacles: Obstacles,
  /** Where a name may go: the viewport less the bands the page keeps for its controls. */
  area: Box,
  /** Extra cost for a candidate, e.g. for sitting nearer another nebula than its own. */
  extraCost: (box: Box) => number = () => 0,
): Box | null {
  let best: Box | null = null
  let bestCost = Number.POSITIVE_INFINITY
  candidates.forEach((box, order) => {
    if (box.x0 < area.x0 || box.y0 < area.y0 || box.x1 > area.x1 || box.y1 > area.y1) return
    if (obstacles.boxes.some((placed) => boxesOverlap(box, placed))) return
    if (obstacles.segments.some((segment) => boxHitsSegment(box, segment))) return
    let cost = order * 0.5
    for (const circle of obstacles.circles) if (boxHitsCircle(box, circle)) cost += 10
    cost += extraCost(box)
    if (!Number.isFinite(cost)) return
    if (cost < bestCost) {
      best = box
      bestCost = cost
    }
  })
  return best
}

/** Candidate boxes around a disc for a label of `width` x `height`: below, above, right, left. */
export function aroundDisc(x: number, y: number, r: number, width: number, height: number, gap: number): Box[] {
  const half = width / 2
  return [
    { x0: x - half, y0: y + r + gap, x1: x + half, y1: y + r + gap + height },
    { x0: x - half, y0: y - r - gap - height, x1: x + half, y1: y - r - gap },
    { x0: x + r + gap, y0: y - height / 2, x1: x + r + gap + width, y1: y + height / 2 },
    { x0: x - r - gap - width, y0: y - height / 2, x1: x - r - gap, y1: y + height / 2 },
  ]
}

/**
 * The parts of a segment that run clear of every circle, and the parts
 * inside one, as [t0, t1] intervals along it (0 = start, 1 = end).
 */
export function splitByCircles(s: Segment, circles: readonly Circle[]): { clear: [number, number][]; hidden: [number, number][] } {
  const dx = s.x1 - s.x0
  const dy = s.y1 - s.y0
  const a = dx * dx + dy * dy
  const inside: [number, number][] = []
  if (a > 0) {
    for (const c of circles) {
      const fx = s.x0 - c.x
      const fy = s.y0 - c.y
      const b = 2 * (fx * dx + fy * dy)
      const cc = fx * fx + fy * fy - c.r * c.r
      const disc = b * b - 4 * a * cc
      if (disc <= 0) continue
      const root = Math.sqrt(disc)
      const t0 = Math.max(0, (-b - root) / (2 * a))
      const t1 = Math.min(1, (-b + root) / (2 * a))
      if (t1 > t0) inside.push([t0, t1])
    }
  }
  inside.sort((p, q) => p[0] - q[0])
  const hidden: [number, number][] = []
  for (const span of inside) {
    const last = hidden[hidden.length - 1]
    if (last && span[0] <= last[1]) last[1] = Math.max(last[1], span[1])
    else hidden.push([span[0], span[1]])
  }
  const clear: [number, number][] = []
  let t = 0
  for (const [h0, h1] of hidden) {
    if (h0 > t) clear.push([t, h0])
    t = Math.max(t, h1)
  }
  if (t < 1) clear.push([t, 1])
  return { clear, hidden }
}

/** Every part of a label must lie nearer its own centre than another nebula's. */
export function belongsTo(box: Box, own: Circle, others: readonly Circle[]): boolean {
  return [[box.x0, box.y0], [box.x1, box.y0], [box.x0, box.y1], [box.x1, box.y1]].every(([x, y]) =>
    others.every((other) => Math.hypot(x - own.x, y - own.y) < Math.hypot(x - other.x, y - other.y)))
}

/** Rim anchors stay clear of star glyphs; a small gap becomes a visible bowed bridge. */
export function nebulaConnection(a: Circle, b: Circle, padding: number): { segments: Segment[]; bridge: boolean } {
  const d = Math.hypot(b.x - a.x, b.y - a.y)
  if (d === 0) return { segments: [], bridge: false }
  const ux = (b.x - a.x) / d
  const uy = (b.y - a.y) / d
  const ra = a.r + padding
  const rb = b.r + padding
  const bridge = d - ra - rb < 24
  const turn = bridge ? 0.5 : 0
  const cos = Math.cos(turn), sin = Math.sin(turn)
  const start = { x: a.x + (ux * cos - uy * sin) * ra, y: a.y + (uy * cos + ux * sin) * ra }
  const end = { x: b.x + (-ux * cos - uy * sin) * rb, y: b.y + (-uy * cos + ux * sin) * rb }
  const bend = bridge ? Math.max(32, Math.min(ra, rb) * 0.3) : 0
  const control = { x: (start.x + end.x) / 2 - uy * bend, y: (start.y + end.y) / 2 + ux * bend }
  const steps = bridge ? 8 : 1
  const segments: Segment[] = []
  let previous = start
  for (let i = 1; i <= steps; i += 1) {
    const t = i / steps
    const next = { x: (1-t)**2 * start.x + 2*(1-t)*t*control.x + t*t*end.x,
      y: (1-t)**2 * start.y + 2*(1-t)*t*control.y + t*t*end.y }
    segments.push({ x0: previous.x, y0: previous.y, x1: next.x, y1: next.y })
    previous = next
  }
  return { segments, bridge }
}
