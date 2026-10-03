/*
 * The design preview's side of the lighting moment (#51): the two seams the
 * app leaves open, filled from the demo backend (`demoSource.ts`).
 *
 *   - `demoLightingSource`: stoa-backend#71's unacknowledged lit points and
 *     their acknowledgement, kept by the demo backend (so a reload of the tab
 *     does not replay the celebration).
 *   - `demoStarMapOverride`: the star map follows the lessons completed on the
 *     page. The demo knowledge point's state is #116's
 *     `demoKnowledgePointState(completed)`; once it is lit, "Refraction" in
 *     physics, whose only unlit prerequisite it was, becomes ready to start,
 *     and the subject's recommendation moves on by the backend's rule (#9
 *     point 8: first in progress, else first ready, in order). It also
 *     carries the demo sky's prerequisites (#121), across subjects too, as
 *     the read model will: the connection lines are drawn from them. The
 *     app's own route leaves them out (no backend claim, #110); only this
 *     preview, like the bench's `&relations=fixture`, puts them in.
 *
 * `PreviewLighting` provides both around the app; with `longNames` (the
 * preview's `&longNames=1`) the override also gives the nebulae long names.
 */
import type { TFunction } from 'i18next'
import { useMemo, useSyncExternalStore, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { DEMO_BRIDGE_STAR, DEMO_KNOWLEDGE_POINT, demoKnowledgePointState, demoSky, localize } from '@/dev/demo/data'
import {
  acknowledgeLit,
  completedLessons,
  demoLanguage,
  demoServerVersion,
  onDemoServerChange,
  unacknowledgedLit,
} from '@/dev/preview/demoSource'
import type { FixtureSize } from '@/features/starmap/fixtures/demoSky'
import { LightingEventSourceContext, type LightingEventSource } from '@/features/starmap/lighting/lightingEvents'
import { StarMapOverrideContext } from '@/features/starmap/lighting/starMapOverride'
import { orderedStars, subjectOfNebula, type Nebula, type Star, type StarMap } from '@/features/starmap/model/starMap'

export const demoLightingSource: LightingEventSource = {
  unacknowledged: async () => unacknowledgedLit(),
  acknowledge: async (unitIds) => acknowledgeLit(unitIds),
  subscribe: onDemoServerChange,
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
  const next = remaining[0]
  const bridgeOpens = sky.prerequisites.filter((edge) => edge.to === DEMO_BRIDGE_STAR).every((edge) => isLit(edge.from))

  let stars: Star[] = map.stars.map((star) => {
    if (star.unitId === kp.unitId) {
      return {
        ...star,
        state,
        progress: (kp.lessons.length - remaining.length) / kp.lessons.length,
        unmetExercises: remaining.reduce((sum, lesson) => sum + lesson.exercises, 0),
        skills: state === 'lit' ? star.skills.map((skill) => ({ ...skill, lit: true })) : star.skills,
        chapter: {
          lessonCount: kp.lessons.length,
          lessonsDone: kp.lessons.length - remaining.length,
          nextLesson: next ? { lessonId: next.lessonId, title: localize(next.title, demoLanguage()) } : null,
        },
      }
    }
    if (star.unitId === DEMO_BRIDGE_STAR && star.state === 'locked' && bridgeOpens) return { ...star, state: 'ready' as const }
    return star
  })

  // A lit point is no longer what to learn next. The next pick is its own galaxy's: at most one
  // per subject (#9 point 8), so another galaxy's recommendation is never touched.
  if (hasPoint && state === 'lit' && stars.some((star) => star.unitId === kp.unitId && star.recommendation)) {
    const ordered = orderedStars({ ...map, stars }).filter((star) => subjectOfNebula(map, star.nebulaId) === kp.subjectId)
    const pick = ordered.find((star) => star.state === 'in_progress' && star.unitId !== kp.unitId) ?? ordered.find((star) => star.state === 'ready')
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
  // A new function when the demo backend changes, so the map is drawn again.
  const override = useMemo(() => {
    void version
    const completed = completedLessons()
    return (map: StarMap, size: FixtureSize) => {
      const followed = demoStarMapOverride(map, size, completed)
      return longNames ? withLongNebulaNames(followed, t) : followed
    }
  }, [version, longNames, t])
  return (
    <LightingEventSourceContext.Provider value={demoLightingSource}>
      <StarMapOverrideContext.Provider value={override}>{children}</StarMapOverrideContext.Provider>
    </LightingEventSourceContext.Provider>
  )
}
