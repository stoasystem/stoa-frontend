/*
 * The step numbers of a found path (#489): 1, 2, 3 ... on small gold badges
 * beside the stars of its main chain, in the order they are walked
 * (`chainSteps`), the target left out. Placed by the renderer with the
 * names, after the star names: each tries a few spots round its own star
 * (the corners first, then the sides, then a little further out) and takes
 * the nearest clear of every placed name and badge and of the main chain's
 * lines, crossing as few other lines and stars as it can (a dim line under a
 * badge reads; a badge pushed far from its star does not say whose it is);
 * its box then goes in with the placed names, so the nebula
 * names and the next badges keep clear of it. Painted at once, over the
 * lines and stars. The parallel DOM says the same thing in words ("Step 3 of
 * 10", `components/labels.ts`).
 */
import { boxHitsCircle, boxHitsSegment, placeInsisting, placeLabel, type Box, type Circle, type Segment } from '@/features/starmap/render/labels'
import type { StarMapTheme } from '@/features/starmap/render/types'

/** A badge: its text's size (px, bold), its height, the room either side of the number, how far off the glyph, and the far ring's extra distance. */
export const STEP = { font: 11, height: 16, padX: 4, gap: 2, far: 9, outline: 1.5, lineCost: 1.5, starCost: 10 } as const

/** A step badge placed: whose it is (star index), its number, its box (CSS px). */
export type StepBadge = { star: number; step: number; box: Box }

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
 * each clear of the placed names, the other badges and the main chain,
 * crossing the fewest other lines (`STEP.lineCost` each) and stars
 * (`STEP.starCost`), the nearer spots first; failing that, across the chain
 * too, still never over a name or a badge; failing that too, over a name,
 * never over another badge. A star off screen gets none.
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
    const box =
      placeLabel(preferred, { boxes: at.boxes, circles: [], segments: chain, covers: at.covers }, area, crossings) ??
      placeInsisting(preferred, at.boxes, circles, [], lines, area, undefined, at.covers ?? []) ??
      placeLabel(preferred, { boxes: badges.map((badge) => badge.box), circles, segments: [] }, area)
    if (!box) return
    at.boxes.push(box)
    at.slots.set(star, spots.indexOf(box))
    badges.push({ star, step, box })
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
