/*
 * The design preview's sky (#116, map #114): one sky for every subject
 * (ADR 0001), in the shape of `Sky` (`model/starMap.ts`).
 *
 *   - three galaxies: mathematics and physics, which the demo student takes,
 *     and chemistry, which they do not (no student evidence, drawn dimmed);
 *   - sixteen nebulae (topics), each with its own lit ratio, so "a nebula
 *     brightens with its lit share" can be judged;
 *   - one demo knowledge point (演示知识点, `DEMO_KNOWLEDGE_POINT`), in the
 *     trigonometry nebula, with a full chapter (`src/dev/demo/data`);
 *   - every other star a placeholder star (占位星): a name and a learning
 *     state, no chapter;
 *   - prerequisites inside nebulae, between nebulae, and across subjects:
 *     physics optics needs mathematics trigonometry, and the demo knowledge
 *     point is the one prerequisite still holding "Refraction" locked.
 *
 * Star dust (星尘) is not here: it is decoration painted by
 * `render/galaxy.ts`, never a `Star`.
 *
 * Sizes 10 / 500 / 1000 / 2000 count the stars of the whole sky. Size 10 is
 * planned by hand; the others are generated from `demo-sky.json`, seeded, so
 * the same size gives the same sky. Learning states follow CONTEXT.md: a
 * ready star's prerequisites are all lit, a locked star has at least one that
 * is not. Recommendations: at most one per subject, none for a subject the
 * student does not take; in mathematics it is the demo knowledge point, on
 * purpose, rather than the backend's first-in-order rule (#9 point 8).
 *
 * Names are in all four languages in `demo-sky.json`, the way the backend
 * sends names already in the reader's language; they are demo content, so
 * they stay out of the locale bundles.
 */
import data from '@/features/starmap/fixtures/demo-sky.json'
import { galaxyOrder, layoutSky, seededRandom, type GalaxyBox } from '@/features/starmap/layout/layout'
import { nebulaLinks } from '@/features/starmap/model/links'
import {
  crossSubjectPrerequisites,
  type Galaxy,
  type KnowledgeSkill,
  type LearningState,
  type Prerequisite,
  type Sky,
  type SkyNebula,
  type Star,
} from '@/features/starmap/model/starMap'
import type { SupportedLanguage } from '@/i18n/languages'

/**
 * The sky's sizes, counting the stars of the whole sky: 10 is planned by
 * hand; 500, 1000 and 2000 are the phone bench's steps (#44).
 */
export const FIXTURE_SIZES = [10, 500, 1000, 2000] as const
export type FixtureSize = (typeof FIXTURE_SIZES)[number]

export function isFixtureSize(value: number): value is FixtureSize {
  return (FIXTURE_SIZES as readonly number[]).includes(value)
}

/** A text in the four languages the app ships. */
export type Localized = Record<SupportedLanguage, string>

export function localize(text: Localized, language: SupportedLanguage): string {
  return text[language] ?? text.en
}

/** The one star with content. Its chapter is `demoChapter` in `src/dev/demo/data`. */
export const DEMO_KNOWLEDGE_POINT = {
  unitId: data.knowledgePoint.unitId,
  subjectId: 'math',
  topicId: data.knowledgePoint.topicId,
  gradeLevel: data.knowledgePoint.gradeLevel,
  name: data.knowledgePoint.name as Localized,
  lessons: data.knowledgePoint.lessons.map((lesson) => ({
    lessonId: lesson.lessonId,
    title: lesson.title as Localized,
    exercises: lesson.exercises,
  })),
  /** Lessons already completed when the preview opens. */
  lessonsDone: data.knowledgePoint.lessonsDone,
  skills: data.knowledgePoint.skills.map((skill, index) => ({
    skillId: `${data.knowledgePoint.unitId}-skill-${index + 1}`,
    name: skill.name as Localized,
    lit: skill.lit,
  })),
} as const

/** The physics star whose one unlit prerequisite is the demo knowledge point. */
export const DEMO_BRIDGE_STAR = data.bridge.unitId

/** What a star of the design preview is. Star dust is no star at all. */
export type DemoStarKind = 'knowledge_point' | 'placeholder'

export function demoStarKind(unitId: string): DemoStarKind {
  return unitId === DEMO_KNOWLEDGE_POINT.unitId ? 'knowledge_point' : 'placeholder'
}

/**
 * The design preview's sky, which says which star is the demo knowledge
 * point and where each galaxy lies along the band (`layoutSky`).
 */
export type DemoSky = Sky & { knowledgePointId: string; galaxyBoxes: Record<string, GalaxyBox> }

type NebulaSpec = (typeof data.nebulae)[number]

const enrolled = new Map(data.galaxies.map((galaxy) => [galaxy.subjectId, galaxy.enrolled]))

