import { useQuery } from '@tanstack/react-query'
import { getAdminUsageSummary } from '@/services/admin/adminApi'
import { adminQueryKeys } from '@/services/admin/adminQueryKeys'

export function useAdminUsageSummaryQuery() {
  return useQuery({
    queryKey: adminQueryKeys.usageSummary(),
    queryFn: getAdminUsageSummary,
  })
}
