import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { trackEvent } from '@/services/analytics/analyticsClient'
import { addTeacherHelpRequestNote } from '@/services/teacher/teacherApi'
import { teacherQueryKeys } from '@/services/teacher/teacherQueryKeys'

export function useAddTeacherHelpRequestNoteMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: addTeacherHelpRequestNote,
    onSuccess: (note, variables) => {
      trackEvent('teacher_note_added', {
        requestId: variables.requestId,
        noteId: note.id,
      })
      toast.success('Teacher note added')
      void queryClient.invalidateQueries({
        queryKey: teacherQueryKeys.helpRequestDetail(variables.requestId),
      })
    },
    onError: () => {
      toast.error('Failed to add teacher note')
    },
  })
}
