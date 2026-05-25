import { useQuery } from '@tanstack/react-query'
import { getSubscription } from '@/services/billing/billingApi'

export function useSubscriptionQuery() {
  return useQuery({
    queryKey: ['billing', 'subscription'],
    queryFn: getSubscription,
    retry: false,
  })
}
