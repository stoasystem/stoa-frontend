import { useQuery } from '@tanstack/react-query'
import { getBillingUsage } from '@/services/billing/billingApi'

export function useBillingUsageQuery() {
  return useQuery({
    queryKey: ['billing', 'usage'],
    queryFn: getBillingUsage,
  })
}
