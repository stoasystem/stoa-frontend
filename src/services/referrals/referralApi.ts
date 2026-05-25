import { mockReferralSummary } from '@/data/phase11MockData'
import { httpClient } from '@/services/api/httpClient'
import { withDemoFallback } from '@/services/demo/demoFallback'
import type { ReferralSummary } from '@/types/referral'

export async function getMyReferral() {
  return withDemoFallback(async () => {
    const response = await httpClient.get<ReferralSummary>('/referrals/me')
    return response.data
  }, mockReferralSummary)
}
