import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateTeacherDispatchStatus } from '@/services/teacher/teacherAvailabilityApi'
import { teacherQueryKeys } from '@/services/teacher/teacherQueryKeys'
import type { TeacherDispatchStatus } from '@/types/teacherAvailability'

/**
 * Takes dispatch or pauses it (#768): sent on its own, at once, not with the
 * subjects-and-hours form. The backend answers with the whole availability,
 * which the page shows straight away before reading it again.
 */
export function useUpdateTeacherDispatchStatusMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (status: TeacherDispatchStatus) => updateTeacherDispatchStatus(status),
    onSuccess: (availability) => {
      queryClient.setQueryData(teacherQueryKeys.availability(), availability)
      void queryClient.invalidateQueries({ queryKey: teacherQueryKeys.availability() })
      // The profile page shows the same status.
      void queryClient.invalidateQueries({ queryKey: teacherQueryKeys.profile() })
    },
  })
}
