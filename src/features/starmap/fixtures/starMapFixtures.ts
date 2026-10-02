/*
 * Fixture star maps in the shape of stoa-backend#59 (#47, #72), until #48
 * reads the real endpoint. Four sizes:
 *
 *   10    hand-written: every learning state, one recommendation, a star due
 *         for review, a star with all lessons done but exercises unmet, and
 *         prerequisites inside and across nebulae;
 *   500   generated, 12 nebulae;
 *   1000  generated, 15 nebulae: the middle step of the phone bench (#44);
 *   2000  generated, 18 nebulae: the most one map may carry (#11 point 3).
 *
 * All four are laid out by `layout/layout.ts`, the way stoa-backend#60 will
 * lay out the real map: nebulae by their relation graph, stars scattered
 * evenly inside. Everything is seeded, so a screenshot or a frame-rate
 * reading can be repeated.
 *
 * The backend has no prerequisites yet (#72 point 2), so a real map has no
 * lines until stoa-backend#56 lands; the fixtures carry some so the lines can
 * be seen and tested.
 */
import small from '@/features/starmap/fixtures/map-10.json'
import nebulaNames from '@/features/starmap/fixtures/nebula-names.json'
import { layoutStarMap, seededRandom } from '@/features/starmap/layout/layout'
import { nebulaLinks } from '@/features/starmap/model/links'
import { compareStars, type LearningState, type Nebula, type Prerequisite, type Star, type StarMap } from '@/features/starmap/model/starMap'

export const FIXTURE_SIZES = [10, 500, 1000, 2000] as const
export type FixtureSize = (typeof FIXTURE_SIZES)[number]

export function isFixtureSize(value: number): value is FixtureSize {
  return (FIXTURE_SIZES as readonly number[]).includes(value)
}

type Unplaced = Omit<StarMap, 'stars'> & { stars: Omit<Star, 'x' | 'y'>[] }

/** Anything with nebulae, unplaced stars and prerequisites: a one-subject map or the whole sky. */
type Placeable = { nebulae: Nebula[]; stars: Omit<Star, 'x' | 'y'>[]; prerequisites: Prerequisite[] }

const slug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-')

/** Give every star its place, as the backend's offline layout will. */
export function placeStars<T extends Placeable>(map: T, seed: number): Omit<T, 'stars'> & { stars: Star[] } {
  const links = nebulaLinks({ stars: map.stars as Star[], prerequisites: map.prerequisites })
  const sizes = new Map<string, number>()
  for (const star of map.stars) sizes.set(star.nebulaId, (sizes.get(star.nebulaId) ?? 0) + 1)
  const placed = layoutStarMap(
    map.nebulae.map((nebula) => ({ id: nebula.topicId, order: nebula.order, size: sizes.get(nebula.topicId) ?? 1 })),
    map.stars,
    links,
    seed,
  )
  return {
    ...map,
    stars: map.stars.map((star) => {
      const at = placed.stars.get(star.unitId) ?? { x: 0.5, y: 0.5 }
      return { ...star, x: at.x, y: at.y }
    }),
  }
}

