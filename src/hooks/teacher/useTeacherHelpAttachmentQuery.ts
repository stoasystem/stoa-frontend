import { useQuery } from '@tanstack/react-query'
import { retryUnlessOutOfReach } from '@/lib/teacherHelpRequestConflict'
import { getTeacherHelpRequestAttachment } from '@/services/teacher/teacherApi'
import { teacherQueryKeys } from '@/services/teacher/teacherQueryKeys'

/**
 * A picture the student sent in the help request (#510). A file does not
 * change once sent: read once, and not again with every poll of the request,
 * nor when a language switch invalidates every query (`'static'` keeps it out
 * of `invalidateQueries`). Refused (403/404), asking again cannot change that.
 */
export function useTeacherHelpAttachmentQuery(requestId: string, attachmentId: string) {
  return useQuery({
    queryKey: teacherQueryKeys.helpRequestAttachment(requestId, attachmentId),
    queryFn: () => getTeacherHelpRequestAttachment(requestId, attachmentId),
    staleTime: 'static',
    retry: retryUnlessOutOfReach,
  })
}
