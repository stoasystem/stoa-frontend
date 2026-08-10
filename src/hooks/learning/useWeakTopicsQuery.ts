import { useQuery } from '@tanstack/react-query'
import { getMyMemorySummary } from '@/services/learning/memoryApi'
import type { WeakTopic } from '@/types/dashboard'

export const memoryQueryKeys = {
  summary: (subject?: string) => ['students', 'me', 'memory', subject ?? 'all'] as const,
}

/**
 * Fetches the student's adaptive learning memory summary and maps the
 * backend snapshot format to the WeakTopic shape used by WeakTopicsCard.
 */
export function useWeakTopicsQuery(subject?: string) {
  return useQuery({
    queryKey: memoryQueryKeys.summary(subject),
    queryFn: async (): Promise<WeakTopic[]> => {
      const data = await getMyMemorySummary(subject)

      const snapshots = data.snapshots?.length
        ? data.snapshots
        : data.generated_snapshots ?? []

      return snapshots
        .filter((s) => s.weak_topics?.length > 0 || s.struggling_concepts?.length > 0)
        .slice(0, 8)
        .map((s) => ({
          id: `${s.subject}-${s.topic_id}`,
          subject: s.subject,
          topic: s.topic_id.replace(/_/g, ' '),
          level: _confidenceToLevel(s.confidence, s.count),
        }))
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })
}

function _confidenceToLevel(confidence: string | undefined, count: number): WeakTopic['level'] {
  if (confidence === 'high') return 'low'
  if (confidence === 'medium' || count >= 3) return 'medium'
  return 'high'
}
