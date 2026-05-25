import { useMutation } from '@tanstack/react-query'
import { submitPartnershipInterest } from '@/services/partnership/partnershipApi'
import type { PartnershipInterestPayload } from '@/types/partnership'

export function useSubmitPartnershipInterestMutation() {
  return useMutation({
    mutationFn: (payload: PartnershipInterestPayload) => submitPartnershipInterest(payload),
  })
}
