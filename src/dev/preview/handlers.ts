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
  saveDemoProfile,
  saveDemoNotificationPreferences,
  setDemoLanguage,
} from '@/dev/preview/demoSource'
import { starCountFrom } from '@/dev/preview/surfaces'
import { DEMO_BRIDGE_STAR, DEMO_KNOWLEDGE_POINT } from '@/dev/demo/data'
import { DEMO_ANSWER_STYLE_CODES, DEMO_GRADE_CODES } from '@/dev/demo/data/student'
import { isSupportedLanguage } from '@/i18n/languages'
import { commandMessageIds } from '@/services/chat/commandMessageIds'
import type { ChatMessage, ConversationSummary, MessageQuote } from '@/types/chat'
import type { NotificationPreferenceMatrix } from '@/types/notification'
import type { StudentEntitlement } from '@/types/student'

export type PreviewRequest = {
  method: string
  path: string
  query: URLSearchParams
  body: unknown
  params: Record<string, string>
  /** The bearer token the request carried, if any. */
  token?: string
}

export type PreviewReply = { status: number; data: unknown }

type Handler = (request: PreviewRequest) => unknown

/** A handler's answer that is not a 200: the status and the body, as the backend sends a refusal. */
const REFUSAL = Symbol('refusal')
type Refusal = { [REFUSAL]: number; data: unknown }
const refuse = (status: number, code: string, message: string): Refusal => ({ [REFUSAL]: status, data: { detail: { code, message } } })
const isRefusal = (data: unknown): data is Refusal => typeof data === 'object' && data !== null && REFUSAL in data

const now = () => new Date().toISOString()
/** The page's star count (`?points=`), which sizes the sky the demo backend answers with. */
const pageStarCount = () => starCountFrom(new URLSearchParams(window.location.search).get('points'))

/*
 * The usage period (#616, stoa-backend#343), set by `?period=`: `soon` (three
 * days left, a parent's), `today` (the last day), `expired` (over, the
 * student's own); anything else is a parent's period months away, which
 * shows no reminder. Days are Zurich days, as the backend counts.
 */
type DemoPeriod = { endsAt: string; state: 'active' | 'expired'; daysLeft: number }
function demoPeriodSetting() {
  return new URLSearchParams(window.location.search).get('period')
}
function zurichDayFromToday(offset: number) {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Zurich', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
  return new Date(Date.parse(`${today}T00:00:00Z`) + offset * 86_400_000).toISOString().slice(0, 10)
}
function demoPeriod(): DemoPeriod & { paidBy: 'self' | 'parent' } {
  switch (demoPeriodSetting()) {
    case 'soon': return { endsAt: zurichDayFromToday(3), state: 'active', daysLeft: 3, paidBy: 'parent' }
    case 'today': return { endsAt: zurichDayFromToday(0), state: 'active', daysLeft: 0, paidBy: 'parent' }
    case 'expired': return { endsAt: zurichDayFromToday(-2), state: 'expired', daysLeft: 0, paidBy: 'self' }
    default: return { endsAt: zurichDayFromToday(120), state: 'active', daysLeft: 120, paidBy: 'parent' }
  }
}
const RENEWAL_CONTACT_EMAIL = 'info@stoaedu.ch'

/*
 * The notification preferences as the backend keeps them
 * (`notification_service.py`): every category, every channel; in the bell
 * and live on, digest and push off; what was saved laid over that.
 */
const PREFERENCE_CATEGORIES = ['admin_operations', 'assignments', 'learning_updates', 'teacher_responses', 'weekly_reports']
const PREFERENCE_CHANNELS = ['email_digest', 'in_app', 'push', 'realtime']

/** The defaults with `over` laid on them, channel by channel (`_merged_preferences`). */
function withDefaults(over: NotificationPreferenceMatrix | null): NotificationPreferenceMatrix {
  return Object.fromEntries(PREFERENCE_CATEGORIES.map((category) => [
    category,
    { in_app: true, realtime: true, email_digest: false, push: false, ...over?.[category] },
  ]))
}

/** `GET /notifications/preferences`: the demo student's, with what /me saved. */
function notificationPreferences() {
  return {
    userId: demo().demoStudent.id,
    preferences: withDefaults(demoNotificationPreferences()),
    // A teacher's switch; the demo student has no help requests offered to them.
    dispatchEmail: true,
    // A parent's switch (stoa-backend#363), on by default.
    weeklyReportEmail: true,
    supportedCategories: PREFERENCE_CATEGORIES,
    supportedChannels: PREFERENCE_CHANNELS,
    updatedAt: null as string | null,
  }
}

