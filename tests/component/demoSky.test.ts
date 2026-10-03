/**
 * The design preview's sky (#116): one sky for every subject (ADR 0001), one
 * demo knowledge point, placeholder stars in all four learning states, and
 * prerequisites -- across subjects too -- that keep those states true.
 */
import { describe, expect, it } from 'vitest'
import { DEMO_BRIDGE_STAR, DEMO_KNOWLEDGE_POINT, demoSky, demoStarKind } from '@/features/starmap/fixtures/demoSky'
import { FIXTURE_SIZES } from '@/features/starmap/fixtures/demoSky'
import { crossSubjectPrerequisites, LEARNING_STATES, type Sky } from '@/features/starmap/model/starMap'
import { supportedLanguages } from '@/i18n/languages'

const subjectOf = (sky: Sky) => {
  const byTopic = new Map(sky.nebulae.map((nebula) => [nebula.topicId, nebula.subjectId]))
  return new Map(sky.stars.map((star) => [star.unitId, byTopic.get(star.nebulaId)!]))
}

describe.each(FIXTURE_SIZES)('the %i-star demo sky', (size) => {
  const sky = demoSky(size)
  const stateOf = new Map(sky.stars.map((star) => [star.unitId, star.state]))
  const galaxyOf = subjectOf(sky)

  it('has exactly that many stars, each in a nebula of a galaxy it lists', () => {
    expect(sky.stars).toHaveLength(size)
    expect(new Set(sky.stars.map((star) => star.unitId)).size).toBe(size)
    const galaxies = new Set(sky.galaxies.map((galaxy) => galaxy.subjectId))
    const topics = new Set(sky.nebulae.map((nebula) => nebula.topicId))
    for (const nebula of sky.nebulae) expect(galaxies.has(nebula.subjectId)).toBe(true)
    for (const star of sky.stars) expect(topics.has(star.nebulaId)).toBe(true)
    for (const star of sky.stars) {
      expect(star.x).toBeGreaterThanOrEqual(0)
      expect(star.x).toBeLessThanOrEqual(1)
      expect(star.y).toBeGreaterThanOrEqual(0)
      expect(star.y).toBeLessThanOrEqual(1)
    }
  })

  it('holds mathematics and physics, which the student takes, and chemistry, which they do not, each in nebulae', () => {
    expect(sky.galaxies.map((galaxy) => [galaxy.subjectId, galaxy.enrolled])).toEqual([
      ['math', true],
      ['physics', true],
      ['chemistry', false],
    ])
    for (const galaxy of sky.galaxies) {
      expect(sky.nebulae.filter((nebula) => nebula.subjectId === galaxy.subjectId).length).toBeGreaterThanOrEqual(2)
      const own = sky.stars.filter((star) => galaxyOf.get(star.unitId) === galaxy.subjectId)
      expect(galaxy.total).toBe(own.length)
      expect(galaxy.lit).toBe(own.filter((star) => star.state === 'lit').length)
    }
    expect(sky.summary).toMatchObject({ total: size, lit: sky.stars.filter((star) => star.state === 'lit').length })
  })

  it('shows every learning state, review due, skill dots, and nothing learnt in a subject not taken', () => {
    for (const state of LEARNING_STATES) expect(sky.stars.some((star) => star.state === state)).toBe(true)
    expect(sky.stars.some((star) => star.reviewDue > 0)).toBe(true)
    expect(sky.stars.some((star) => star.skills.length > 0 && demoStarKind(star.unitId) === 'placeholder')).toBe(true)
    const chemistry = sky.stars.filter((star) => galaxyOf.get(star.unitId) === 'chemistry')
    expect(chemistry.every((star) => star.state === 'ready' || star.state === 'locked')).toBe(true)
    expect(chemistry.every((star) => star.reviewDue === 0 && star.progress === 0)).toBe(true)
  })

  it('has exactly one star with a chapter: the demo knowledge point, in mathematics trigonometry', () => {
    const withChapter = sky.stars.filter((star) => star.chapter.lessonCount > 0)
    expect(withChapter.map((star) => star.unitId)).toEqual([DEMO_KNOWLEDGE_POINT.unitId])
    expect(sky.knowledgePointId).toBe(DEMO_KNOWLEDGE_POINT.unitId)
    const point = withChapter[0]
    expect(point).toMatchObject({ nebulaId: 'trigonometry', state: 'in_progress', recommendation: { source: 'system' } })
    expect(point.chapter.lessonCount).toBe(DEMO_KNOWLEDGE_POINT.lessons.length)
    expect(point.chapter.lessonsDone).toBe(DEMO_KNOWLEDGE_POINT.lessonsDone)
    expect(point.skills.length).toBeGreaterThan(0)
    for (const star of sky.stars) {
      expect(demoStarKind(star.unitId)).toBe(star === point ? 'knowledge_point' : 'placeholder')
    }
  })

  it('recommends at most one star per subject the student takes, and none in another', () => {
    for (const galaxy of sky.galaxies) {
      const recommended = sky.stars.filter((star) => star.recommendation && galaxyOf.get(star.unitId) === galaxy.subjectId)
      expect(recommended).toHaveLength(galaxy.enrolled ? 1 : 0)
      for (const star of recommended) expect(['in_progress', 'ready']).toContain(star.state)
    }
  })

  it('keeps learning states true to the prerequisites: ready means all lit, locked means one is not', () => {
    for (const edge of sky.prerequisites) {
      expect(stateOf.has(edge.from)).toBe(true)
      expect(stateOf.has(edge.to)).toBe(true)
    }
    for (const star of sky.stars) {
      const before = sky.prerequisites.filter((edge) => edge.to === star.unitId).map((edge) => stateOf.get(edge.from))
      if (star.state === 'locked') expect(before.some((state) => state !== 'lit')).toBe(true)
      else expect(before.every((state) => state === 'lit')).toBe(true)
    }
  })

  it('has no cycle of prerequisites', () => {
    const next = new Map<string, string[]>()
    for (const { from, to } of sky.prerequisites) next.set(from, [...(next.get(from) ?? []), to])
    const mark = new Map<string, 1 | 2>()
    const visit = (id: string): boolean => {
      if (mark.get(id) === 2) return true
      if (mark.get(id) === 1) return false
      mark.set(id, 1)
      const ok = (next.get(id) ?? []).every(visit)
      mark.set(id, 2)
      return ok
    }
    expect(sky.stars.every((star) => visit(star.unitId))).toBe(true)
  })

  it('crosses subjects: physics optics needs mathematics trigonometry, and Refraction waits for the demo knowledge point', () => {
    const cross = crossSubjectPrerequisites(sky)
    const nebulaOf = new Map(sky.stars.map((star) => [star.unitId, star.nebulaId]))
    expect(cross.some((edge) => nebulaOf.get(edge.from) === 'trigonometry' && nebulaOf.get(edge.to) === 'optics')).toBe(true)
    expect(cross).toContainEqual({ from: DEMO_KNOWLEDGE_POINT.unitId, to: DEMO_BRIDGE_STAR })
    const unlit = sky.prerequisites.filter((edge) => edge.to === DEMO_BRIDGE_STAR && stateOf.get(edge.from) !== 'lit')
    expect(unlit).toEqual([{ from: DEMO_KNOWLEDGE_POINT.unitId, to: DEMO_BRIDGE_STAR }])
    // And prerequisites inside a subject, inside a nebula and between two.
    const inSubject = sky.prerequisites.filter((edge) => galaxyOf.get(edge.from) === galaxyOf.get(edge.to))
    expect(inSubject.some((edge) => nebulaOf.get(edge.from) === nebulaOf.get(edge.to))).toBe(true)
    expect(inSubject.some((edge) => nebulaOf.get(edge.from) !== nebulaOf.get(edge.to))).toBe(true)
  })

  it('is the same sky every time', () => {
    const again = demoSky(size, 'de')
    expect(again.stars.map((star) => [star.unitId, star.state, star.x, star.y])).toEqual(
      sky.stars.map((star) => [star.unitId, star.state, star.x, star.y]),
    )
    expect(again.prerequisites).toEqual(sky.prerequisites)
  })
})

