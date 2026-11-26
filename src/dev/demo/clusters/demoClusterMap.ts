/*
 * The knowledge base's subjects as the demo backend sends them (#747): the
 * real knowledge base (`knowledgeBase.ts`) -- mathematics, physics, German and
 * English -- as `StarMap`s shaped like `GET /practice/knowledge-map`, so the
 * design preview draws the production star map: the read model's `placed()`
 * gathers each subject into the star clusters of `route/clusters.ts`. Dev only
 * (#131).
 *
 * The learning state is made up, and the same every time: in each cluster the
 * first few stars along its route are lit (a prefix of the route, so nothing
 * is lit before its in-cluster prerequisites), the next one is in progress and
 * the rest are ready -- drawn as waiting where a prerequisite is not lit yet.
 * Every sixth star lit has review cards due, as in the demo sky (#593).
 * `demoClusterMap` recommends the star in progress in each subject's first
 * cluster; the demo backend's sky (`withKnowledgeBase`) recommends the demo
 * knowledge point in mathematics instead.
 */
import { clustersOf } from '@/features/starmap/route/clusters'
import type { Galaxy, Nebula, Prerequisite, Sky, SkyNebula, Star, StarMap } from '@/features/starmap/model/starMap'
import type { SupportedLanguage } from '@/i18n/languages'
import { KNOWLEDGE_BASE, KNOWLEDGE_BASE_TOPICS, type KnowledgeBaseStar, type KnowledgeBaseSubject } from '@/dev/demo/clusters/knowledgeBase'
import { DEMO_BRIDGE_STAR, DEMO_KNOWLEDGE_POINT } from '@/dev/demo/sky/demoSky'

type Names = Record<SupportedLanguage, string>

/** The preview's subject ids (short, as the demo sky has them), and the knowledge base's. */
export const DEMO_KNOWLEDGE_BASE_SUBJECTS = { math: 'mathematics', physics: 'physics', german: 'german', english: 'english' } as const satisfies Record<
  string,
  KnowledgeBaseSubject
>
export type DemoClusterSubject = keyof typeof DEMO_KNOWLEDGE_BASE_SUBJECTS

export const DEMO_CLUSTER_SUBJECT: DemoClusterSubject = 'math'

/** Mathematics' nebulae are older than the knowledge base, named here; the others' come with it. */
const MATH_NEBULA_NAMES: Record<string, Names> = {
  zahlen: { de: 'Zahlen', en: 'Numbers', fr: 'Nombres', it: 'Numeri' },
  brueche: { de: 'Brüche', en: 'Fractions', fr: 'Fractions', it: 'Frazioni' },
  prozentrechnung: { de: 'Prozentrechnung', en: 'Percentages', fr: 'Pourcentages', it: 'Percentuali' },
  geometrie: { de: 'Geometrie', en: 'Geometry', fr: 'Géométrie', it: 'Geometria' },
  groessen: { de: 'Grössen und Masse', en: 'Quantities and measures', fr: 'Grandeurs et mesures', it: 'Grandezze e misure' },
  gleichungen: { de: 'Gleichungen', en: 'Equations', fr: 'Équations', it: 'Equazioni' },
  daten: { de: 'Daten', en: 'Data', fr: 'Données', it: 'Dati' },
}

const SUBJECT_NAMES: Record<DemoClusterSubject, Names> = {
  math: { de: 'Mathematik', en: 'Mathematics', fr: 'Mathématiques', it: 'Matematica' },
  physics: { de: 'Physik', en: 'Physics', fr: 'Physique', it: 'Fisica' },
  german: { de: 'Deutsch', en: 'German', fr: 'Allemand', it: 'Tedesco' },
  english: { de: 'Englisch', en: 'English', fr: 'Anglais', it: 'Inglese' },
}

/** How many stars are lit at the start of each cluster's route. */
const LIT_PER_CLUSTER: Record<string, number> = {
  numbers: 7,
  geometry: 5,
  algebra: 3,
  data: 2,
  'physics-mechanics': 6,
  'physics-electricity': 3,
  // Up to light's propagation, which Refraction (the demo sky's bridge star) builds on.
  'physics-waves': 2,
  'german-words': 5,
  'german-sentences': 4,
  'german-reading': 3,
  'german-language': 2,
  'english-grammar': 5,
  'english-me': 8,
  'english-out': 4,
  'english-world': 2,
}
/** The cluster whose star in progress is the subject's recommendation. */
const RECOMMENDED_IN: Record<DemoClusterSubject, string> = { math: 'numbers', physics: 'physics-mechanics', german: 'german-words', english: 'english-me' }

/** The knowledge base's stars of one subject. */
export function knowledgeBaseOf(subject: DemoClusterSubject): KnowledgeBaseStar[] {
  return KNOWLEDGE_BASE.filter((star) => star.subjectId === DEMO_KNOWLEDGE_BASE_SUBJECTS[subject])
}

