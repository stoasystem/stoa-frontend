import { useQuery } from '@tanstack/react-query'
import { getTutorHelpRequestDetail } from '@/services/tutor/tutorApi'
import { tutorQueryKeys } from '@/services/tutor/tutorQueryKeys'

/** The teacher is working on it — poll fast for near-real-time updates. */
const ACTIVE_STATUSES = new Set(['in_progress'])

/** Not yet being worked on — a slower poll is enough. */
const WAITING_STATUSES = new Set(['pending', 'assigned'])

export function useTutorHelpRequestDetailQuery(requestId: string | undefined) {
  return useQuery({
    queryKey: tutorQueryKeys.helpRequestDetail(requestId ?? ''),
    queryFn: () => getTutorHelpRequestDetail(requestId ?? ''),
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
