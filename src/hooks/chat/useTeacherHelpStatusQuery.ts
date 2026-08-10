import { useQuery } from '@tanstack/react-query'
import { getTeacherHelpRequest } from '@/services/teacherHelp/teacherHelpApi'
import { chatQueryKeys } from '@/services/chat/chatQueryKeys'

/** Active statuses where the teacher is still engaging — poll more frequently. */
const ACTIVE_STATUSES = new Set(['assigned', 'in_progress'])

/** Pending status — teacher hasn't responded yet, lower priority. */
const WAITING_STATUSES = new Set(['pending'])

export function useTeacherHelpStatusQuery(requestId: string | null) {
  return useQuery({
    queryKey: chatQueryKeys.teacherHelpRequest(requestId ?? ''),
    queryFn: () => getTeacherHelpRequest(requestId ?? ''),
    enabled: Boolean(requestId),
    refetchInterval: (query) => {
      const status = query.state.data?.status
      if (!status) return false
      // Active: teacher is engaged → fast 5s poll for near-real-time updates
      if (ACTIVE_STATUSES.has(status)) return 5_000
      // Waiting: request submitted, teacher not yet assigned → 15s is enough
      if (WAITING_STATUSES.has(status)) return 15_000
      // Resolved / cancelled / any terminal state → stop polling
      return false
    },
    // Only poll when the tab is visible — no background traffic
    refetchIntervalInBackground: false,
  })
}