/** `POST /notifications/email-(un|re)subscribe`, as the backend answers it (stoa-backend#363). */
function emailSubscription(query: URLSearchParams, subscribed: boolean) {
  const [demoToken, kind] = (query.get('token') ?? '').split(':')
  return demoToken === 'demo'
    ? { kind: kind || 'weekly_report', subscribed }
    : refuse(400, 'email_unsubscribe_link_invalid', 'This unsubscribe link is not valid.')
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
  // Login review: #fail refuses credentials; the unverified demo address opens
  // the existing verification panel. These replies never contact an identity provider.
  ['POST', '/auth/login', ({ body }) =>
    field<string>(body, 'password')?.includes(DEMO_FAIL_ONCE)
      ? refuse(401, 'invalid_credentials', 'Check your email and password, then try signing in again.')
      : field<string>(body, 'email') === 'unverified@example.com'
        ? refuse(403, 'email_verification_required', 'Verify your email, then sign in again.')
        : { accessToken: 'design-preview', user: demo().demoStudent, onboardingStatus: 'completed' }],
  ['POST', '/auth/email-verification/resend', () => ({
    status: 'sent', emailVerificationStatus: 'pending_verification', emailVerificationRequired: true,
    accountActivationStatus: 'pending_email_verification', resendAllowed: true,
  })],
  ['POST', '/auth/email-verification/confirm', ({ body }) =>
    field<string>(body, 'confirmationCode')?.includes(DEMO_FAIL_ONCE)
      ? refuse(400, 'verification_code_invalid', 'Check the verification code and try again.')
      : { status: 'confirmed', emailVerificationStatus: 'verified', emailVerificationRequired: false,
          accountActivationStatus: 'active', resendAllowed: false }],
  // The invitation link's page (/activate?token=...): any token is the demo student's invitation.
  ['POST', '/auth/invitations/claim', () => ({ status: 'claimed', userId: demo().demoStudent.id, role: 'student', accountNumber: 'S-DEMO-0001' })],
  ['POST', '/auth/logout', () => ({ ok: true })],
  ['PATCH', '/auth/me/preferences/locale', ({ body }) => {
    const asked = field<string>(body, 'preferredLocale')
    if (isSupportedLanguage(asked)) setDemoLanguage(asked)
    const { preferredLocale, effectiveLocale, supportedLocales } = demo().demoStudent
    return { preferredLocale, effectiveLocale, supportedLocales, updatedAt: now() }
  }],
  ['GET', '/students/me/profile', () => demoProfileNow()],
  // Kept, so the year group saved on /me or in "About you" is the one read back (#184, #591). As the
  // backend (stoa-backend#310): a year group is one of `choices.grade`, or "" for not said. The answer
  // style (stoa-backend#314, #597) is one of `choices.answerStyle`, "" saves `standard`. Any unknown
  // code refuses the whole request.
  ['PATCH', '/students/me/profile', ({ body }) => {
    const grade = field<string>(body, 'grade')
    if (typeof grade === 'string' && grade.trim() !== '' && !DEMO_GRADE_CODES.includes(grade.trim())) {
      return refuse(422, 'profile_choice_unknown', 'Choose a year group from the list.')
    }
    const answerStyle = field<string>(body, 'answerStyle')
    if (typeof answerStyle === 'string' && answerStyle !== '' && !DEMO_ANSWER_STYLE_CODES.includes(answerStyle)) {
      return refuse(422, 'profile_choice_unknown', 'Choose an answer style from the list.')
    }
    const primarySubjects = field<string[]>(body, 'primarySubjects')
    saveDemoProfile({
      answerStyle: typeof answerStyle === 'string' ? answerStyle || 'standard' : undefined,
      grade: typeof grade === 'string' ? grade.trim() : undefined,
      primarySubjects: Array.isArray(primarySubjects) ? primarySubjects.filter((id) => typeof id === 'string') : undefined,
    })
    return demoProfileNow()
  }],
  // The plan and the usage period (stoa-backend#343): every page reads it for the reminder (#616),
  // and Ask takes questions only while it runs (#615). `?period=expired` shows both.
  ['GET', '/students/me/entitlement', (): StudentEntitlement => ({
    effectivePlan: 'standard',
    newUsageAllowed: demoPeriod().state === 'active',
    teacherSupportIncluded: true,
    dailyAiQuestionLimit: null,
    dailyChatMessageLimit: null,
    usagePeriod: demoPeriod(),
    renewalContactEmail: RENEWAL_CONTACT_EMAIL,
  })],
  // A parent's periods, the same `?period=` on the demo student as their child (no parent signs in here).
  ['GET', '/parents/me/usage-period', () => {
    const { endsAt, state, daysLeft } = demoPeriod()
    const student = demo().demoStudent
    return {
      own: { endsAt: zurichDayFromToday(120), state: 'active', daysLeft: 120 },
      children: [{ studentId: student.id, name: student.name, endsAt, state, paidBy: daysLeft >= 120 ? 'you' : 'other_parent' }],
      renewalContactEmail: RENEWAL_CONTACT_EMAIL,
    }
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
    // Rebuilt from the defaults, as the backend does: what is left out goes back to its default.
    if (asked) saveDemoNotificationPreferences(withDefaults(asked))
    return { ...notificationPreferences(), updatedAt: now() }
  }],
  // The unsubscribe link (#621): a token `demo` or `demo:<kind>` works, any other is the one refusal.
  ['POST', '/notifications/email-unsubscribe', ({ query }) => emailSubscription(query, false)],
  ['POST', '/notifications/email-resubscribe', ({ query }) => emailSubscription(query, true)],

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
  // Taken back while it waits (#543); one the demo data holds, or none, answers 404.
  ['POST', '/teacher-help/conversations/:id/request/withdraw', ({ params }) => {
    const asked = askedForTeacher.get(params.id)
    if (!asked) return null
    const withdrawn = { ...asked, status: 'withdrawn' }
    askedForTeacher.set(params.id, withdrawn)
    return withdrawn
  }],
  // A conversation never handed to a teacher answers 404, as the backend does.
  ['GET', '/teacher-help/conversations/:id/request', ({ params }) =>
    demoTeacherHelpRequests.find((request) => request.conversationId === params.id) ?? askedForTeacher.get(params.id) ?? null],

  // Chapter and practice stage
  ['GET', '/practice/curriculum/catalog', () => demo().demoChapter.catalog],
  // The sky beside the chapter (#501): what the map says of the demo knowledge point and its
  // small stars, at the page's star count. Loaded when asked: nothing of the app before interception.
  ['GET', '/practice/knowledge-map', async ({ query }) =>
    (await import('@/dev/preview/lighting')).demoKnowledgeMap(pageStarCount(), query.get('view') === 'skeleton' ? 'skeleton' : 'full')],
  // The stars around one in full (#503).
  ['GET', '/practice/knowledge-map/stars', async ({ query }) =>
    (await import('@/dev/preview/lighting')).demoKnowledgeStars(pageStarCount(), query.get('around'))],
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
  ['GET', '/practice/review/summary', async () => demoReviewSummary((await import('@/dev/preview/lighting')).demoSkyReviewDue(pageStarCount()))],
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

/**
 * A question with this in it is answered as one that names a star to go to
 * (#487): the answer carries the physics star Refraction, another galaxy than
 * the maths one the map opens on, so the card and the flight to it can be
 * seen. No assistant reads the question; the marker stands in for the backend
 * recognising the star (stoa-backend#124).
 */
export const DEMO_FIND_STAR = '#star'

/**
 * A question about sine and cosine, in any of the four languages, is
 * answered as one that names the demo knowledge point (#586): the first
 * landing's "Find my own star" offers one in mathematics ("We're doing sine
 * and cosine at school"), and with nothing lit the map draws the path to it,
 * so the walk-through goes on into its chapter and the practice stage.
 */
const DEMO_FINDS_KNOWLEDGE_POINT = /\b(sine|sinus|seno)\b/i

/** The star a question's answer names in the demo backend, if any. */
export function demoTargetFor(content: string): { unitId: string } | null {
  if (content.includes(DEMO_FIND_STAR)) return { unitId: DEMO_BRIDGE_STAR }
  if (DEMO_FINDS_KNOWLEDGE_POINT.test(content)) return { unitId: DEMO_KNOWLEDGE_POINT.unitId }
  return null
}

/** A question and its answer as the backend stores them, with the ids it derives from the command. */
async function exchange(
  conversationId: string,
  idempotencyKey: string,
  content: string,
  quote?: MessageQuote,
): Promise<ChatMessage[]> {
  const { studentMessageId, assistantMessageId } = await commandMessageIds(conversationId, idempotencyKey)
  const askedAt = now()
  const targetUnit = demoTargetFor(content)
  return [
    // Its quote kept, as the backend keeps it, so a step quoted from an answer (#506) reads back.
    { id: studentMessageId, conversationId, role: 'student', content, createdAt: askedAt, status: 'completed', quote: quote ?? null, targetUnit: null },
    { id: assistantMessageId, conversationId, role: 'assistant', content: replyTo(content), createdAt: now(), status: 'completed', targetUnit },
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
export async function streamedAnswer(
  conversationId: string,
  content: string,
  idempotencyKey: string,
  quote?: MessageQuote,
): Promise<string[]> {
  const messages = await exchange(conversationId, idempotencyKey, content, quote)
  recordDemoExchange(conversationId, messages)
  const reply = messages[1]
  // Each word with the space after it; no lookbehind, which Safari before 16.4 cannot parse (#398).
  const words = reply.content.match(/[^ ]* |[^ ]+$/g) ?? ['']
  const events: (readonly [string, object])[] = [
    ['message_start', { messageId: reply.id, conversationId, role: 'assistant', createdAt: reply.createdAt }],
    ...words.map((delta) => ['message_delta', { messageId: reply.id, delta }] as const),
    ['message_done', { messageId: reply.id, status: 'completed', targetUnit: reply.targetUnit ?? null }],
  ]
  return events.map(([type, data]) => `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`)
}