/** Size 10, by hand: every state, both recommendations, the cross-subject prerequisite. */
const TEN: Record<string, LearningState[]> = {
  numbers: ['lit'],
  algebra: ['ready'],
  trigonometry: ['in_progress', 'locked'],
  mechanics: ['lit', 'in_progress'],
  optics: ['ready', 'locked'],
  atoms: ['ready'],
  reactions: ['locked'],
}

/** Each nebula's learning states, in unit order: lit, in progress, ready, then locked. */
function planFor(size: FixtureSize): Map<string, LearningState[]> {
  if (size === 10) return new Map(Object.entries(TEN))
  const total = data.nebulae.reduce((sum, nebula) => sum + nebula.weight, 0)
  const counts = data.nebulae.map((nebula) => Math.max(4, Math.floor((nebula.weight / total) * size)))
  let short = size - counts.reduce((sum, n) => sum + n, 0)
  for (let i = 0; short > 0; i = (i + 1) % counts.length, short -= 1) counts[i] += 1
  return new Map(
    data.nebulae.map((nebula, i) => {
      const n = counts[i]
      const taken = enrolled.get(nebula.subjectId) ?? false
      const lit = taken ? Math.floor(n * nebula.lit) : 0
      const inProgress = taken ? Math.max(1, Math.round(n * 0.06)) : 0
      const ready = Math.max(1, Math.round(n * 0.12))
      const states: LearningState[] = []
      for (let k = 0; k < n; k += 1) {
        states.push(k < lit ? 'lit' : k < lit + inProgress ? 'in_progress' : k < lit + inProgress + ready ? 'ready' : 'locked')
      }
      return [nebula.topicId, states] as const
    }),
  )
}

type Built = {
  sky: Omit<DemoSky, 'stars'> & { stars: Star[] }
  /** Every name, by id, in every language. */
  starName: Map<string, (language: SupportedLanguage) => string>
  skillName: Map<string, Localized>
  nebulaName: Map<string, Localized>
  galaxyName: Map<string, Localized>
  nextLessonTitle: Localized
}

