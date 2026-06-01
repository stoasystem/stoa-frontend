import { useMutation, useQueryClient } from '@tanstack/react-query'
import { saveClassroomNotes } from '@/features/live-classroom/services/liveClassroomService'
import type { ClassroomNotes } from '@/features/live-classroom/types/liveClassroom'
import { liveClassroomQueryKeys } from '@/features/live-classroom/utils/liveClassroomQueryKeys'

export function useClassroomNotes(sessionId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (notes: ClassroomNotes) => saveClassroomNotes(sessionId ?? '', notes),
    onSuccess: () => {
      if (!sessionId) return
      void queryClient.invalidateQueries({ queryKey: liveClassroomQueryKeys.session(sessionId) })
      void queryClient.invalidateQueries({ queryKey: liveClassroomQueryKeys.tutorQueue() })
    },
  })
}
