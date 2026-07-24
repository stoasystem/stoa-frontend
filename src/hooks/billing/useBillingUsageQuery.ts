import { useQuery } from '@tanstack/react-query'
import { getBillingUsage } from '@/services/billing/billingApi'
import { useAuthStore } from '@/store/authStore'

export function useBillingUsageQuery() {
  const role = useAuthStore((state) => state.user?.role)

  return useQuery({
    queryKey: ['billing', 'usage'],
    queryFn: getBillingUsage,
    enabled: role === 'parent',
    retry: false,
  })
}
