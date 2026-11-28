import { useQuery } from '@tanstack/react-query'
import { useAskServer } from '@/features/ask/server/askServer'
import type { MemoryRecommendation, MemorySummaryResponse } from '@/services/learning/memoryApi'

export const memoryQueryKeys = {
  summary: (subject?: string) => ['students', 'me', 'memory', subject ?? 'all'] as const,
}

const MAX_RECOMMENDATIONS = 3

function useMemorySummaryQuery(subject?: string) {
  const { getMyMemorySummary } = useAskServer().memory
  return useQuery<MemorySummaryResponse>({
    queryKey: memoryQueryKeys.summary(subject),
    queryFn: () => getMyMemorySummary(subject),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })
}

/** Top-ranked next-practice recommendations for the student. */
export function useRecommendationsQuery(subject?: string) {
  const query = useMemorySummaryQuery(subject)

  const recommendations: MemoryRecommendation[] = (query.data?.recommendations ?? []).slice(
    0,
    MAX_RECOMMENDATIONS,
  )

  return { ...query, recommendations }
}
