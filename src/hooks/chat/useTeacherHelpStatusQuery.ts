import { useQuery } from '@tanstack/react-query'
import { ApiError } from '@/services/api/httpClient'
import { getTeacherHelpRequest } from '@/services/teacherHelp/teacherHelpApi'
import { chatQueryKeys } from '@/services/chat/chatQueryKeys'

/** Active statuses where the teacher is still engaging — poll more frequently. */
const ACTIVE_STATUSES = new Set(['assigned', 'in_progress'])

/** Ended — nothing more will happen to the request, so it is not read again. */
const ENDED_STATUSES = new Set(['resolved', 'cancelled', 'withdrawn', 'expired'])

/**
 * How often a conversation with help in this state is read again: 5 s while a
 * teacher is on it, 15 s while it waits for one, not at all once it has ended.
 * Ask reads the conversation itself at the same pace (#12 point 2), so a
 * teacher's reply appears without the student doing anything.
 */
export function teacherHelpPollInterval(status: string | null | undefined): number | false {
  if (!status) return false
  // Active: teacher is engaged → fast 5s poll for near-real-time updates
  if (ACTIVE_STATUSES.has(status)) return 5_000
  // Resolved / cancelled / withdrawn / expired → stop polling
  if (ENDED_STATUSES.has(status)) return false
  // Waiting: pending, waiting_no_teacher (no teacher free yet), and a status
  // this app does not know yet, which is read as waiting rather than as ended
  // (#397) → 15s is enough
  return 15_000
}

export function useTeacherHelpStatusQuery(conversationId: string | null) {
  return useQuery({
    queryKey: chatQueryKeys.teacherHelpRequest(conversationId ?? ''),
    queryFn: () => getTeacherHelpRequest(conversationId ?? ''),
    enabled: Boolean(conversationId),
    refetchInterval: (query) => teacherHelpPollInterval(query.state.data?.status),
    // 404 is the answer for a conversation that was never escalated: asking
    // again will not change it.
    retry: (failures, error) =>
      !(error instanceof ApiError && error.status === 404) && failures < 1,
    // Only poll when the tab is visible — no background traffic
    refetchIntervalInBackground: false,
  })
}
