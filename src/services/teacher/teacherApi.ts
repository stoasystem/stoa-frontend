import { apiPath } from '@/services/api/apiPath'
import { httpClient } from '@/services/api/httpClient'

import type { ReplyImageReference } from '@/types/file'
import type { TeacherHelpStatus } from '@/types/teacherHelp'
import type {
  TeacherHelpRequestDetail,
  TeacherHelpRequestNote,
  TeacherHelpRequestSummary,
  TeacherProfile,
  TeacherStats,
  TeacherReplyRichContent,
} from '@/types/teacher'

export async function getTeacherProfile() {
  const response = await httpClient.get<TeacherProfile>('/teachers/me/profile')
  return response.data
}

export async function getTeacherHelpRequests() {
  const response = await httpClient.get<{ items: TeacherHelpRequestSummary[] }>(
    '/teachers/me/help-requests',
  )
  return response.data
}

export async function getTeacherHelpRequestDetail(requestId: string) {
  const response = await httpClient.get<TeacherHelpRequestDetail>(
    apiPath`/teachers/me/help-requests/${requestId}`,
  )
  return response.data
}

/**
 * The bytes of a file the student sent in this help request (#510). The route
 * wants the teacher's token, so an `<img src>` cannot read it: the caller
 * shows the blob. 403/404 when this teacher may not read it (any more).
 */
export async function getTeacherHelpRequestAttachment(requestId: string, attachmentId: string) {
  const response = await httpClient.get<Blob>(
    apiPath`/teachers/me/help-requests/${requestId}/attachments/${attachmentId}/content`,
    { responseType: 'blob' },
  )
  return response.data
}

/**
 * Accept a request (`in_progress`) or finish it (`resolved`). No closing note:
 * the backend stored it and nothing ever read it (#705).
 */
export async function updateTeacherHelpRequestStatus({
  requestId,
  status,
}: {
  requestId: string
  status: TeacherHelpStatus
}) {
  const response = await httpClient.patch<TeacherHelpRequestSummary>(
    apiPath`/teachers/me/help-requests/${requestId}`,
    { status },
  )
  return response.data
}

/**
 * A reply, with the pictures the teacher added as their validated uploads
 * (`help_reply_image`, stoa-backend#145). A reply without any sends no
 * `attachmentIds` at all, as before.
 */
export async function addTeacherHelpRequestNote({
  requestId,
  content,
  richContent,
  attachmentIds = [],
}: {
  requestId: string
  content: string
  richContent?: TeacherReplyRichContent
  attachmentIds?: ReplyImageReference[]
}) {
  const response = await httpClient.post<TeacherHelpRequestNote>(
    apiPath`/teachers/me/help-requests/${requestId}/notes`,
    attachmentIds.length > 0 ? { content, richContent, attachmentIds } : { content, richContent },
  )
  return response.data
}

export async function getTeacherStats() {
  const response = await httpClient.get<TeacherStats>('/teachers/me/stats')
  return response.data
}


