import { httpClient } from '@/services/api/httpClient'

import type { PartnershipInterestPayload, PartnershipInterestResponse } from '@/types/partnership'

export async function submitPartnershipInterest(payload: PartnershipInterestPayload) {
  const response = await httpClient.post<PartnershipInterestResponse>('/partnership/interests', payload)
  return response.data
}
