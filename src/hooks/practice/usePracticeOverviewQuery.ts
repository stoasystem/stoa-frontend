import { useQuery } from '@tanstack/react-query'
import { getPracticeOverview } from '@/services/practice/practiceApi'
import { practiceQueryKeys } from '@/services/practice/practiceQueryKeys'

export function usePracticeOverviewQuery() {
  return useQuery({
    queryKey: practiceQueryKeys.overview(),
    queryFn: getPracticeOverview,
  })
}
