/*
 * The star cluster prototype's sky (`src/dev/clusters.html`): the real
 * mathematics knowledge base (`mathKnowledgeBase.ts`) as a `StarMap`, shaped
 * like `GET /practice/knowledge-map` so the prototype could read the backend
 * as it is. Dev only (#131).
 *
 * The learning state is made up, and the same every time: in each cluster the
 * first few stars along its route are lit (a prefix of the route, so nothing
 * is lit before its in-cluster prerequisites), the next one is in progress and
 * the rest are ready -- drawn as waiting where a prerequisite is not lit yet.
 * The system recommends the star in progress in Numbers and operations.
 */
import { clustersOf } from '@/features/starmap/route/clusters'
import type { Nebula, Star, StarMap } from '@/features/starmap/model/starMap'
import type { SupportedLanguage } from '@/i18n/languages'
import { MATH_KNOWLEDGE_BASE } from '@/dev/demo/clusters/mathKnowledgeBase'

export const DEMO_CLUSTER_SUBJECT = 'math'

const NEBULA_NAMES: Record<string, Record<SupportedLanguage, string>> = {
  zahlen: { de: 'Zahlen', en: 'Numbers', fr: 'Nombres', it: 'Numeri' },
  brueche: { de: 'Brüche', en: 'Fractions', fr: 'Fractions', it: 'Frazioni' },
  prozentrechnung: { de: 'Prozentrechnung', en: 'Percentages', fr: 'Pourcentages', it: 'Percentuali' },
  geometrie: { de: 'Geometrie', en: 'Geometry', fr: 'Géométrie', it: 'Geometria' },
  groessen: { de: 'Grössen und Masse', en: 'Quantities and measures', fr: 'Grandeurs et mesures', it: 'Grandezze e misure' },
  gleichungen: { de: 'Gleichungen', en: 'Equations', fr: 'Équations', it: 'Equazioni' },
  daten: { de: 'Daten', en: 'Data', fr: 'Données', it: 'Dati' },
}

const SUBJECT_NAMES: Record<SupportedLanguage, string> = { de: 'Mathematik', en: 'Mathematics', fr: 'Mathématiques', it: 'Matematica' }

/** How many stars are lit at the start of each cluster's route. */
const LIT_PER_CLUSTER: Record<string, number> = { numbers: 7, geometry: 5, algebra: 3, data: 2 }
const RECOMMENDED_IN = 'numbers'

export function demoClusterMap(language: SupportedLanguage): StarMap {
  const topics = Object.keys(NEBULA_NAMES)
  const nebulae: Nebula[] = topics.map((topicId, i) => ({ topicId, name: NEBULA_NAMES[topicId][language], order: i + 1, subjectId: DEMO_CLUSTER_SUBJECT }))
  const prerequisites = MATH_KNOWLEDGE_BASE.flatMap((s) => s.prerequisites.map((from) => ({ from, to: s.unitId })))
  const bare: Star[] = MATH_KNOWLEDGE_BASE.map((s) => ({
    unitId: s.unitId,
    name: s.titles[language],
    nebulaId: s.topicId,
    order: s.order,
    state: 'ready',
    progress: 0,
    unmetExercises: 0,
    reviewDue: 0,
    recommendation: null,
    x: 0.5,
    y: 0.5,
    skills: [],
    chapter: { lessonCount: 3, lessonsDone: 0, nextLesson: null },
    unlitPrerequisiteIds: [],
  }))
  const subject = { subjectId: DEMO_CLUSTER_SUBJECT, name: SUBJECT_NAMES[language] }

  // The route does not depend on the state, so the bare sky gives each cluster's route order.
  const state = new Map<string, Star['state']>()
  let recommended: string | null = null
  for (const cluster of clustersOf({ subject, nebulae, stars: bare, prerequisites }, language)) {
    const lit = LIT_PER_CLUSTER[cluster.clusterId] ?? 1
    cluster.stars.forEach((star, i) => {
      if (i < lit) state.set(star.unitId, 'lit')
      else if (i === lit) {
        state.set(star.unitId, 'in_progress')
        if (cluster.clusterId === RECOMMENDED_IN) recommended = star.unitId
      }
    })
  }

  const stars = bare.map((star): Star => {
    const s = state.get(star.unitId) ?? 'ready'
    const unlit = s === 'lit' ? [] : MATH_KNOWLEDGE_BASE.find((k) => k.unitId === star.unitId)!.prerequisites.filter((p) => state.get(p) !== 'lit')
    return {
      ...star,
      state: s,
      progress: s === 'lit' ? 1 : s === 'in_progress' ? 1 / 3 : 0,
      chapter: { lessonCount: 3, lessonsDone: s === 'lit' ? 3 : s === 'in_progress' ? 1 : 0, nextLesson: null },
      recommendation: star.unitId === recommended ? { source: 'system', reason: 'in_progress' } : null,
      unlitPrerequisiteIds: unlit,
    }
  })
  const litCount = stars.filter((s) => s.state === 'lit').length

  return {
    subject,
    nebulae,
    stars,
    prerequisites,
    summary: { lit: litCount, total: stars.length, streakDays: 4, score: 1280 },
    subjects: [{ subjectId: DEMO_CLUSTER_SUBJECT, name: subject.name, lit: litCount, total: stars.length, enrolled: true }],
  }
}
