import { httpClient } from '@/services/api/httpClient'
import type { SupportedLanguage } from '@/i18n/languages'
import { apiMode } from '@/lib/env'

const emailJsPublicKey = import.meta.env.VITE_CONTACT_EMAILJS_PUBLIC_KEY ?? 'oT2sDvEzvUw-khq2T'
const emailJsServiceId = import.meta.env.VITE_CONTACT_EMAILJS_SERVICE_ID ?? 'service_stoa'
const notifyTemplateId = import.meta.env.VITE_CONTACT_EMAILJS_NOTIFY_TEMPLATE_ID ?? 'template_g6tviz6'
const autoReplyTemplateId = import.meta.env.VITE_CONTACT_EMAILJS_AUTOREPLY_TEMPLATE_ID ?? 'template_9i4iphq'
const contactInboxEmail = import.meta.env.VITE_CONTACT_INBOX_EMAIL ?? 'info@stoaedu.ch'
const enableFrontendEmailFallback = import.meta.env.VITE_CONTACT_EMAILJS_FALLBACK !== 'false'
const enableFrontendAutoReply = import.meta.env.VITE_CONTACT_AUTOREPLY_FALLBACK !== 'false'

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
  emailDelivery?: {
    enabled: boolean
    notificationSent: boolean
    autoReplySent: boolean
    fallback?: boolean
  }
}

export async function submitContactRequest(payload: ContactRequestPayload) {
  try {
    const response = await httpClient.post<ContactRequestResponse>('/contact/requests', payload)
    return response.data
  } catch (error) {
    if (!enableFrontendEmailFallback || !shouldUseFrontendEmailFallback(error)) {
      throw error
    }

    return sendContactEmailFallback(payload)
  }
}

function shouldUseFrontendEmailFallback(error: unknown) {
  if (apiMode === 'mock') return true
  if (!(error instanceof Error)) return false

  return error.message === 'Network Error' ||
    error.message.includes('ERR_NETWORK') ||
    error.message.includes('Failed to fetch')
}

async function sendContactEmailFallback(payload: ContactRequestPayload): Promise<ContactRequestResponse> {
  if (!emailJsPublicKey || !emailJsServiceId || !notifyTemplateId || !autoReplyTemplateId) {
    throw new Error('Contact email is not configured.')
  }

  const requestId = `contact-request-${crypto.randomUUID()}`
  const templateParams = buildTemplateParams(payload, requestId)

  await sendEmailJsTemplate(notifyTemplateId, {
    ...templateParams,
    to_email: contactInboxEmail,
  })

  let autoReplySent = false
  if (enableFrontendAutoReply && payload.email.trim().toLowerCase() !== contactInboxEmail.toLowerCase()) {
    await sendEmailJsTemplate(autoReplyTemplateId, {
      ...templateParams,
      to_email: payload.email.trim(),
    })
    autoReplySent = true
  }

  return {
    ok: true,
    requestId,
    emailDelivery: {
      enabled: true,
      notificationSent: true,
      autoReplySent,
      fallback: true,
    },
  }
}

async function sendEmailJsTemplate(templateId: string, templateParams: Record<string, string>) {
  const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id: emailJsServiceId,
      template_id: templateId,
      user_id: emailJsPublicKey,
      public_key: emailJsPublicKey,
      template_params: templateParams,
    }),
  })

  if (!response.ok) {
    throw new Error(`Email delivery failed with status ${response.status}`)
  }
}

function buildTemplateParams(payload: ContactRequestPayload, requestId: string) {
  const templateParams = {
    from_name: payload.name.trim(),
    from_email: payload.email.trim(),
    phone: payload.phone?.trim() ?? '',
    timestamp: new Date().toLocaleString('de-CH', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
    subject: payload.topic,
    role: payload.role,
    preferred_language: payload.preferredLanguage ?? '',
    message: payload.message.trim(),
    request_id: requestId,
    reply_to: payload.email.trim(),
  }

  return {
    ...templateParams,
    mail_body: buildMailBody(templateParams),
  }
}

function buildMailBody(params: Record<string, string>) {
  return [
    '[Deutsch]',
    '',
    'Sie haben eine neue Anfrage uber das Kontaktformular auf Ihrer Website erhalten:',
    '',
    `Name: ${params.from_name}`,
    `E-Mail: ${params.from_email}`,
    `Telefon: ${params.phone}`,
    `Rolle: ${params.role}`,
    `Thema: ${params.subject}`,
    `Sprache: ${params.preferred_language}`,
    `Datum: ${params.timestamp}`,
    '',
    'Nachricht:',
    params.message,
    '',
    'Bitte antworten Sie dem Kunden so bald wie moglich.',
    '',
    '',
    '[English]',
    '',
    'You have received a new inquiry from your website contact form:',
    '',
    `Name: ${params.from_name}`,
    `Email: ${params.from_email}`,
    `Phone: ${params.phone}`,
    `Role: ${params.role}`,
    `Topic: ${params.subject}`,
    `Preferred language: ${params.preferred_language}`,
    `Date: ${params.timestamp}`,
    '',
    'Message:',
    params.message,
    '',
    'Please respond to the customer as soon as possible.',
  ].join('\n')
}
