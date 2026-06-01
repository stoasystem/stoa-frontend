import { useQuery } from '@tanstack/react-query'
import { getQuestionBankResult } from '@/services/questionBank/questionBankApi'
import { questionBankQueryKeys } from '@/services/questionBank/questionBankQueryKeys'

export function useQuestionBankResultQuery(sessionId: string | undefined) {
  return useQuery({
    queryKey: questionBankQueryKeys.result(sessionId ?? ''),
    queryFn: () => getQuestionBankResult(sessionId ?? ''),
    enabled: Boolean(sessionId),
  })
}
