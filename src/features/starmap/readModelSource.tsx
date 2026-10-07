/*
 * The production star map source (#48): the sky the backend read model returns.
 *
 * `starMapSource.ts` left the application on `emptyStarMapSource` so no demo
 * data could reach a production bundle (#131). This is what replaces it: the
 * same seam, fed by `GET /practice/knowledge-map` (stoa-backend#59).
 *
 * `StarMapSource.read` has to be pure and synchronous - a new source object is
 * how the view learns the states changed - so the request lives in a query
 * here and `read` only projects whatever that query has already resolved.
 * While it is loading, or if it fails, the source reads as the empty sky: the
 * route already draws that as "your star map is on its way", which is the
 * honest thing to show when we do not yet know what the student's sky holds.
 *
 * `demo` stays false. The Demo notice belongs to the design preview and the
 * bench; a student looking at their own knowledge points is not looking at a
 * demonstration.
 */
import { useQuery } from '@tanstack/react-query'
import { useMemo, type ReactNode } from 'react'
import {
  StarMapSourceContext,
  emptyStarMap,
  emptyStarMapSource,
  useStarMapSource,
  type StarMapRequest,
  type StarMapSource,
} from '@/features/starmap/starMapSource'
import type { StarMap } from '@/features/starmap/model/starMap'
import { nebulaLinks } from '@/features/starmap/model/links'
import { layoutSky } from '@/features/starmap/layout/layout'
import { getKnowledgeMap } from '@/services/practice/practiceApi'
import { useAuthStore } from '@/store/authStore'
import { practiceQueryKeys } from '@/services/practice/practiceQueryKeys'
import type { KnowledgeMapResponse } from '@/types/practice'

/** How long a sky stays fresh. Learning states move when a lesson is finished,
 *  not between two glances at the map, so this is minutes rather than seconds. */
export const KNOWLEDGE_MAP_STALE_MS = 2 * 60 * 1000

/**
 * One seed for every sky, so a student's map keeps its arrangement between
 * visits and between devices. The same number the demo sky uses, so what the
 * design was accepted against is what real content is laid out by.
 */
const LAYOUT_SEED = 116

/**
 * Place the sky the way the demo sky is placed: with the layout engine, not
 * with the coordinates the read model sends.
 *
 * The backend derives `(x, y)` deterministically from identifiers as a
 * stand-in for the offline layout (stoa-backend#60). Passed straight through,
 * that put every nebula on one thin horizontal band and the student landed
 * zoomed into a single star with the rest of their subject off-screen -
 * measured on production: 1 of 10 knowledge points visible.
 *
 * `layoutSky` is the engine the design was accepted against: it groups a
 * galaxy's nebulae by their relations, sizes each by its star count, and
 * scatters stars inside them. Running it here costs one pass over the sky and
 * makes real content look like what was signed off.
 */
function placed(sky: KnowledgeMapResponse): KnowledgeMapResponse['stars'] {
  const starsPerNebula = new Map<string, number>()
  for (const star of sky.stars) {
    starsPerNebula.set(star.nebulaId, (starsPerNebula.get(star.nebulaId) ?? 0) + 1)
  }
  const layout = layoutSky(
    sky.galaxies.map((galaxy) => ({
      id: galaxy.subjectId,
      nebulae: sky.nebulae
        .filter((nebula) => nebula.subjectId === galaxy.subjectId)
        .map((nebula) => ({
          id: nebula.topicId,
          order: nebula.order,
          size: starsPerNebula.get(nebula.topicId) ?? 1,
        })),
    })),
    sky.stars,
    nebulaLinks({ stars: sky.stars as never, prerequisites: sky.prerequisites }),
    LAYOUT_SEED,
  )
  return sky.stars.map((star) => ({ ...star, ...(layout.stars.get(star.unitId) ?? { x: star.x, y: star.y }) }))
}

export function projectStarMap(response: KnowledgeMapResponse, { subjectId }: StarMapRequest): StarMap {
  const sky = { ...response, stars: placed(response) }
  const focus = subjectId || sky.subjectId
  const nebulaeOfFocus = new Set(
    sky.nebulae.filter((nebula) => nebula.subjectId === focus).map((nebula) => nebula.topicId),
  )
  const named = sky.galaxies.find((galaxy) => galaxy.subjectId === focus)
  const stars = sky.stars.filter((star) => nebulaeOfFocus.has(star.nebulaId))
  const unitIds = new Set(stars.map((star) => star.unitId))
  return {
    subject: { subjectId: focus, name: named?.name ?? '' },
    subjects: sky.galaxies,
    nebulae: sky.nebulae,
    stars: sky.stars,
    prerequisites: sky.prerequisites,
    summary: {
      // The galaxy in focus, not the whole sky: the counts under the title
      // belong to the subject the student is looking at.
      lit: stars.filter((star) => star.state === 'lit').length,
      total: unitIds.size,
      streakDays: sky.summary.streakDays,
      score: sky.summary.score,
    },
  }
}

/**
 * Put the read model behind the star map for everything under it.
 *
 * Mounted once, around the signed-in application: the sky is the same for
 * every route that draws it, and one query serves them all.
 */
export function KnowledgeMapSourceProvider({ children }: { children: ReactNode }) {
  // Somebody above may already have supplied a sky — the design preview, the
  // bench, a test. This sits inside the router, so without yielding to them it
  // would silently replace theirs with the read model's and no override would
  // ever take effect.
  const provided = useStarMapSource()
  if (provided !== emptyStarMapSource) return <>{children}</>
  return <ReadModelSource>{children}</ReadModelSource>
}

function ReadModelSource({ children }: { children: ReactNode }) {
  // Only a signed-in student has a sky. Asking for one from the sign-in page,
  // or as a parent or teacher, would be a request that can only be refused.
  const isStudent = useAuthStore(
    (state) => Boolean(state.isAuthenticated) && state.user?.role === 'student',
  )

  // The whole sky, once. The galaxy in focus is a projection the route asks
  // `read` for, and the route derives it from this very source - so keying the
  // query by subject would make every switch of galaxy a fetch, and the first
  // read a chicken-and-egg.
  const { data } = useQuery({
    queryKey: practiceQueryKeys.knowledgeMap(''),
    queryFn: () => getKnowledgeMap(),
    enabled: isStudent,
    staleTime: KNOWLEDGE_MAP_STALE_MS,
    // A sky that could not be read is drawn as an empty one by the route. It
    // is not worth hammering the API for: the student can reload.
    retry: 1,
  })

  const source = useMemo<StarMapSource>(
    () => ({
      read: (request) => (data ? projectStarMap(data, request) : emptyStarMap(request.subjectId)),
      demo: false,
    }),
    [data],
  )

  return <StarMapSourceContext.Provider value={source}>{children}</StarMapSourceContext.Provider>
}
