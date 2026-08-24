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

export async function getTeacherHelpRequest(requestId: string) {
  const response = await httpClient.get<TeacherHelpRequest>(
    `/teacher-help/request/${requestId}`,
  )
  return response.data
}

