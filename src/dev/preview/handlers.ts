/*
 * The design preview's backend: every API path the in-scope screens call,
 * answered from #116's demo data through `demoSource.ts` (#115).
 *
 * A path missing from this table is answered 404 by `interception.ts` and
 * recorded, never sent anywhere. Writes are acknowledged; those the demo
 * backend keeps (`demoSource.ts`, for the tab's session) are a completed
 * lesson, so the chapter moves on, and Ask's conversations and messages with
 * their answers, so the thread read back holds them.
 */
import {
  checkDemoAnswer,
  completeLesson,
  createDemoConversation,
  demo,
  demoConversation,
  demoConversationList,
  demoChapterNow,
  demoHint,
  demoLanguage,
  demoLessonResult,
  demoNotificationPreferences,
  demoProfileNow,
  demoReviewDue,
  demoReviewSummary,
  demoTeacherAvailability,
  demoTeacherHelpRequests,
  recordDemoExchange,
  saveDemoGrade,
  saveDemoNotificationPreferences,
  setDemoLanguage,
} from '@/dev/preview/demoSource'
import { isSupportedLanguage } from '@/i18n/languages'
import { commandMessageIds } from '@/services/chat/commandMessageIds'
import type { ChatMessage, ConversationSummary } from '@/types/chat'
import type { NotificationPreferenceMatrix } from '@/types/notification'

export type PreviewRequest = {
  method: string
  path: string
  query: URLSearchParams
  body: unknown
  params: Record<string, string>
}

export type PreviewReply = { status: number; data: unknown }

type Handler = (request: PreviewRequest) => unknown

/** A handler's answer that is not a 200: the status and the body, as the backend sends a refusal. */
const REFUSAL = Symbol('refusal')
type Refusal = { [REFUSAL]: number; data: unknown }
const refuse = (status: number, code: string, message: string): Refusal => ({ [REFUSAL]: status, data: { detail: { code, message } } })
const isRefusal = (data: unknown): data is Refusal => typeof data === 'object' && data !== null && REFUSAL in data

const now = () => new Date().toISOString()

/** `GET /notifications/preferences`: the demo student's, with what /me saved. */
function notificationPreferences() {
  return {
    userId: demo().demoStudent.id,
    preferences: demoNotificationPreferences() ?? {
      learning_updates: { in_app: true, email_digest: false },
      teacher_responses: { in_app: true, email_digest: true },
    },
    supportedCategories: ['learning_updates', 'teacher_responses'],
    supportedChannels: ['in_app', 'email_digest'],
    updatedAt: null as string | null,
  }
}

/** The address the code goes to, as the backend shows it: the first letter, then stars (`mask_recipient`). */
function maskedAddress(email: string): string {
  const [local, domain] = email.split('@')
  return local && domain ? `${local[0]}${'*'.repeat(Math.max(local.length - 1, 1))}@${domain}` : '***'
}

const field = <T>(body: unknown, name: string): T | undefined =>
  typeof body === 'object' && body !== null ? (body as Record<string, T>)[name] : undefined

/** Exercises answered right on this page, for the lesson's result. */
const answeredRight = new Set<string>()

/** Teachers asked for on this page, by conversation. */
const askedForTeacher = new Map<string, { requestId: string; conversationId: string; status: string; createdAt: string }>()

