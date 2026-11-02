import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { classifyRefusal } from '@/features/teacherReply/replyRules'
import { isUploadGone } from '@/features/uploads/uploadGone'
import i18n from '@/i18n'
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

/**
 * The server would not take a picture the reply carried, and so took none of
 * it (stoa-backend#145): the upload was already sent, or past its time.
 */
export const isReplyImageRefusal = isUploadGone

// The teacher has to know whether to rewrite the reply or look at the request
// again, told from the same reasons the check before sending gives (#564).
function replyFailureKey(error: unknown) {
  const refusal = classifyRefusal(error)
  if (refusal === 'images') return 'teacher:toasts.replyImagesExpired'
  if (refusal === 'conflict') return 'teacher:toasts.replyConflict'
  if (refusal === 'unknown') return 'teacher:toasts.replyRefused'
  if (refusal) return `teacher:toasts.replyRefusedBecause.${refusal}`
  return 'teacher:toasts.replyFailed'
}
