import { useQuery } from '@tanstack/react-query'
import { getAdminFeedbackList } from '@/services/admin/adminApi'
import { adminQueryKeys } from '@/services/admin/adminQueryKeys'

export function useAdminFeedbackListQuery() {
  return useQuery({
    queryKey: adminQueryKeys.feedback(),
    queryFn: getAdminFeedbackList,
  })
}
