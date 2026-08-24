
import { httpClient } from '@/services/api/httpClient'

import type { AdminAnalyticsOverview } from '@/types/adminAnalytics'

export async function getAdminAnalyticsOverview() {
  const response = await httpClient.get<AdminAnalyticsOverview>('/admin/analytics/overview')
  return response.data
}
