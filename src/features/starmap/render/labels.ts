/*
 * Where names go on the star map (#72; review of #71): each name sits by its
 * own nebula or star, never pushed away from it, and never on top of another
 * name, a nebula's core, a line between nebulae, or another star's glyph.
 * A name with nowhere free to go is left out -- the parallel DOM still has it.
 * Two kinds of name insist (#144): a key star's may sit over other stars and
 * lines, on a thin dark backing (`placeInsisting`), and a name at the
 * screen's edge slides along it (`edgeSpots`) to keep clear of the key stars.
 */
import { REVEAL } from '@/features/starmap/view/semanticZoom'

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
 * `aroundDisc`'s four spots, then the four corners (below right, below left,
 * above right, above left): for a name that should find a place if any is
 * free (#138 B2: a key star's lines leave it every way, often through all
 * four sides).
 */
export function aroundDiscWide(x: number, y: number, r: number, width: number, height: number, gap: number): Box[] {
  const d = (r + gap) * Math.SQRT1_2
  return [
    ...aroundDisc(x, y, r, width, height, gap),
    { x0: x + d, y0: y + d, x1: x + d + width, y1: y + d + height },
    { x0: x - d - width, y0: y + d, x1: x - d, y1: y + d + height },
    { x0: x + d, y0: y - d - height, x1: x + d + width, y1: y - d },
    { x0: x - d - width, y0: y - d - height, x1: x - d, y1: y - d },
  ]
}

/**
 * Spots for a name of half-width `half` (24 px tall) at the screen's edge
 * around `(x, y)` (#144 B4): there first, then slid further and further
 * either way -- along the edge (`horizontal`: at the top or the bottom) or
 * up and down it (at a side) -- every one inside `area`.
 */
export function edgeSpots(x: number, y: number, half: number, area: Box, horizontal: boolean): Box[] {
  const { slideSteps, slideX, slideY } = REVEAL.edgeLabel
  const clampX = (v: number) => Math.max(area.x0 + half + 12, Math.min(area.x1 - half - 12, v))
  const clampY = (v: number) => Math.max(area.y0 + 14, Math.min(area.y1 - 14, v))
  const spots: Box[] = []
  const seen = new Set<string>()
  for (let k = 0; k <= slideSteps * 2; k += 1) {
    const shift = k === 0 ? 0 : k % 2 === 1 ? (k + 1) / 2 : -k / 2
    const sx = clampX(x + (horizontal ? shift * slideX : 0))
    const sy = clampY(y + (horizontal ? 0 : shift * slideY))
    const key = `${Math.round(sx)}:${Math.round(sy)}`
    if (seen.has(key)) continue
    seen.add(key)
    spots.push({ x0: sx - half, y0: sy - 12, x1: sx + half, y1: sy + 12 })
  }
  return spots
}

/**
 * A key star's name when no free place is left (#144 B5): it may sit over
 * other stars (`circles`) and cross lines, on a thin dark backing, but never
 * over a placed name, over a key star (`keyCircles`) while another spot is
 * clear of them, or outside `area`. Over a star weighs less than across a
 * line; the nearer spots win. Null only if every spot is under a placed name.
 */
export function placeInsisting(
  candidates: readonly Box[],
  boxes: readonly Box[],
  circles: readonly Circle[],
  keyCircles: readonly Circle[],
  segments: readonly Segment[],
  area: Box,
  /** Extra cost for a spot, as `placeLabel`'s. */
  extraCost: (box: Box) => number = () => 0,
): Box | null {
  const { keyStarCost, starCost, lineCost } = REVEAL.keyName
  return placeLabel(candidates, { boxes: [...boxes], circles: [], segments: [] }, area, (box) => {
    let cost = extraCost(box)
    for (const c of keyCircles) if (boxHitsCircle(box, c)) cost += keyStarCost
    for (const c of circles) if (boxHitsCircle(box, c)) cost += starCost
    for (const s of segments) if (boxHitsSegment(box, s)) cost += lineCost
    return cost
  })
}

/**
 * How many of `others` lie nearer the middle of `box` than `own` does: a
 * name there could be read as theirs (#144 B5). 0: it reads as its own.
 */
export function nearerStars(box: Box, own: { x: number; y: number }, others: readonly Circle[]): number {
  const cx = (box.x0 + box.x1) / 2
  const cy = (box.y0 + box.y1) / 2
  const d = Math.hypot(cx - own.x, cy - own.y)
  let count = 0
  for (const c of others) if (Math.hypot(cx - c.x, cy - c.y) < d) count += 1
  return count
}

/** Every part of a label must lie nearer its own centre than another nebula's. */
export function belongsTo(box: Box, own: Circle, others: readonly Circle[]): boolean {
  return [[box.x0, box.y0], [box.x1, box.y0], [box.x0, box.y1], [box.x1, box.y1]].every(([x, y]) =>
    others.every((other) => Math.hypot(x - own.x, y - own.y) < Math.hypot(x - other.x, y - other.y)))
}

/** What `keyStars` reads of a scene: its stars' states, its prerequisites and its recommended stars. */
export type KeyStarScene = {
  count: number
  state: ArrayLike<number>
  starLinks: readonly { from: number; to: number }[]
  recommended: number
  recommendations?: readonly number[]
}

/**
 * The stars named first, at the nebula band (#138 B2), 1 each: every
 * recommended star, every star in progress (`inProgress`, the state's
 * number), and every star the gold path (tier 1, a line into a recommended
 * star) runs through. The rest are named on hover, or zoomed further in.
 */
export function keyStars(scene: KeyStarScene, inProgress: number): Uint8Array {
  const key = new Uint8Array(scene.count)
  const beacons = scene.recommendations ?? (scene.recommended >= 0 ? [scene.recommended] : [])
  const recommended = new Set<number>()
  for (const i of beacons) {
    if (i < 0 || i >= scene.count) continue
    recommended.add(i)
    key[i] = 1
  }
  for (let i = 0; i < scene.count; i += 1) if (scene.state[i] === inProgress) key[i] = 1
  for (const { from, to } of scene.starLinks) {
    if (!recommended.has(to) || from < 0 || from >= scene.count) continue
    key[from] = 1
  }
  return key
}
