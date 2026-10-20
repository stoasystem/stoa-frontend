import { useQuery } from '@tanstack/react-query'
import { KNOWLEDGE_MAP_STALE_MS } from '@/features/starmap/readModelSource'
import { getKnowledgeMap } from '@/services/practice/practiceApi'
import { practiceQueryKeys } from '@/services/practice/practiceQueryKeys'
import { useAuthStore } from '@/store/authStore'

/**
 * `GET /practice/knowledge-map`, the whole sky: the same query, and so the
 * same cache, the star map reads (`readModelSource.tsx`). Only a student has
 * a sky.
 */
export function useKnowledgeMapQuery() {
  const isStudent = useAuthStore((state) => Boolean(state.isAuthenticated) && state.user?.role === 'student')
  return useQuery({
    queryKey: practiceQueryKeys.knowledgeMap(''),
    queryFn: () => getKnowledgeMap(),
    enabled: isStudent,
    staleTime: KNOWLEDGE_MAP_STALE_MS,
  })
}
