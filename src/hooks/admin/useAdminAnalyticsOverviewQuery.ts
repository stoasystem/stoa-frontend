import { useQuery } from '@tanstack/react-query'
import { getAdminAnalyticsOverview } from '@/services/admin/adminAnalyticsApi'

export function useAdminAnalyticsOverviewQuery() {
  return useQuery({
    queryKey: ['admin', 'analytics', 'overview'],
    queryFn: getAdminAnalyticsOverview,
  })
}
