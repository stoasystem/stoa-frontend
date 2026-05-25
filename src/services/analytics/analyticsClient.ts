import { enableAnalytics, isDevelopment } from '@/lib/env'
import { DEFAULT_API_BASE_URL } from '@/lib/constants'
import { TOKEN_KEY } from '@/store/authStore'

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
  | 'parent_upgrade_cta_clicked'
  | 'pricing_page_viewed'
  | 'pricing_plan_selected'
  | 'checkout_started'
  | 'checkout_mock_completed'
  | 'billing_page_viewed'
  | 'feature_locked_viewed'
  | 'upgrade_prompt_clicked'
  | 'parent_landing_viewed'
  | 'parent_value_cta_clicked'
  | 'referral_page_viewed'
  | 'referral_link_copied'
  | 'tutor_availability_viewed'
  | 'tutor_availability_updated'
  | 'support_ticket_created'
  | 'support_ticket_viewed'
  | 'admin_analytics_viewed'
  | 'utm_captured'
  | 'billing_checkout_started'
  | 'billing_virtual_checkout_completed'
  | 'billing_virtual_checkout_canceled'
  | 'tutor_request_opened'
  | 'tutor_request_status_updated'
  | 'tutor_time_to_first_action_recorded'
  | 'tutor_note_added'
  | 'feedback_submitted'
  | 'organization_dashboard_viewed'
  | 'organization_switched'
  | 'organization_student_opened'
  | 'learning_profile_viewed'
  | 'curriculum_graph_viewed'
  | 'curriculum_topic_selected'
  | 'weak_point_diagnosis_viewed'
  | 'tutor_assignment_board_viewed'
  | 'tutor_assignment_suggested_clicked'
  | 'parent_monthly_report_viewed'
  | 'advanced_analytics_viewed'
  | 'retention_page_viewed'
  | 'partnership_page_viewed'
  | 'partnership_interest_submitted'

export type AnalyticsPayload = Record<string, unknown>

type SanitizedAnalyticsPayload = Record<string, string | number | boolean | null>

const ANALYTICS_ENDPOINT = '/analytics/events'
const SESSION_ID_KEY = 'stoa_analytics_session_id'
const BLOCKED_PAYLOAD_KEYS = new Set([
  'attachment',
  'attachments',
  'body',
  'content',
  'file',
  'filecontent',
  'filename',
  'message',
  'messages',
  'note',
  'prompt',
  'response',
  'text',
  'transcript',
])
const MAX_STRING_LENGTH = 120

function getApiBaseUrl() {
  return import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL
}

function getSessionId() {
  try {
    const existingSessionId = sessionStorage.getItem(SESSION_ID_KEY)

    if (existingSessionId) return existingSessionId

    const nextSessionId = crypto.randomUUID()
    sessionStorage.setItem(SESSION_ID_KEY, nextSessionId)
    return nextSessionId
  } catch {
    return undefined
  }
}

function getAccessToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

function sanitizeValue(value: unknown): string | number | boolean | null | undefined {
  if (value === undefined) return undefined
  if (value === null) return null
  if (typeof value === 'boolean' || typeof value === 'number') return value
  if (typeof value === 'string') return value.slice(0, MAX_STRING_LENGTH)
  if (Array.isArray(value)) return value.length

  return undefined
}

export function sanitizeAnalyticsPayload(payload: AnalyticsPayload = {}) {
  return Object.entries(payload).reduce<SanitizedAnalyticsPayload>((result, [key, value]) => {
    if (BLOCKED_PAYLOAD_KEYS.has(key.toLowerCase())) return result

    const sanitizedValue = sanitizeValue(value)
    if (sanitizedValue !== undefined) {
      result[key] = sanitizedValue
    }

    return result
  }, {})
}

export function trackEvent(name: AnalyticsEventName, payload: AnalyticsPayload = {}) {
  const sanitizedPayload = sanitizeAnalyticsPayload(payload)

  if (isDevelopment) {
    console.info('[analytics]', name, sanitizedPayload)
  }

  if (!enableAnalytics) return

  const token = getAccessToken()
  const body = {
    name,
    payload: sanitizedPayload,
    path: window.location.pathname,
    sessionId: getSessionId(),
    createdAt: new Date().toISOString(),
  }

  void fetch(`${getApiBaseUrl()}${ANALYTICS_ENDPOINT}`, {
    method: 'POST',
    keepalive: true,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  }).catch(() => {
    if (isDevelopment) {
      console.info('[analytics] event not sent', name)
    }
  })
}
