import { useQuery } from '@tanstack/react-query'
import { getQuestionBankSet } from '@/services/questionBank/questionBankApi'
import { questionBankQueryKeys } from '@/services/questionBank/questionBankQueryKeys'

export function useQuestionBankSetQuery(setId: string | undefined) {
  return useQuery({
    queryKey: questionBankQueryKeys.set(setId ?? ''),
    queryFn: () => getQuestionBankSet(setId ?? ''),
    enabled: Boolean(setId),
  })
}
