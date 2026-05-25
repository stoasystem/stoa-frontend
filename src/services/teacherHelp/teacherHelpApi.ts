import { httpClient } from '@/services/api/httpClient'
import { withDemoFallback } from '@/services/demo/demoFallback'
import type { TeacherHelpRequest } from '@/types/teacherHelp'

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
    teacherName: 'Demo Tutor',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })
}

function createDemoTeacherHelpRequest(conversationId: string): TeacherHelpRequest {
  return {
    requestId: `teacher-help-${Date.now()}`,
    conversationId,
    status: 'pending',
    teacherName: 'Demo Tutor',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}
