import { useQuery } from '@tanstack/react-query'
import { getOrganizationStudents } from '@/services/organization/organizationApi'

export function useOrganizationStudentsQuery(organizationId: string) {
  return useQuery({
    queryKey: ['organizations', organizationId, 'students'],
    queryFn: () => getOrganizationStudents(organizationId),
    enabled: Boolean(organizationId),
  })
}
