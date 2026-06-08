import { useQuery } from '@tanstack/react-query'
import { getAdminPlatformStats } from '@/services/admin/adminApi'
import { adminQueryKeys } from '@/services/admin/adminQueryKeys'

export function useAdminPlatformStatsQuery() {
  return useQuery({
    queryKey: adminQueryKeys.platformStats(),
    queryFn: getAdminPlatformStats,
  })
}
