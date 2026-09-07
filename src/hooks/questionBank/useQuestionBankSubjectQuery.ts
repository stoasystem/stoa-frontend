import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { getQuestionBankSubject } from '@/services/questionBank/questionBankApi'
import { questionBankQueryKeys } from '@/services/questionBank/questionBankQueryKeys'

export function useQuestionBankSubjectQuery(subjectId: string | undefined) {
  const { i18n } = useTranslation()
  return useQuery({
    queryKey: questionBankQueryKeys.subject(subjectId ?? '', i18n.language),
    queryFn: () => getQuestionBankSubject(subjectId ?? ''),
    enabled: Boolean(subjectId),
  })
}
