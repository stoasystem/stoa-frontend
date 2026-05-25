import { useQuery } from '@tanstack/react-query'
import { getOrganizationReports } from '@/services/organization/organizationApi'

export function useOrganizationReportsQuery(organizationId: string) {
  return useQuery({
    queryKey: ['organizations', organizationId, 'reports'],
    queryFn: () => getOrganizationReports(organizationId),
    enabled: Boolean(organizationId),
  })
}
