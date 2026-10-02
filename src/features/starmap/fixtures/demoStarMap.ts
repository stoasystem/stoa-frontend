/*
 * One galaxy of the demo sky (`demoSky.ts`), as the one-subject `StarMap` the
 * renderer draws until #119 draws the whole sky. Visual placeholders only:
 * stoa-backend#59 will supply the actual curriculum and progress.
 *
 * Positions come from `demoGalaxyPositions` (#110's star-light layout).
 * Prerequisites are left out unless `relations` asks for them (the
 * `&relations=fixture` dev switch); then only those inside the subject, as a
 * one-subject map cannot draw a star of another one. The sky keeps the
 * cross-subject ones.
 */
import type { TFunction } from 'i18next'
import { demoGalaxyPositions } from '@/features/starmap/fixtures/demoGalaxy'
import { demoSky } from '@/features/starmap/fixtures/demoSky'
import type { FixtureSize } from '@/features/starmap/fixtures/starMapFixtures'
import type { StarMap } from '@/features/starmap/model/starMap'
import type { SupportedLanguage } from '@/i18n/languages'

export type DemoStarMapOptions = {
  language?: SupportedLanguage
  /** Show the subject's own prerequisites (dev switch). */
  relations?: boolean
  /** Replace nebula names with long ones, to check labels in four languages (dev switch). */
  longNames?: boolean
}

const normalSubjectId = (subjectId: string) => {
  const id = subjectId.trim().toLowerCase()
  return id === 'mathematics' ? 'math' : id
}

export function demoStarMap(
  subjectId: string,
  size: FixtureSize,
  t: TFunction<'starmap'>,
  { language = 'en', relations = false, longNames = false }: DemoStarMapOptions = {},
): StarMap {
  const sky = demoSky(size, language)
  const id = normalSubjectId(subjectId)
  const galaxy = sky.galaxies.find((candidate) => candidate.subjectId === id)
  const subject = { subjectId: id, name: galaxy?.name ?? id }
  const subjects = sky.galaxies
  const nebulae = sky.nebulae.filter((nebula) => nebula.subjectId === id)
  const topics = new Set(nebulae.map((nebula) => nebula.topicId))
  const stars = sky.stars.filter((star) => topics.has(star.nebulaId))
  if (!galaxy || stars.length === 0) {
    return { subject, nebulae: [], stars: [], prerequisites: [], subjects, summary: { lit: 0, total: 0, streakDays: 0, score: 0 } }
  }
  const units = new Set(stars.map((star) => star.unitId))
  const positions = demoGalaxyPositions(stars)
  return {
    subject,
    subjects,
    summary: { ...sky.summary, lit: galaxy.lit, total: galaxy.total },
    prerequisites: relations ? sky.prerequisites.filter((edge) => units.has(edge.from) && units.has(edge.to)) : [],
    nebulae: longNames ? nebulae.map((nebula, index) => ({ ...nebula, name: t('demo.longNebula', { index: index + 1 }) })) : nebulae,
    stars: stars.map((star, index) => ({ ...star, ...positions[index] })),
  }
}

/** The subject to open: the last one, else the first the student takes that has stars. */
export function defaultDemoSubject(last: string | undefined, subjects: StarMap['subjects']): string {
  return subjects.find((s) => s.subjectId === last)?.subjectId
    ?? subjects.find((s) => s.enrolled && s.total > 0)?.subjectId
    ?? subjects.find((s) => s.total > 0)?.subjectId
    ?? subjects[0]?.subjectId
    ?? 'math'
}
