import { getAttachmentContent } from '@/services/files/fileApi'
import { getTeacherHelpRequestAttachment } from '@/services/teacher/teacherApi'

/**
 * Where `AttachmentPictures` reads a file's bytes from (#563). `scope` sets
 * the reads of one route apart in the cache: the same file read through
 * another route is another read. The HTTP call stays in `src/services`, where
 * the API contract check looks for it.
 */
export type AttachmentReader = {
  /** The cache key's prefix, as `['teacher-help', requestId]`. */
  scope: readonly unknown[]
  read(attachmentId: string): Promise<Blob>
}

/** The student's own files, a teacher's picture in a reply among them (#513). */
export const studentAttachments: AttachmentReader = {
  scope: ['student'],
  read: (attachmentId) => getAttachmentContent(attachmentId),
}

/** The files of one help request, read with the teacher's token (#510). */
export function teacherHelpAttachments(requestId: string): AttachmentReader {
  return {
    scope: ['teacher-help', requestId],
    read: (attachmentId) => getTeacherHelpRequestAttachment(requestId, attachmentId),
  }
}
