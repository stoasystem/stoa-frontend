/*
 * The step numbers of a found path (#489): 1, 2, 3 ... on small gold badges
 * beside the stars of its main chain, in the order they are walked
 * (`chainSteps`), the target left out. Placed by the renderer with the
 * names, after the star names: each tries a few spots round its own star
 * (the corners first, then the sides, then a little further out) and takes
 * the nearest that is its own -- its middle nearer its star than any other
 * star -- clear of every placed name and badge and of the main chain's
 * lines, crossing as few other lines and stars as it can. In a cluster too
 * dense for that, or set off on the outer ring, a thin leader runs from the
 * badge to its star, so it still says whose it is. Its box then goes in
 * with the placed names, so the nebula
 * names and the next badges keep clear of it. Painted at once, over the
 * lines and stars. The parallel DOM says the same thing in words ("Step 3 of
 * 10", `components/labels.ts`).
 */
import { boxHitsCircle, boxHitsSegment, placeInsisting, placeLabel, type Box, type Circle, type Segment } from '@/features/starmap/render/labels'
import type { StarMapTheme } from '@/features/starmap/render/types'

/** A badge: its text's size (px, bold), its height, the room either side of the number, how far off the glyph, and the far ring's extra distance. */
export const STEP = {
  font: 11,
  height: 16,
  padX: 4,
  gap: 2,
  far: 9,
  outline: 1.5,
  lineCost: 1.5,
  starCost: 10,
  /** A badge whose nearest edge is farther than this (px) off its star's glyph gets a leader, as does one not its star's own. */
  leaderAt: 6,
  /** A badge is its star's own only if its middle is at most this share of the way to the nearest other star (a clear margin, not a tie). */
  own: 0.8,
  /** The leader: width and strength. */
  leader: { width: 1, alpha: 0.85 },
} as const

/** A step badge placed: whose it is (star index), its number, its box (CSS px), and the leader to its star if it has one. */
export type StepBadge = { star: number; step: number; box: Box; leader: Segment | null }

/** Whether `box`'s middle is clearly nearer `own` than every one of `others` (`STEP.own`): a badge there reads as `own`'s. */
export function ownsBadge(box: Box, own: { x: number; y: number }, others: readonly { x: number; y: number }[]): boolean {
  const cx = (box.x0 + box.x1) / 2
  const cy = (box.y0 + box.y1) / 2
  const d = Math.hypot(cx - own.x, cy - own.y)
  return others.every((c) => Math.hypot(cx - c.x, cy - c.y) * STEP.own > d)
}

/** The leader from a star of radius `r` at `(x, y)` to `box`: glyph edge to the box's nearest point; null when the box is close enough. */
export function leaderTo(x: number, y: number, r: number, box: Box, always = false): Segment | null {
  const nx = Math.max(box.x0, Math.min(x, box.x1))
  const ny = Math.max(box.y0, Math.min(y, box.y1))
  const d = Math.hypot(nx - x, ny - y)
  if (d <= r + 1 || (!always && d <= r + STEP.leaderAt)) return null
  return { x0: x + ((nx - x) / d) * (r + 1), y0: y + ((ny - y) / d) * (r + 1), x1: nx, y1: ny }
}

/**
 * Spots for a badge `w` x `h` round a star of radius `r` at `(x, y)`, in
 * order of preference: the four corners (up left first, where the prototype
 * put it, clear of the name below), then left, right, above, below; then the
 * same eight `STEP.far` px further out.
 */
export function stepSpots(x: number, y: number, r: number, w: number, h: number): Box[] {
  const ring = (gap: number): Box[] => {
    const d = (r + gap) * Math.SQRT1_2
    const s = r + gap
    return [
      { x0: x - d - w, y0: y - d - h, x1: x - d, y1: y - d },
      { x0: x + d, y0: y - d - h, x1: x + d + w, y1: y - d },
      { x0: x + d, y0: y + d, x1: x + d + w, y1: y + d + h },
      { x0: x - d - w, y0: y + d, x1: x - d, y1: y + d + h },
      { x0: x - s - w, y0: y - h / 2, x1: x - s, y1: y + h / 2 },
      { x0: x + s, y0: y - h / 2, x1: x + s + w, y1: y + h / 2 },
      { x0: x - w / 2, y0: y - s - h, x1: x + w / 2, y1: y - s },
      { x0: x - w / 2, y0: y + s, x1: x + w / 2, y1: y + s + h },
    ]
  }
  return [...ring(STEP.gap), ...ring(STEP.gap + STEP.far)]
}

export type StepPlacement = {
  /** The placed names (and edge names, and controls' corners): a badge never covers one, and goes in with them. */
  boxes: Box[]
  /** The lines on screen: a badge crosses as few as it can. */
  segments: readonly Segment[]
  /** The main chain's lines (`drawPath`'s `chain`): a badge never sits on one while it has anywhere else. */
  chain: readonly Segment[]
  /** Galaxy names' letters. */
  covers?: readonly Box[]
  /** Where a badge may go: the band between the page's controls. */
  area: Box
  /** The other stars round a box (not `own`). */
  starsNear: (box: Box, own: number) => Circle[]
  /** A star's drawn radius. */
  radius: (star: number) => number
  /** Which spot each star's badge took last frame: kept while it is clear, so a badge does not hop. */
  slots: Map<number, number>
}

