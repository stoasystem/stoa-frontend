import { useQuery } from '@tanstack/react-query'
import { getOrganizationSummary } from '@/services/organization/organizationApi'

export function useOrganizationSummaryQuery(organizationId: string) {
  return useQuery({
    queryKey: ['organizations', organizationId, 'summary'],
    queryFn: () => getOrganizationSummary(organizationId),
    enabled: Boolean(organizationId),
  })
}
