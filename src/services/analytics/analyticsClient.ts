import { enableAnalytics, isDevelopment } from '@/lib/env'

export type AnalyticsEventName =
  | 'user_login'
  | 'user_register'
  | 'chat_conversation_created'
  | 'chat_message_sent'
  | 'chat_response_started'
  | 'chat_response_completed'
  | 'chat_response_stopped'
  | 'file_uploaded'
  | 'teacher_help_requested'
  | 'teacher_help_assigned'
  | 'teacher_help_resolved'
  | 'parent_child_summary_viewed'
  | 'parent_report_viewed'
  | 'tutor_request_opened'
  | 'tutor_request_status_updated'
  | 'tutor_note_added'

export type AnalyticsPayload = Record<string, string | number | boolean | null | undefined>

export function trackEvent(name: AnalyticsEventName, payload: AnalyticsPayload = {}) {
  if (isDevelopment) {
    console.info('[analytics]', name, payload)
  }

  if (!enableAnalytics) return

  const body = {
    name,
    payload,
    createdAt: new Date().toISOString(),
  }

  void fetch(`${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'}/analytics/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(localStorage.getItem('stoa_access_token')
        ? { Authorization: `Bearer ${localStorage.getItem('stoa_access_token')}` }
        : {}),
    },
    body: JSON.stringify(body),
  }).catch(() => {
    if (isDevelopment) {
      console.info('[analytics] event not sent', name)
    }
  })
}
