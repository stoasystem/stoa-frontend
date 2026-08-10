import { useQuery } from '@tanstack/react-query'
import {
  getMyMemorySummary,
  type MemoryRecommendation,
  type MemorySummaryResponse,
} from '@/services/learning/memoryApi'
import type { WeakTopic } from '@/types/dashboard'

export const memoryQueryKeys = {
  summary: (subject?: string) => ['students', 'me', 'memory', subject ?? 'all'] as const,
}

const MAX_WEAK_TOPICS = 8
const MAX_RECOMMENDATIONS = 3

/**
 * Repeat count above which a weak topic is treated as urgent. Chosen to match
 * the backend's own "medium confidence" threshold on sequencing candidates.
 */
const URGENT_REPEAT_COUNT = 4

function useMemorySummaryQuery(subject?: string) {
  return useQuery<MemorySummaryResponse>({
    queryKey: memoryQueryKeys.summary(subject),
    queryFn: () => getMyMemorySummary(subject),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })
}

/** Weak topics mapped into the shape WeakTopicsCard renders. */
export function useWeakTopicsQuery(subject?: string) {
  const query = useMemorySummaryQuery(subject)

  const topics: WeakTopic[] = (query.data?.weakTopics ?? [])
    .slice(0, MAX_WEAK_TOPICS)
    .map((topic) => ({
      id: `${topic.subject}-${topic.topicId}`,
      subject: topic.subject,
      topic: topic.label || topic.topicId.replace(/_/g, ' '),
      level: countToLevel(topic.count),
    }))

  return { ...query, topics }
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

/** More repeats on a topic means it needs more urgent attention. */
function countToLevel(count: number): WeakTopic['level'] {
  if (count >= URGENT_REPEAT_COUNT) return 'high'
  if (count >= 2) return 'medium'
  return 'low'
}
