/*
 * The newcomer's sky (plan A of docs/research/user-onboarding-design.md): the
 * demo sky as it is for a student who has not started anything. Same
 * galaxies, nebulae, stars and places; no evidence at all.
 *
 *   - Nothing lit, nothing in progress, no skill lit, nothing due for review.
 *   - With nothing lit, a star is ready only if it has no prerequisite at
 *     all (CONTEXT.md); every other star is locked.
 *   - Every subject the student takes is recommended by the backend's rule
 *     (#9 point 8): its first ready star in course order, which is where the
 *     course starts -- in mathematics "Integers", not the demo knowledge point
 *     the demo sky recommends on purpose (sine and cosine is no first star).
 *     That star is a placeholder: it has no chapter, so the walk-through stops
 *     at the first landing.
 *
 * The demo knowledge point follows the lessons completed on the page (the
 * demo backend's state, which `startAsNewcomer` empties): in progress after
 * the first, lit after the last. Once it is lit, the stars that waited only
 * for it are ready, and mathematics' recommendation moves on by the
 * backend's rule.
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
    state: waits.has(star.unitId) ? 'locked' : 'ready',
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
    const pick = own.find((star) => star.state === 'ready')
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
    const lit = new Set([kp.unitId])
    const into = new Map<string, string[]>()
    for (const edge of parts.prerequisites) into.set(edge.to, [...(into.get(edge.to) ?? []), edge.from])
    stars = stars.map((star) => (star.state === 'locked' && (into.get(star.unitId) ?? []).every((from) => lit.has(from)) ? { ...star, state: 'ready' as const } : star))
    // A lit point is no longer what to learn next: its subject's recommendation moves on (#9 point 8).
    const own = orderedStars({ nebulae: map.nebulae, stars }).filter((star) => subjectOfNebula(map, star.nebulaId) === kp.subjectId)
    const pick = own.find((star) => star.state === 'in_progress') ?? own.find((star) => star.state === 'ready')
    stars = stars.map((star) =>
      star.unitId === kp.unitId ? { ...star, recommendation: null } : star.unitId === pick?.unitId ? { ...star, recommendation: { source: 'system' as const } } : star,
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
