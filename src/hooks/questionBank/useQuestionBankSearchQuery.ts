import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { searchQuestionBank } from '@/services/questionBank/questionBankApi'
import { questionBankQueryKeys } from '@/services/questionBank/questionBankQueryKeys'

export function useQuestionBankSearchQuery(query: string) {
  const { i18n } = useTranslation()
  return useQuery({
    queryKey: questionBankQueryKeys.search(query, i18n.language),
    queryFn: () => searchQuestionBank(query),
    enabled: query.trim().length > 1,
  })
}
