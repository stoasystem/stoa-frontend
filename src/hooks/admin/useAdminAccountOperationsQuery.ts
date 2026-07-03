import { useQuery } from '@tanstack/react-query'
import { getAdminParentAccountOperations } from '@/services/admin/adminApi'
import { adminQueryKeys } from '@/services/admin/adminQueryKeys'

export function useAdminParentAccountOperationsQuery(parentId: string, day?: string) {
  return useQuery({
    queryKey: adminQueryKeys.accountOperations(parentId, day),
    queryFn: () => getAdminParentAccountOperations(parentId, day),
    enabled: Boolean(parentId),
    retry: false,
  })
}
