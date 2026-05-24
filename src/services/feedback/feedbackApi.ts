import { httpClient } from '@/services/api/httpClient'
import type { UserRole } from '@/types/user'

export type FeedbackType = 'bug' | 'confusion' | 'suggestion' | 'praise'

export type SubmitFeedbackRequest = {
  type: FeedbackType
  page: string
  message: string
  userRole?: UserRole
  createdAt?: string
}

export async function submitFeedback(payload: SubmitFeedbackRequest) {
  const response = await httpClient.post<{ ok: boolean; feedbackId: string }>(
    '/feedback',
    payload,
  )
  return response.data
}
