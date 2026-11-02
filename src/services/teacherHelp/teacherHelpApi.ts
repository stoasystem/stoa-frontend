import { apiPath } from '@/services/api/apiPath'
import { httpClient } from '@/services/api/httpClient'

import type { TeacherAvailability, TeacherHelpRequest } from '@/types/teacherHelp'

export async function getTeacherAvailability() {
  const response = await httpClient.get<TeacherAvailability>(
    '/teacher-help/availability',
  )
  return response.data
}

export async function createTeacherHelpRequest(payload: {
  conversationId: string
  message?: string
}) {
  const response = await httpClient.post<TeacherHelpRequest>(
    '/teacher-help/request',
    payload,
  )
  return response.data
}

export async function getTeacherHelpRequest(conversationId: string) {
  const response = await httpClient.get<TeacherHelpRequest>(
    apiPath`/teacher-help/conversations/${conversationId}/request`,
  )
  return response.data
}


/**
 * Takes back a request no teacher has taken yet (stoa-backend#86): it ends as
 * `withdrawn` and the week's case is given back. 409 once a teacher has it or
 * it has ended; 503 `teacher_help_withdrawal_unavailable` when trying again is
 * safe.
 */
export async function withdrawTeacherHelpRequest(conversationId: string) {
  const response = await httpClient.post<TeacherHelpRequest>(
    apiPath`/teacher-help/conversations/${conversationId}/request/withdraw`,
  )
  return response.data
}
