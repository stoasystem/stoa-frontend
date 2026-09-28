/*
 * Fixture planets in the shape of stoa-backend#59 (#47), until #48 reads the
 * real endpoint. Three sizes:
 *
 *   10    hand-written: every learning state, one recommendation, a point due
 *         for review, a point with all lessons done but exercises unmet;
 *   500   generated, 12 regions;
 *   2000  generated, 18 regions: the most one planet may carry (#11 point 3).
 *
 * The generated ones are laid out the way stoa-backend#60 plans to: regions
 * spread over the sphere, each region's points in a Fibonacci spiral inside
 * its circle. Everything is deterministic, so a screenshot or a frame-rate
 * reading can be repeated.
 */
import { geoRotation } from 'd3-geo'
import small from '@/features/planet/fixtures/math-10.json'
import regionNames from '@/features/planet/fixtures/region-names.json'
import type {
  KnowledgeMap,
  KnowledgePoint,
  KnowledgeRegion,
  LearningState,
} from '@/features/planet/model/knowledgeMap'
import { comparePoints } from '@/features/planet/model/knowledgeMap'

export const FIXTURE_SIZES = [10, 500, 2000] as const
export type FixtureSize = (typeof FIXTURE_SIZES)[number]

export function isFixtureSize(value: number): value is FixtureSize {
  return (FIXTURE_SIZES as readonly number[]).includes(value)
}

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5))
const DEGREES = 180 / Math.PI

/** A small, seeded generator (mulberry32), so every run draws the same planet. */
function random(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const slug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-')

function generate(count: number, regionCount: number): KnowledgeMap {
  const rand = random(count * 7919 + regionCount)
  const regions: KnowledgeRegion[] = []

  // Region centres: a Fibonacci lattice over the sphere, kept off the poles.
  for (let r = 0; r < regionCount; r += 1) {
    const z = 1 - (2 * (r + 0.5)) / regionCount
    const lat = Math.asin(z * 0.9) * DEGREES
    const lng = ((((r * GOLDEN_ANGLE * DEGREES) % 360) + 540) % 360) - 180
    const name = regionNames[r % regionNames.length]
    regions.push({ topicId: slug(name), name, order: r + 1, lat, lng })
  }

  // Uneven region sizes, adding up to `count`.
  const weights = regions.map(() => 0.6 + rand() * 0.8)
  const total = weights.reduce((sum, w) => sum + w, 0)
  const sizes = weights.map((w) => Math.max(1, Math.floor((w / total) * count)))
  let short = count - sizes.reduce((sum, n) => sum + n, 0)
  for (let r = 0; short > 0; r = (r + 1) % regionCount, short -= 1) sizes[r] += 1

  const points: KnowledgePoint[] = []
  regions.forEach((region, r) => {
    const size = sizes[r]
    // A cap covering its share of the sphere (70% of it, leaving seas between).
    const share = size / count
    const cap = Math.acos(1 - 2 * share * 0.7) * DEGREES
    const toCentre = geoRotation([-region.lng, -region.lat]).invert
    // How far this region has got: the far side of the planet is barely started.
    const litShare = Math.max(0, 0.55 - r / regionCount) * (0.6 + rand() * 0.6)
    const litUpTo = Math.floor(size * litShare)
    const inProgressUpTo = litUpTo + Math.max(1, Math.round(size * 0.08))
    const readyUpTo = inProgressUpTo + Math.max(1, Math.round(size * 0.15))

    for (let k = 0; k < size; k += 1) {
      const distance = cap * Math.sqrt((k + 0.5) / size)
      const angle = k * GOLDEN_ANGLE
      const [lng, lat] = toCentre([distance * Math.cos(angle), distance * Math.sin(angle)])
      const state: LearningState =
        k < litUpTo ? 'lit' : k < inProgressUpTo ? 'in_progress' : k < readyUpTo ? 'ready' : 'locked'
      const lessonCount = 3 + Math.floor(rand() * 6)
      const progress = state === 'lit' ? 1 : state === 'in_progress' ? Math.round((0.2 + rand() * 0.8) * lessonCount) / lessonCount : 0
      const lessonsDone = Math.round(progress * lessonCount)
      const name = `${region.name} ${k + 1}`
      points.push({
        unitId: `u-${r + 1}-${k + 1}`,
        name,
        regionId: region.topicId,
        order: k + 1,
        state,
        progress,
        unmetExercises: state === 'in_progress' ? (lessonsDone === lessonCount ? 2 : 1 + Math.floor(rand() * 5)) : 0,
        reviewDue: state === 'lit' && k % 7 === 3 ? 1 + Math.floor(rand() * 5) : 0,
        recommendation: null,
        lat,
        lng,
        skills: [],
        chapter: {
          lessonCount,
          lessonsDone,
          nextLesson:
            state === 'lit' ? null : { lessonId: `l-${r + 1}-${k + 1}-${lessonsDone + 1}`, title: `${name} · ${lessonsDone + 1}` },
        },
      })
    }
  })

  return withRecommendation({
    subject: { subjectId: 'math', name: 'Mathematics' },
    regions,
    points,
    edges: [],
    summary: { lit: points.filter((p) => p.state === 'lit').length, total: points.length, streakDays: 5, score: 1240 },
    planets: [
      { subjectId: 'physics', name: 'Physics', lit: 0, total: 14 },
      { subjectId: 'german', name: 'German', lit: 4, total: 12 },
    ],
  })
}

/**
 * The backend's rule for the one recommendation (#9 point 8): the first
 * point in progress, else the first ready one, by `(topic.order, unit.order,
 * unit_id)`.
 */
function withRecommendation(map: KnowledgeMap): KnowledgeMap {
  const order = new Map(map.regions.map((region) => [region.topicId, region.order]))
  const sorted = [...map.points].sort(comparePoints(order))
  const pick = sorted.find((p) => p.state === 'in_progress') ?? sorted.find((p) => p.state === 'ready')
  return {
    ...map,
    points: map.points.map((point) => ({
      ...point,
      recommendation: point === pick ? { source: 'system' as const } : null,
    })),
  }
}

const cache = new Map<FixtureSize, KnowledgeMap>()

export function planetFixture(size: FixtureSize): KnowledgeMap {
  const hit = cache.get(size)
  if (hit) return hit
  const map = size === 10 ? (small as KnowledgeMap) : generate(size, size <= 500 ? 12 : 18)
  cache.set(size, map)
  return map
}