function build(size: FixtureSize): Built {
  const rand = seededRandom(116_000 + size)
  const plan = planFor(size)
  const specs = data.nebulae.filter((nebula) => plan.has(nebula.topicId))
  const starName = new Map<string, (language: SupportedLanguage) => string>()
  const skillName = new Map<string, Localized>()
  const nebulaName = new Map<string, Localized>(specs.map((nebula) => [nebula.topicId, nebula.name as Localized]))
  const galaxyName = new Map<string, Localized>(data.galaxies.map((galaxy) => [galaxy.subjectId, galaxy.name as Localized]))
  const kp = DEMO_KNOWLEDGE_POINT
  const nextLesson = kp.lessons[kp.lessonsDone]

  const nebulae: SkyNebula[] = []
  const stars: Omit<Star, 'x' | 'y'>[] = []
  const members = new Map<string, Omit<Star, 'x' | 'y'>[]>()
  let litSeen = 0
  for (const galaxy of data.galaxies) {
    specs
      .filter((spec) => spec.subjectId === galaxy.subjectId)
      .forEach((spec: NebulaSpec, index) => {
        nebulae.push({ topicId: spec.topicId, subjectId: spec.subjectId, name: spec.name.en, order: index + 1 })
        const list: Omit<Star, 'x' | 'y'>[] = []
        let placedKp = false
        let placedBridge = false
        plan.get(spec.topicId)!.forEach((state, k) => {
          const isKp = !placedKp && spec.topicId === kp.topicId && state === 'in_progress'
          const isBridge = !placedBridge && spec.topicId === data.bridge.topicId && state === 'locked'
          placedKp ||= isKp
          placedBridge ||= isBridge
          const unitId = isKp ? kp.unitId : isBridge ? data.bridge.unitId : `${spec.topicId}-${k + 1}`
          const named = spec.stars[k] as { name: Localized; skills?: Localized[] } | undefined
          const fixed = isKp ? kp.name : isBridge ? (data.bridge.name as Localized) : named?.name
          starName.set(unitId, fixed ? (language) => localize(fixed, language) : (language) => `${localize(spec.name as Localized, language)} ${k + 1}`)

          let skills: KnowledgeSkill[] = []
          if (isKp) {
            skills = kp.skills.map((skill) => ({ skillId: skill.skillId, name: skill.name.en, lit: skill.lit }))
            kp.skills.forEach((skill) => skillName.set(skill.skillId, skill.name))
          } else if (named?.skills && !isBridge) {
            skills = named.skills.map((name, s) => {
              const skillId = `${unitId}-skill-${s + 1}`
              skillName.set(skillId, name)
              return { skillId, name: name.en, lit: state === 'lit' || (state === 'in_progress' && s === 0) }
            })
          }
          const reviewDue = state === 'lit' && litSeen++ % 6 === 0 ? 1 + Math.floor(rand() * 4) : 0
          const star: Omit<Star, 'x' | 'y'> = {
            unitId,
            name: starName.get(unitId)!('en'),
            nebulaId: spec.topicId,
            order: k + 1,
            state,
            progress: isKp
              ? kp.lessonsDone / kp.lessons.length
              : state === 'lit' ? 1 : state === 'in_progress' ? Math.round((0.2 + rand() * 0.6) * 10) / 10 : 0,
            unmetExercises: isKp ? kp.lessons.slice(kp.lessonsDone).reduce((sum, lesson) => sum + lesson.exercises, 0) : 0,
            reviewDue,
            recommendation: null,
            skills,
            chapter: isKp
              ? {
                  lessonCount: kp.lessons.length,
                  lessonsDone: kp.lessonsDone,
                  nextLesson: nextLesson ? { lessonId: nextLesson.lessonId, title: nextLesson.title.en } : null,
                }
              : { lessonCount: 0, lessonsDone: 0, nextLesson: null },
          }
          list.push(star)
          stars.push(star)
        })
        members.set(spec.topicId, list)
      })
  }

  const prerequisites = prerequisitesFor(members, rand)
  const recommended = recommendationsFor(nebulae, stars)
  const withMarks = stars.map((star) => (recommended.has(star.unitId) ? { ...star, recommendation: { source: 'system' as const } } : star))

  // One sky (#119): galaxies along a band, neighbours where prerequisites cross subjects.
  const unplaced = withMarks as Star[]
  const subjectOfTopic = new Map(nebulae.map((nebula) => [nebula.topicId, nebula.subjectId]))
  const crossLinks = nebulaLinks({ stars: unplaced, prerequisites: crossSubjectPrerequisites({ nebulae, stars: unplaced, prerequisites }) })
    .map((link) => ({ a: subjectOfTopic.get(link.a)!, b: subjectOfTopic.get(link.b)!, count: link.count }))
  const order = galaxyOrder(data.galaxies.map((galaxy) => galaxy.subjectId), crossLinks)
  const sizes = new Map<string, number>()
  for (const star of withMarks) sizes.set(star.nebulaId, (sizes.get(star.nebulaId) ?? 0) + 1)
  const layout = layoutSky(
    order.map((subjectId) => ({
      id: subjectId,
      nebulae: nebulae
        .filter((nebula) => nebula.subjectId === subjectId)
        .map((nebula) => ({ id: nebula.topicId, order: nebula.order, size: sizes.get(nebula.topicId) ?? 1 })),
    })),
    withMarks,
    nebulaLinks({ stars: unplaced, prerequisites }),
    116, // One seed for every size: the galaxies and nebulae keep their places, only the star count changes.
  )
  const placedStars: Star[] = withMarks.map((star) => ({ ...star, ...(layout.stars.get(star.unitId) ?? { x: 0.5, y: 0.5 }) }))
  const galaxies: Galaxy[] = data.galaxies.map((galaxy) => {
    const topics = new Set(nebulae.filter((nebula) => nebula.subjectId === galaxy.subjectId).map((nebula) => nebula.topicId))
    const own = stars.filter((star) => topics.has(star.nebulaId))
    return {
      subjectId: galaxy.subjectId,
      name: galaxy.name.en,
      lit: own.filter((star) => star.state === 'lit').length,
      total: own.length,
      enrolled: galaxy.enrolled,
    }
  })
  return {
    sky: {
      galaxies,
      nebulae,
      stars: placedStars,
      prerequisites,
      summary: { lit: stars.filter((star) => star.state === 'lit').length, total: stars.length, streakDays: 5, score: 1240 },
      knowledgePointId: kp.unitId,
      galaxyBoxes: Object.fromEntries(layout.galaxies),
    },
    starName,
    skillName,
    nebulaName,
    galaxyName,
    nextLessonTitle: nextLesson?.title ?? kp.name,
  }
}

/**
 * Edges that keep the states true: into a star that is lit, in progress or
 * ready only from lit stars; every locked star gets at least one unlit
 * prerequisite. Inside a nebula an edge runs from an earlier unit to a later
 * one, and between nebulae along `relations`, so the graph has no cycle.
 */
