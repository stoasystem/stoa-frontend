import { useQuery } from '@tanstack/react-query'
import { getOrganizationTutors } from '@/services/organization/organizationApi'

export function useOrganizationTutorsQuery(organizationId: string) {
  return useQuery({
    queryKey: ['organizations', organizationId, 'tutors'],
    queryFn: () => getOrganizationTutors(organizationId),
    enabled: Boolean(organizationId),
  })
}
