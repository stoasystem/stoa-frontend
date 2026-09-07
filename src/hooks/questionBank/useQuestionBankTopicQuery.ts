import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { getQuestionBankTopic } from '@/services/questionBank/questionBankApi'
import { questionBankQueryKeys } from '@/services/questionBank/questionBankQueryKeys'
import type { QuestionBankFilters } from '@/types/questionBank'

export function useQuestionBankTopicQuery(
  subjectId: string | undefined,
  topicId: string | undefined,
  filters: QuestionBankFilters = {},
) {
  const { i18n } = useTranslation()
  return useQuery({
    queryKey: [...questionBankQueryKeys.topic(subjectId ?? '', topicId ?? '', i18n.language), filters],
    queryFn: () => getQuestionBankTopic(subjectId ?? '', topicId ?? '', filters),
    enabled: Boolean(subjectId && topicId),
  })
}
