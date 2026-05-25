import { mockAdvancedAnalytics, mockRetentionOverview } from '@/data/phase12MockData'
import { httpClient } from '@/services/api/httpClient'
import { withDemoFallback } from '@/services/demo/demoFallback'
import type { AdvancedAnalyticsOverview, RetentionOverview } from '@/types/advancedAnalytics'

export async function getAdvancedAnalyticsOverview(scope = 'platform') {
  return withDemoFallback(async () => {
    const response = await httpClient.get<AdvancedAnalyticsOverview>('/admin/advanced-analytics', {
      params: { scope },
    })
    return response.data
  }, mockAdvancedAnalytics)
}

export async function getRetentionOverview() {
  return withDemoFallback(async () => {
    const response = await httpClient.get<RetentionOverview>('/admin/retention')
    return response.data
  }, mockRetentionOverview)
}
