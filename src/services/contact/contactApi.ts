import { httpClient } from '@/services/api/httpClient'
import type { SupportedLanguage } from '@/i18n/languages'

export type ContactRole = 'parent' | 'student' | 'teacher' | 'school' | 'other'

export type ContactTopic =
  | 'learning_platform'
  | 'teacher_support'
  | 'parent_reports'
  | 'pricing'
  | 'tutor_application'
  | 'school_partnership'
  | 'technical_support'
  | 'other'

export type ContactRequestPayload = {
  name: string
  email: string
  phone?: string
  role: ContactRole
  topic: ContactTopic
  message: string
  preferredLanguage?: SupportedLanguage
}

export type ContactRequestResponse = {
  ok: boolean
  requestId: string
}

export async function submitContactRequest(payload: ContactRequestPayload) {
  const response = await httpClient.post<ContactRequestResponse>('/contact/requests', payload)
  return response.data
}