const routes: Array<[method: string, pattern: string, handler: Handler]> = [
  // Account
  ['GET', '/auth/me', () => demo().demoStudent],
  ['POST', '/auth/login', () => ({ accessToken: 'design-preview', user: demo().demoStudent, onboardingStatus: 'completed' })],
  ['POST', '/auth/logout', () => ({ ok: true })],
  ['PATCH', '/auth/me/preferences/locale', ({ body }) => {
    const asked = field<string>(body, 'preferredLocale')
    if (isSupportedLanguage(asked)) setDemoLanguage(asked)
    const { preferredLocale, effectiveLocale, supportedLocales } = demo().demoStudent
    return { preferredLocale, effectiveLocale, supportedLocales, updatedAt: now() }
  }],
  ['GET', '/students/me/profile', () => demoProfileNow()],
  // Kept, so the year group saved on /me is the one read back (#184).
  ['PATCH', '/students/me/profile', ({ body }) => {
    const grade = field<string>(body, 'grade')
    if (typeof grade === 'string') saveDemoGrade(grade)
    return demoProfileNow()
  }],
  // The password change on /me (#184): the current password with the marker in
  // it is refused, a code with it is refused; anything else goes through.
  ['POST', '/auth/password-change/request', ({ body }) =>
    field<string>(body, 'currentPassword')?.includes(DEMO_FAIL_ONCE)
      ? refuse(400, 'password_change_credentials_invalid', 'Check the current password and try again.')
      : { status: 'sent', maskedRecipient: maskedAddress(demo().demoStudent.email), expiresAt: Math.floor(Date.now() / 1000) + 600 }],
  ['POST', '/auth/password-change/confirm', ({ body }) =>
    field<string>(body, 'code')?.includes(DEMO_FAIL_ONCE)
      ? refuse(400, 'password_change_verification_failed', 'This code cannot be used. Request a new code and try again.')
      : { status: 'changed' }],

  // Notifications
  ['GET', '/notifications', () => demo().demoNotifications],
  ['POST', '/notifications/:id/read', ({ params }) => {
    const event = demo().demoNotifications.items.find((item) => item.eventId === params.id)
    return event ? { ...event, status: 'read', readAt: now() } : null
  }],
  ['POST', '/notifications/:id/archive', ({ params }) => {
    const event = demo().demoNotifications.items.find((item) => item.eventId === params.id)
    return event ? { ...event, status: 'archived', archivedAt: now() } : null
  }],
  ['POST', '/notifications/read-all', () => ({ ok: true })],
  ['GET', '/notifications/preferences', () => notificationPreferences()],
  // Kept, and answered whole: the app puts the answer straight into its cache,
  // so an answer without the categories took the switch off /me (#184).
  ['PATCH', '/notifications/preferences', ({ body }) => {
    const asked = field<NotificationPreferenceMatrix>(body, 'preferences')
    // The whole matrix, as the backend takes it: what is left out goes back to its default.
    if (asked) saveDemoNotificationPreferences(asked)
    return { ...notificationPreferences(), updatedAt: now() }
  }],

  // Ask
  ['GET', '/conversations', () => demoConversationList()],
  ['POST', '/conversations', async ({ body }) => {
    const initialMessage = field<string>(body, 'initialMessage')?.trim()
    const summary: ConversationSummary = {
      id: `demo-conversation-${Date.now()}`,
      title: initialMessage ? titleOf(initialMessage) : '…',
      subject: field<string>(body, 'subject') ?? 'math',
      grade: field<string>(body, 'grade') ?? demoProfileNow().grade,
      updatedAt: now(),
    }
    createDemoConversation(summary)
    // The first question goes out with the conversation; its answer comes on the command `initial-<id>`.
    if (initialMessage) recordDemoExchange(summary.id, await exchange(summary.id, `initial-${summary.id}`, initialMessage))
    return { ...summary, messages: [] }
  }],
  ['GET', '/conversations/:id', ({ params }) => demoConversation(params.id) ?? {
    id: params.id, title: '…', subject: 'math', grade: demoProfileNow().grade, updatedAt: now(), messages: [],
  }],
  // A command failed on purpose (#183) says so, as the backend does, and may be sent again with its key.
  ['GET', '/conversations/:id/generation', ({ params, query }) => {
    const key = query.get('idempotencyKey')
    const failed = key !== null && failedOnce.has(key) && !answeredAfterFailing.has(key)
    return failed
      ? { conversationId: params.id, steps: [], updatedAt: now(), status: 'failed', retryable: true, failureCategory: 'provider_unavailable' }
      : { conversationId: params.id, steps: [], updatedAt: now(), status: 'completed' }
  }],
  ['GET', '/teacher-help/availability', () => demoTeacherAvailability],
  // Kept, as the backend keeps it: the card is drawn from the request read back, not from this answer (#183).
  ['POST', '/teacher-help/request', ({ body }) => {
    const request = {
      requestId: `demo-help-${Date.now()}`,
      conversationId: field<string>(body, 'conversationId') ?? '',
      status: 'pending',
      createdAt: now(),
    }
    askedForTeacher.set(request.conversationId, request)
    return request
  }],
  // A conversation never handed to a teacher answers 404, as the backend does.
  ['GET', '/teacher-help/conversations/:id/request', ({ params }) =>
    demoTeacherHelpRequests.find((request) => request.conversationId === params.id) ?? askedForTeacher.get(params.id) ?? null],

  // Chapter and practice stage
  ['GET', '/practice/curriculum/catalog', () => demo().demoChapter.catalog],
  ['GET', '/practice/:subjectId/:topicId/roadmap', ({ params }) => {
    const { roadmap } = demoChapterNow()
    return params.subjectId === roadmap.subjectId && params.topicId === roadmap.topicId ? roadmap : null
  }],
  ['GET', '/practice/lessons/:lessonId', ({ params }) => demoChapterNow().lessons.find((lesson) => lesson.id === params.lessonId) ?? null],
  ['POST', '/practice/challenges/:challengeId/answer', ({ params, body }) => {
    const result = checkDemoAnswer(params.challengeId, field<string | string[]>(body, 'answer') ?? '', demoLanguage())
    if (result?.correct) answeredRight.add(params.challengeId)
    return result
  }],
  ['POST', '/practice/lessons/:lessonId/complete', ({ params }) => {
    const lesson = demoChapterNow().lessons.find((candidate) => candidate.id === params.lessonId)
    const right = lesson?.challenges.filter((challenge) => answeredRight.has(challenge.challengeId)).length
    const result = demoLessonResult(params.lessonId, right)
    if (result) completeLesson(params.lessonId)
    return result
  }],
  ['POST', '/practice/hints', ({ body }) => demoHint(field<string>(body, 'challengeId') ?? '', demoLanguage())],
  ['GET', '/practice/review/due', () => demoReviewDue()],
  ['GET', '/practice/review/summary', () => demoReviewSummary()],
  ['GET', '/practice/mistakes', () => ({ items: [] })],
]

