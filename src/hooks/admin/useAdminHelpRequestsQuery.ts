import { useQuery } from '@tanstack/react-query'
import { getAdminHelpRequests } from '@/services/admin/adminApi'
import { adminQueryKeys } from '@/services/admin/adminQueryKeys'

export function useAdminHelpRequestsQuery() {
  return useQuery({
    queryKey: [...adminQueryKeys.all, 'help-requests'],
    queryFn: getAdminHelpRequests,
    retry: false,
  })
}
