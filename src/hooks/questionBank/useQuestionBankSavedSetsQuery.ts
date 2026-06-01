import { useQuery } from '@tanstack/react-query'
import { getQuestionBankSavedSets } from '@/services/questionBank/questionBankApi'
import { questionBankQueryKeys } from '@/services/questionBank/questionBankQueryKeys'

export function useQuestionBankSavedSetsQuery() {
  return useQuery({
    queryKey: questionBankQueryKeys.saved(),
    queryFn: getQuestionBankSavedSets,
  })
}
