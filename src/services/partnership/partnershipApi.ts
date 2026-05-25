import { httpClient } from '@/services/api/httpClient'
import { withDemoFallback } from '@/services/demo/demoFallback'
import type { PartnershipInterestPayload, PartnershipInterestResponse } from '@/types/partnership'

export async function submitPartnershipInterest(payload: PartnershipInterestPayload) {
  return withDemoFallback(async () => {
    const response = await httpClient.post<PartnershipInterestResponse>('/partnership/interests', payload)
    return response.data
  }, { ok: true, interestId: 'partner-interest-1' })
}
