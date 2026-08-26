import { useQuery } from '@tanstack/react-query'
import { getStudentEntitlement } from '@/services/student/studentApi'

export function useStudentEntitlementQuery() {
  return useQuery({
    queryKey: ['student', 'entitlement'],
    queryFn: getStudentEntitlement,
  })
}
