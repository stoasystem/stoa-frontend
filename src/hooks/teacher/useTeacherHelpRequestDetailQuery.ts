import { useQuery } from '@tanstack/react-query'
import { getTeacherHelpRequestDetail } from '@/services/teacher/teacherApi'
import { teacherQueryKeys } from '@/services/teacher/teacherQueryKeys'

/** The teacher is working on it — poll fast for near-real-time updates. */
const ACTIVE_STATUSES = new Set(['in_progress'])

/** Not yet being worked on — a slower poll is enough. */
const WAITING_STATUSES = new Set(['pending', 'assigned'])

export function useTeacherHelpRequestDetailQuery(requestId: string | undefined) {
  return useQuery({
    queryKey: teacherQueryKeys.helpRequestDetail(requestId ?? ''),
    queryFn: () => getTeacherHelpRequestDetail(requestId ?? ''),
    enabled: Boolean(requestId),
    refetchInterval: (query) => {
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
