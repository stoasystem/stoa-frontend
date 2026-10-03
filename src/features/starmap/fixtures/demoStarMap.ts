/*
 * The demo sky (`demoSky.ts`) as the `StarMap` the renderer draws (#119):
 * every galaxy's nebulae and stars, with `subject` the galaxy in focus -- the
 * route's `/map/:subjectId`, the header and the switcher -- and `summary`
 * that galaxy's lit count. Visual placeholders only: stoa-backend#59 will
 * supply the actual curriculum and progress.
 *
 * The nebulae and stars are the same arrays whichever galaxy is in focus, so
 * flying from one galaxy to another hands the engine the same sky (it keeps
 * its tiles and only moves the camera).
 *
 * Prerequisites are left out unless `relations` asks for them (the
 * `&relations=fixture` dev switch); then all of them, across subjects too.
 */
import type { TFunction } from 'i18next'
import { demoSky, type FixtureSize } from '@/features/starmap/fixtures/demoSky'
import type { Nebula, StarMap } from '@/features/starmap/model/starMap'
import type { SupportedLanguage } from '@/i18n/languages'

export type DemoStarMapOptions = {
  language?: SupportedLanguage
  /** Show the sky's prerequisites (dev switch). */
  relations?: boolean
  /** Replace nebula names with long ones, to check labels in four languages (dev switch). */
  longNames?: boolean
}

const normalSubjectId = (subjectId: string) => {
  const id = subjectId.trim().toLowerCase()
  return id === 'mathematics' ? 'math' : id
}

type SkyParts = Pick<StarMap, 'nebulae' | 'stars' | 'prerequisites'>
const parts = new Map<string, SkyParts>()

function skyParts(size: FixtureSize, t: TFunction<'starmap'>, language: SupportedLanguage, relations: boolean, longNames: boolean): SkyParts {
  const key = `${size}:${language}:${relations}:${longNames}`
  const hit = parts.get(key)
  if (hit) return hit
  const sky = demoSky(size, language)
  // Nebulae in band order: galaxy by galaxy from the left, then by topic order.
  const along = Object.entries(sky.galaxyBoxes).sort(([, a], [, b]) => a.x0 - b.x0).map(([id]) => id)
  const nebulae: Nebula[] = [...sky.nebulae]
    .sort((a, b) => along.indexOf(a.subjectId) - along.indexOf(b.subjectId) || a.order - b.order)
    .map((nebula, index) => ({
      topicId: nebula.topicId,
      subjectId: nebula.subjectId,
      order: index + 1,
      name: longNames ? t('demo.longNebula', { index: index + 1 }) : nebula.name,
    }))
  const made: SkyParts = { nebulae, stars: sky.stars, prerequisites: relations ? sky.prerequisites : [] }
  parts.set(key, made)
  return made
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
  if (!galaxy || galaxy.total === 0) {
    return { subject, nebulae: [], stars: [], prerequisites: [], subjects, summary: { lit: 0, total: 0, streakDays: 0, score: 0 } }
  }
  return {
    subject,
    subjects,
    summary: { ...sky.summary, lit: galaxy.lit, total: galaxy.total },
    ...skyParts(size, t, language, relations, longNames),
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
