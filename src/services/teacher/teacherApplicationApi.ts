import { apiPath } from '@/services/api/apiPath'
import { httpClient } from '@/services/api/httpClient'

export type TeacherReviewState = 'pending_review' | 'approved' | 'rejected'

export type TeacherApplicationSubmitResponse = {
  applicationId: string
  version: number
  status: string
  createdAt?: string
}

export type TeacherApplicationListItem = TeacherApplicationSubmitResponse & {
  reviewState?: TeacherReviewState | string
  verifiedEmail?: string
  fullName?: string
  subjects?: string[]
}

export type TeacherApplicationListResponse = {
  reviewState: string
  items: TeacherApplicationListItem[]
  count: number
}

export type TeacherApplicationDetail = TeacherApplicationSubmitResponse & {
  fullName?: string
  subjects?: string[]
  statement?: string
}

export type TeacherReviewResponse = {
  applicationId: string
  version: number
  decision: 'approved' | 'rejected'
  evidenceReference?: string
  invitationId?: string
  expiresAt?: string
  invitationDelivered?: boolean
}

export type TeacherActivationResponse = {
  status: string
  userId: string
  applicationId: string
  applicationVersion: number
  evidenceReference?: string
}

export async function claimTeacherInvitation(invitationToken: string, password: string) {
  const response = await httpClient.post<TeacherActivationResponse>(
    '/teacher-applications/activation/claim',
    { invitation_token: invitationToken, password },
  )
  return response.data
}

export async function consumeTeacherInvitation(invitationToken: string) {
  const response = await httpClient.post<TeacherActivationResponse>(
    '/teacher-applications/activation/consume',
    { invitation_token: invitationToken },
  )
  return response.data
}

/**
 * The identifier the queue read is authorized against.
 *
 * `GET /teacher-applications` shares its reviewer dependency with the
 * per-application reads, so it declares `application_id` as a required query
 * parameter even though the queue is selected by `review_state` alone. Sending
 * the detail shape without it answered 422, and the console printed the
 * server's field complaint as if it were a sentence for the reviewer.
 */
export const TEACHER_APPLICATION_QUEUE_ID = '*'

export const TEACHER_APPLICATION_QUEUE_PAGE_SIZE = 50

export async function listTeacherApplications(reviewState: TeacherReviewState = 'pending_review') {
  const response = await httpClient.get<TeacherApplicationListResponse>('/teacher-applications', {
    params: {
      review_state: reviewState,
      limit: TEACHER_APPLICATION_QUEUE_PAGE_SIZE,
      application_id: TEACHER_APPLICATION_QUEUE_ID,
    },
  })
  return response.data
}

export async function getTeacherApplicationDetail(applicationId: string, version: number) {
  const response = await httpClient.get<TeacherApplicationDetail>(
    apiPath`/teacher-applications/${applicationId}/versions/${version}`,
  )
  return response.data
}

export async function reviewTeacherApplication(input: {
  applicationId: string
  version: number
  decision: 'approved' | 'rejected'
  reason: string
}) {
  const response = await httpClient.post<TeacherReviewResponse>(
    apiPath`/teacher-applications/${input.applicationId}/reviews`,
    { version: input.version, decision: input.decision, reason: input.reason },
  )
  return response.data
}

export async function reissueTeacherInvitation(applicationId: string, version: number) {
  const response = await httpClient.post<TeacherReviewResponse>(
    apiPath`/teacher-applications/${applicationId}/invitations`,
    { version },
  )
  return response.data
}
