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
// reply's content (#271), and what in it (#332).
function replyFailureKey(error: unknown) {
  if (isHelpRequestConflict(error)) return 'teacher:toasts.replyConflict'
  if (error instanceof ApiError && error.status === 422) {
    const reason = refusalReason(error)
    return reason ? `teacher:toasts.replyRefusedBecause.${reason}` : 'teacher:toasts.replyRefused'
  }
  return 'teacher:toasts.replyFailed'
}

type RefusalReason = 'html' | 'privateMarkers' | 'tooManyBlocks' | 'blockTooLong' | 'tooLong'

/*
 * The server's code for a refusal, read before its message (#371). stoa-backend
 * sends none for a refused reply yet (the teachers router passes only
 * `detail=str(exc)`), so nothing is listed (#388). When it adds codes, register
 * the ones it really sends here; any other code falls back to the message.
 */
const REFUSAL_CODES = new Map<string, RefusalReason>()

function refusalReason(error: ApiError): RefusalReason | null {
  const coded = error.code ? REFUSAL_CODES.get(error.code) : undefined
  return coded ?? refusalReasonFromMessage(error.message)
}

// teacher_reply_service's TeacherReplyValidationError messages, as the router
// passes them on in `detail`. A block's own limit names its field ("text
// exceeds 2000 characters", "latex exceeds 500 characters"); the whole reply's
// is "teacher reply fallback exceeds 4000 characters" (#371).
function refusalReasonFromMessage(message: string): RefusalReason | null {
  const lowered = message.toLowerCase()
  if (lowered.includes('unsafe raw html')) return 'html'
  if (lowered.includes('private markers') || lowered.includes('private credentials')) return 'privateMarkers'
  if (lowered.includes('1 to 20 blocks')) return 'tooManyBlocks'
  if (/\b(?:text|latex) exceeds\b/.test(lowered)) return 'blockTooLong'
  if (lowered.includes('exceeds')) return 'tooLong'
  return null
}
