import { httpClient } from '@/services/api/httpClient'
import type { TeacherHelpStatus } from '@/types/teacherHelp'
import type { TutorHelpRequestDetail, TutorHelpRequestSummary } from '@/types/tutor'

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
}: {
  requestId: string
  status: TeacherHelpStatus
}) {
  const response = await httpClient.patch<TutorHelpRequestSummary>(
    `/tutors/me/help-requests/${requestId}`,
    { status },
  )
  return response.data
}
