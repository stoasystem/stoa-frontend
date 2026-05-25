import { httpClient } from '@/services/api/httpClient'
import type { UserRole } from '@/types/user'

export type SupportRequestCategory =
  | 'account_access'
  | 'bug'
  | 'teacher_help_question'
  | 'parent_report'
  | 'pilot_feedback'
  | 'other'

export type SupportRequestSeverity = 'low' | 'normal' | 'high' | 'urgent'

export type SubmitSupportRequestPayload = {
  category: SupportRequestCategory
  severity: SupportRequestSeverity
  subject: string
  message: string
  page?: string
  contactEmail?: string
  userRole?: UserRole
  createdAt?: string
}

export type SubmitSupportRequestResponse = {
  ok: boolean
  requestId: string
}

export async function submitSupportRequest(payload: SubmitSupportRequestPayload) {
  const response = await httpClient.post<SubmitSupportRequestResponse>(
    '/support/requests',
    payload,
  )

  return response.data
}