describe('the default demo sky', () => {
  const sky = demoSky(1000)

  it('gives the nebulae of the subjects taken lit ratios from none to most, to judge their brightness by', () => {
    const enrolled = new Set(sky.galaxies.filter((galaxy) => galaxy.enrolled).map((galaxy) => galaxy.subjectId))
    const ratios = sky.nebulae
      .filter((nebula) => enrolled.has(nebula.subjectId))
      .map((nebula) => {
        const own = sky.stars.filter((star) => star.nebulaId === nebula.topicId)
        return own.filter((star) => star.state === 'lit').length / own.length
      })
    expect(Math.min(...ratios)).toBe(0)
    expect(Math.max(...ratios)).toBeGreaterThan(0.6)
    const buckets = new Set(ratios.map((ratio) => Math.min(4, Math.floor(ratio * 5))))
    expect(buckets.size).toBeGreaterThanOrEqual(4)
  })

  it.each(supportedLanguages)('names every galaxy, nebula, star and skill in %s', (language) => {
    const named = demoSky(1000, language)
    const english = new Map(sky.nebulae.map((nebula) => [nebula.topicId, nebula.name]))
    const labels = [
      ...named.galaxies.map((galaxy) => galaxy.name),
      ...named.nebulae.map((nebula) => nebula.name),
      ...named.stars.flatMap((star) => [star.name, ...star.skills.map((skill) => skill.name)]),
    ]
    for (const label of labels) expect(label.trim()).not.toBe('')
    if (language !== 'en') {
      expect(named.nebulae.some((nebula) => nebula.name !== english.get(nebula.topicId))).toBe(true)
      expect(named.galaxies.find((galaxy) => galaxy.subjectId === 'math')?.name).not.toBe('Mathematics')
    }
  })
})
