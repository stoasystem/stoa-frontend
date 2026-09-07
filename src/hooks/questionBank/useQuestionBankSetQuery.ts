import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { getQuestionBankSet } from '@/services/questionBank/questionBankApi'
import { questionBankQueryKeys } from '@/services/questionBank/questionBankQueryKeys'

export function useQuestionBankSetQuery(setId: string | undefined) {
  const { i18n } = useTranslation()
  return useQuery({
    queryKey: questionBankQueryKeys.set(setId ?? '', i18n.language),
    queryFn: () => getQuestionBankSet(setId ?? ''),
    enabled: Boolean(setId),
  })
}
