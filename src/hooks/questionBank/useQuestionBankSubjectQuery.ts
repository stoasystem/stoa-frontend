import { useQuery } from '@tanstack/react-query'
import { getQuestionBankSubject } from '@/services/questionBank/questionBankApi'
import { questionBankQueryKeys } from '@/services/questionBank/questionBankQueryKeys'

export function useQuestionBankSubjectQuery(subjectId: string | undefined) {
  return useQuery({
    queryKey: questionBankQueryKeys.subject(subjectId ?? ''),
    queryFn: () => getQuestionBankSubject(subjectId ?? ''),
    enabled: Boolean(subjectId),
  })
}
