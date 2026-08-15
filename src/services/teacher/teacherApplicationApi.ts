import { httpClient } from '@/services/api/httpClient'

export type TeacherReviewState = 'pending_review' | 'approved' | 'rejected'

export type TeacherApplicationSubmitRequest = {
  email: string
  emailVerified: true
  fullName: string
  subjects: string[]
  statement: string
}

export type TeacherApplicationSubmitResponse = {
  applicationId: string
  version: number
  status: string
  createdAt?: string
}

export type TeacherApplicationStatus = {
  applicationId: string
  version: number
  reviewState: TeacherReviewState | string
  createdAt?: string
  decidedAt?: string | null
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

function toSnakeApplication(payload: TeacherApplicationSubmitRequest) {
  return {
    email: payload.email,
    email_verified: payload.emailVerified,
    full_name: payload.fullName,
    subjects: payload.subjects,
    statement: payload.statement,
  }
}

export async function submitTeacherApplication(payload: TeacherApplicationSubmitRequest) {
  const response = await httpClient.post<TeacherApplicationSubmitResponse>(
    '/teacher-applications',
    toSnakeApplication(payload),
  )
  return response.data
}

export async function getTeacherApplicationStatus(applicationId: string) {
  const response = await httpClient.get<TeacherApplicationStatus>(
    `/teacher-applications/${applicationId}/status`,
  )
  return response.data
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

export async function listTeacherApplications(reviewState: TeacherReviewState = 'pending_review') {
  const response = await httpClient.get<TeacherApplicationListResponse>('/teacher-applications', {
    params: { review_state: reviewState, limit: 50 },
  })
  return response.data
}

export async function getTeacherApplicationDetail(applicationId: string, version: number) {
  const response = await httpClient.get<TeacherApplicationDetail>(
    `/teacher-applications/${applicationId}/versions/${version}`,
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
    `/teacher-applications/${input.applicationId}/reviews`,
    { version: input.version, decision: input.decision, reason: input.reason },
  )
  return response.data
}

export async function reissueTeacherInvitation(applicationId: string, version: number) {
  const response = await httpClient.post<TeacherReviewResponse>(
    `/teacher-applications/${applicationId}/invitations`,
    { version },
  )
  return response.data
}

export function buildTeacherStatement(input: {
  introduction: string
  educationBackground: string
  yearsOfExperience?: number
}) {
  const parts = [input.introduction.trim()]
  if (input.educationBackground.trim()) {
    parts.push(`Education: ${input.educationBackground.trim()}`)
  }
  if (typeof input.yearsOfExperience === 'number' && Number.isFinite(input.yearsOfExperience)) {
    parts.push(`Experience: ${input.yearsOfExperience} years`)
  }
  return parts.filter(Boolean).join('\n\n').slice(0, 2000)
}
