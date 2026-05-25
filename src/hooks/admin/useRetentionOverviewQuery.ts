import { useQuery } from '@tanstack/react-query'
import { getRetentionOverview } from '@/services/admin/advancedAnalyticsApi'

export function useRetentionOverviewQuery() {
  return useQuery({
    queryKey: ['admin', 'retention'],
    queryFn: getRetentionOverview,
  })
}
