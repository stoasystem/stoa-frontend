/**
 * The fixture star maps keep the shape and the rules of the stoa-backend#59
 * read model (#9, #47, #72), so the renderer is built against what the
 * endpoint will send.
 */
import { describe, expect, it } from 'vitest'
import { FIXTURE_SIZES, starMapFixture } from '@/features/starmap/fixtures/starMapFixtures'
import { LEARNING_STATES, orderedStars } from '@/features/starmap/model/starMap'
import { fixtureSizeFrom, foveationFrom } from '@/features/starmap/useStarMap'

describe.each(FIXTURE_SIZES)('the %i-point fixture', (size) => {
  const map = starMapFixture(size)

  it('has exactly that many stars, each in a nebula it lists', () => {
    expect(map.stars).toHaveLength(size)
    const regions = new Set(map.nebulae.map((nebula) => nebula.topicId))
    expect(regions.size).toBe(map.nebulae.length)
    for (const point of map.stars) expect(regions.has(point.nebulaId)).toBe(true)
    expect(new Set(map.stars.map((point) => point.unitId)).size).toBe(size)
  })

  it('shows every learning state, a star due for review, and one with all lessons done but not lit', () => {
    for (const state of LEARNING_STATES) expect(map.stars.some((point) => point.state === state)).toBe(true)
    expect(map.stars.some((point) => point.reviewDue > 0)).toBe(true)
    expect(
      map.stars.some(
        (point) => point.state === 'in_progress' && point.chapter.lessonsDone === point.chapter.lessonCount && point.unmetExercises > 0,
      ),
    ).toBe(true)
  })

  it('recommends one star, chosen the way the backend chooses (#9 point 8)', () => {
    const recommended = map.stars.filter((point) => point.recommendation)
    expect(recommended).toHaveLength(1)
    const ordered = orderedStars(map)
    const expected = ordered.find((point) => point.state === 'in_progress') ?? ordered.find((point) => point.state === 'ready')
    expect(recommended[0].unitId).toBe(expected?.unitId)
  })

  it('keeps progress in [0, 1] and prerequisites between stars it has', () => {
    const ids = new Set(map.stars.map((star) => star.unitId))
    for (const point of map.stars) {
      expect(point.progress).toBeGreaterThanOrEqual(0)
      expect(point.progress).toBeLessThanOrEqual(1)
    }
    expect(map.prerequisites.length).toBeGreaterThan(0)
    for (const edge of map.prerequisites) {
      expect(ids.has(edge.from)).toBe(true)
      expect(ids.has(edge.to)).toBe(true)
    }
  })

  it('offers a subject switcher with this subject in it', () => {
    expect(map.subjects.map((subject) => subject.subjectId)).toContain(map.subject.subjectId)
    expect(map.subjects.length).toBeGreaterThan(1)
  })

  it('counts its lit stars in the summary', () => {
    expect(map.summary.total).toBe(size)
    expect(map.summary.lit).toBe(map.stars.filter((point) => point.state === 'lit').length)
  })
})

describe('the fixture size in the URL (#44)', () => {
  it('offers the three sizes the phone bench measures: 500, 1000 and 2000', () => {
    for (const size of [500, 1000, 2000]) {
      expect(fixtureSizeFrom(new URLSearchParams(`points=${size}`))).toBe(size)
    }
  })

  it('falls back to the hand-written map for anything else', () => {
    expect(fixtureSizeFrom(new URLSearchParams('points=750'))).toBe(10)
    expect(fixtureSizeFrom(new URLSearchParams(''))).toBe(10)
  })
})

describe('the foveation switch in the URL (#44)', () => {
  it('is on unless the URL says foveation=off', () => {
    expect(foveationFrom(new URLSearchParams(''))).toBe(true)
    expect(foveationFrom(new URLSearchParams('foveation=on'))).toBe(true)
    expect(foveationFrom(new URLSearchParams('foveation=off'))).toBe(false)
  })
})
