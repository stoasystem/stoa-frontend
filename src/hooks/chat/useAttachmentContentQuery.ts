import { useQuery } from '@tanstack/react-query'
import { ApiError } from '@/services/api/httpClient'
import { chatQueryKeys } from '@/services/chat/chatQueryKeys'
import { getAttachmentContent } from '@/services/files/fileApi'

/** Not the student's to read (403), or gone (404): asking again cannot change that. */
export function isAttachmentOutOfReach(error: unknown) {
  return error instanceof ApiError && (error.status === 403 || error.status === 404)
}

/**
 * A picture a teacher replied with (#513). A file does not change once sent:
 * read once, and not again with every refetch of the conversation, nor when a
 * language switch invalidates every query (`'static'` keeps it out of
 * `invalidateQueries`), as the teacher's view of a student's picture is (#510).
 */
export function useAttachmentContentQuery(attachmentId: string) {
  return useQuery({
    queryKey: chatQueryKeys.attachmentContent(attachmentId),
    queryFn: () => getAttachmentContent(attachmentId),
    staleTime: 'static',
    retry: (failureCount, error) => !isAttachmentOutOfReach(error) && failureCount < 1,
  })
}