/**
 * Place the badges of `steps` (star indices, step 1 first) at `x`, `y`:
 * each on a spot its own star owns (`ownsBadge`), clear of the placed names,
 * the other badges and the main chain, crossing the fewest other lines
 * (`STEP.lineCost` each) and stars (`STEP.starCost`), the nearer spots
 * first; failing that, anywhere clear of names, badges and the chain, the
 * outer ring first (its leader must be long enough to see);
 * failing that, across the chain too, still never over a name or a badge;
 * failing that too, over a name, never over another badge. A badge not its
 * star's own, or farther than `STEP.leaderAt` off its glyph, gets a leader.
 * A star off screen gets none.
 */
export function placeStepBadges(
  ctx: CanvasRenderingContext2D,
  theme: StarMapTheme,
  steps: readonly number[],
  x: ArrayLike<number>,
  y: ArrayLike<number>,
  at: StepPlacement,
): StepBadge[] {
  const badges: StepBadge[] = []
  if (steps.length === 0) return badges
  ctx.font = `700 ${STEP.font}px ${theme.fontFamily}`
  const { area } = at
  steps.forEach((star, index) => {
    const sx = x[star]
    const sy = y[star]
    if (!(sx >= area.x0 && sx <= area.x1 && sy >= area.y0 && sy <= area.y1)) return
    const step = index + 1
    const w = Math.max(STEP.height, ctx.measureText(String(step)).width + STEP.padX * 2)
    const spots = stepSpots(sx, sy, at.radius(star), w, STEP.height)
    const slot = at.slots.get(star) ?? -1
    const preferred = slot > 0 && slot < spots.length ? [spots[slot], ...spots.filter((_, k) => k !== slot)] : spots
    const reach = STEP.gap + STEP.far + at.radius(star) + w + STEP.height
    const region: Box = { x0: sx - reach, y0: sy - reach, x1: sx + reach, y1: sy + reach }
    const inRegion = (s: Segment) =>
      Math.max(s.x0, s.x1) > region.x0 && Math.min(s.x0, s.x1) < region.x1 && Math.max(s.y0, s.y1) > region.y0 && Math.min(s.y0, s.y1) < region.y1
    const lines = at.segments.filter(inRegion)
    const chain = at.chain.filter(inRegion)
    const circles = at.starsNear(region, star)
    const crossings = (box: Box) => {
      let cost = 0
      for (const s of lines) if (boxHitsSegment(box, s)) cost += STEP.lineCost
      for (const c of circles) if (boxHitsCircle(box, c)) cost += STEP.starCost
      return cost
    }
    const own = { x: sx, y: sy }
    const clear = { boxes: at.boxes, circles: [], segments: chain, covers: at.covers }
    const owned = placeLabel(preferred, clear, area, (b) => (ownsBadge(b, own, circles) ? crossings(b) : Infinity))
    // No spot is its own: the outer ring first, so the leader that says whose it is can be seen.
    const apart = owned ? preferred : [...spots.slice(8), ...spots.slice(0, 8)]
    const box =
      owned ??
      placeLabel(apart, clear, area, crossings) ??
      placeInsisting(apart, at.boxes, circles, [], lines, area, undefined, at.covers ?? []) ??
      placeLabel(apart, { boxes: badges.map((badge) => badge.box), circles, segments: [] }, area)
    if (!box) return
    at.boxes.push(box)
    at.slots.set(star, spots.indexOf(box))
    badges.push({ star, step, box, leader: leaderTo(sx, sy, at.radius(star), box, owned === null) })
  })
  return badges
}

/** Paint the badges: a gold pill outlined in the sky, its number in the sky's colour. */
export function paintStepBadges(ctx: CanvasRenderingContext2D, badges: readonly StepBadge[], theme: StarMapTheme, ink: string, alpha: number): number {
  if (badges.length === 0 || alpha <= 0.001) return 0
  ctx.save()
  ctx.font = `700 ${STEP.font}px ${theme.fontFamily}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.setLineDash([])
  // The leaders first, under every badge.
  ctx.strokeStyle = ink
  ctx.lineWidth = STEP.leader.width
  ctx.lineCap = 'round'
  ctx.globalAlpha = alpha * STEP.leader.alpha
  for (const { leader } of badges) {
    if (!leader) continue
    ctx.beginPath()
    ctx.moveTo(leader.x0, leader.y0)
    ctx.lineTo(leader.x1, leader.y1)
    ctx.stroke()
  }
  ctx.globalAlpha = alpha
  for (const { step, box } of badges) {
    const w = box.x1 - box.x0
    const h = box.y1 - box.y0
    ctx.beginPath()
    if (typeof ctx.roundRect === 'function') ctx.roundRect(box.x0, box.y0, w, h, h / 2)
    else ctx.rect(box.x0, box.y0, w, h)
    ctx.fillStyle = ink
    ctx.fill()
    ctx.lineWidth = STEP.outline
    ctx.strokeStyle = theme.sky
    ctx.stroke()
    ctx.fillStyle = theme.sky
    ctx.fillText(String(step), (box.x0 + box.x1) / 2, (box.y0 + box.y1) / 2 + 0.5)
  }
  ctx.restore()
  return badges.length
}
