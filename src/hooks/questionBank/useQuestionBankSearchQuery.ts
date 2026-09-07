import { useQuery } from '@tanstack/react-query'
import { searchQuestionBank } from '@/services/questionBank/questionBankApi'
import { questionBankQueryKeys } from '@/services/questionBank/questionBankQueryKeys'

export function useQuestionBankSearchQuery(query: string) {
  return useQuery({
    queryKey: questionBankQueryKeys.search(query),
    queryFn: () => searchQuestionBank(query),
    enabled: query.trim().length > 1,
  })
}
