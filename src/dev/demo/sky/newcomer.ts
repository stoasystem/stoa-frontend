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
 * The profile ("About you", #591) steers it as the backend does: the subjects
 * ticked count as taken (stoa-backend#321), and with a year group the backend
 * can read, a subject's recommendation is the first star of that year in
 * course order, else of the latest year before it (stoa-backend#310, reason
 * `grade`). Only mathematics has years here (`DEMO_YEARS`): year 9 is the
 * demo knowledge point's, so a year-9 student lands on it; years 5 to 8 land
 * earlier in the course, 1 to 4 on its first chapter.
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
import { demoSchoolYear } from '@/dev/demo/data/student'
import { DEMO_KNOWLEDGE_POINT, localize } from '@/dev/demo/sky/demoSky'
import type { SupportedLanguage } from '@/i18n/languages'
import { orderedStars, subjectOfNebula, type Prerequisite, type Star, type StarMap } from '@/features/starmap/model/starMap'

/** What the profile says that the sky follows: the year group's code, and the subjects ticked. */
export type NewcomerProfile = { grade: string; primarySubjects: readonly string[] }

/**
 * The year of each mathematics nebula's stars, as the backend reads a star's
 * year from its practice sets (stoa-backend#310); the demo knowledge point is
 * year 9 (its `gradeLevel`), the rest of trigonometry year 8.
 */
const DEMO_YEARS: Readonly<Record<string, number>> = { numbers: 1, algebra: 5, geometry: 6, functions: 7, trigonometry: 8, probability: 10, statistics: 10 }

function demoStarYear(star: Star): number | null {
  if (star.unitId === DEMO_KNOWLEDGE_POINT.unitId) return Number(DEMO_KNOWLEDGE_POINT.gradeLevel)
  return DEMO_YEARS[star.nebulaId] ?? null
}

/** Rule 3 by year (stoa-backend#310): the first star of `year`, else the first of the latest year before it. */
function byYear(own: readonly Star[], year: number): Star | null {
  const years = own.map(demoStarYear)
  const at = own.find((_, index) => years[index] === year)
  if (at) return at
  const before = years.filter((each): each is number => each !== null && each < year)
  if (before.length === 0) return null
  const latest = Math.max(...before)
  return own.find((_, index) => years[index] === latest) ?? null
}

type Made = { stars: Star[]; prerequisites: Prerequisite[]; taken: ReadonlySet<string> }
const made = new WeakMap<Star[], WeakMap<Prerequisite[], Map<string, Made>>>()

function newcomerParts(map: StarMap, profile: NewcomerProfile | undefined): Made {
  const byPrerequisites = made.get(map.stars) ?? new WeakMap<Prerequisite[], Map<string, Made>>()
  made.set(map.stars, byPrerequisites)
  const byProfile = byPrerequisites.get(map.prerequisites) ?? new Map<string, Made>()
  byPrerequisites.set(map.prerequisites, byProfile)
  const profileKey = profile ? `${profile.grade}|${profile.primarySubjects.join(',')}` : ''
  const hit = byProfile.get(profileKey)
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

  // Taken: the demo sky's own, and the subjects ticked on the profile (stoa-backend#321).
  const ticked = new Set(profile?.primarySubjects ?? [])
  const taken = new Set(map.subjects.filter((galaxy) => galaxy.enrolled || ticked.has(galaxy.subjectId)).map((galaxy) => galaxy.subjectId))
  const year = profile ? demoSchoolYear(profile.grade) : null
  const picks = new Map<string, 'start' | 'grade'>()
  const ordered = orderedStars({ nebulae: map.nebulae, stars: fresh })
  for (const subjectId of taken) {
    const own = ordered.filter((star) => subjectOfNebula(map, star.nebulaId) === subjectId)
    const ofYear = year === null ? null : byYear(own, year)
    if (ofYear) {
      picks.set(ofYear.unitId, 'grade')
      continue
    }
    // Nothing is lit: the outer fringe is the stars with no prerequisite.
    const pick = own.find((star) => !waits.has(star.unitId))
    if (pick) picks.set(pick.unitId, 'start')
  }
  const stars = fresh.map((star) => {
    const reason = picks.get(star.unitId)
    return reason ? { ...star, recommendation: { source: 'system' as const, reason, relatedUnitId: null } } : star
  })

  const parts = { stars, prerequisites, taken }
  byProfile.set(profileKey, parts)
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
      !math.has(star.unitId)
        ? star
        : {
            ...star,
            recommendation:
              star.unitId === pick?.unitId ? { source: 'system' as const, reason: 'after_lit' as const, relatedUnitId: kp.unitId } : null,
          },
    )
  }
  known.set(key, stars)
  return stars
}

/** `map` for a student who has not started anything, but for the `completed` lessons of the demo knowledge point. */
export function asNewcomer(map: StarMap, completed: readonly string[] = [], language: SupportedLanguage = 'en', profile?: NewcomerProfile): StarMap {
  if (map.stars.length === 0) return map
  const parts = newcomerParts(map, profile)
  const stars = withProgress(map, parts, completed, language)
  const lit = stars === parts.stars ? 0 : stars.filter((star) => star.state === 'lit').length
  const inFocus = subjectOfNebula(map, DEMO_KNOWLEDGE_POINT.topicId) === map.subject.subjectId ? lit : 0
  return {
    ...map,
    stars,
    prerequisites: parts.prerequisites,
    summary: { ...map.summary, lit: inFocus, streakDays: 0, score: 0 },
    subjects: map.subjects.map((galaxy) => ({
      ...galaxy,
      lit: galaxy.subjectId === DEMO_KNOWLEDGE_POINT.subjectId ? lit : 0,
      enrolled: parts.taken.has(galaxy.subjectId),
    })),
  }
}
