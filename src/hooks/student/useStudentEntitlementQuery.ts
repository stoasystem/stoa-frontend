import { type QueryClient, useQuery } from '@tanstack/react-query'
import { getStudentEntitlement } from '@/services/student/studentApi'
import type { StudentEntitlement } from '@/types/student'

/** The student's own entitlement: their plan, limits and usage period. Ask reads it under the same key. */
export const studentEntitlementQueryKey = ['student', 'entitlement'] as const

export function useStudentEntitlementQuery() {
  return useQuery({
    queryKey: studentEntitlementQueryKey,
    queryFn: getStudentEntitlement,
  })
}

/**
 * A question or a request for a teacher was refused `usage_period_ended`: the
 * period ended while the page was open. Whatever reads the entitlement shows
 * it ended at once, and the entitlement is read again; what the server says
 * then stands.
 */
export function noteUsagePeriodEnded(queryClient: QueryClient) {
  queryClient.setQueryData<StudentEntitlement>(studentEntitlementQueryKey, (entitlement) =>
    entitlement && entitlement.usagePeriod.state === 'active'
      ? { ...entitlement, usagePeriod: { ...entitlement.usagePeriod, state: 'expired', daysLeft: 0 } }
      : entitlement,
  )
  void queryClient.invalidateQueries({ queryKey: studentEntitlementQueryKey, exact: true })
}