function generate(count: number, nebulaCount: number): StarMap {
  const rand = seededRandom(count * 7919 + nebulaCount)
  const nebulae: Nebula[] = []
  for (let r = 0; r < nebulaCount; r += 1) {
    const name = nebulaNames[r % nebulaNames.length]
    nebulae.push({ topicId: slug(name), name, order: r + 1 })
  }

  // Uneven nebula sizes, adding up to `count`.
  const weights = nebulae.map(() => 0.6 + rand() * 0.8)
  const total = weights.reduce((sum, w) => sum + w, 0)
  const sizes = weights.map((w) => Math.max(1, Math.floor((w / total) * count)))
  let short = count - sizes.reduce((sum, n) => sum + n, 0)
  for (let r = 0; short > 0; r = (r + 1) % nebulaCount, short -= 1) sizes[r] += 1

  const stars: Omit<Star, 'x' | 'y'>[] = []
  const members: string[][] = []
  nebulae.forEach((nebula, r) => {
    const size = sizes[r]
    const ids: string[] = []
    // Early topics are further along; late ones are barely started.
    const litShare = Math.max(0, 0.55 - r / nebulaCount) * (0.6 + rand() * 0.6)
    const litUpTo = Math.floor(size * litShare)
    const inProgressUpTo = litUpTo + Math.max(1, Math.round(size * 0.08))
    const readyUpTo = inProgressUpTo + Math.max(1, Math.round(size * 0.15))
    for (let k = 0; k < size; k += 1) {
      const state: LearningState =
        k < litUpTo ? 'lit' : k < inProgressUpTo ? 'in_progress' : k < readyUpTo ? 'ready' : 'locked'
      const lessonCount = 3 + Math.floor(rand() * 6)
      const progress =
        state === 'lit' ? 1 : state === 'in_progress' ? Math.round((0.2 + rand() * 0.8) * lessonCount) / lessonCount : 0
      const lessonsDone = Math.round(progress * lessonCount)
      const name = `${nebula.name} ${k + 1}`
      const unitId = `u-${r + 1}-${k + 1}`
      ids.push(unitId)
      stars.push({
        unitId,
        name,
        nebulaId: nebula.topicId,
        order: k + 1,
        state,
        progress,
        unmetExercises: state === 'in_progress' ? (lessonsDone === lessonCount ? 2 : 1 + Math.floor(rand() * 5)) : 0,
        reviewDue: state === 'lit' && k % 7 === 3 ? 1 + Math.floor(rand() * 5) : 0,
        recommendation: null,
        skills: [],
        chapter: {
          lessonCount,
          lessonsDone,
          nextLesson:
            state === 'lit' ? null : { lessonId: `l-${r + 1}-${k + 1}-${lessonsDone + 1}`, title: `${name} · ${lessonsDone + 1}` },
        },
      })
    }
    members.push(ids)
  })

  // A relation graph between topics: each hangs off an earlier one, some off
  // two; every relation is a handful of unit prerequisites crossing over.
  const prerequisites: Prerequisite[] = []
  const pick = (ids: string[], share = 1) => ids[Math.floor(rand() * Math.max(1, Math.floor(ids.length * share)))]
  for (let r = 1; r < nebulaCount; r += 1) {
    const parents = new Set([Math.floor(rand() * r)])
    if (r > 2 && rand() < 0.35) parents.add(Math.floor(rand() * r))
    for (const parent of parents) {
      const crossings = 1 + Math.floor(rand() * 4)
      for (let c = 0; c < crossings; c += 1) {
        prerequisites.push({ from: pick(members[parent], 0.5), to: pick(members[r]) })
      }
    }
  }
  // Inside a topic: some units build on an earlier one.
  members.forEach((ids) => {
    for (let k = 1; k < ids.length; k += 1) {
      if (rand() < 0.3) prerequisites.push({ from: ids[Math.floor(rand() * k)], to: ids[k] })
    }
  })

  return withRecommendation(
    placeStars(
      {
        subject: { subjectId: 'math', name: 'Mathematics' },
        nebulae,
        stars,
        prerequisites,
        summary: { lit: stars.filter((s) => s.state === 'lit').length, total: stars.length, streakDays: 5, score: 1240 },
        subjects: [],
      },
      count,
    ),
  )
}

/**
 * The backend's rule for the one recommendation (#9 point 8): the first
 * star in progress, else the first ready one, by `(topic.order, unit.order,
 * unit_id)`.
 */
function withRecommendation(map: StarMap): StarMap {
  const order = new Map(map.nebulae.map((nebula) => [nebula.topicId, nebula.order]))
  const sorted = [...map.stars].sort(compareStars(order))
  const pick = sorted.find((s) => s.state === 'in_progress') ?? sorted.find((s) => s.state === 'ready')
  return {
    ...map,
    stars: map.stars.map((star) => ({ ...star, recommendation: star === pick ? { source: 'system' as const } : null })),
  }
}

/** The switcher's subjects: this one plus two with little or nothing in them. */
function withSubjects(map: StarMap): StarMap {
  return {
    ...map,
    subjects: [
      { subjectId: 'math', name: 'Mathematics', lit: map.summary.lit, total: map.summary.total, enrolled: true },
      { subjectId: 'physics', name: 'Physics', lit: 0, total: 0, enrolled: true },
      { subjectId: 'german', name: 'German', lit: 0, total: 0, enrolled: false },
    ],
  }
}

const NEBULAE_FOR: Record<Exclude<FixtureSize, 10>, number> = { 500: 12, 1000: 15, 2000: 18 }

const cache = new Map<FixtureSize, StarMap>()

export function starMapFixture(size: FixtureSize): StarMap {
  const hit = cache.get(size)
  if (hit) return hit
  const map = withSubjects(size === 10 ? placeStars(small as Unplaced, 10) : generate(size, NEBULAE_FOR[size]))
  cache.set(size, map)
  return map
}
