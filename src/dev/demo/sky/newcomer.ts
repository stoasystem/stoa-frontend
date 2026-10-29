/*
 * The newcomer's sky (plan A of docs/research/user-onboarding-design.md): the
 * demo sky as it is for a student who has not started anything. Same
 * galaxies, nebulae, stars and places; no evidence at all.
 *
 *   - Nothing lit, nothing in progress, no skill lit, nothing due for review.
 *   - Every star is ready to start: prerequisites do not lock a knowledge
 *     point (ADR 0004). A star with a prerequisite not yet lit only carries
 *     that as a hint, which this read model does not draw yet (#484).
 *   - Each subject the student takes is recommended by #474's rule (CONTEXT.md,
 *     "Recommendation"): with nothing lit, the first star of the outer fringe
 *     (not lit, its prerequisites all lit or none) in course order -- in
 *     mathematics "Integers", not the demo knowledge point the demo sky
 *     recommends on purpose. That star is a placeholder: it has no chapter,
 *     so the walk-through stops at the first landing.
 *
 * The demo knowledge point follows the lessons completed on the page (the
 * demo backend's state, which `startAsNewcomer` empties): in progress after
 * the first, lit after the last. Once it is lit, mathematics' recommendation
 * follows it (#474): its successors in the outer fringe first, else the next
 * fringe star after it in course order.
 *
 * Arrays are kept per input, so the same map gives the same sky (the engine
 * compares by identity).
 */
import { demoKnowledgePointState } from '@/dev/demo/data'
import { DEMO_KNOWLEDGE_POINT, localize } from '@/dev/demo/sky/demoSky'
import type { SupportedLanguage } from '@/i18n/languages'
import { orderedStars, subjectOfNebula, type Prerequisite, type Star, type StarMap } from '@/features/starmap/model/starMap'

type Made = { stars: Star[]; prerequisites: Prerequisite[] }
const made = new WeakMap<Star[], WeakMap<Prerequisite[], Made>>()

function newcomerParts(map: StarMap): Made {
  const byPrerequisites = made.get(map.stars) ?? new WeakMap<Prerequisite[], Made>()
  made.set(map.stars, byPrerequisites)
  const hit = byPrerequisites.get(map.prerequisites)
  if (hit) return hit

  const kp = DEMO_KNOWLEDGE_POINT.unitId
  const prerequisites = map.prerequisites
  const waits = new Set(prerequisites.map((edge) => edge.to))
  const fresh: Star[] = map.stars.map((star) => ({
    ...star,
    state: 'ready',
    progress: 0,
    unmetExercises: star.unitId === kp ? DEMO_KNOWLEDGE_POINT.lessons.reduce((sum, lesson) => sum + lesson.exercises, 0) : 0,
    reviewDue: 0,
    recommendation: null,
    skills: star.skills.map((skill) => ({ ...skill, lit: false })),
    chapter: { ...star.chapter, lessonsDone: 0 },
  }))

  const taken = new Set(map.subjects.filter((galaxy) => galaxy.enrolled).map((galaxy) => galaxy.subjectId))
  const picks = new Set<string>()
  const ordered = orderedStars({ nebulae: map.nebulae, stars: fresh })
  for (const subjectId of taken) {
    const own = ordered.filter((star) => subjectOfNebula(map, star.nebulaId) === subjectId)
    // Nothing is lit: the outer fringe is the stars with no prerequisite.
    const pick = own.find((star) => !waits.has(star.unitId))
    if (pick) picks.add(pick.unitId)
  }
  const stars = fresh.map((star) => (picks.has(star.unitId) ? { ...star, recommendation: { source: 'system' as const } } : star))

  const parts = { stars, prerequisites }
  byPrerequisites.set(map.prerequisites, parts)
  return parts
}

const progressed = new WeakMap<Star[], Map<string, Star[]>>()

/** The newcomer's stars after `completed` lessons of the demo knowledge point, the same array for the same lessons. */
function withProgress(map: StarMap, parts: Made, completed: readonly string[], language: SupportedLanguage): Star[] {
  const kp = DEMO_KNOWLEDGE_POINT
  const done = kp.lessons.filter((lesson) => completed.includes(lesson.lessonId))
  if (done.length === 0) return parts.stars
  const key = `${language}:${done.map((lesson) => lesson.lessonId).join(',')}`
  const known = progressed.get(parts.stars) ?? new Map<string, Star[]>()
  progressed.set(parts.stars, known)
  const hit = known.get(key)
  if (hit) return hit

  const state = demoKnowledgePointState(completed)
  const remaining = kp.lessons.filter((lesson) => !completed.includes(lesson.lessonId))
  let stars = parts.stars.map((star) =>
    star.unitId !== kp.unitId
      ? star
      : {
          ...star,
          state,
          progress: done.length / kp.lessons.length,
          unmetExercises: remaining.reduce((sum, lesson) => sum + lesson.exercises, 0),
          skills: star.skills.map((skill) => ({ ...skill, lit: state === 'lit' })),
          chapter: {
            lessonCount: kp.lessons.length,
            lessonsDone: done.length,
            nextLesson: remaining[0] ? { lessonId: remaining[0].lessonId, title: localize(remaining[0].title, language) } : null,
          },
        },
  )
  if (state === 'lit') {
    // #474: no star in progress, so the recommendation follows the star just lit. The outer fringe:
    // not lit, every prerequisite lit (the demo knowledge point is the only lit star).
    const into = new Map<string, string[]>()
    for (const edge of parts.prerequisites) into.set(edge.to, [...(into.get(edge.to) ?? []), edge.from])
    const inFringe = (star: Star) => star.state !== 'lit' && (into.get(star.unitId) ?? []).every((from) => from === kp.unitId)
    const own = orderedStars({ nebulae: map.nebulae, stars }).filter((star) => subjectOfNebula(map, star.nebulaId) === kp.subjectId)
    const after = own.findIndex((star) => star.unitId === kp.unitId)
    const successors = own.filter((star) => inFringe(star) && (into.get(star.unitId) ?? []).includes(kp.unitId))
    const onward = [...own.slice(after + 1), ...own.slice(0, after)].find(inFringe)
    const pick = successors[0] ?? onward
    // At most one per subject: mathematics' recommendation moves, wherever it was.
    const math = new Set(own.map((star) => star.unitId))
    stars = stars.map((star) =>
      !math.has(star.unitId) ? star : { ...star, recommendation: star.unitId === pick?.unitId ? { source: 'system' as const } : null },
    )
  }
  known.set(key, stars)
  return stars
}

/** `map` for a student who has not started anything, but for the `completed` lessons of the demo knowledge point. */
export function asNewcomer(map: StarMap, completed: readonly string[] = [], language: SupportedLanguage = 'en'): StarMap {
  if (map.stars.length === 0) return map
  const parts = newcomerParts(map)
  const stars = withProgress(map, parts, completed, language)
  const lit = stars === parts.stars ? 0 : stars.filter((star) => star.state === 'lit').length
  const inFocus = subjectOfNebula(map, DEMO_KNOWLEDGE_POINT.topicId) === map.subject.subjectId ? lit : 0
  return {
    ...map,
    stars,
    prerequisites: parts.prerequisites,
    summary: { ...map.summary, lit: inFocus, streakDays: 0, score: 0 },
    subjects: map.subjects.map((galaxy) => ({ ...galaxy, lit: galaxy.subjectId === DEMO_KNOWLEDGE_POINT.subjectId ? lit : 0 })),
  }
}
