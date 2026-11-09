import { useQuery } from '@tanstack/react-query'
import { useAskServer } from '@/features/ask/server/askServer'
import { studentEntitlementQueryKey } from '@/hooks/student/useStudentEntitlementQuery'
import { usagePeriodPaused } from '@/lib/usagePeriod'
import type { StudentEntitlement } from '@/types/student'

export type AskUsagePeriod = {
  /** The period has ended, or none was set: no new question, no teacher (#615). */
  paused: boolean
  /** As last read; `undefined` until it is, or when it could not be. */
  entitlement: StudentEntitlement | undefined
}

/**
 * Whether Ask may take a new question, from the student's usage period
 * (`GET /students/me/entitlement`, #615). Read through the server behind Ask,
 * under the entitlement's own key, so a refusal `usage_period_ended` anywhere
 * (`noteUsagePeriodEnded`) pauses every reader at once. Unknown is not paused.
 */
export function useAskUsagePeriod(): AskUsagePeriod {
  const { getStudentEntitlement } = useAskServer().student
  const { data } = useQuery({
    queryKey: studentEntitlementQueryKey,
    queryFn: () => getStudentEntitlement(),
  })
  return { paused: usagePeriodPaused(data), entitlement: data }
}
