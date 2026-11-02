/*
 * The star map in two layers (#503, stoa-backend#127): the skeleton
 * (`useKnowledgeMapQuery`) is every star without its small stars; this is the
 * few stars around one in full -- small stars, practice sets, what they need.
 *
 * A neighbourhood is read for one subject (ADR 0001: one sky, many galaxies):
 * the backend looks for `around` only in the subject it is asked about, and
 * without one it takes the first, so every read names the galaxy of the star
 * it is around, and the subject is part of the key.
 *
 * Every neighbourhood read is kept in the query cache under one prefix, and
 * `useStarDetails` reads them all as one index by star: whichever read last
 * says a star, wins. So a star loaded around one star stays loaded when the
 * student moves on to another.
 */
import { useQuery, useQueryClient, type QueryCache } from '@tanstack/react-query'
import { useCallback, useSyncExternalStore } from 'react'
import { KNOWLEDGE_MAP_STALE_MS, useHasSky } from '@/hooks/practice/useKnowledgeMapQuery'
import { getKnowledgeMapStars } from '@/services/practice/practiceApi'
import { practiceQueryKeys } from '@/services/practice/practiceQueryKeys'
import type { KnowledgeMapNeighbour, KnowledgeMapNeighbourhood, KnowledgeMapResponse } from '@/types/practice'

/** Stars in full, by unit id. */
export type StarDetails = ReadonlyMap<string, KnowledgeMapNeighbour>

/**
 * The stars loaded so far, and those whose latest read has been declared out
 * of date since (another language, an answer): still shown, read again when
 * picked.
 */
export type StarDetailsIndex = { stars: StarDetails; outdated: ReadonlySet<string> }

const EMPTY: StarDetails = new Map()
const NONE: ReadonlySet<string> = new Set()
const EMPTY_INDEX: StarDetailsIndex = { stars: EMPTY, outdated: NONE }
/** Every neighbourhood read, whatever it was read around. */
const EVERY_NEIGHBOURHOOD = { queryKey: practiceQueryKeys.knowledgeMapStarsAll() }

/** The subject (galaxy) a star of the sky belongs to, by its nebula; null for a star the sky does not hold. */
export function subjectOfStar(sky: Pick<KnowledgeMapResponse, 'stars' | 'nebulae'> | undefined, unitId: string): string | null {
  const star = sky?.stars.find((candidate) => candidate.unitId === unitId)
  return (star && sky?.nebulae.find((nebula) => nebula.topicId === star.nebulaId)?.subjectId) || null
}

/**
 * The stars around `around` in `subjectId` (around null: where the student
 * last practised in that subject). Nothing is read without a subject.
 */
export function useKnowledgeMapStarsQuery(
  subjectId: string | null,
  around: string | null,
  { enabled = true }: { enabled?: boolean } = {},
) {
  const hasSky = useHasSky()
  return useQuery({
    queryKey: practiceQueryKeys.knowledgeMapStars(subjectId ?? '', around ?? ''),
    queryFn: () => getKnowledgeMapStars({ subjectId: subjectId!, ...(around ? { around } : {}) }),
    enabled: hasSky && enabled && Boolean(subjectId),
    staleTime: KNOWLEDGE_MAP_STALE_MS,
    // A backend before stoa-backend#127 has no such read: the full sky already
    // carries every small star, so a refusal costs nothing worth retrying. A
    // failure of a backend that has it is shown, with a retry (`StarCard`).
    retry: false,
  })
}

type Read = { data: KnowledgeMapNeighbourhood | undefined; at: number; outdated?: boolean }

/** Every neighbourhood read so far as one index, the latest read of a star winning. */
export function mergeStarDetails(reads: readonly Read[]): StarDetails {
  return indexStarDetails(reads).stars
}

function indexStarDetails(reads: readonly Read[]): StarDetailsIndex {
  const ordered = reads.filter((read) => read.data).sort((a, b) => a.at - b.at)
  if (ordered.length === 0) return EMPTY_INDEX
  const stars = new Map<string, KnowledgeMapNeighbour>()
  const outdated = new Set<string>()
  for (const read of ordered) {
    for (const star of read.data!.stars) {
      stars.set(star.unitId, star)
      if (read.outdated) outdated.add(star.unitId)
      else outdated.delete(star.unitId)
    }
  }
  return { stars, outdated }
}

/**
 * The index last built for a cache, and the reads it was built from. A read
 * that came back the same is the same object (the query cache shares what did
 * not change), so a refetch that changed nothing hands back this very index.
 */
const built = new WeakMap<QueryCache, { reads: readonly unknown[]; details: StarDetailsIndex }>()

function detailsOf(cache: QueryCache): StarDetailsIndex {
  const queries = cache.findAll(EVERY_NEIGHBOURHOOD)
  const reads = queries.flatMap((query) => [query.state.data, query.state.isInvalidated])
  const known = built.get(cache)
  if (known && known.reads.length === reads.length && known.reads.every((read, i) => read === reads[i])) return known.details
  const details = indexStarDetails(
    queries.map((query) => ({
      data: query.state.data as KnowledgeMapNeighbourhood | undefined,
      at: query.state.dataUpdatedAt,
      outdated: query.state.isInvalidated,
    })),
  )
  built.set(cache, { reads, details })
  return details
}

/** The stars loaded in full so far (#503), by unit id; a new index only when a read brought something new. */
export function useStarDetails(): StarDetailsIndex {
  const cache = useQueryClient().getQueryCache()
  const subscribe = useCallback((onChange: () => void) => cache.subscribe(onChange), [cache])
  return useSyncExternalStore(subscribe, () => detailsOf(cache))
}
