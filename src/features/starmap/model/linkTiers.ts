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
 *                  case): darkest, dashed, and only on the star layer.
 *
 * By layer:
 *
 *   panorama  no star-to-star lines at all. Between two nebulae of one galaxy
 *             with a prerequisite, one very faint, wide, soft bridge. A
 *             hovered or focused nebula's bridges brighten (its bridges to
 *             other galaxies appear), the others dim further. Between two
 *             galaxies, only a faint glow at the edges of the dark between
 *             them.
 *   nebula    the chosen nebula's own lines, tiers 1-3; a line to another
 *             nebula is drawn from this nebula's star towards the other end
 *             and fades out with distance, keeping only its direction. A
 *             focused star: only its prerequisites and successors stay lit.
 *   star      this star's prerequisites and successors fully lit, tier 4
 *             included, drawn to the other end; everything else hidden.
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

/** On the nebula layer, a line that does not touch the focused star keeps this much. */
export const UNFOCUSED_LINE = 0.15
/** A panorama bridge of the hovered / focused nebula, and the others, against a bridge at rest. */
export const BRIDGE_FOCUSED = 4
export const BRIDGE_UNFOCUSED = 0.4
/** The glow between two galaxies while one of their bridges is lit instead. */
export const HINT_WHILE_BRIDGED = 0.4

/** Where the map is between its layers, as the frame says it. */
export type LinkView = {
  /** 0 on the panorama, 1 on the nebula and star layers; between, a crossfade. */
  nebula: number
  /** 1 on the star layer, 0 elsewhere; between, a crossfade. */
  star: number
  /** The chosen nebula (nebula and star layers), or -1. */
  chosen: number
  /** The star in focus (keyboard focus, or the star layer's star), or -1. */
  focusStar: number
}

/** A prerequisite between two stars, by index, with their nebulae and its tier. */
export type StarLine = { from: number; to: number; fromNebula: number; toNebula: number; tier: LinkTier }

/**
 * How a star-to-star line is drawn: `strength` multiplies its tier's ink (0 =
 * not drawn); `reach` is how much of a line leaving the chosen nebula is
 * drawn at full strength -- 0: it fades out near its own star, keeping only
 * the direction; 1: drawn all the way to the other star.
 */
export function starLineLook(line: StarLine, view: LinkView): { strength: number; reach: number } {
  const none = { strength: 0, reach: 0 }
  if (view.nebula <= 0 || view.chosen < 0) return none
  const inside = line.fromNebula === view.chosen || line.toNebula === view.chosen
  const focused = view.focusStar >= 0 && (line.from === view.focusStar || line.to === view.focusStar)
  if (!inside && !focused) return none
  const star = Math.max(0, Math.min(1, view.star))
  // The nebula layer: tiers 1-3; with a star in focus, only its own lines stay lit.
  const atNebula = line.tier === TIER_LOCKED ? 0 : view.focusStar >= 0 && !focused ? UNFOCUSED_LINE : 1
  // The star layer: only the star's own lines, every tier.
  const atStar = focused ? 1 : 0
  const strength = (atNebula + (atStar - atNebula) * star) * view.nebula
  return strength <= 0.001 ? none : { strength, reach: focused ? star : 0 }
}

/** A line between two nebulae on the panorama: their prerequisites aggregated, and whether it crosses galaxies. */
export type NebulaBridge = { a: number; b: number; count: number; crossGalaxy: boolean }

/**
 * A panorama bridge's strength against one at rest (0 = not drawn). `focus`
 * is the hovered or focused nebula, or -1. Bridges between galaxies only
 * appear for a focused end.
 */
export function bridgeLook(bridge: NebulaBridge, focus: number, view: Pick<LinkView, 'nebula'>): number {
  const panorama = 1 - Math.max(0, Math.min(1, view.nebula))
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
export function galaxyHintLook(bridged: boolean, view: Pick<LinkView, 'nebula'>): number {
  const panorama = 1 - Math.max(0, Math.min(1, view.nebula))
  return (bridged ? HINT_WHILE_BRIDGED : 1) * panorama
}
