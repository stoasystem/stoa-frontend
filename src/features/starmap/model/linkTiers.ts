/*
 * How strongly each connection line is drawn (#121, from #117 D1-D3).
 * Brightness says how relevant a relation is to the student right now, not
 * that the relation exists. Pure: no canvas, no screen; `render/links.ts`
 * turns these numbers into strokes.
 *
 * Four tiers, bright to dark, decided by the learning states of a
 * prerequisite's two stars (`from` must be lit before `to` opens):
 *
 *   1 recommended  the line into the recommended star: brightest, warm gold;
 *   2 in progress  an in-progress star to its prerequisites: medium;
 *   3 walked       both ends lit (or a lit star to a ready one): very faint,
 *                  the path already walked;
 *   4 locked       a line into a locked star (both ends locked is the common
 *                  case): darkest, dashed, only when zoomed far in.
 *
 * By zoom (#134: crossfaded by how far in the map is, no longer switched by
 * layer; the thresholds are `REVEAL` in `view/semanticZoom.ts`):
 *
 *   far out   no star-to-star lines at all. Between two nebulae of one galaxy
 *             with a prerequisite, one very faint, wide, soft bridge. A
 *             hovered or focused nebula's bridges brighten (its bridges to
 *             other galaxies appear), the others dim further. Between two
 *             galaxies, only a faint glow at the edges of the dark between
 *             them. The bridges fade out as tiers 1-2 fade in.
 *   closer    every star's lines on screen, tiers 1-2 first, then 3 (the
 *             path walked), tier 4 (locked) only when the glyph is very
 *             large; a line to another nebula is drawn from its star towards
 *             the other end and fades out with distance, keeping only its
 *             direction. A focused star: only its own lines stay lit.
 *   a star    chosen (its card open): its prerequisites and successors fully
 *             lit, tier 4 included, drawn to the other end; everything else
 *             fades away as the map gives way to it.
 *   dragged   (#136) while a star is dragged, every line of it lit and drawn
 *             to the other end, whatever its tier; every other line dimmed.
 */
import type { LearningState } from '@/features/starmap/model/starMap'

export const TIER_RECOMMENDED = 1
export const TIER_IN_PROGRESS = 2
export const TIER_WALKED = 3
export const TIER_LOCKED = 4
export type LinkTier = typeof TIER_RECOMMENDED | typeof TIER_IN_PROGRESS | typeof TIER_WALKED | typeof TIER_LOCKED

/**
 * The tier of the prerequisite `from -> to`. `toRecommended`: `to` carries
 * the recommendation marker (the line leads to it).
 */
export function linkTier(from: LearningState, to: LearningState, toRecommended: boolean): LinkTier {
  if (toRecommended) return TIER_RECOMMENDED
  if (to === 'in_progress') return TIER_IN_PROGRESS
  if (to === 'locked' || from === 'locked') return TIER_LOCKED
  // lit -> lit, lit -> ready (a ready star's prerequisites are all lit).
  return TIER_WALKED
}

/** While a star is dragged (#136), a line that does not touch it keeps this much. */
export const UNDRAGGED_LINE = 0.2

/** With a star in focus, a line that does not touch it keeps this much. */
export const UNFOCUSED_LINE = 0.15
/** A panorama bridge of the hovered / focused nebula, and the others, against a bridge at rest. */
export const BRIDGE_FOCUSED = 4
export const BRIDGE_UNFOCUSED = 0.4
/** The glow between two galaxies while one of their bridges is lit instead. */
export const HINT_WHILE_BRIDGED = 0.4

