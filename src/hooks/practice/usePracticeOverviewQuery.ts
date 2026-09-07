import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { getPracticeOverview } from '@/services/practice/practiceApi'
import { practiceQueryKeys } from '@/services/practice/practiceQueryKeys'

export function usePracticeOverviewQuery() {
  const { i18n } = useTranslation()
  return useQuery({
    queryKey: practiceQueryKeys.overview(i18n.language),
    queryFn: getPracticeOverview,
  })
}
