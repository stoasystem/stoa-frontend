import { useQuery } from '@tanstack/react-query'
import { getAdvancedAnalyticsOverview } from '@/services/admin/advancedAnalyticsApi'

export function useAdvancedAnalyticsOverviewQuery(scope = 'platform') {
  return useQuery({
    queryKey: ['admin', 'advanced-analytics', scope],
    queryFn: () => getAdvancedAnalyticsOverview(scope),
  })
}
