import { useQuery, useQueryClient } from '@tanstack/react-query'
import { isHelpRequestOutOfReach, retryUnlessOutOfReach } from '@/lib/teacherHelpRequestConflict'
import { getTeacherHelpRequestDetail } from '@/services/teacher/teacherApi'
import { teacherQueryKeys } from '@/services/teacher/teacherQueryKeys'
import type { TeacherHelpRequestDetail } from '@/types/teacher'

/** The teacher is working on it — poll fast for near-real-time updates. */
const ACTIVE_STATUSES = new Set(['in_progress'])

/** Not yet being worked on — a slower poll is enough. */
const WAITING_STATUSES = new Set(['pending', 'assigned'])

/** The poll reads no evidence: what the first load read is kept. */
function withEvidenceOf(
  loaded: TeacherHelpRequestDetail,
  live: TeacherHelpRequestDetail,
): TeacherHelpRequestDetail {
  return { ...live, commonErrorCause: loaded.commonErrorCause, aiHelpedStars: loaded.aiHelpedStars }
}

export function useTeacherHelpRequestDetailQuery(requestId: string | undefined) {
  const queryClient = useQueryClient()
  const queryKey = teacherQueryKeys.helpRequestDetail(requestId ?? '')
  return useQuery({
    queryKey,
    queryFn: async () => {
      const loaded = queryClient.getQueryData<TeacherHelpRequestDetail>(queryKey)
      if (!loaded) return getTeacherHelpRequestDetail(requestId ?? '')
      return withEvidenceOf(loaded, await getTeacherHelpRequestDetail(requestId ?? '', 'live'))
    },
    enabled: Boolean(requestId),
    retry: retryUnlessOutOfReach,
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
