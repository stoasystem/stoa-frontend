import { useQuery } from '@tanstack/react-query'
import { getFeatureAccess } from '@/services/billing/billingApi'

export function useFeatureAccessQuery() {
  return useQuery({
    queryKey: ['billing', 'feature-access'],
    queryFn: getFeatureAccess,
  })
}
