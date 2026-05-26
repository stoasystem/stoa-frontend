import { httpClient } from '@/services/api/httpClient'
import { withDemoFallback } from '@/services/demo/demoFallback'
import type { TeacherAvailability, TeacherHelpRequest } from '@/types/teacherHelp'

export async function getTeacherAvailability() {
  return withDemoFallback(async () => {
    const response = await httpClient.get<TeacherAvailability>(
      '/teacher-help/availability',
    )
    return response.data
  }, {
    online: true,
    availableTeachers: 1,
    nextWindow: 'Today 16:00-19:00',
    responseTime: 'Usually within a few minutes when a teacher is online.',
  })
}

export async function createTeacherHelpRequest(payload: {
  conversationId: string
  message?: string
}) {
  return withDemoFallback(async () => {
    const response = await httpClient.post<TeacherHelpRequest>(
      '/teacher-help/request',
      payload,
    )
    return response.data
  }, createDemoTeacherHelpRequest(payload.conversationId))
}

export async function getTeacherHelpRequest(requestId: string) {
  return withDemoFallback(async () => {
    const response = await httpClient.get<TeacherHelpRequest>(
      `/teacher-help/request/${requestId}`,
    )
    return response.data
  }, {
    requestId,
    conversationId: 'conv-1',
    status: 'pending',
    teacherName: 'STOA teacher',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })
}

function createDemoTeacherHelpRequest(conversationId: string): TeacherHelpRequest {
  return {
    requestId: `teacher-help-${Date.now()}`,
    conversationId,
    status: 'pending',
    teacherName: 'STOA teacher',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}
