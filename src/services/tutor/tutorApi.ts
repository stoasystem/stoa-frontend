import { httpClient } from '@/services/api/httpClient'
import {
  mockTutorHelpRequestDetail,
  mockTutorHelpRequests,
  mockTutorStats,
} from '@/data/phase11MockData'
import { withDemoFallback } from '@/services/demo/demoFallback'
import type { TeacherHelpStatus } from '@/types/teacherHelp'
import type {
  TutorHelpRequestDetail,
  TutorHelpRequestNote,
  TutorHelpRequestSummary,
  TutorStats,
} from '@/types/tutor'

export async function getTutorHelpRequests() {
  return withDemoFallback(async () => {
    const response = await httpClient.get<{ items: TutorHelpRequestSummary[] }>(
      '/tutors/me/help-requests',
    )
    return response.data
  }, { items: mockTutorHelpRequests })
}

export async function getTutorHelpRequestDetail(requestId: string) {
  return withDemoFallback(async () => {
    const response = await httpClient.get<TutorHelpRequestDetail>(
      `/tutors/me/help-requests/${requestId}`,
    )
    return response.data
  }, { ...mockTutorHelpRequestDetail, requestId })
}

export async function updateTutorHelpRequestStatus({
  requestId,
  status,
  resolutionNote,
}: {
  requestId: string
  status: TeacherHelpStatus
  resolutionNote?: string
}) {
  return withDemoFallback(async () => {
    const response = await httpClient.patch<TutorHelpRequestSummary>(
      `/tutors/me/help-requests/${requestId}`,
      { status, resolutionNote },
    )
    return response.data
  }, { ...mockTutorHelpRequests[0], requestId, status })
}

export async function addTutorHelpRequestNote({
  requestId,
  content,
}: {
  requestId: string
  content: string
}) {
  return withDemoFallback(async () => {
    const response = await httpClient.post<TutorHelpRequestNote>(
      `/tutors/me/help-requests/${requestId}/notes`,
      { content },
    )
    return response.data
  }, {
    id: `note-${Date.now()}`,
    note: content,
    createdAt: new Date().toISOString(),
    tutor: { id: 'demo-tutor', name: 'Demo Tutor' },
  })
}

export async function getTutorStats() {
  return withDemoFallback(async () => {
    const response = await httpClient.get<TutorStats>('/tutors/me/stats')
    return response.data
  }, mockTutorStats)
}
