/*
 * Where the planet's data comes from. For now, fixtures (#47); #48 swaps the
 * body of this hook for a query of `GET /practice/knowledge-map?subjectId=`
 * through `src/services` (the API contract check only reads that directory).
 *
 * The fixture subject answers to both `math` and `mathematics`, as the real
 * endpoint will (stoa-backend#62); any other subject is an empty planet, which
 * is what the backend returns for a subject with no content -- never a 404.
 */
import { useMemo } from 'react'
import { isFixtureSize, planetFixture, type FixtureSize } from '@/features/planet/fixtures/planetFixtures'
import type { KnowledgeMap } from '@/features/planet/model/knowledgeMap'

/** The subject `/` opens. #48: the last one opened, else the first with content. */
export const DEFAULT_SUBJECT_ID = 'math'

const FIXTURE_SUBJECTS = new Set(['math', 'mathematics'])

function emptyPlanet(subjectId: string): KnowledgeMap {
  return {
    subject: { subjectId, name: subjectId },
    regions: [],
    points: [],
    edges: [],
    summary: { lit: 0, total: 0, streakDays: 0, score: 0 },
    planets: [],
  }
}

/** `?points=500` or `?points=2000` draws a bigger fixture planet; default 10. */
export function fixtureSizeFrom(search: URLSearchParams): FixtureSize {
  const asked = Number(search.get('points'))
  return isFixtureSize(asked) ? asked : 10
}

export function usePlanetMap(subjectId: string, size: FixtureSize): KnowledgeMap {
  return useMemo(() => {
    const normal = subjectId.trim().toLowerCase()
    return FIXTURE_SUBJECTS.has(normal) ? planetFixture(size) : emptyPlanet(subjectId)
  }, [subjectId, size])
}
