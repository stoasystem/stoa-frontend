import { useQuery } from '@tanstack/react-query'
import { getKnowledgeMap } from '@/services/practice/practiceApi'
import { practiceQueryKeys } from '@/services/practice/practiceQueryKeys'
import { useAuthStore } from '@/store/authStore'

/** How long a sky stays fresh. Learning states move when a lesson is finished,
 *  not between two glances at the map, so this is minutes rather than seconds. */
export const KNOWLEDGE_MAP_STALE_MS = 2 * 60 * 1000

/**
 * `GET /practice/knowledge-map`, the whole sky: the one definition of the
 * query the star map (`readModelSource.tsx`) and the chapter read, so they
 * share one cache and one set of options (#368). Only a student has a sky.
 *
 * Not keyed by subject: the galaxy in focus is a projection of the whole
 * sky, and a key per subject would make every switch of galaxy a fetch.
 */
export function useKnowledgeMapQuery() {
  const isStudent = useAuthStore((state) => Boolean(state.isAuthenticated) && state.user?.role === 'student')
  return useQuery({
    queryKey: practiceQueryKeys.knowledgeMap(''),
    queryFn: () => getKnowledgeMap(),
    enabled: isStudent,
    staleTime: KNOWLEDGE_MAP_STALE_MS,
    // A sky that could not be read is not worth hammering the API for: the
    // star map offers the student a retry, and the chapter goes on without it.
    retry: 1,
  })
}
