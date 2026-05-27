import { useQuery } from '@tanstack/react-query'
import { getPracticeRoadmap } from '@/services/practice/practiceApi'
import { practiceQueryKeys } from '@/services/practice/practiceQueryKeys'

export function usePracticeRoadmapQuery(subjectId: string | undefined, topicId: string | undefined) {
  return useQuery({
    queryKey: practiceQueryKeys.roadmap(subjectId ?? '', topicId ?? ''),
    queryFn: () => getPracticeRoadmap(subjectId ?? '', topicId ?? ''),
    enabled: Boolean(subjectId && topicId),
  })
}
