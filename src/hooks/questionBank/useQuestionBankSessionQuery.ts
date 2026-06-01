import { useQuery } from '@tanstack/react-query'
import { getQuestionBankSession } from '@/services/questionBank/questionBankApi'
import { questionBankQueryKeys } from '@/services/questionBank/questionBankQueryKeys'

export function useQuestionBankSessionQuery(sessionId: string | undefined) {
  return useQuery({
    queryKey: questionBankQueryKeys.session(sessionId ?? ''),
    queryFn: () => getQuestionBankSession(sessionId ?? ''),
    enabled: Boolean(sessionId),
  })
}
