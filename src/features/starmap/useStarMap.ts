/*
 * Where the star map's data comes from. For now, fixtures (#47); #48 swaps
 * the body of this hook for a query of `GET /practice/knowledge-map?subjectId=`
 * through `src/services` (the API contract check only reads that directory).
 *
 * The fixture subject answers to both `math` and `mathematics`, as the real
 * endpoint will (stoa-backend#62); any other subject is an empty map, which
 * is what the backend returns for a subject with no content -- never a 404.
 */
import { useMemo } from 'react'
import { isFixtureSize, starMapFixture, type FixtureSize } from '@/features/starmap/fixtures/starMapFixtures'
import type { StarMap } from '@/features/starmap/model/starMap'

/** The subject `/` opens. #48: the last one opened, else the first with content. */
export const DEFAULT_SUBJECT_ID = 'math'

const FIXTURE_SUBJECTS = new Set(['math', 'mathematics'])

function emptyMap(subjectId: string, subjects: StarMap['subjects']): StarMap {
  const known = subjects.find((subject) => subject.subjectId === subjectId)
  return {
    subject: { subjectId, name: known?.name ?? subjectId },
    nebulae: [],
    stars: [],
    prerequisites: [],
    summary: { lit: 0, total: 0, streakDays: 0, score: 0 },
    subjects,
  }
}

/** `?points=500`, `1000` or `2000` draws a bigger fixture map; default 10. */
export function fixtureSizeFrom(search: URLSearchParams): FixtureSize {
  const asked = Number(search.get('points'))
  return isFixtureSize(asked) ? asked : 10
}

/** `?foveation=off` draws every nebula star by star, for the phone bench (#44); on otherwise. */
export function foveationFrom(search: URLSearchParams): boolean {
  return search.get('foveation') !== 'off'
}

export function useStarMap(subjectId: string, size: FixtureSize): StarMap {
  return useMemo(() => {
    const fixture = starMapFixture(size)
    return FIXTURE_SUBJECTS.has(subjectId.trim().toLowerCase()) ? fixture : emptyMap(subjectId, fixture.subjects)
  }, [subjectId, size])
}
