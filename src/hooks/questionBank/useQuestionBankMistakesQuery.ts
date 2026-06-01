import { useQuery } from '@tanstack/react-query'
import { getQuestionBankMistakes } from '@/services/questionBank/questionBankApi'
import { questionBankQueryKeys } from '@/services/questionBank/questionBankQueryKeys'
import type { QuestionBankFilters } from '@/types/questionBank'

export function useQuestionBankMistakesQuery(filters: QuestionBankFilters = {}) {
  return useQuery({
    queryKey: [...questionBankQueryKeys.mistakes(), filters],
    queryFn: () => getQuestionBankMistakes(filters),
  })
}
