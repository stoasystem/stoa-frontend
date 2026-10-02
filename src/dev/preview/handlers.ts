/*
 * The design preview's backend: every API path the in-scope screens call,
 * answered from `demoSource.ts` (#115).
 *
 * A path missing from this table is answered 404 by `interception.ts` and
 * recorded, never sent anywhere. Writes are acknowledged and forgotten; the
 * preview is for looking at screens, so nothing it does is kept.
 */
import {
  demoChapter,
  demoConversations,
  demoNotifications,
  demoProfile,
  demoStudent,
} from '@/dev/preview/demoSource'
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

const ok = (data: unknown): PreviewReply => ({ status: 200, data })

const now = () => new Date().toISOString()

let locale: string | undefined

/** The language the demo account reads in, so `/auth/me` does not switch the page back. */
export function setPreviewLocale(language: string) {
  locale = language
}

const student = () => (locale ? { ...demoStudent, preferredLocale: locale, effectiveLocale: locale } : demoStudent)

function conversationById(id: string) {
  return demoConversations.find((conversation) => conversation.id === id)
}

const routes: Array<[method: string, pattern: string, handler: Handler]> = [
  // Account
  ['GET', '/auth/me', student],
  ['POST', '/auth/login', () => ({ accessToken: 'design-preview', user: student(), onboardingStatus: 'completed' })],
  ['POST', '/auth/logout', () => ({ ok: true })],
  ['PATCH', '/auth/me/preferences/locale', ({ body }) => {
    locale = (body as { preferredLocale?: string })?.preferredLocale ?? locale
    return { preferredLocale: locale, effectiveLocale: locale, supportedLocales: demoStudent.supportedLocales, updatedAt: now() }
  }],
  ['GET', '/students/me/profile', () => demoProfile],
  ['PATCH', '/students/me/profile', ({ body }) => ({ ...demoProfile, ...(body as object) })],
  ['GET', '/students/me/entitlement', () => ({ studentId: demoStudent.id, plan: 'student', status: 'active', features: {} })],

  // Notifications
  ['GET', '/notifications', () => ({ items: demoNotifications, count: demoNotifications.length })],
  ['POST', '/notifications/:id/read', ({ params }) => ({ ...demoNotifications.find((n) => n.eventId === params.id), status: 'read', readAt: now() })],
  ['POST', '/notifications/:id/archive', ({ params }) => ({ ...demoNotifications.find((n) => n.eventId === params.id), status: 'archived', archivedAt: now() })],
  ['POST', '/notifications/read-all', () => ({ ok: true })],
  ['GET', '/notifications/preferences', () => ({
    userId: demoStudent.id,
    preferences: { learning_updates: { in_app: true, email_digest: false }, teacher_responses: { in_app: true, email_digest: true } },
    supportedCategories: ['learning_updates', 'teacher_responses'],
    supportedChannels: ['in_app', 'email_digest'],
    updatedAt: null,
  })],
  ['PATCH', '/notifications/preferences', ({ body }) => ({ userId: demoStudent.id, supportedCategories: [], supportedChannels: [], ...(body as object) })],

  // Ask
  ['GET', '/conversations', () => ({
    items: demoConversations.map(({ id, title, subject, grade, updatedAt, lastMessagePreview }) => ({ id, title, subject, grade, updatedAt, lastMessagePreview })),
  })],
  ['POST', '/conversations', ({ body }) => ({
    id: `demo-conversation-${Date.now()}`,
    title: 'New question',
    subject: (body as { subject?: string })?.subject ?? 'math',
    grade: (body as { grade?: string })?.grade ?? demoProfile.grade,
    updatedAt: now(),
    messages: [],
  })],
  ['GET', '/conversations/:id', ({ params }) => conversationById(params.id) ?? {
    id: params.id, title: 'New question', subject: 'math', grade: demoProfile.grade, updatedAt: now(), messages: [],
  }],
  ['GET', '/conversations/:id/generation', ({ params }) => ({ conversationId: params.id, steps: [], updatedAt: now(), status: 'completed' })],
  ['GET', '/teacher-help/availability', () => ({ online: true, availableTeachers: 2, responseTime: '5 min' })],
  ['POST', '/teacher-help/request', ({ body }) => ({
    requestId: 'demo-help-1',
    conversationId: (body as { conversationId?: string })?.conversationId ?? '',
    status: 'pending',
    createdAt: now(),
  })],
  // 404 is the backend's answer for a conversation never handed to a teacher.
  ['GET', '/teacher-help/conversations/:id/request', () => null],

  // Chapter and practice stage
  ['GET', '/practice/curriculum/catalog', () => demoChapter.catalog],
  ['GET', '/practice/:subjectId/:topicId/roadmap', ({ params }) =>
    params.topicId === demoChapter.roadmap.topicId ? demoChapter.roadmap : { ...demoChapter.roadmap, topicId: params.topicId, units: [] }],
  ['GET', '/practice/lessons/:lessonId', ({ params }) => demoChapter.lessons.find((lesson) => lesson.id === params.lessonId) ?? null],
  ['POST', '/practice/challenges/:challengeId/answer', ({ params, body }) => {
    const challenge = demoChapter.lessons.flatMap((lesson) => lesson.challenges).find((c) => c.id === params.challengeId)
    const correct = JSON.stringify((body as { answer?: unknown })?.answer) === JSON.stringify(challenge?.correctAnswer)
    return {
      challengeId: params.challengeId,
      correct,
      feedback: correct ? 'Correct.' : 'Not yet.',
      explanation: challenge?.explanation,
      hint: challenge?.hint,
      attemptsRemaining: correct ? 0 : 2,
      canAskLearningAssistant: true,
      canAskTeacher: true,
    }
  }],
  ['POST', '/practice/lessons/:lessonId/complete', ({ params }) => {
    const lesson = demoChapter.lessons.find((candidate) => candidate.id === params.lessonId)
    return {
      lessonId: params.lessonId,
      subjectId: lesson?.subjectId ?? 'math',
      gradeLevel: lesson?.gradeLevel ?? '',
      topicId: lesson?.topicId ?? '',
      correctCount: lesson?.challenges.length ?? 0,
      totalCount: lesson?.challenges.length ?? 0,
      progressPoints: 10,
      studyStreak: 3,
      timeSpentSeconds: 240,
      mistakes: [],
    }
  }],
  ['POST', '/practice/hints', () => ({ title: 'Hint', hint: 'Write both fractions over the same denominator.', nextStep: 'Try 12.' })],
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

/** The demo answer to one request, or `null` when the preview has none. */
export function answer(request: Omit<PreviewRequest, 'params'>): PreviewReply | null {
  for (const route of compiled) {
    if (route.method !== request.method) continue
    const match = route.regex.exec(request.path)
    if (!match) continue
    const params = Object.fromEntries(route.names.map((name, index) => [name, decodeURIComponent(match[index + 1])]))
    const data = route.handler({ ...request, params })
    return data === null ? { status: 404, data: { detail: 'Not in the demo data' } } : ok(data)
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