/**
 * A subject's nebulae in the backend's order: mathematics' as listed above,
 * the others' as the knowledge base numbers them. The clusters still come in
 * the cluster table's order (`clustersOf`), as in production.
 */
function nebulaeOf(subject: DemoClusterSubject, language: SupportedLanguage): Nebula[] {
  const topics = [...new Set(knowledgeBaseOf(subject).map((star) => star.topicId))]
  const backendOrder = [...Object.keys(MATH_NEBULA_NAMES), ...KNOWLEDGE_BASE_TOPICS.map((t) => t.topicId)]
  const place = (topicId: string) => KNOWLEDGE_BASE_TOPICS.find((t) => t.topicId === topicId)?.order ?? backendOrder.indexOf(topicId) + 1
  const ordered = topics.sort((a, b) => place(a) - place(b) || (a < b ? -1 : 1))
  const names = (topicId: string): Names => MATH_NEBULA_NAMES[topicId] ?? KNOWLEDGE_BASE_TOPICS.find((t) => t.topicId === topicId)?.titles ?? { de: topicId, en: topicId, fr: topicId, it: topicId }
  return ordered.map((topicId, i) => ({ topicId, name: names(topicId)[language], order: i + 1, subjectId: subject }))
}

export function demoClusterMap(language: SupportedLanguage, subject: DemoClusterSubject = DEMO_CLUSTER_SUBJECT): StarMap {
  const base = knowledgeBaseOf(subject)
  const nebulae = nebulaeOf(subject, language)
  const prerequisites = base.flatMap((s) => s.prerequisites.map((from) => ({ from, to: s.unitId })))
  const bare: Star[] = base.map((s) => ({
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
  const subjectRef = { subjectId: subject, name: SUBJECT_NAMES[subject][language] }

  // The route does not depend on the state, so the bare sky gives each cluster's route order.
  const state = new Map<string, Star['state']>()
  // Review cards due on every sixth star lit, as the demo sky has them (#593).
  const reviewDue = new Map<string, number>()
  let litSeen = 0
  let recommended: string | null = null
  for (const cluster of clustersOf({ subject: subjectRef, nebulae, stars: bare, prerequisites }, language)) {
    const lit = LIT_PER_CLUSTER[cluster.clusterId] ?? 1
    cluster.stars.forEach((star, i) => {
      if (i < lit) {
        state.set(star.unitId, 'lit')
        if (litSeen % 6 === 0) reviewDue.set(star.unitId, 1 + (litSeen % 4))
        litSeen += 1
      } else if (i === lit) {
        state.set(star.unitId, 'in_progress')
        if (cluster.clusterId === RECOMMENDED_IN[subject]) recommended = star.unitId
      }
    })
  }

  const stars = bare.map((star): Star => {
    const s = state.get(star.unitId) ?? 'ready'
    const unlit = s === 'lit' ? [] : base.find((k) => k.unitId === star.unitId)!.prerequisites.filter((p) => state.get(p) !== 'lit')
    return {
      ...star,
      state: s,
      progress: s === 'lit' ? 1 : s === 'in_progress' ? 1 / 3 : 0,
      reviewDue: reviewDue.get(star.unitId) ?? 0,
      chapter: { lessonCount: 3, lessonsDone: s === 'lit' ? 3 : s === 'in_progress' ? 1 : 0, nextLesson: null },
      recommendation: star.unitId === recommended ? { source: 'system', reason: 'in_progress' } : null,
      unlitPrerequisiteIds: unlit,
    }
  })
  const litCount = stars.filter((s) => s.state === 'lit').length

  return {
    subject: subjectRef,
    nebulae,
    stars,
    prerequisites,
    summary: { lit: litCount, total: stars.length, streakDays: 4, score: 1280 },
    subjects: [{ subjectId: subject, name: subjectRef.name, lit: litCount, total: stars.length, enrolled: true }],
  }
}

/** The demo knowledge point's place in the knowledge base: in Geometry, after Trigonometry. */
export const DEMO_POINT_TOPIC = 'geometrie'
const DEMO_POINT_AFTER = 'geometrie-trigonometrie'
/** Refraction's (the demo sky's bridge star): in Sound and light, after light's propagation, reflection and refraction. */
export const DEMO_BRIDGE_TOPIC = 'physik-optik-akustik'
const DEMO_BRIDGE_AFTER = 'physik-optik-akustik-ausbreitung-reflexion-und-brechung-des-lichts'

/** The demo sky's stars kept in a knowledge-base subject: each with its topic there and the star it comes after. */
const KEPT: Partial<Record<DemoClusterSubject, { unitId: string; topicId: string; after: string }>> = {
  math: { unitId: DEMO_KNOWLEDGE_POINT.unitId, topicId: DEMO_POINT_TOPIC, after: DEMO_POINT_AFTER },
  physics: { unitId: DEMO_BRIDGE_STAR, topicId: DEMO_BRIDGE_TOPIC, after: DEMO_BRIDGE_AFTER },
}

/** The order the knowledge base's galaxies come in, before the demo sky's other ones. */
const GALAXY_ORDER: readonly DemoClusterSubject[] = ['math', 'physics', 'german', 'english']

const withBase = new WeakMap<Sky, Map<SupportedLanguage, Sky>>()

/**
 * The demo sky with mathematics and physics replaced by the knowledge base's,
 * and German and English added from it (`demoClusterMap`), as the demo backend
 * answers `GET /practice/knowledge-map` (#747). Two stars of the demo sky stay:
 * the demo knowledge point, the one star with a chapter (`src/dev/demo/data`),
 * in Geometry after Trigonometry and mathematics' recommendation, so the
 * Geometry cluster's route opens on it and "Start practising" there opens its
 * chapter; and Refraction, which builds on it across subjects, in Sound and
 * light after light's propagation. Chemistry is the demo sky's, each topic a
 * cluster of its own (no table entry), not taken. The same sky for the same
 * input, so the map keeps its scene.
 */
export function withKnowledgeBase(sky: Sky, language: SupportedLanguage): Sky {
  const known = withBase.get(sky)?.get(language)
  if (known) return known
  const replaced = new Set<string>(GALAXY_ORDER)
  const replacedTopics = new Set(sky.nebulae.filter((nebula) => replaced.has(nebula.subjectId)).map((nebula) => nebula.topicId))
  const keptIds = new Set(Object.values(KEPT).map((k) => k.unitId))
  const others = sky.stars.filter((star) => !replacedTopics.has(star.nebulaId))

  const subjects = GALAXY_ORDER.map((subject) => {
    const base = demoClusterMap(language, subject)
    const keep = KEPT[subject]
    const old = keep ? sky.stars.find((star) => star.unitId === keep.unitId) : undefined
    // One recommendation per subject (#9 point 8): mathematics' is the demo knowledge point's.
    const own = subject === 'math' && old ? base.stars.map((star) => (star.recommendation ? { ...star, recommendation: null } : star)) : base.stars
    const litIds = new Set(own.filter((star) => star.state === 'lit').map((star) => star.unitId))
    const kept: Star[] =
      keep && old
        ? [
            {
              ...old,
              nebulaId: keep.topicId,
              // Its new prerequisite, and of its old ones those still in the sky (Refraction's on the point).
              unlitPrerequisiteIds:
                old.state === 'lit' ? [] : [...(litIds.has(keep.after) ? [] : [keep.after]), ...old.unlitPrerequisiteIds.filter((id) => keptIds.has(id))],
            },
          ]
        : []
    const prerequisites: Prerequisite[] = [...base.prerequisites, ...(keep && old ? [{ from: keep.after, to: old.unitId }] : [])]
    const stars = [...own, ...kept]
    return { subject, base, stars, prerequisites, lit: stars.filter((star) => star.state === 'lit').length }
  })

  const madeStars = subjects.flatMap((s) => s.stars)
  const keptHere = new Set([...others.map((star) => star.unitId), ...[...keptIds].filter((id) => madeStars.some((star) => star.unitId === id))])
  const prerequisites = [
    ...subjects.flatMap((s) => s.prerequisites),
    // The demo sky's own lines among what is left of it: chemistry, and the two stars kept (Refraction needs the point).
    ...sky.prerequisites.filter((edge) => keptHere.has(edge.from) && keptHere.has(edge.to)),
  ]
  const galaxyOf = (subject: DemoClusterSubject, made: (typeof subjects)[number]): Galaxy => {
    const old = sky.galaxies.find((galaxy) => galaxy.subjectId === subject)
    return { subjectId: subject, name: old?.name ?? made.base.subject.name, lit: made.lit, total: made.stars.length, enrolled: old?.enrolled ?? true }
  }
  const math = subjects[0]
  const made: Sky = {
    galaxies: [...subjects.map((s) => galaxyOf(s.subject, s)), ...sky.galaxies.filter((galaxy) => !replaced.has(galaxy.subjectId))],
    nebulae: [
      ...subjects.flatMap((s) => s.base.nebulae.map((nebula): SkyNebula => ({ ...nebula, subjectId: s.subject }))),
      ...sky.nebulae.filter((nebula) => !replacedTopics.has(nebula.topicId)),
    ],
    stars: [...madeStars, ...others],
    prerequisites,
    summary: { ...sky.summary, lit: math.lit, total: math.stars.length },
  }
  const byLanguage = withBase.get(sky) ?? new Map<SupportedLanguage, Sky>()
  byLanguage.set(language, made)
  withBase.set(sky, byLanguage)
  return made
}
