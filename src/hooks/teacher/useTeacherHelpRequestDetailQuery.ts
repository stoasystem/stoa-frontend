import { useQuery } from '@tanstack/react-query'
import { ApiError } from '@/services/api/httpClient'
import { getTeacherHelpRequestDetail } from '@/services/teacher/teacherApi'
import { teacherQueryKeys } from '@/services/teacher/teacherQueryKeys'

/** The teacher is working on it — poll fast for near-real-time updates. */
const ACTIVE_STATUSES = new Set(['in_progress'])

/** Not yet being worked on — a slower poll is enough. */
const WAITING_STATUSES = new Set(['pending', 'assigned'])

/**
 * The server will not show this request to this teacher any more: someone
 * else took it (403) or it is gone (404). Asking again cannot change that;
 * any other failure (a timeout, a 500) may pass (#331).
 */
export function isHelpRequestOutOfReach(error: unknown) {
  return error instanceof ApiError && (error.status === 403 || error.status === 404)
}

export function useTeacherHelpRequestDetailQuery(requestId: string | undefined) {
  return useQuery({
    queryKey: teacherQueryKeys.helpRequestDetail(requestId ?? ''),
    queryFn: () => getTeacherHelpRequestDetail(requestId ?? ''),
    enabled: Boolean(requestId),
    // The app's one retry, but not for a request out of reach.
    retry: (failureCount, error) => !isHelpRequestOutOfReach(error) && failureCount < 1,
    refetchInterval: (query) => {
      if (isHelpRequestOutOfReach(query.state.error)) return false
      const status = query.state.data?.status
      if (!status) return false
      if (ACTIVE_STATUSES.has(status)) return 5_000
      if (WAITING_STATUSES.has(status)) return 10_000
      // Resolved / cancelled / any terminal state → stop polling
      return false
    },
    // Only poll when the tab is visible — no background traffic
    refetchIntervalInBackground: false,
  })
}
