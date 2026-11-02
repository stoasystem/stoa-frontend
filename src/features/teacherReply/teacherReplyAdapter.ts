import { addTeacherHelpRequestNote } from '@/services/teacher/teacherApi'
import type { ReplyImageReference } from '@/types/file'
import type { TeacherHelpRequestNote, TeacherReplyRichContent } from '@/types/teacher'

/** One reply as it goes out: its plain text, its blocks, and the pictures it names. */
export type TeacherReplyBody = {
  content: string
  richContent: TeacherReplyRichContent
  attachmentIds: ReplyImageReference[]
}

/**
 * The server a reply goes out to (#564): the one request a reply makes, and
 * nothing else. Tests put an in-memory one in its place.
 */
export type TeacherReplyAdapter = {
  /** `POST /teachers/me/help-requests/{id}/notes`. */
  addNote(requestId: string, body: TeacherReplyBody): Promise<TeacherHelpRequestNote>
}

export const serverTeacherReplyAdapter: TeacherReplyAdapter = {
  addNote: (requestId, body) => addTeacherHelpRequestNote({ requestId, ...body }),
}
