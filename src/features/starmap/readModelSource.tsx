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
 *
 * The sky comes in two layers (#503): a skeleton of every star without its
 * small stars, and the few stars around one in full
 * (`hooks/practice/useKnowledgeMapStars.ts`). The map says what it is on
 * (`focus`): the source reads the stars around that star, or around where the
 * student last practised in the galaxy in focus, always in that star's own
 * galaxy -- one read at a time, the one the map is on. A star it already has
 * in the language on screen is not read again. Their small stars are laid
 * onto the skeleton's stars; a star still without them says so
 * (`skillsKnown: false`, or `skillsFailed` with a retry) rather than drawn as
 * a star with none. A backend before stoa-backend#127 sends the sky in full
 * and is asked for nothing more.
 *
 * On a return visit the sky is drawn at once from the last one this browser
 * kept for the account (#757, `lib/skyCache.ts`) while the skeleton is read
 * again; the source says so (`provisional`) and the route decides nothing on
 * it. The cache never enters the query: the chapter (#368) and the lighting
 * moment read the query, so they only ever see the server's answer. When it
 * comes, every array that did not change is the cached one (`keepUnchanged`),
 * so the placement below is the same one and the engine keeps its scene: no
 * flight, no names fading in again; only what changed is drawn anew. The
 * stars around one are read at the same time as the skeleton when the galaxy
 * is known -- from the route, or from the cached sky -- not after it.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  StarMapSourceContext,
  emptyStarMap,
  emptyStarMapSource,
  useStarMapSource,
  type StarMapRequest,
  type StarMapSource,
} from '@/features/starmap/starMapSource'
import type { Nebula, Star, StarMap } from '@/features/starmap/model/starMap'
import { layoutClusteredSky } from '@/features/starmap/route/clusteredSky'
import { KNOWLEDGE_MAP_KEY, KNOWLEDGE_MAP_STALE_MS, useHasSky, useKnowledgeMapQuery } from '@/hooks/practice/useKnowledgeMapQuery'
import { useKnowledgeMapStarsQuery, useStarDetails, type StarDetails } from '@/hooks/practice/useKnowledgeMapStars'
import { useAuthStore } from '@/store/authStore'
import type { KnowledgeMapResponse } from '@/types/practice'
import { activeLanguage, type SupportedLanguage } from '@/i18n/languages'
import { readCachedSky, writeCachedSky } from '@/lib/skyCache'

/**
 * One seed for every sky, so a student's map keeps its arrangement between
 * visits and between devices.
 */
const LAYOUT_SEED = 116

/**
 * Place the sky as star clusters (#747, ADR 0007): each subject's topics
 * gathered into a few large clusters (`route/clusters.ts`), each cluster one
 * nebula on the map, its stars from left to right along its learning route
 * (`route/clusteredSky.ts`). Not the coordinates the read model sends.
 *
 * The backend derives `(x, y)` deterministically from identifiers as a
 * stand-in for the offline layout (stoa-backend#60). Passed straight through,
 * that put every nebula on one thin horizontal band and the student landed
 * zoomed into a single star with the rest of their subject off-screen -
 * measured on production: 1 of 10 knowledge points visible.
 *
 * The stars' `nebulaId` becomes their cluster's, and the nebulae are the
 * clusters, named in the language on screen; the layout does not look at the
 * learning state, so the same sky always gives the same picture.
 */
function placed(sky: KnowledgeMapResponse, language: SupportedLanguage): { nebulae: Nebula[]; stars: Star[] } {
  return layoutClusteredSky(
    {
      subject: { subjectId: sky.subjectId, name: '' },
      subjects: sky.galaxies,
      nebulae: sky.nebulae,
      stars: sky.stars.map((star) => asStar(star, sky)),
      prerequisites: sky.prerequisites,
    },
    language,
    { seed: LAYOUT_SEED },
  )
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
  language: SupportedLanguage
  /** The star clusters, one nebula each (#747). */
  clusters: Nebula[]
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

function placement(sky: KnowledgeMapResponse, language: SupportedLanguage): Placement {
  const known = placements.get(sky.stars)
  if (known && known.galaxies === sky.galaxies && known.nebulae === sky.nebulae && known.prerequisites === sky.prerequisites && known.language === language) {
    return known
  }
  // A subject with no knowledge points has no galaxy to fly to: listed in
  // the switcher, a click on it flew to the first galaxy and the route was
  // put back there at rest (#329).
  const subjectOf = new Map(sky.nebulae.map((nebula) => [nebula.topicId, nebula.subjectId]))
  const withStars = new Set(sky.stars.map((star) => subjectOf.get(star.nebulaId)))
  const { nebulae: clusters, stars } = placed(sky, language)
  const made = {
    galaxies: sky.galaxies,
    nebulae: sky.nebulae,
    prerequisites: sky.prerequisites,
    language,
    clusters,
    stars,
    subjects: sky.galaxies.filter((galaxy) => withStars.has(galaxy.subjectId)),
  }
  placements.set(sky.stars, made)
  return made
}

/**
 * The placed stars with the small stars loaded so far laid on (#503). A star
 * whose small stars did not change is the same object, and when none changed
 * the array is the same one: a read that brought nothing new must not make
 * the engine build its scene again, which would drop a drag in progress and
 * fade every name anew.
 */
const detailed = new WeakMap<Star[], { details: StarDetails; failed: string | null; stars: StarMap['stars'] }>()

function withDetails(
  placedStars: Star[],
  skeleton: boolean,
  details: StarDetails,
  failed: string | null,
): StarMap['stars'] {
  if (!skeleton) return placedStars
  const known = detailed.get(placedStars)
  if (known && known.details === details && known.failed === failed) return known.stars
  let changed = !known
  const stars = placedStars.map((star, index) => {
    const full = details.get(star.unitId)
    const skillsFailed = !full && star.unitId === failed
    const before = known?.stars[index]
    const same = full
      ? before?.skillsKnown === true && before.skills === full.skills
      : before?.skillsKnown === false && Boolean(before.skillsFailed) === skillsFailed
    if (before && same) return before
    changed = true
    if (full) return { ...star, skills: full.skills, skillsKnown: true }
    return { ...star, skillsKnown: false, ...(skillsFailed ? { skillsFailed: true } : {}) }
  })
  const kept = changed ? stars : known!.stars
  detailed.set(placedStars, { details, failed, stars: kept })
  return kept
}

export function projectStarMap(
  response: KnowledgeMapResponse,
  { subjectId, language }: Pick<StarMapRequest, 'subjectId' | 'language'>,
  details: StarDetails = new Map(),
  failed: string | null = null,
): StarMap {
  const { stars: placed, subjects, clusters } = placement(response, language)
  const placedStars = withDetails(placed, response.view === 'skeleton', details, failed)
  const sky = { ...response, nebulae: clusters, stars: placedStars }
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

const LAID_OUT = ['galaxies', 'nebulae', 'prerequisites', 'stars'] as const

/**
 * The server's sky with each array that came back as the cached sky had it
 * replaced by the cached one (#757): the placement is kept per array, and the
 * engine keeps its scene while the arrays are the same, so a sky that did not
 * change is not drawn anew when it is confirmed. One that did keeps the
 * camera where it is (the same layout) and draws what changed.
 */
export function keepUnchanged(fresh: KnowledgeMapResponse, cached: KnowledgeMapResponse | null): KnowledgeMapResponse {
  if (!cached) return fresh
  let kept: KnowledgeMapResponse | null = null
  for (const field of LAID_OUT) {
    if (fresh[field] !== cached[field] && JSON.stringify(fresh[field]) === JSON.stringify(cached[field])) {
      kept ??= { ...fresh }
      ;(kept as Record<string, unknown>)[field] = cached[field]
    }
  }
  return kept ?? fresh
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
  const { data: fresh, status, refetch } = useKnowledgeMapQuery()
  const hasSky = useHasSky()
  const accountId = useAuthStore((state) => state.user?.id ?? null)
  // The last sky kept for this account, read once per account (#757): only for drawing.
  const cached = useMemo(() => (hasSky && accountId ? readCachedSky(accountId, activeLanguage()) : null), [hasSky, accountId])
  const data = useMemo(() => (fresh ? keepUnchanged(fresh, cached) : undefined), [fresh, cached])
  const sky = data ?? cached ?? undefined
  const provisional = !data && Boolean(cached)
  // Each new answer is kept for next time (an acknowledged lighting too), under the account
  // it was read for. Only a new answer: the account changing under the same one writes nothing.
  const written = useRef<KnowledgeMapResponse | undefined>(undefined)
  useEffect(() => {
    if (!fresh || fresh === written.current) return
    written.current = fresh
    if (accountId && hasSky) writeCachedSky(accountId, activeLanguage(), fresh)
  }, [fresh, accountId, hasSky])
  const skeleton = sky?.view === 'skeleton'
  const client = useQueryClient()
  const { stars: details, outdated } = useStarDetails()
  // What the map is on, and so the one neighbourhood read and watched (#503).
  const [wanted, setWanted] = useState<{ subjectId: string; unitId: string | null; named: boolean } | null>(null)
  // Read beside the skeleton, not after it, when the galaxy is known before it comes (#757):
  // the route names it, or the cached sky did. On `/` with nothing cached it comes from the skeleton.
  const galaxyKnown = Boolean(cached) || Boolean(wanted?.named)
  const around = useKnowledgeMapStarsQuery(wanted?.subjectId ?? null, wanted?.unitId ?? null, {
    enabled: data ? skeleton : galaxyKnown,
  })
  const failed = around.isError && !around.data ? (wanted?.unitId ?? null) : null

  const focus = useCallback(
    ({ subjectId, unitId, named = false }: { subjectId: string; unitId: string | null; named?: boolean }) => {
      // A star already here, in the language on screen, is not read again: the map stays on what it reads.
      if (unitId && details.has(unitId) && !outdated.has(unitId)) return
      setWanted((before) =>
        before?.subjectId === subjectId && before.unitId === unitId && before.named === named ? before : { subjectId, unitId, named },
      )
    },
    [details, outdated],
  )
  const { refetch: refetchAround } = around
  const retrySkills = useCallback(() => void refetchAround(), [refetchAround])
  // Exercises answered elsewhere refresh only their own stars; the skeleton
  // follows when the map is back on screen (#503).
  // Read from the cache when called, so it stays one function: the map calls it once, on arrival.
  const arrive = useCallback(() => {
    const read = client.getQueryState(KNOWLEDGE_MAP_KEY)
    if (read?.data && (read.isInvalidated || Date.now() - read.dataUpdatedAt > KNOWLEDGE_MAP_STALE_MS)) void refetch()
  }, [client, refetch])

  const source = useMemo<StarMapSource>(
    () => ({
      read: (request) => (sky ? projectStarMap(sky, request, details, failed) : emptyStarMap(request.subjectId)),
      demo: false,
      // A sky already drawn stays drawn when a later refetch fails. Nobody
      // but a student asks for one, so for anybody else there is nothing to wait for.
      // A cached sky is drawn while the server's is on the wire; if that read fails,
      // the student is told so rather than left on a sky nobody confirmed.
      status: data ? 'success' : isStudent ? (cached && status === 'pending' ? 'success' : status) : 'success',
      provisional,
      retry: () => void refetch(),
      focus,
      retrySkills,
      arrive,
    }),
    [sky, data, cached, provisional, details, failed, status, isStudent, refetch, focus, retrySkills, arrive],
  )

  return <StarMapSourceContext.Provider value={source}>{children}</StarMapSourceContext.Provider>
}
