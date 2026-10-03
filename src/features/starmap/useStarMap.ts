/*
 * The star map the route draws, from the star map source (`starMapSource.ts`,
 * #131). In the application that is an empty sky until #48 wires the read
 * model (stoa-backend#59) in here; the design preview and the bench inject
 * the demo sky from `src/dev`. No demo data is imported from here.
 */
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { StarMap } from '@/features/starmap/model/starMap'
import { isFixtureSize, useStarMapSource, type FixtureSize } from '@/features/starmap/starMapSource'
import { isSupportedLanguage } from '@/i18n/languages'

/** The sky size the route asks a demo source for when `?points=` says nothing. */
export const DEMO_STAR_COUNT: FixtureSize = 1000

export const DEFAULT_SUBJECT_ID = 'math'

/** Benchmark-only fixture sizes; default is the curated demonstration. */
export function fixtureSizeFrom(search: URLSearchParams, fallback: FixtureSize = 10): FixtureSize {
  const asked = Number(search.get('points'))
  return isFixtureSize(asked) ? asked : fallback
}

export function foveationFrom(search: URLSearchParams): boolean {
  return search.get('foveation') !== 'off'
}

export function useStarMap(subjectId: string, size: FixtureSize, relations = false, longNames = false): StarMap {
  const { t, i18n } = useTranslation('starmap')
  const resolved = i18n.resolvedLanguage ?? i18n.language
  const language = isSupportedLanguage(resolved) ? resolved : 'en'
  const source = useStarMapSource() // #131: empty in production; the preview's and the bench's give the demo sky.
  return useMemo(
    () => source.read({ subjectId, size, t, language, relations, longNames }),
    [subjectId, size, t, language, relations, longNames, source],
  )
}
