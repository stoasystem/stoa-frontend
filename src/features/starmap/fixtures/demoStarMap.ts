/** Visual placeholders only; backend #59 will supply the actual curriculum and progress. */
import type { TFunction } from 'i18next'
import { starMapFixture, type FixtureSize } from '@/features/starmap/fixtures/starMapFixtures'
import { demoGalaxyPositions } from '@/features/starmap/fixtures/demoGalaxy'
import type { StarMap } from '@/features/starmap/model/starMap'

export function demoStarMap(subjectId: string, size: FixtureSize, t: TFunction<'starmap'>, relations = false, longNames = false): StarMap {
  const fixture = starMapFixture(size)
  const id = subjectId.trim().toLowerCase() === 'mathematics' ? 'math' : subjectId.trim().toLowerCase()
  const subjects = [
    { subjectId: 'math', name: t('demo.subjects.math'), lit: fixture.summary.lit, total: size },
    { subjectId: 'physics', name: t('demo.subjects.physics'), lit: fixture.summary.lit, total: size },
    { subjectId: 'german', name: t('demo.subjects.german'), lit: 0, total: 0 },
  ]
  const subject = { subjectId: id, name: subjects.find((s) => s.subjectId === id)?.name ?? id }
  if (id !== 'math' && id !== 'physics') return {
    subject, nebulae: [], stars: [], prerequisites: [], subjects,
    summary: { lit: 0, total: 0, streakDays: 0, score: 0 },
  }
  const positions = demoGalaxyPositions(fixture.stars)
  return {
    ...fixture, subject, subjects,
    prerequisites: relations ? fixture.prerequisites : [], // Dev-only relationship fixture; no backend claim.
    nebulae: fixture.nebulae.map((n, index) => ({ ...n, name: t(longNames ? 'demo.longNebula' : 'demo.sampleNebula', { index: index + 1 }) })),
    stars: fixture.stars.map((s, index) => ({
      ...s, ...positions[index], name: t('demo.sampleStar', { index: index + 1 }), unmetExercises: 0, skills: [],
      chapter: { lessonCount: 0, lessonsDone: 0, nextLesson: null },
    })),
  }
}

export function defaultDemoSubject(last: string | undefined, subjects: StarMap['subjects']): string {
  return subjects.find((s) => s.subjectId === last)?.subjectId
    ?? subjects.find((s) => s.total > 0)?.subjectId
    ?? subjects[0]?.subjectId
    ?? 'math'
}
