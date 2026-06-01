import { useMutation, useQueryClient } from '@tanstack/react-query'
import { scheduleClassroomSession } from '@/features/live-classroom/services/liveClassroomService'
import type { ScheduleClassroomInput } from '@/features/live-classroom/types/liveClassroom'
import { liveClassroomQueryKeys } from '@/features/live-classroom/utils/liveClassroomQueryKeys'

export function useScheduleClassroom() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: ScheduleClassroomInput) => scheduleClassroomSession(input),
    onSuccess: (session) => {
      queryClient.setQueryData(liveClassroomQueryKeys.session(session.id), session)
      void queryClient.invalidateQueries({ queryKey: liveClassroomQueryKeys.studentHome() })
      void queryClient.invalidateQueries({ queryKey: liveClassroomQueryKeys.tutorQueue() })
    },
  })
}
