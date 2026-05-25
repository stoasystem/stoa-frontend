import { useQuery } from '@tanstack/react-query'
import { getBillingPlans } from '@/services/billing/billingApi'

export function useBillingPlansQuery() {
  return useQuery({
    queryKey: ['billing', 'plans'],
    queryFn: getBillingPlans,
  })
}
