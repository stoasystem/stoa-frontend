import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import i18n from '@/i18n'
import { isHelpRequestConflict } from '@/lib/teacherHelpRequestConflict'
import { trackEvent } from '@/services/analytics/analyticsClient'
import { ApiError } from '@/services/api/httpClient'
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
      toast.success(i18n.t('teacher:toasts.replySent'))
      // A reply to an offer is also its acceptance (now `in_progress`), so the
      // list and the stats move too, not only the detail (#269). The list key
      // is the detail's prefix.
      void queryClient.invalidateQueries({ queryKey: teacherQueryKeys.helpRequests() })
      void queryClient.invalidateQueries({ queryKey: teacherQueryKeys.stats() })
    },
    onError: (error) => {
      toast.error(i18n.t(replyFailureKey(error)))
      if (!isHelpRequestConflict(error)) return
      void queryClient.invalidateQueries({ queryKey: teacherQueryKeys.helpRequests() })
      void queryClient.invalidateQueries({ queryKey: teacherQueryKeys.stats() })
    },
  })
}

// The teacher has to know whether to rewrite the reply or look at the request
// again: a 409 means the request moved on, a 422 that the server refused the
// reply's content (#271).
function replyFailureKey(error: unknown) {
  if (isHelpRequestConflict(error)) return 'teacher:toasts.replyConflict'
  if (error instanceof ApiError && error.status === 422) return 'teacher:toasts.replyRefused'
  return 'teacher:toasts.replyFailed'
}
