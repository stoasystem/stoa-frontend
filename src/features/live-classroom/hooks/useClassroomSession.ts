import { useQuery } from '@tanstack/react-query'
import { getClassroomSession } from '@/features/live-classroom/services/liveClassroomService'
import { liveClassroomQueryKeys } from '@/features/live-classroom/utils/liveClassroomQueryKeys'

export function useClassroomSession(sessionId: string | undefined) {
  return useQuery({
    queryKey: liveClassroomQueryKeys.session(sessionId),
    queryFn: () => getClassroomSession(sessionId ?? ''),
    enabled: Boolean(sessionId),
  })
}
