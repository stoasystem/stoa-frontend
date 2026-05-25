import { useQuery } from '@tanstack/react-query'
import { getOrganizations } from '@/services/organization/organizationApi'

export function useOrganizationsQuery() {
  return useQuery({
    queryKey: ['organizations'],
    queryFn: getOrganizations,
  })
}
