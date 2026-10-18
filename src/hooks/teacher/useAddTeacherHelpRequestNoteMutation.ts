import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { isHelpRequestConflict } from '@/lib/teacherHelpRequestConflict'
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
      // A reply to an offer is also its acceptance (now `in_progress`), so the
      // list and the stats move too, not only the detail (#269). The list key
      // is the detail's prefix.
      void queryClient.invalidateQueries({ queryKey: teacherQueryKeys.helpRequests() })
      void queryClient.invalidateQueries({ queryKey: teacherQueryKeys.stats() })
    },
    onError: (error) => {
      toast.error('Failed to add teacher note')
      if (!isHelpRequestConflict(error)) return
      void queryClient.invalidateQueries({ queryKey: teacherQueryKeys.helpRequests() })
      void queryClient.invalidateQueries({ queryKey: teacherQueryKeys.stats() })
    },
  })
}
