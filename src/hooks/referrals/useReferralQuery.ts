import { useQuery } from '@tanstack/react-query'
import { getMyReferral } from '@/services/referrals/referralApi'

export function useReferralQuery() {
  return useQuery({
    queryKey: ['referrals', 'me'],
    queryFn: getMyReferral,
  })
}
