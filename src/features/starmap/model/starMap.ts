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
 *
 * One sky (ADR 0001, #117): the star map is one sky holding every subject.
 * A subject is drawn as a galaxy (`Galaxy`), its topics as that galaxy's
 * nebulae, and a prerequisite may cross subjects -- unit ids are global, so a
 * cross-subject prerequisite is an ordinary `Prerequisite` whose two stars
 * sit in different galaxies. `Sky` is that whole picture; `StarMap` is still
 * one galaxy's view, which the renderer draws until #119. The backend read
 * model (stoa-backend#59) answers per subject today; how it will answer for
 * the whole sky is settled in #3, so `Sky` is this front end's reading too.
 *
 * Only knowledge points are `Star`s. Star dust (星尘, `render/galaxy.ts`) is
 * decoration painted from a seed: it has no id, no learning state, is never
 * a click target and is never in `stars`. The design preview's placeholder
 * stars (占位星) are `Star`s in shape only; `fixtures/demoSky.ts` says which
 * one star is the demo knowledge point and that all others are placeholders.
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

/**
 * A galaxy: one subject of the sky (ADR 0001), with its lit count.
 * `enrolled` is false for a subject the student does not take: it is still
 * in the sky, drawn dimmed (#117 C4), and has no student evidence.
 */
export type Galaxy = {
  subjectId: string
  name: string
  lit: number
  total: number
  enrolled: boolean
}

export type StarMap = {
  subject: { subjectId: string; name: string }
  nebulae: Nebula[]
  stars: Star[]
  prerequisites: Prerequisite[]
  summary: { lit: number; total: number; streakDays: number; score: number }
  /** Every subject in the sky, this one included, for the switcher (#72 point 7). */
  subjects: Galaxy[]
}

/** A nebula of the sky, which names the galaxy (subject) it belongs to. */
export type SkyNebula = Nebula & { subjectId: string }

/**
 * The whole sky: every galaxy, every nebula and star, and every
 * prerequisite, those across subjects included.
 */
export type Sky = {
  galaxies: Galaxy[]
  nebulae: SkyNebula[]
  stars: Star[]
  prerequisites: Prerequisite[]
  summary: { lit: number; total: number; streakDays: number; score: number }
}

/** The prerequisites whose two stars are in different galaxies. */
export function crossSubjectPrerequisites(sky: Pick<Sky, 'nebulae' | 'stars' | 'prerequisites'>): Prerequisite[] {
  const subjectOf = new Map(sky.nebulae.map((nebula) => [nebula.topicId, nebula.subjectId]))
  const galaxyOf = new Map(sky.stars.map((star) => [star.unitId, subjectOf.get(star.nebulaId)]))
  return sky.prerequisites.filter(({ from, to }) => {
    const a = galaxyOf.get(from)
    const b = galaxyOf.get(to)
    return a !== undefined && b !== undefined && a !== b
  })
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
