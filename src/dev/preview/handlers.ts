/*
 * The design preview's backend: every API path the in-scope screens call,
 * answered from #116's demo data through `demoSource.ts` (#115).
 *
 * A path missing from this table is answered 404 by `interception.ts` and
 * recorded, never sent anywhere. Writes are acknowledged; the only one kept
 * (until the page reloads) is a completed lesson, so the chapter moves on.
 */
import {
  checkDemoAnswer,
  completeLesson,
  demo,
  demoChapterNow,
  demoHint,
  demoLanguage,
  demoLessonResult,
  demoTeacherAvailability,
  demoTeacherHelpRequests,
  setDemoLanguage,
} from '@/dev/preview/demoSource'
import { isSupportedLanguage } from '@/i18n/languages'
import type { ChatMessage } from '@/types/chat'

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
  ['GET', '/conversations', () => demo().demoConversationList],
  ['POST', '/conversations', ({ body }) => ({
    id: `demo-conversation-${Date.now()}`,
    title: field<string>(body, 'initialMessage') ?? '…',
    subject: field<string>(body, 'subject') ?? 'math',
    grade: field<string>(body, 'grade') ?? demo().demoProfile.grade,
    updatedAt: now(),
    messages: [],
  })],
  ['GET', '/conversations/:id', ({ params }) => demo().demoConversations.find((c) => c.id === params.id) ?? {
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
export function answer(request: Omit<PreviewRequest, 'params'>): PreviewReply | null {
  for (const route of compiled) {
    if (route.method !== request.method) continue
    const match = route.regex.exec(request.path)
    if (!match) continue
    const params = Object.fromEntries(route.names.map((name, index) => [name, decodeURIComponent(match[index + 1])]))
    const data = route.handler({ ...request, params })
    return data === null ? { status: 404, data: { detail: 'Not in the demo data' } } : { status: 200, data }
  }
  return null
}

/** The assistant's answer to a message sent in Ask, as the stream endpoint's events. */
export function streamedAnswer(conversationId: string, content: string): string {
  const messageId = `demo-answer-${Date.now()}`
  const reply: Pick<ChatMessage, 'content'> = {
    content: `This is the design preview, so no assistant is answering. You asked: “${content}”.`,
  }
  const events = [
    ['message_start', { messageId, conversationId, role: 'assistant', createdAt: now() }],
    ['message_delta', { messageId, delta: reply.content }],
    ['message_done', { messageId, status: 'completed' }],
  ] as const
  return events.map(([type, data]) => `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`).join('')
}