function prerequisitesFor(members: Map<string, Omit<Star, 'x' | 'y'>[]>, rand: () => number): Prerequisite[] {
  const edges: Prerequisite[] = []
  const seen = new Set<string>()
  const add = (from: string, to: string) => {
    const key = `${from}\u0000${to}`
    if (from === to || seen.has(key)) return
    seen.add(key)
    edges.push({ from, to })
  }
  const any = <T,>(list: T[]) => list[Math.floor(rand() * list.length)]
  const relations = data.relations.filter(([a, b]) => members.has(a) && members.has(b))

  // The cross-subject prerequisite the story needs: optics' Refraction waits for the demo knowledge point.
  if (members.get(data.bridge.topicId)?.some((star) => star.unitId === data.bridge.unitId)) {
    add(DEMO_KNOWLEDGE_POINT.unitId, data.bridge.unitId)
  }

  for (const [parent, child] of relations) {
    const from = members.get(parent)!
    const to = members.get(child)!
    const lit = from.filter((star) => star.state === 'lit')
    const crossings = 1 + Math.floor(rand() * 3)
    for (let c = 0; c < crossings; c += 1) {
      const target = any(to)
      if (target.state === 'locked' && target.unitId !== data.bridge.unitId) add(any(from).unitId, target.unitId)
      else if (lit.length > 0) add(any(lit).unitId, target.unitId)
    }
  }

  for (const list of members.values()) {
    list.forEach((star, k) => {
      if (k === 0 || star.state === 'locked' || rand() >= 0.25) return
      const lit = list.slice(0, k).filter((before) => before.state === 'lit')
      if (lit.length > 0) add(any(lit).unitId, star.unitId)
    })
  }

  const stateOf = new Map([...members.values()].flat().map((star) => [star.unitId, star.state]))
  for (const [topic, list] of members) {
    list.forEach((star, k) => {
      if (star.state !== 'locked') return
      if (edges.some((edge) => edge.to === star.unitId && stateOf.get(edge.from) !== 'lit')) return
      const earlier = list.slice(0, k).filter((before) => before.state !== 'lit')
      const parents = relations
        .filter(([, child]) => child === topic)
        .flatMap(([parent]) => members.get(parent)!.filter((before) => before.state !== 'lit'))
      const pool = earlier.length > 0 ? earlier : parents
      if (pool.length === 0) throw new Error(`demo sky: locked ${star.unitId} has no unlit star to wait for`)
      add(any(pool).unitId, star.unitId)
    })
  }
  return edges
}

/** At most one per subject the student takes: the demo knowledge point in its subject, else the backend's rule. */
function recommendationsFor(nebulae: SkyNebula[], stars: Omit<Star, 'x' | 'y'>[]): Set<string> {
  const picks = new Set<string>()
  for (const galaxy of data.galaxies) {
    if (!galaxy.enrolled) continue
    if (galaxy.subjectId === DEMO_KNOWLEDGE_POINT.subjectId && stars.some((star) => star.unitId === DEMO_KNOWLEDGE_POINT.unitId)) {
      picks.add(DEMO_KNOWLEDGE_POINT.unitId)
      continue
    }
    const own = nebulae.filter((nebula) => nebula.subjectId === galaxy.subjectId)
    const order = new Map(own.map((nebula) => [nebula.topicId, nebula.order]))
    const sorted = stars
      .filter((star) => order.has(star.nebulaId))
      .sort((a, b) => order.get(a.nebulaId)! - order.get(b.nebulaId)! || a.order - b.order || (a.unitId < b.unitId ? -1 : 1))
    const pick = sorted.find((star) => star.state === 'in_progress') ?? sorted.find((star) => star.state === 'ready')
    if (pick) picks.add(pick.unitId)
  }
  return picks
}

const built = new Map<FixtureSize, Built>()
const localized = new Map<string, DemoSky>()

/** The whole demo sky at `size` stars, its names in `language`. */
export function demoSky(size: FixtureSize, language: SupportedLanguage = 'en'): DemoSky {
  const key = `${size}:${language}`
  const hit = localized.get(key)
  if (hit) return hit
  let raw = built.get(size)
  if (!raw) {
    raw = build(size)
    built.set(size, raw)
  }
  const { sky, starName, skillName, nebulaName, galaxyName, nextLessonTitle } = raw
  const sky2: DemoSky = {
    ...sky,
    galaxies: sky.galaxies.map((galaxy) => ({ ...galaxy, name: localize(galaxyName.get(galaxy.subjectId)!, language) })),
    nebulae: sky.nebulae.map((nebula) => ({ ...nebula, name: localize(nebulaName.get(nebula.topicId)!, language) })),
    stars: sky.stars.map((star) => ({
      ...star,
      name: starName.get(star.unitId)!(language),
      skills: star.skills.map((skill) => ({ ...skill, name: localize(skillName.get(skill.skillId)!, language) })),
      chapter: star.chapter.nextLesson
        ? { ...star.chapter, nextLesson: { ...star.chapter.nextLesson, title: localize(nextLessonTitle, language) } }
        : star.chapter,
    })),
  }
  localized.set(key, sky2)
  return sky2
}
