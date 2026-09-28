/**
 * The fixture planets keep the shape and the rules of the stoa-backend#59
 * read model (#9, #47), so the renderer is built against what the endpoint
 * will send.
 */
import { describe, expect, it } from 'vitest'
import { FIXTURE_SIZES, planetFixture } from '@/features/planet/fixtures/planetFixtures'
import { LEARNING_STATES, orderedPoints } from '@/features/planet/model/knowledgeMap'

describe.each(FIXTURE_SIZES)('the %i-point fixture', (size) => {
  const map = planetFixture(size)

  it('has exactly that many points, each in a region it lists', () => {
    expect(map.points).toHaveLength(size)
    const regions = new Set(map.regions.map((region) => region.topicId))
    expect(regions.size).toBe(map.regions.length)
    for (const point of map.points) expect(regions.has(point.regionId)).toBe(true)
    expect(new Set(map.points.map((point) => point.unitId)).size).toBe(size)
  })

  it('shows every learning state, a point due for review, and one with all lessons done but not lit', () => {
    for (const state of LEARNING_STATES) expect(map.points.some((point) => point.state === state)).toBe(true)
    expect(map.points.some((point) => point.reviewDue > 0)).toBe(true)
    expect(
      map.points.some(
        (point) => point.state === 'in_progress' && point.chapter.lessonsDone === point.chapter.lessonCount && point.unmetExercises > 0,
      ),
    ).toBe(true)
  })

  it('recommends one point, chosen the way the backend chooses (#9 point 8)', () => {
    const recommended = map.points.filter((point) => point.recommendation)
    expect(recommended).toHaveLength(1)
    const ordered = orderedPoints(map)
    const expected = ordered.find((point) => point.state === 'in_progress') ?? ordered.find((point) => point.state === 'ready')
    expect(recommended[0].unitId).toBe(expected?.unitId)
  })

  it('places every point on the sphere', () => {
    for (const point of map.points) {
      expect(point.lat).toBeGreaterThanOrEqual(-90)
      expect(point.lat).toBeLessThanOrEqual(90)
      expect(point.lng).toBeGreaterThanOrEqual(-180)
      expect(point.lng).toBeLessThanOrEqual(180)
      expect(point.progress).toBeGreaterThanOrEqual(0)
      expect(point.progress).toBeLessThanOrEqual(1)
    }
  })

  it('counts its lit points in the summary', () => {
    expect(map.summary.total).toBe(size)
    expect(map.summary.lit).toBe(map.points.filter((point) => point.state === 'lit').length)
  })
})
