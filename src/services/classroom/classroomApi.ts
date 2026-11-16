import { apiPath } from '@/services/api/apiPath'
import { httpClient } from '@/services/api/httpClient'

import type { ClassroomPass } from '@/types/classroom'

/**
 * A student's seat in the classroom of their own conversation's help request
 * (stoa-backend#467): while it waits for a teacher or a teacher has it. 503
 * `classroom_unavailable` while the whiteboard or voice is not configured.
 */
export async function enterStudentClassroom(conversationId: string) {
  const response = await httpClient.post<ClassroomPass>(
    apiPath`/conversations/${conversationId}/classroom`,
  )
  return response.data
}

/**
 * A teacher's seat in the classroom of a help request they hold, once it is
 * in progress (stoa-backend#467). Same 503 as the student's.
 */
export async function enterTeacherClassroom(requestId: string) {
  const response = await httpClient.post<ClassroomPass>(
    apiPath`/teachers/me/help-requests/${requestId}/classroom`,
  )
  return response.data
}
