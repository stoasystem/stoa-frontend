import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { getQuestionBankOverview } from '@/services/questionBank/questionBankApi'
import { questionBankQueryKeys } from '@/services/questionBank/questionBankQueryKeys'

export function useQuestionBankOverviewQuery() {
  const { i18n } = useTranslation()
  return useQuery({
    queryKey: questionBankQueryKeys.overview(i18n.language),
    queryFn: getQuestionBankOverview,
  })
}