function compile(pattern: string) {
  const names: string[] = []
  const source = pattern.replace(/:([A-Za-z]+)/g, (_match, name: string) => {
    names.push(name)
    return '([^/]+)'
  })
  return { regex: new RegExp(`^${source}$`), names }
}

const compiled = routes.map(([method, pattern, handler]) => ({ method, pattern, handler, ...compile(pattern) }))

/** The demo answer to one request, or `null` when the preview has none. A handler's `null` is the backend's 404. */
export async function answer(request: Omit<PreviewRequest, 'params'>): Promise<PreviewReply | null> {
  for (const route of compiled) {
    if (route.method !== request.method) continue
    const match = route.regex.exec(request.path)
    if (!match) continue
    const params = Object.fromEntries(route.names.map((name, index) => [name, decodeURIComponent(match[index + 1])]))
    const data = await route.handler({ ...request, params })
    if (isRefusal(data)) return { status: data[REFUSAL], data: data.data }
    return data === null ? { status: 404, data: { detail: 'Not in the demo data' } } : { status: 200, data }
  }
  return null
}

/** A conversation's title, as the backend makes it from the first question: its last line, cut short. */
function titleOf(question: string): string {
  const lines = question.split('\n')
  const line = lines[lines.length - 1].trim() || question
  return line.length > 60 ? `${line.slice(0, 59)}…` : line
}

/** The stand-in answer, in the language the preview is read in, so a German review reads German (#183). */
const REPLY: Record<string, (content: string) => string> = {
  en: (content) => `This is the design preview, so no assistant is answering. You asked: “${content}”.`,
  de: (content) => `Das ist die Designvorschau, deshalb antwortet hier kein Assistent. Deine Frage war: «${content}».`,
  fr: (content) => `Ceci est l’aperçu du design : aucun assistant ne répond ici. Ta question était : « ${content} ».`,
  it: (content) => `Questa è l’anteprima del design: qui non risponde nessun assistente. La tua domanda era: «${content}».`,
}
const replyTo = (content: string) => (REPLY[demoLanguage()] ?? REPLY.en)(content)

/** A question and its answer as the backend stores them, with the ids it derives from the command. */
async function exchange(conversationId: string, idempotencyKey: string, content: string): Promise<ChatMessage[]> {
  const { studentMessageId, assistantMessageId } = await commandMessageIds(conversationId, idempotencyKey)
  const askedAt = now()
  return [
    { id: studentMessageId, conversationId, role: 'student', content, createdAt: askedAt, status: 'completed' },
    { id: assistantMessageId, conversationId, role: 'assistant', content: replyTo(content), createdAt: now(), status: 'completed' },
  ]
}

/** A question with this in it fails its first send, so the failed state and its retry can be seen (#183). */
export const DEMO_FAIL_ONCE = '#fail'
const failedOnce = new Set<string>()
const answeredAfterFailing = new Set<string>()

/** Whether this send is the one that fails: the first for its command, with the marker in it. */
export function failsThisTime(content: string, idempotencyKey: string): boolean {
  if (!content.includes(DEMO_FAIL_ONCE)) return false
  if (failedOnce.has(idempotencyKey)) {
    answeredAfterFailing.add(idempotencyKey)
    return false
  }
  failedOnce.add(idempotencyKey)
  return true
}

/**
 * The assistant's answer to a message sent in Ask, as the stream endpoint's
 * events, one per frame: the start, the answer a word at a time, the end, so
 * the sending and streaming states are on screen long enough to be seen
 * (#183). The exchange is stored first, as the backend does, so reading the
 * conversation back afterwards (and after a reload) finds it.
 */
export async function streamedAnswer(conversationId: string, content: string, idempotencyKey: string): Promise<string[]> {
  const messages = await exchange(conversationId, idempotencyKey, content)
  recordDemoExchange(conversationId, messages)
  const reply = messages[1]
  const words = reply.content.split(/(?<= )/)
  const events: (readonly [string, object])[] = [
    ['message_start', { messageId: reply.id, conversationId, role: 'assistant', createdAt: reply.createdAt }],
    ...words.map((delta) => ['message_delta', { messageId: reply.id, delta }] as const),
    ['message_done', { messageId: reply.id, status: 'completed' }],
  ]
  return events.map(([type, data]) => `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`)
}
