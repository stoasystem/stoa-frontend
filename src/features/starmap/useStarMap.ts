/** Fixture source for the demo. Backend #59 will replace this hook with a service query. */
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { isFixtureSize, type FixtureSize } from '@/features/starmap/fixtures/starMapFixtures'
import { demoStarMap } from '@/features/starmap/fixtures/demoStarMap'
import type { StarMap } from '@/features/starmap/model/starMap'

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
  const { t } = useTranslation('starmap')
  return useMemo(() => demoStarMap(subjectId, size, t, relations, longNames), [subjectId, size, t, relations, longNames])
}
