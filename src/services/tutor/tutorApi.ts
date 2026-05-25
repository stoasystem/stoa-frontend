import { httpClient } from '@/services/api/httpClient'
import type { TeacherHelpStatus } from '@/types/teacherHelp'
import type {
  TutorHelpRequestDetail,
  TutorHelpRequestNote,
  TutorHelpRequestSummary,
  TutorStats,
} from '@/types/tutor'

export async function getTutorHelpRequests() {
  const response = await httpClient.get<{ items: TutorHelpRequestSummary[] }>(
    '/tutors/me/help-requests',
  )
  return response.data
}

export async function getTutorHelpRequestDetail(requestId: string) {
  const response = await httpClient.get<TutorHelpRequestDetail>(
    `/tutors/me/help-requests/${requestId}`,
  )
  return response.data
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
  const response = await httpClient.patch<TutorHelpRequestSummary>(
    `/tutors/me/help-requests/${requestId}`,
    { status, resolutionNote },
  )
  return response.data
}

export async function addTutorHelpRequestNote({
  requestId,
  content,
}: {
  requestId: string
  content: string
}) {
  const response = await httpClient.post<TutorHelpRequestNote>(
    `/tutors/me/help-requests/${requestId}/notes`,
    { content },
  )
  return response.data
}

export async function getTutorStats() {
  const response = await httpClient.get<TutorStats>('/tutors/me/stats')
  return response.data
}
