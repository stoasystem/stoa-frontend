import { useQuery } from '@tanstack/react-query'
import { getQuestionBankTopic } from '@/services/questionBank/questionBankApi'
import { questionBankQueryKeys } from '@/services/questionBank/questionBankQueryKeys'
import type { QuestionBankFilters } from '@/types/questionBank'

export function useQuestionBankTopicQuery(
  subjectId: string | undefined,
  topicId: string | undefined,
  filters: QuestionBankFilters = {},
) {
  return useQuery({
    queryKey: [...questionBankQueryKeys.topic(subjectId ?? '', topicId ?? ''), filters],
    queryFn: () => getQuestionBankTopic(subjectId ?? '', topicId ?? '', filters),
    enabled: Boolean(subjectId && topicId),
  })
}
