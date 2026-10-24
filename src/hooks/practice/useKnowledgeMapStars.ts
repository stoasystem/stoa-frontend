/*
 * The star map in two layers (#503, stoa-backend#127): the skeleton
 * (`useKnowledgeMapQuery`) is every star without its small stars; this is the
 * few stars around one in full -- small stars, practice sets, what they need.
 *
 * Every neighbourhood read is kept in the query cache under one prefix, and
 * `useStarDetails` reads them all as one index by star: whichever read last
 * says a star, wins. So a star loaded around one star stays loaded when the
 * student moves on to another, and the map asks only for stars it has not got.
 */
import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useMemo, useSyncExternalStore } from 'react'
import { KNOWLEDGE_MAP_STALE_MS } from '@/hooks/practice/useKnowledgeMapQuery'
import { getKnowledgeMapStars } from '@/services/practice/practiceApi'
import { practiceQueryKeys } from '@/services/practice/practiceQueryKeys'
import { useAuthStore } from '@/store/authStore'
import type { KnowledgeMapNeighbour, KnowledgeMapNeighbourhood } from '@/types/practice'

/** Stars in full, by unit id. */
export type StarDetails = ReadonlyMap<string, KnowledgeMapNeighbour>

const EMPTY: StarDetails = new Map()
/** Every neighbourhood read, whatever it was read around. */
const EVERY_NEIGHBOURHOOD = { queryKey: practiceQueryKeys.knowledgeMapStarsAll() }

function useHasSky() {
  return useAuthStore(
    (state) => Boolean(state.isAuthenticated) && state.user?.role === 'student' && !state.user.mustChangePassword,
  )
}

/**
 * The stars around `around` (null: around where the student last practised).
 * Mounted where those stars are on screen, so finishing an exercise refreshes
 * this neighbourhood and nothing more (`useSubmitChallengeAnswerMutation`).
 */
export function useKnowledgeMapStarsQuery(around: string | null, { enabled = true }: { enabled?: boolean } = {}) {
  const hasSky = useHasSky()
  return useQuery({
    queryKey: practiceQueryKeys.knowledgeMapStars('', around ?? ''),
    queryFn: () => getKnowledgeMapStars(around ? { around } : {}),
    enabled: hasSky && enabled,
    staleTime: KNOWLEDGE_MAP_STALE_MS,
    // A backend before stoa-backend#127 has no such read: the full sky already
    // carries every small star, so a refusal costs nothing worth retrying.
    retry: false,
  })
}

/** Load the stars around `around` into the cache, once; what is fresh is not read again. */
export function loadStarsAround(client: QueryClient, around: string) {
  return client
    .prefetchQuery({
      queryKey: practiceQueryKeys.knowledgeMapStars('', around),
      queryFn: () => getKnowledgeMapStars({ around }),
      staleTime: KNOWLEDGE_MAP_STALE_MS,
      retry: false,
    })
    .catch(() => undefined)
}

/** Every neighbourhood read so far as one index, the latest read of a star winning. */
export function mergeStarDetails(reads: readonly { data: KnowledgeMapNeighbourhood | undefined; at: number }[]): StarDetails {
  const ordered = reads.filter((read) => read.data).sort((a, b) => a.at - b.at)
  if (ordered.length === 0) return EMPTY
  const index = new Map<string, KnowledgeMapNeighbour>()
  for (const read of ordered) for (const star of read.data!.stars) index.set(star.unitId, star)
  return index
}

/** The stars loaded in full so far (#503), by unit id; it changes only when a read lands. */
export function useStarDetails(): StarDetails {
  const cache = useQueryClient().getQueryCache()
  // When each neighbourhood was last read: the index is rebuilt only when that moves.
  const stamp = useSyncExternalStore(
    (onChange) => cache.subscribe(onChange),
    () =>
      cache
        .findAll(EVERY_NEIGHBOURHOOD)
        .map((query) => `${query.queryHash}@${query.state.dataUpdatedAt}`)
        .join('|'),
  )
  return useMemo(
    () =>
      stamp
        ? mergeStarDetails(
            cache.findAll(EVERY_NEIGHBOURHOOD).map((query) => ({
              data: query.state.data as KnowledgeMapNeighbourhood | undefined,
              at: query.state.dataUpdatedAt,
            })),
          )
        : EMPTY,
    [stamp, cache],
  )
}
