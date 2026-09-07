import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { getPracticeRoadmap } from '@/services/practice/practiceApi'
import { practiceQueryKeys } from '@/services/practice/practiceQueryKeys'

export function usePracticeRoadmapQuery(subjectId: string | undefined, topicId: string | undefined) {
  const { i18n } = useTranslation()
  return useQuery({
    queryKey: practiceQueryKeys.roadmap(subjectId ?? '', topicId ?? '', i18n.language),
    queryFn: () => getPracticeRoadmap(subjectId ?? '', topicId ?? ''),
    enabled: Boolean(subjectId && topicId),
  })
}
