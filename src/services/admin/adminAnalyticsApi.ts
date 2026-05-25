import { mockAdminAnalyticsOverview } from '@/data/phase11MockData'
import { httpClient } from '@/services/api/httpClient'
import { withDemoFallback } from '@/services/demo/demoFallback'
import type { AdminAnalyticsOverview } from '@/types/adminAnalytics'

export async function getAdminAnalyticsOverview() {
  return withDemoFallback(async () => {
    const response = await httpClient.get<AdminAnalyticsOverview>('/admin/analytics/overview')
    return response.data
  }, mockAdminAnalyticsOverview)
}
