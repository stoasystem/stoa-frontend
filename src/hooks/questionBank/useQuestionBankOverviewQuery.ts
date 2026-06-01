import { useQuery } from '@tanstack/react-query'
import { getQuestionBankOverview } from '@/services/questionBank/questionBankApi'
import { questionBankQueryKeys } from '@/services/questionBank/questionBankQueryKeys'

export function useQuestionBankOverviewQuery() {
  return useQuery({
    queryKey: questionBankQueryKeys.overview(),
    queryFn: getQuestionBankOverview,
  })
}
