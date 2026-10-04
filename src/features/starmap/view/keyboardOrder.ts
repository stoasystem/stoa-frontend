/*
 * The star map's two keyboard orders (#141, #123 E5): one rule each.
 *
 * - Arrow keys go by **where things are**: between nebulae, left and right
 *   step to the next nebula along the band, round the ring (`ringNeighbour`,
 *   #120); up and down, and every arrow on a star (a star's link in the
 *   parallel DOM, or the chosen star), go to the nearest one in that
 *   direction (`nearestInDirection`). Across the seam the ring's shorter way
 *   counts, so nothing jumps.
 * - Tab goes by **the course**: galaxy by galaxy (the order of the subjects),
 *   then nebula by nebula (`topic.order`), then star by star
 *   (`unit.order`) -- the order of the parallel DOM (`courseNebulae`).
 */
import type { Galaxy, Nebula } from '@/features/starmap/model/starMap'
import { nearestCopy } from '@/features/starmap/view/camera'
import { KEYS } from '@/features/starmap/view/semanticZoom'

export type ArrowDirection = 'left' | 'right' | 'up' | 'down'

/** The direction of an arrow key, or null for any other key. */
export function arrowDirection(key: string): ArrowDirection | null {
  switch (key) {
    case 'ArrowLeft':
      return 'left'
    case 'ArrowRight':
      return 'right'
    case 'ArrowUp':
      return 'up'
    case 'ArrowDown':
      return 'down'
    default:
      return null
  }
}

/**
 * The point nearest `points[from]` in `direction`, by map position (y grows
 * downwards), or -1 when there is none. A candidate must lie ahead, inside a
 * cone of `KEYS.coneSlope` off the axis; among those, the least
 * `ahead + KEYS.offAxisWeight × aside` wins, so a point straight ahead beats
 * a slightly nearer one off to the side. Ties keep the given order. On a ring
 * (`wrap` > 0) x is measured the shorter way round.
 */
export function nearestInDirection(points: readonly { x: number; y: number }[], from: number, direction: ArrowDirection, wrap = 0): number {
  const origin = points[from]
  if (!origin) return -1
  let best = -1
  let bestScore = Infinity
  for (let i = 0; i < points.length; i += 1) {
    if (i === from) continue
    const dx = nearestCopy(points[i].x, origin.x, wrap) - origin.x
    const dy = points[i].y - origin.y
    const ahead = direction === 'right' ? dx : direction === 'left' ? -dx : direction === 'down' ? dy : -dy
    const aside = Math.abs(direction === 'left' || direction === 'right' ? dy : dx)
    if (!(ahead > KEYS.minAhead) || aside > ahead * KEYS.coneSlope) continue
    const score = ahead + aside * KEYS.offAxisWeight
    if (score < bestScore) {
      best = i
      bestScore = score
    }
  }
  return best
}

/**
 * The nebulae in course order, for Tab: by galaxy (the order of the
 * subjects), then by `topic.order`. `nebulae` comes in the engine's order
 * (`orderedNebulae`); each keeps its index there, which the engine's focus
 * and on-screen discs are keyed by. A nebula that names no galaxy belongs to
 * `fallbackSubject`; a galaxy not among the subjects goes last.
 */
export function courseNebulae<N extends Pick<Nebula, 'order' | 'subjectId'>>(
  nebulae: readonly N[],
  subjects: readonly Pick<Galaxy, 'subjectId'>[],
  fallbackSubject: string,
): { nebula: N; index: number }[] {
  const rank = new Map(subjects.map((subject, i) => [subject.subjectId, i]))
  const galaxyRank = (nebula: N) => rank.get(nebula.subjectId ?? fallbackSubject) ?? subjects.length
  return nebulae
    .map((nebula, index) => ({ nebula, index }))
    .sort((a, b) => galaxyRank(a.nebula) - galaxyRank(b.nebula) || a.nebula.order - b.nebula.order || a.index - b.index)
}
