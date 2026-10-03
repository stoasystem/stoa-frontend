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
  demoTeacherAvailability,
  demoTeacherHelpRequests,
  recordDemoExchange,
  setDemoLanguage,
} from '@/dev/preview/demoSource'
import { isSupportedLanguage } from '@/i18n/languages'
import { commandMessageIds } from '@/services/chat/commandMessageIds'
import type { ChatMessage, ConversationSummary } from '@/types/chat'

export type PreviewRequest = {
  method: string
  path: string
  query: URLSearchParams
  body: unknown
  params: Record<string, string>
}

export type PreviewReply = { status: number; data: unknown }

type Handler = (request: PreviewRequest) => unknown

const now = () => new Date().toISOString()

const field = <T>(body: unknown, name: string): T | undefined =>
  typeof body === 'object' && body !== null ? (body as Record<string, T>)[name] : undefined

/** Exercises answered right on this page, for the lesson's result. */
const answeredRight = new Set<string>()

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
  ['GET', '/students/me/profile', () => demo().demoProfile],
  ['PATCH', '/students/me/profile', ({ body }) => ({ ...demo().demoProfile, ...(body as object) })],

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
  ['GET', '/notifications/preferences', () => ({
    userId: demo().demoStudent.id,
    preferences: { learning_updates: { in_app: true, email_digest: false }, teacher_responses: { in_app: true, email_digest: true } },
    supportedCategories: ['learning_updates', 'teacher_responses'],
    supportedChannels: ['in_app', 'email_digest'],
    updatedAt: null,
  })],
  ['PATCH', '/notifications/preferences', ({ body }) => ({ userId: demo().demoStudent.id, supportedCategories: [], supportedChannels: [], ...(body as object) })],

  // Ask
  ['GET', '/conversations', () => demoConversationList()],
  ['POST', '/conversations', async ({ body }) => {
    const initialMessage = field<string>(body, 'initialMessage')?.trim()
    const summary: ConversationSummary = {
      id: `demo-conversation-${Date.now()}`,
      title: initialMessage ? titleOf(initialMessage) : '…',
      subject: field<string>(body, 'subject') ?? 'math',
      grade: field<string>(body, 'grade') ?? demo().demoProfile.grade,
      updatedAt: now(),
    }
    createDemoConversation(summary)
    // The first question goes out with the conversation; its answer comes on the command `initial-<id>`.
    if (initialMessage) recordDemoExchange(summary.id, await exchange(summary.id, `initial-${summary.id}`, initialMessage))
    return { ...summary, messages: [] }
  }],
  ['GET', '/conversations/:id', ({ params }) => demoConversation(params.id) ?? {
    id: params.id, title: '…', subject: 'math', grade: demo().demoProfile.grade, updatedAt: now(), messages: [],
  }],
  ['GET', '/conversations/:id/generation', ({ params }) => ({ conversationId: params.id, steps: [], updatedAt: now(), status: 'completed' })],
  ['GET', '/teacher-help/availability', () => demoTeacherAvailability],
  ['POST', '/teacher-help/request', ({ body }) => ({
    requestId: `demo-help-${Date.now()}`,
    conversationId: field<string>(body, 'conversationId') ?? '',
    status: 'pending',
    createdAt: now(),
  })],
  // A conversation never handed to a teacher answers 404, as the backend does.
  ['GET', '/teacher-help/conversations/:id/request', ({ params }) =>
    demoTeacherHelpRequests.find((request) => request.conversationId === params.id) ?? null],

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
    const right = lesson?.challenges.filter((challenge) => answeredRight.has(challenge.id)).length
    const result = demoLessonResult(params.lessonId, right)
    if (result) completeLesson(params.lessonId)
    return result
  }],
  ['POST', '/practice/hints', ({ body }) => demoHint(field<string>(body, 'challengeId') ?? '', demoLanguage())],
  ['GET', '/practice/review/due', () => ({ items: [], count: 0 })],
  ['GET', '/practice/review/summary', () => ({ dueCount: 0, items: [] })],
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

const replyTo = (content: string) => `This is the design preview, so no assistant is answering. You asked: “${content}”.`

/** A question and its answer as the backend stores them, with the ids it derives from the command. */
async function exchange(conversationId: string, idempotencyKey: string, content: string): Promise<ChatMessage[]> {
  const { studentMessageId, assistantMessageId } = await commandMessageIds(conversationId, idempotencyKey)
  const askedAt = now()
  return [
    { id: studentMessageId, conversationId, role: 'student', content, createdAt: askedAt, status: 'completed' },
    { id: assistantMessageId, conversationId, role: 'assistant', content: replyTo(content), createdAt: now(), status: 'completed' },
  ]
}

/**
 * The assistant's answer to a message sent in Ask, as the stream endpoint's
 * events. The exchange is stored first, as the backend does, so reading the
 * conversation back afterwards (and after a reload) finds it.
 */
export async function streamedAnswer(conversationId: string, content: string, idempotencyKey: string): Promise<string> {
  const messages = await exchange(conversationId, idempotencyKey, content)
  recordDemoExchange(conversationId, messages)
  const reply = messages[1]
  const events = [
    ['message_start', { messageId: reply.id, conversationId, role: 'assistant', createdAt: reply.createdAt }],
    ['message_delta', { messageId: reply.id, delta: reply.content }],
    ['message_done', { messageId: reply.id, status: 'completed' }],
  ] as const
  return events.map(([type, data]) => `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`).join('')
}
