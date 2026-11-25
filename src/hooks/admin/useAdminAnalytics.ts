import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { adminQueryKeys } from '@/services/admin/adminQueryKeys'
import { getAnalyticsOverview, type AnalyticsDays, type AnalyticsRole } from '@/services/admin/analyticsApi'

export function useAdminAnalytics(days: AnalyticsDays, role: AnalyticsRole) {
  return useQuery({
    queryKey: adminQueryKeys.analyticsOverview(days, role),
    queryFn: ({ signal }) => getAnalyticsOverview(days, role, signal),
    placeholderData: keepPreviousData,
  })
}