/** What the zoom shows of the lines, as the frame says it (`lineReveal` in `view/semanticZoom.ts`). */
export type LinkView = {
  /** The panorama's bridges between nebulae: 1 far out, 0 once tiers 1-2 are in. */
  bridges: number
  /** Each tier's star-to-star lines, 0..1, indexed by tier (index 0 unused). */
  tiers: readonly number[]
  /** With a star chosen: 0..1, how far the map has given way to it (its own lines, every tier; the rest fade). */
  star: number
  /** The chosen nebula, or -1 (its lines lead to named nebulae off screen). */
  chosen: number
  /** The star in focus (keyboard focus, or the chosen star), or -1. */
  focusStar: number
  /** A star being dragged (#136), or -1 / absent, and how far its emphasis is in (0..1, eased). */
  dragStar?: number
  drag?: number
}

/** A prerequisite between two stars, by index, with their nebulae and its tier. */
export type StarLine = { from: number; to: number; fromNebula: number; toNebula: number; tier: LinkTier }

/**
 * How a star-to-star line is drawn: `strength` multiplies its tier's ink (0 =
 * not drawn); `reach` is how much of a line leaving the chosen nebula is
 * drawn at full strength -- 0: it fades out near its own star, keeping only
 * the direction; 1: drawn all the way to the other star.
 */
export function starLineLook(line: StarLine, view: LinkView): { strength: number; reach: number; lit: number } {
  const none = { strength: 0, reach: 0, lit: 0 }
  const focused = view.focusStar >= 0 && (line.from === view.focusStar || line.to === view.focusStar)
  const star = Math.max(0, Math.min(1, view.star))
  // By zoom: this tier's share; with a star in focus, only its own lines stay lit.
  const tier = Math.max(0, Math.min(1, view.tiers[line.tier] ?? 0))
  const atZoom = view.focusStar >= 0 && !focused ? tier * UNFOCUSED_LINE : tier
  // A chosen star: only its own lines, every tier.
  const atStar = focused ? 1 : 0
  const strength = atZoom + (atStar - atZoom) * star
  const reach = focused ? star : 0
  // A dragged star (#136): its lines all light up, drawn to the other star
  // whatever their tier (tier 4 too, `lit`); every other line steps back.
  const drag = Math.max(0, Math.min(1, view.drag ?? 0))
  const dragStar = view.dragStar ?? -1
  if (drag > 0 && dragStar >= 0) {
    if (line.from === dragStar || line.to === dragStar) {
      return { strength: strength + (1 - strength) * drag, reach: reach + (1 - reach) * drag, lit: drag }
    }
    const kept = strength * (1 - (1 - UNDRAGGED_LINE) * drag)
    return kept <= 0.001 ? none : { strength: kept, reach, lit: 0 }
  }
  return strength <= 0.001 ? none : { strength, reach, lit: 0 }
}

/** A line between two nebulae on the panorama: their prerequisites aggregated, and whether it crosses galaxies. */
export type NebulaBridge = { a: number; b: number; count: number; crossGalaxy: boolean }

/**
 * A panorama bridge's strength against one at rest (0 = not drawn). `focus`
 * is the hovered or focused nebula, or -1. Bridges between galaxies only
 * appear for a focused end.
 */
export function bridgeLook(bridge: NebulaBridge, focus: number, view: Pick<LinkView, 'bridges'>): number {
  const panorama = Math.max(0, Math.min(1, view.bridges))
  if (panorama <= 0) return 0
  const touches = focus >= 0 && (bridge.a === focus || bridge.b === focus)
  if (bridge.crossGalaxy) return touches ? BRIDGE_FOCUSED * panorama : 0
  if (focus < 0) return panorama
  return (touches ? BRIDGE_FOCUSED : BRIDGE_UNFOCUSED) * panorama
}

/**
 * The glow between two galaxies that share prerequisites, on the panorama:
 * there at rest, fainter while a focused nebula lights one of their bridges.
 * `bridged`: the focused nebula has a bridge between these two galaxies.
 */
export function galaxyHintLook(bridged: boolean, view: Pick<LinkView, 'bridges'>): number {
  const panorama = Math.max(0, Math.min(1, view.bridges))
  return (bridged ? HINT_WHILE_BRIDGED : 1) * panorama
}
