import { useMutation, useQueryClient } from '@tanstack/react-query'
import { requestInstantVideoHelp } from '@/features/live-classroom/services/liveClassroomService'
import type { InstantVideoHelpInput } from '@/features/live-classroom/types/liveClassroom'
import { liveClassroomQueryKeys } from '@/features/live-classroom/utils/liveClassroomQueryKeys'

export function useInstantVideoHelp() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: InstantVideoHelpInput) => requestInstantVideoHelp(input),
    onSuccess: (session) => {
      queryClient.setQueryData(liveClassroomQueryKeys.session(session.id), session)
      void queryClient.invalidateQueries({ queryKey: liveClassroomQueryKeys.studentHome() })
      void queryClient.invalidateQueries({ queryKey: liveClassroomQueryKeys.tutorQueue() })
    },
  })
}
