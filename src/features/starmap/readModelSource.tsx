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
 * While it is loading, or if it fails, `read` gives the empty sky, and
 * `status` says which of the two it is (#329): the route draws a skeleton
 * while the sky is on the wire, an error with a retry when it could not be
 * read, and "your star map is on its way" only for a sky that came back empty.
 *
 * `demo` stays false. The Demo notice belongs to the design preview and the
 * bench; a student looking at their own knowledge points is not looking at a
 * demonstration.
 */
import { useMemo, type ReactNode } from 'react'
import {
  StarMapSourceContext,
  emptyStarMap,
  emptyStarMapSource,
  useStarMapSource,
  type StarMapRequest,
  type StarMapSource,
} from '@/features/starmap/starMapSource'
import type { Star, StarMap } from '@/features/starmap/model/starMap'
import { nebulaLinks } from '@/features/starmap/model/links'
import { layoutSky } from '@/features/starmap/layout/layout'
import { useKnowledgeMapQuery } from '@/hooks/practice/useKnowledgeMapQuery'
import { useAuthStore } from '@/store/authStore'
import type { KnowledgeMapResponse } from '@/types/practice'

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
function placed(sky: KnowledgeMapResponse): Star[] {
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
  return sky.stars.map((star) => ({ ...asStar(star, sky), ...(layout.stars.get(star.unitId) ?? { x: star.x, y: star.y }) }))
}

/**
 * A star of the read model as the map reads it. In the gap between two
 * deploys a backend from before ADR 0004 still says `locked`, and leaves out
 * `unlitPrerequisiteIds` (stoa-backend#125): such a star is ready, with its
 * unlit prerequisites worked out from the edges, so it opens like any other
 * and nothing breaks.
 */
function asStar(star: KnowledgeMapResponse['stars'][number], sky: KnowledgeMapResponse): Star {
  return { ...star, state: star.state === 'locked' ? 'ready' : star.state, unlitPrerequisiteIds: unlitPrerequisiteIdsOf(star, sky) }
}

/** A star's prerequisites not lit yet: as the backend sends them, else worked out from the edges (see `asStar`). */
export function unlitPrerequisiteIdsOf(
  star: KnowledgeMapResponse['stars'][number],
  sky: Pick<KnowledgeMapResponse, 'stars' | 'prerequisites'>,
): string[] {
  if (star.unlitPrerequisiteIds) return star.unlitPrerequisiteIds
  if (star.state === 'lit') return []
  return sky.prerequisites
    .filter((edge) => edge.to === star.unitId)
    .map((edge) => edge.from)
    .filter((unitId) => sky.stars.some((candidate) => candidate.unitId === unitId && candidate.state !== 'lit'))
}

type Placement = {
  galaxies: KnowledgeMapResponse['galaxies']
  nebulae: KnowledgeMapResponse['nebulae']
  prerequisites: KnowledgeMapResponse['prerequisites']
  stars: Star[]
  subjects: KnowledgeMapResponse['galaxies']
}

/**
 * One placement per sky (#329). `read` runs again for every galaxy in focus
 * and every acknowledged lighting, which hands over a new response with the
 * same arrays. Laid out afresh each time, the stars came back as new objects,
 * and the engine, which keeps its scene only while the arrays are the same
 * ones, rebuilt it: names blinked and a drag in progress was dropped. So the
 * placement is kept per stars array, and reused while the galaxies, nebulae
 * and prerequisites beside it are the ones it was made from.
 */
const placements = new WeakMap<KnowledgeMapResponse['stars'], Placement>()

function placement(sky: KnowledgeMapResponse): Placement {
  const known = placements.get(sky.stars)
  if (known && known.galaxies === sky.galaxies && known.nebulae === sky.nebulae && known.prerequisites === sky.prerequisites) {
    return known
  }
  // A subject with no knowledge points has no galaxy to fly to: listed in
  // the switcher, a click on it flew to the first galaxy and the route was
  // put back there at rest (#329).
  const subjectOf = new Map(sky.nebulae.map((nebula) => [nebula.topicId, nebula.subjectId]))
  const withStars = new Set(sky.stars.map((star) => subjectOf.get(star.nebulaId)))
  const made = {
    galaxies: sky.galaxies,
    nebulae: sky.nebulae,
    prerequisites: sky.prerequisites,
    stars: placed(sky),
    subjects: sky.galaxies.filter((galaxy) => withStars.has(galaxy.subjectId)),
  }
  placements.set(sky.stars, made)
  return made
}

export function projectStarMap(response: KnowledgeMapResponse, { subjectId }: StarMapRequest): StarMap {
  const { stars: placedStars, subjects } = placement(response)
  const sky = { ...response, stars: placedStars }
  const focus = subjectId || sky.subjectId
  const nebulaeOfFocus = new Set(
    sky.nebulae.filter((nebula) => nebula.subjectId === focus).map((nebula) => nebula.topicId),
  )
  const named = sky.galaxies.find((galaxy) => galaxy.subjectId === focus)
  const stars = sky.stars.filter((star) => nebulaeOfFocus.has(star.nebulaId))
  const unitIds = new Set(stars.map((star) => star.unitId))
  return {
    subject: { subjectId: focus, name: named?.name ?? '' },
    subjects,
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
  // read a chicken-and-egg. The query is the chapter's too: one definition (#368).
  const { data, status, refetch } = useKnowledgeMapQuery()

  const source = useMemo<StarMapSource>(
    () => ({
      read: (request) => (data ? projectStarMap(data, request) : emptyStarMap(request.subjectId)),
      demo: false,
      // A sky already drawn stays drawn when a later refetch fails. Nobody
      // but a student asks for one, so for anybody else there is nothing to wait for.
      status: data ? 'success' : isStudent ? status : 'success',
      retry: () => void refetch(),
    }),
    [data, status, isStudent, refetch],
  )

  return <StarMapSourceContext.Provider value={source}>{children}</StarMapSourceContext.Provider>
}
