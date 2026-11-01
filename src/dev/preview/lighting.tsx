/*
 * The design preview's side of the lighting moment (#51) and of the star
 * map's data (#131): the two seams the app leaves open, filled from the demo
 * backend (`demoSource.ts`) and the demo sky (`src/dev/demo/sky`).
 *
 *   - `demoLightingSource`: stoa-backend#71's unacknowledged lit points and
 *     their acknowledgement, kept by the demo backend (so a reload of the tab
 *     does not replay the celebration); known at once (`known`, #140), so
 *     the point is drawn in progress until the flare's brightest moment and
 *     its star's route opens on its nebula seen whole.
 *   - the star map source: the demo sky (`readDemoStarMap`), passed through
 *     `demoStarMapOverride`, so the star map follows the lessons completed on the
 *     page. The demo knowledge point's state is #116's
 *     `demoKnowledgePointState(completed)`; once it is lit, "Refraction" in
 *     physics, whose only unlit prerequisite it was, becomes ready to start,
 *     and the subject's recommendation moves on by the backend's rule (#9
 *     point 8: first in progress, else first ready, in order). It also
 *     carries the demo sky's prerequisites (#121), across subjects too, as
 *     the read model will: the connection lines are drawn from them. The
 *     application's own source has no sky at all (#131); only this preview,
 *     like the bench's `&relations=fixture`, puts the prerequisites in.
 *
 * `PreviewLighting` provides both around the app; with `longNames` (the
 * preview's `&longNames=1`) the source also gives the nebulae long names.
 */
