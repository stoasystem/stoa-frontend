/*
 * The star map's read model (#72), shaped like the response of
 * `GET /practice/knowledge-map?subjectId=` (stoasystem/stoa-backend#59, being
 * rewritten for #72).
 *
 * Terms (#72 point 1): a subject is a star map, a topic is a nebula, a unit
 * is drawn as a star, and a skill is a small dot beside its star. The backend
 * decides every learning state and marker (#9); the map only draws them.
 *
 * Positions are laid out offline by the backend (stoa-backend#60) as
 * normalised 2D coordinates: `x` and `y` in [0, 1], y growing downwards, the
 * same every time the map opens. Until then the fixtures lay themselves out
 * the same way (`layout/layout.ts`).
 *
 * This front end's reading of the contract, to confirm when #48 wires the
 * endpoint in: the state strings (`lit`, `in_progress`, `ready`, `locked`);
 * `order` on nebulae and stars, which the keyboard order needs; one `name` per
 * nebula and star, already in the reader's language; `nebulaId` on each star;
 * unit-level `prerequisites`.
 */

/** The four learning states, in priority order (#9 point 7). */
export const LEARNING_STATES = ['lit', 'in_progress', 'ready', 'locked'] as const
export type LearningState = (typeof LEARNING_STATES)[number]

/** A suggestion laid over a learning state; at most one per subject (#9 point 8). */
export type Recommendation = { source: 'system' | 'teacher' }

/** A skill of the unit's exercises (#9 point 10). `[]` until stoa-backend#58. */
export type KnowledgeSkill = { skillId: string; name: string; lit: boolean }

/** A nebula: one topic of the subject. */
export type Nebula = {
  topicId: string
  name: string
  order: number
}

export type ChapterSummary = {
  lessonCount: number
  lessonsDone: number
  nextLesson: { lessonId: string; title: string } | null
}

/** A star: one unit. Units with no active lesson are never sent. */
export type Star = {
  unitId: string
  name: string
  /** The topic this unit belongs to. */
  nebulaId: string
  order: number
  state: LearningState
  /** Completed active lessons / active lessons, 0..1. */
  progress: number
  /** Exercises not yet answered right, for "all lessons done but not lit". */
  unmetExercises: number
  /** Review cards due in this unit (#9 point 9). Does not change the state. */
  reviewDue: number
  recommendation: Recommendation | null
  /** Normalised position, [0, 1] each. */
  x: number
  y: number
  skills: KnowledgeSkill[]
  chapter: ChapterSummary
}

/** `from` must be lit before `to` opens (stoa-backend#56). Units, not topics. */
export type Prerequisite = { from: string; to: string }

export type StarMap = {
  subject: { subjectId: string; name: string }
  nebulae: Nebula[]
  stars: Star[]
  prerequisites: Prerequisite[]
  summary: { lit: number; total: number; streakDays: number; score: number }
  /** Every subject the student has, this one included, for the switcher (#72 point 7). */
  subjects: { subjectId: string; name: string; lit: number; total: number }[]
}

const byId = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)

/**
 * The keyboard and reading order (#11 point 5, kept by #72): by nebula first,
 * then by `(topic.order, unit.order)`, with the unit id breaking ties the way
 * the backend's recommendation key does (#9 point 8).
 */
export function compareStars(nebulaOrder: ReadonlyMap<string, number>) {
  return (a: Star, b: Star) =>
    (nebulaOrder.get(a.nebulaId) ?? Number.MAX_SAFE_INTEGER) - (nebulaOrder.get(b.nebulaId) ?? Number.MAX_SAFE_INTEGER) ||
    a.order - b.order ||
    byId(a.unitId, b.unitId)
}

export function nebulaOrderOf(map: Pick<StarMap, 'nebulae'>): Map<string, number> {
  return new Map(map.nebulae.map((nebula) => [nebula.topicId, nebula.order]))
}

/** Nebulae sorted by `topic.order`, then id. */
export function orderedNebulae(map: Pick<StarMap, 'nebulae'>): Nebula[] {
  return [...map.nebulae].sort((a, b) => a.order - b.order || byId(a.topicId, b.topicId))
}

/** Every star, in the keyboard and reading order. */
export function orderedStars(map: Pick<StarMap, 'nebulae' | 'stars'>): Star[] {
  return [...map.stars].sort(compareStars(nebulaOrderOf(map)))
}

export function litCount(stars: readonly Star[]): number {
  return stars.reduce((count, star) => count + (star.state === 'lit' ? 1 : 0), 0)
}

export function nebulaCounts(stars: readonly Star[], nebulaId: string): { lit: number; total: number } {
  let lit = 0
  let total = 0
  for (const star of stars) {
    if (star.nebulaId !== nebulaId) continue
    total += 1
    if (star.state === 'lit') lit += 1
  }
  return { lit, total }
}
