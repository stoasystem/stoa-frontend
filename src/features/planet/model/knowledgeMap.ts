/*
 * The planet's read model, shaped like the response of
 * `GET /practice/knowledge-map?subjectId=` (stoasystem/stoa-backend#59).
 *
 * Terms (CONTEXT.md, #9): a planet is a subject, a region is a topic, a
 * knowledge point is a unit. The backend decides every learning state and
 * marker; the planet only draws them.
 *
 * Until #59 ships, the planet renders fixtures of this shape (#47). Three
 * things here are this front end's reading of the contract and are to be
 * confirmed when #48 wires the endpoint in:
 *   - the state strings (`lit`, `in_progress`, `ready`, `locked`);
 *   - `order` on regions and points, which the keyboard order needs (#11 point 5);
 *   - one `name` per region / point, already in the reader's language.
 */

/** The four learning states, in priority order (#9 point 7). */
export const LEARNING_STATES = ['lit', 'in_progress', 'ready', 'locked'] as const
export type LearningState = (typeof LEARNING_STATES)[number]

/** A suggestion laid over a learning state; at most one per subject (#9 point 8). */
export type Recommendation = { source: 'system' | 'teacher' }

/** A skill of the unit's exercises (#9 point 10). `[]` until stoa-backend#58. */
export type KnowledgeSkill = { skillId: string; name: string; lit: boolean }

/** A region: one topic of the subject, a continent on the planet. */
export type KnowledgeRegion = {
  topicId: string
  name: string
  order: number
  /** The region's centre, laid out offline (stoa-backend#60). Degrees. */
  lat: number
  lng: number
}

export type ChapterSummary = {
  lessonCount: number
  lessonsDone: number
  nextLesson: { lessonId: string; title: string } | null
}

/** A knowledge point: one unit. Units with no active lesson are never sent. */
export type KnowledgePoint = {
  unitId: string
  name: string
  /** The topic this unit belongs to. */
  regionId: string
  order: number
  state: LearningState
  /** Completed active lessons / active lessons, 0..1. */
  progress: number
  /** Exercises not yet answered right, for "all lessons done but not lit". */
  unmetExercises: number
  /** Review cards due in this unit (#9 point 9). Does not change the state. */
  reviewDue: number
  recommendation: Recommendation | null
  lat: number
  lng: number
  skills: KnowledgeSkill[]
  chapter: ChapterSummary
}

/** `from` must be lit before `to` opens (stoa-backend#56). */
export type KnowledgeEdge = { from: string; to: string }

export type KnowledgeMap = {
  subject: { subjectId: string; name: string }
  regions: KnowledgeRegion[]
  points: KnowledgePoint[]
  edges: KnowledgeEdge[]
  summary: { lit: number; total: number; streakDays: number; score: number }
  /** The student's other subjects, drawn as smaller planets nearby (#48). */
  planets: { subjectId: string; name: string; lit: number; total: number }[]
}

/**
 * The keyboard and reading order (#11 point 5): by region first, then by
 * `(topic.order, unit.order)`, with the unit id breaking ties the way the
 * backend's recommendation key does (#9 point 8).
 */
export function comparePoints(regionOrder: ReadonlyMap<string, number>) {
  return (a: KnowledgePoint, b: KnowledgePoint) =>
    (regionOrder.get(a.regionId) ?? Number.MAX_SAFE_INTEGER) - (regionOrder.get(b.regionId) ?? Number.MAX_SAFE_INTEGER) ||
    a.order - b.order ||
    (a.unitId < b.unitId ? -1 : a.unitId > b.unitId ? 1 : 0)
}

export function regionOrderOf(map: Pick<KnowledgeMap, 'regions'>): Map<string, number> {
  return new Map(map.regions.map((region) => [region.topicId, region.order]))
}

/** Regions sorted by `topic.order`, then id. */
export function orderedRegions(map: Pick<KnowledgeMap, 'regions'>): KnowledgeRegion[] {
  return [...map.regions].sort(
    (a, b) => a.order - b.order || (a.topicId < b.topicId ? -1 : a.topicId > b.topicId ? 1 : 0),
  )
}

/** Every point, in the keyboard and reading order. */
export function orderedPoints(map: Pick<KnowledgeMap, 'regions' | 'points'>): KnowledgePoint[] {
  return [...map.points].sort(comparePoints(regionOrderOf(map)))
}

export function litCount(points: readonly KnowledgePoint[]): number {
  return points.reduce((count, point) => count + (point.state === 'lit' ? 1 : 0), 0)
}