import type { TFunction } from 'i18next'
import { useMemo, useSyncExternalStore, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { DEMO_BRIDGE_STAR, DEMO_KNOWLEDGE_POINT, demoKnowledgePointState, demoPracticeSets, demoSkillsAfter, demoSky, localize } from '@/dev/demo/data'
import {
  acknowledgeLit,
  completedLessons,
  demoLanguage,
  demoServerVersion,
  onDemoServerChange,
  unacknowledgedLit,
} from '@/dev/preview/demoSource'
import { readDemoStarMap } from '@/dev/demo/sky/source'
import { LightingEventSourceContext, type LightingEventSource } from '@/features/starmap/lighting/lightingEvents'
import { orderedStars, subjectOfNebula, type Nebula, type Star, type StarMap } from '@/features/starmap/model/starMap'
import { StarMapSourceContext, type FixtureSize, type StarMapSource } from '@/features/starmap/starMapSource'
import type { KnowledgeMapNeighbour, KnowledgeMapNeighbourhood, KnowledgeMapResponse } from '@/types/practice'

export const demoLightingSource: LightingEventSource = {
  unacknowledged: async () => unacknowledgedLit(),
  acknowledge: async (unitIds) => acknowledgeLit(unitIds),
  subscribe: onDemoServerChange,
  // The demo backend's state is at hand: the map draws the point in progress from its first frame (#140).
  known: () => unacknowledgedLit(),
}

/** `map` as the demo backend would send it after the lessons completed so far. */
export function demoStarMapOverride(map: StarMap, size: FixtureSize, completed: readonly string[] = completedLessons()): StarMap {
  const kp = DEMO_KNOWLEDGE_POINT
  const sky = demoSky(size)
  const fixtureState = sky.stars.find((star) => star.unitId === kp.unitId)?.state
  const state = demoKnowledgePointState(completed)
  const isLit = (unitId: string) => (unitId === kp.unitId ? state === 'lit' : sky.stars.find((star) => star.unitId === unitId)?.state === 'lit')
  const hasPoint = map.stars.some((star) => star.unitId === kp.unitId)
  const hasBridge = map.stars.some((star) => star.unitId === DEMO_BRIDGE_STAR)
  // The same array every time, so a new state keeps the engine's sky (it compares by identity).
  const prerequisites = map.prerequisites.length > 0 || map.stars.length === 0 ? map.prerequisites : sky.prerequisites
  if (!hasPoint && !hasBridge) return { ...map, prerequisites }

  const remaining = kp.lessons.filter((lesson) => !completed.includes(lesson.lessonId))
  const nameOf = (unitId: string) => map.stars.find((star) => star.unitId === unitId)?.name ?? unitId
  // The core first, then the extension practice sets (#501), as the backend's `nextLesson` does.
  const next = demoPracticeSets().find((lesson) => !completed.includes(lesson.lessonId))
  const bridgeOpens = sky.prerequisites.filter((edge) => edge.to === DEMO_BRIDGE_STAR).every((edge) => isLit(edge.from))

  let stars: Star[] = map.stars.map((star) => {
    if (star.unitId === kp.unitId) {
      return {
        ...star,
        state,
        progress: (kp.lessons.length - remaining.length) / kp.lessons.length,
        unmetExercises: remaining.reduce((sum, lesson) => sum + lesson.exercises, 0),
        // Each small star lights from its own practice sets (#501): the extension one on its own.
        skills: demoSkillsAfter(star.skills, completed, sky.extensionPrerequisite, nameOf),
        chapter: {
          lessonCount: kp.lessons.length,
          lessonsDone: kp.lessons.length - remaining.length,
          nextLesson: next ? { lessonId: next.lessonId, title: localize(next.title, demoLanguage()) } : null,
        },
      }
    }
    // Refraction stops waiting once the point it builds on is lit.
    if (star.unitId === DEMO_BRIDGE_STAR && bridgeOpens) return { ...star, unlitPrerequisiteIds: [] }
    return star
  })

  // A lit point is no longer what to learn next. The next pick is its own galaxy's: at most one
  // per subject (#9 point 8), so another galaxy's recommendation is never touched.
  if (hasPoint && state === 'lit' && stars.some((star) => star.unitId === kp.unitId && star.recommendation)) {
    const ordered = orderedStars({ ...map, stars }).filter((star) => subjectOfNebula(map, star.nebulaId) === kp.subjectId)
    const pick = ordered.find((star) => star.state === 'in_progress' && star.unitId !== kp.unitId) ?? ordered.find((star) => star.state === 'ready' && star.unlitPrerequisiteIds.length === 0)
    stars = stars.map((star) =>
      star.unitId === kp.unitId ? { ...star, recommendation: null } : star.unitId === pick?.unitId ? { ...star, recommendation: { source: 'system' } } : star,
    )
  }

  const delta = (state === 'lit' ? 1 : 0) - (fixtureState === 'lit' ? 1 : 0)
  // `summary` counts the galaxy in focus only; the map holds the whole sky (#119), so the point is
  // on every galaxy's map but counts only on its own.
  const inFocus = hasPoint && map.subject.subjectId === kp.subjectId
  return {
    ...map,
    stars,
    prerequisites,
    summary: inFocus ? { ...map.summary, lit: map.summary.lit + delta } : map.summary,
    subjects: map.subjects.map((subject) => (subject.subjectId === kp.subjectId ? { ...subject, lit: subject.lit + delta } : subject)),
  }
}

/**
 * `GET /practice/knowledge-map` as the demo backend answers it: the sky of
 * `size` stars after the lessons completed so far, as the star map is drawn.
 * The map takes its sky through the source seam; the chapter reads this one
 * for what the sky says of its knowledge point, its small stars among it (#501).
 * Asked for the skeleton (#503), every star comes without its small stars.
 */
export function demoKnowledgeMap(size: FixtureSize, view: 'full' | 'skeleton' = 'full'): KnowledgeMapResponse {
  const sky = demoFollowedSky(size)
  if (view === 'full') return sky
  return { ...sky, view: 'skeleton', stars: sky.stars.map((star) => ({ ...star, skills: [] })) }
}

/** How many stars of a nebula on each side of the one in focus come with it, and the most one answer sends. */
const NEIGHBOURS_EACH_SIDE = 2
const MAX_NEIGHBOURHOOD = 15

/**
 * `GET /practice/knowledge-map/stars` as the demo backend answers it (#503):
 * the star `around` (else the demo knowledge point, where the demo student
 * last practised) in full, with its prerequisites, the stars that need it and
 * its neighbours in its nebula, as stoa-backend's `neighbourhood` picks them.
 * Only the demo knowledge point has practice sets.
 */
export function demoKnowledgeStars(size: FixtureSize, around: string | null): KnowledgeMapNeighbourhood {
  const sky = demoFollowedSky(size)
  const kp = DEMO_KNOWLEDGE_POINT
  const byId = new Map(sky.stars.map((star) => [star.unitId, star]))
  const focus = around && byId.has(around) ? around : kp.unitId
  if (!byId.has(focus)) return { subjectId: kp.subjectId, focus: null, stars: [] }
  const picked = new Map<string, KnowledgeMapNeighbour['relation']>([[focus, 'focus']])
  const add = (unitId: string, relation: KnowledgeMapNeighbour['relation']) => {
    if (byId.has(unitId) && !picked.has(unitId) && picked.size < MAX_NEIGHBOURHOOD) picked.set(unitId, relation)
  }
  const needs = (unitId: string) => sky.prerequisites.filter((edge) => edge.to === unitId).map((edge) => edge.from)
  for (const unitId of needs(focus)) add(unitId, 'prerequisite')
  for (const edge of sky.prerequisites) if (edge.from === focus) add(edge.to, 'next')
  const nebula = sky.stars.filter((star) => star.nebulaId === byId.get(focus)!.nebulaId).sort((a, b) => a.order - b.order)
  const at = nebula.findIndex((star) => star.unitId === focus)
  for (const star of nebula.slice(Math.max(0, at - NEIGHBOURS_EACH_SIDE), at + NEIGHBOURS_EACH_SIDE + 1)) add(star.unitId, 'neighbour')

  const completed = completedLessons()
  const language = demoLanguage()
  const practiceSets = demoPracticeSets().map((lesson, index) => ({
    lessonId: lesson.lessonId,
    title: localize(lesson.title, language),
    order: index + 1,
    exerciseCount: lesson.exercises,
    skillId: lesson.skillId,
    status: completed.includes(lesson.lessonId) ? ('completed' as const) : ('available' as const),
    ...(kp.extensionLessons.some((extension) => extension.lessonId === lesson.lessonId) ? { extension: true } : {}),
  }))
  return {
    subjectId: kp.subjectId,
    focus,
    stars: [...picked].map(([unitId, relation]) => ({
      ...byId.get(unitId)!,
      relation,
      prerequisiteUnitIds: needs(unitId),
      practiceSets: unitId === kp.unitId ? practiceSets : [],
    })),
  }
}

/** The whole sky as the demo backend has it after the lessons completed so far, small stars included. */
function demoFollowedSky(size: FixtureSize): KnowledgeMapResponse {
  const sky = demoSky(size, demoLanguage())
  const subjectId = DEMO_KNOWLEDGE_POINT.subjectId
  const map = demoStarMapOverride(
    {
      subject: { subjectId, name: sky.galaxies.find((galaxy) => galaxy.subjectId === subjectId)?.name ?? subjectId },
      nebulae: sky.nebulae,
      stars: sky.stars,
      prerequisites: sky.prerequisites,
      summary: sky.summary,
      subjects: sky.galaxies,
    },
    size,
  )
  return { subjectId, galaxies: map.subjects, nebulae: sky.nebulae, stars: map.stars, prerequisites: map.prerequisites, summary: map.summary }
}

const longNebulae = new WeakMap<Nebula[], { t: TFunction<'starmap'>; nebulae: Nebula[] }>()

/**
 * The map with long nebula names, to check labels in four languages: what
 * the bench's `&longNames=1` gives the route by its `longNames` prop, which
 * the app's routes do not pass. The same names `demoStarMap` makes, in the
 * same array for the same sky and language, so the engine keeps its tiles.
 */
export function withLongNebulaNames(map: StarMap, t: TFunction<'starmap'>): StarMap {
  const known = longNebulae.get(map.nebulae)
  if (known?.t === t) return { ...map, nebulae: known.nebulae }
  const nebulae = map.nebulae.map((nebula) => ({ ...nebula, name: t('demo.longNebula', { index: nebula.order }) }))
  longNebulae.set(map.nebulae, { t, nebulae })
  return { ...map, nebulae }
}

export function PreviewLighting({ children, longNames = false }: { children: ReactNode; longNames?: boolean }) {
  const version = useSyncExternalStore(onDemoServerChange, demoServerVersion)
  const { t } = useTranslation('starmap')
  // A new source when the demo backend changes, so the map is drawn again.
  const source = useMemo<StarMapSource>(() => {
    void version
    const completed = completedLessons()
    return {
      demo: true,
      read: (request) => {
        const followed = demoStarMapOverride(readDemoStarMap(request), request.size, completed)
        return longNames ? withLongNebulaNames(followed, t) : followed
      },
    }
  }, [version, longNames, t])
  return (
    <LightingEventSourceContext.Provider value={demoLightingSource}>
      <StarMapSourceContext.Provider value={source}>{children}</StarMapSourceContext.Provider>
    </LightingEventSourceContext.Provider>
  )
}
