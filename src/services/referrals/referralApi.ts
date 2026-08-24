
import { httpClient } from '@/services/api/httpClient'

import type { ReferralSummary } from '@/types/referral'

export async function getMyReferral() {
  const response = await httpClient.get<ReferralSummary>('/referrals/me')
  return response.data
}
