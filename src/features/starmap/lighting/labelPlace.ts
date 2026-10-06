/*
 * Where the lighting moment's labels go beside their star (#145, round three
 * C14 of #142): the flare's title and, with reduced motion, the still
 * "<name> is lit" label. Below the star as before (#51, #140) unless that
 * covers a name at the screen's edge ("↘ Optics · Physics", #138 D5) -- on
 * a phone it easily does -- then above, right or left of the star, then
 * slid along below or above it, the first place that keeps clear of every
 * such name. Where none does, the place that covers the least of them.
 *
 * Pure: the caller reads the label's size and the edge names' boxes (the
 * renderer's, through the engine's `starOnScreen`) and writes the result.
 */
import { LIGHTING } from '@/features/starmap/view/semanticZoom'

export type Rect = { x0: number; y0: number; x1: number; y1: number }

export type LabelSide = 'below' | 'above' | 'right' | 'left' | 'below-slid' | 'above-slid'

export type LabelPlace = { x: number; y: number; side: LabelSide }

type Spot = { x: number; y: number }

/**
 * The top-left corner for a `width` x `height` label `gap` px from the star
 * at `spot`, inside a `layer`, clear of `keepClear`. `was`: the side it had
 * in the last frame, kept while it stays clear, so the label does not hop.
 */
export function placeBesideStar(
  spot: Spot,
  label: { width: number; height: number },
  gap: number,
  layer: { width: number; height: number },
  keepClear: readonly Rect[] = [],
  was?: LabelSide,
): LabelPlace {
  const { width: w, height: h } = label
  const inset = LIGHTING.insetPx
  const lowest = layer.height - LIGHTING.bottomReservePx
  const clampX = (x: number) => (layer.width > w + 2 * inset ? Math.max(inset, Math.min(layer.width - inset - w, x)) : x)
  const clampY = (y: number) => Math.max(inset, Math.min(lowest, y))
  const at = (side: LabelSide, x: number, y: number): LabelPlace => ({ side, x: Math.round(clampX(x)), y: Math.round(clampY(y)) })

  const below = at('below', spot.x - w / 2, spot.y + gap)
  const above = at('above', spot.x - w / 2, spot.y - gap - h)
  const right = at('right', spot.x + gap, spot.y - h / 2)
  const left = at('left', spot.x - gap - w, spot.y - h / 2)
  const sides = [below, above, right, left]

  const room = LIGHTING.edgeLabelClearancePx
  const grown = keepClear.map((box) => ({ x0: box.x0 - room, y0: box.y0 - room, x1: box.x1 + room, y1: box.y1 + room }))
  const covered = (place: LabelPlace) => grown.reduce((sum, box) => sum + overlap(box, place, w, h), 0)
  // A side the label would have to leave the star for -- pushed back over it by the layer's edges -- is no place for it.
  const besideIt = (place: LabelPlace) => !(place.x < spot.x && spot.x < place.x + w && place.y < spot.y && spot.y < place.y + h)

  const candidates = [...sides, ...slid(below, 'below-slid'), ...slid(above, 'above-slid')].filter(besideIt)
  const clear = candidates.filter((place) => covered(place) === 0)
  const kept = was ? clear.find((place) => place.side === was) : undefined
  if (kept) return kept
  if (clear.length > 0) return clear[0]
  return sides.filter(besideIt).reduce((best, place) => (covered(place) < covered(best) ? place : best), below)

  /** `from` slid sideways just past each name it covers, nearest first, still over the star's column. */
  function slid(from: LabelPlace, side: LabelSide): LabelPlace[] {
    return grown
      .filter((box) => overlap(box, from, w, h) > 0)
      .flatMap((box) => [box.x0 - w, box.x1])
      .map((x) => at(side, x, from.y))
      .filter((place) => place.x <= spot.x && spot.x <= place.x + w)
      .sort((a, b) => Math.abs(a.x + w / 2 - spot.x) - Math.abs(b.x + w / 2 - spot.x))
  }
}

function overlap(box: Rect, place: LabelPlace, w: number, h: number): number {
  const dx = Math.min(box.x1, place.x + w) - Math.max(box.x0, place.x)
  const dy = Math.min(box.y1, place.y + h) - Math.max(box.y0, place.y)
  return dx > 0 && dy > 0 ? dx * dy : 0
}
