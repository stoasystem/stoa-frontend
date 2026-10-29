import { useQuery } from '@tanstack/react-query'
import { isHelpRequestOutOfReach } from '@/lib/teacherHelpRequestConflict'
import { getTeacherHelpRequestAttachment } from '@/services/teacher/teacherApi'
import { teacherQueryKeys } from '@/services/teacher/teacherQueryKeys'

/**
 * A picture the student sent in the help request (#510). A file does not
 * change once sent: read once, and not again with every poll of the request.
 * Refused (403/404), asking again cannot change that.
 */
export function useTeacherHelpAttachmentQuery(requestId: string, attachmentId: string, enabled = true) {
  return useQuery({
    queryKey: teacherQueryKeys.helpRequestAttachment(requestId, attachmentId),
    queryFn: () => getTeacherHelpRequestAttachment(requestId, attachmentId),
    enabled,
    staleTime: Infinity,
    retry: (failureCount, error) => !isHelpRequestOutOfReach(error) && failureCount < 1,
  })
}
