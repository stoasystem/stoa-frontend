import { createHash } from 'node:crypto'
import type { MockBackend } from './backend'

export const STUDENT = {
  id: 'e2e-student-1',
  name: 'Mia Keller',
  email: 'mia.keller@example.test',
  password: 'e2e-password-1',
}
export const ACCESS_TOKEN = 'e2e-access-token'

type Message = { id: string; conversationId: string; role: string; content: string; createdAt: string }
type Command = {
  key: string
  conversationId: string
  question: string
  answer: string
  finished: boolean
  failed: boolean
  attempt: number
  reads: number
}
type Conversation = { id: string; subject: string; grade: string; createdAt: string; messages: Message[] }

/**
 * One student and the parts of the backend a student's session touches:
 * sign-in, the first screen, Ask, sign-out. Answers are held back until the
 * test lets them finish (`finish`), so a test can reload the page while one
 * is still being written.
 */
export class StudentWorld {
  readonly conversations = new Map<string, Conversation>()
  readonly commands = new Map<string, Command>()
  /** Answers finish on their own after this many reads of their progress, unless held. */
  autoFinishAfterReads: number | null = 2
  /** The next message accepted fails on its first attempt, as one the backend may answer if sent again. */
  failNextRetryably = false
  private clock = Date.parse('2026-09-29T08:00:00Z')
  private nextConversation = 1

  constructor(private readonly backend: MockBackend) {}

  now() {
    this.clock += 1000
    return new Date(this.clock).toISOString()
  }

  answerFor(question: string) {
    return `Here is how to think about it: ${question}`
  }

  finish(key: string) {
    const command = this.commands.get(key)
    if (!command) throw new Error(`no command ${key}`)
    this.complete(command)
  }

  install() {
    const b = this.backend
    const signedIn = (headers: Record<string, string>) => headers.authorization === `Bearer ${ACCESS_TOKEN}`
    const denied = { status: 401, body: { detail: 'Not authenticated' } }
    this.installAskSurroundings()
    this.installKnowledgeMap()

    b.on('POST', '/auth/login', ({ body }) => {
      const { email, password } = body as { email: string; password: string }
      if (email !== STUDENT.email || password !== STUDENT.password) {
        // What the backend answers for a refused sign-in: the security body at the top level.
        return {
          status: 401,
          body: {
            code: 'invalid_credentials',
            message: 'Check your email and password, then try signing in again.',
            correlationId: 'e2e-correlation',
          },
        }
      }
      return { status: 200, body: { accessToken: ACCESS_TOKEN, user: user() } }
    })
    b.on('GET', '/auth/me', ({ headers }) => (signedIn(headers) ? { status: 200, body: user() } : denied))
    b.on('POST', '/auth/logout', () => ({ status: 204 }))
    b.on('GET', '/notifications', ({ headers }) =>
      signedIn(headers) ? { status: 200, body: { items: [], count: 0 } } : denied,
    )
    b.on('GET', '/students/me/profile', ({ headers }) => (signedIn(headers) ? { status: 200, body: profile() } : denied))
    b.on('GET', '/conversations', ({ headers }) =>
      signedIn(headers)
        ? { status: 200, body: { items: [...this.conversations.values()].map((c) => this.summary(c)), truncated: false } }
        : denied,
    )
    b.on('POST', '/conversations', ({ headers, body }) => {
      if (!signedIn(headers)) return denied
      const { subject, grade, initialMessage } = body as { subject: string; grade: string; initialMessage?: string }
      const id = `e2e-conversation-${this.nextConversation++}`
      const conversation: Conversation = { id, subject, grade, createdAt: this.now(), messages: [] }
      this.conversations.set(id, conversation)
      if (initialMessage) this.accept(conversation, `initial-${id}`, initialMessage)
      return { status: 201, body: this.detail(conversation) }
    })
    b.on('GET', '/conversations/{conv_id}', ({ headers, pathname }) => {
      if (!signedIn(headers)) return denied
      const conversation = this.conversations.get(lastSegment(pathname))
      return conversation ? { status: 200, body: this.detail(conversation) } : { status: 404, body: { detail: 'Not Found' } }
    })
    b.on('POST', '/conversations/{conv_id}/messages/stream', ({ headers, pathname, body }) => {
      if (!signedIn(headers)) return denied
      const conversation = this.conversations.get(pathname.split('/')[2])
      if (!conversation) return { status: 404, body: { detail: 'Not Found' } }
      const { content, idempotencyKey } = body as { content: string; idempotencyKey: string }
      // What the backend does with a retryable failure sent again under the same key:
      // the same command is reopened, no second one is made.
      const failed = this.commands.get(idempotencyKey)
      if (failed?.failed) {
        failed.failed = false
        failed.attempt += 1
        failed.reads = 0
      }
      const student = this.accept(conversation, idempotencyKey, content)
      const { commandId } = commandIds(conversation.id, idempotencyKey)
      return {
        status: 202,
        body: { conversationId: conversation.id, commandId, idempotencyKey, status: 'message_committed', studentMessage: student },
      }
    })
    b.on('GET', '/conversations/{conv_id}/generation', ({ headers, pathname, query }) => {
      if (!signedIn(headers)) return denied
      const conversationId = pathname.split('/')[2]
      const key = query.get('idempotencyKey') ?? ''
      const command = this.commands.get(key)
      if (!command || command.conversationId !== conversationId) {
        // What the backend answers (`AttachmentErrorCode.MESSAGE_COMMAND_NOT_FOUND`): 409, not 404.
        return {
          status: 409,
          body: {
            detail: {
              code: 'message_command_not_found',
              message: 'This message request is unavailable. Send it again.',
              correlationId: 'e2e-correlation',
            },
          },
        }
      }
      if (command.failed) {
        return {
          status: 200,
          body: {
            conversationId,
            commandId: commandIds(conversationId, key).commandId,
            status: 'failed',
            attempt: command.attempt,
            assistantMessageId: null,
            retryable: true,
            failureCategory: 'provider_dependency_error',
            steps: [],
            updatedAt: this.now(),
          },
        }
      }
      command.reads += 1
      if (!command.finished && this.autoFinishAfterReads !== null && command.reads >= this.autoFinishAfterReads) {
        this.complete(command)
      }
      const ids = commandIds(conversationId, key)
      return {
        status: 200,
        body: {
          conversationId,
          commandId: ids.commandId,
          status: command.finished ? 'completed' : 'ai_running',
          attempt: command.attempt,
          assistantMessageId: command.finished ? ids.assistantMessageId : null,
          retryable: null,
          failureCategory: null,
          steps: [],
          updatedAt: this.now(),
        },
      }
    })
  }

  /** The star map read model (stoa-backend#59), as #48 wires it in. */
  private installKnowledgeMap() {
    this.backend.on('GET', '/practice/knowledge-map', () => ({
      status: 200,
      body: {
        subjectId: 'math',
        galaxies: [{ subjectId: 'math', name: 'Mathematics', lit: 0, total: 1, enrolled: true }],
        nebulae: [{ topicId: 'fractions', name: 'Fractions', order: 0, subjectId: 'math' }],
        stars: [
          {
            unitId: 'reducing',
            name: 'Reducing fractions',
            nebulaId: 'fractions',
            order: 0,
            state: 'ready',
            progress: 0,
            unmetExercises: 2,
            reviewDue: 0,
            recommendation: { source: 'system' },
            x: 0.5,
            y: 0.5,
            skills: [],
            chapter: { lessonCount: 1, lessonsDone: 0, nextLesson: null },
          },
        ],
        prerequisites: [],
        summary: { lit: 0, total: 1, streakDays: 0, score: 0 },
      },
    }))
  }

  private installAskSurroundings() {
    const b = this.backend
    b.on('GET', '/teacher-help/availability', () => ({ status: 200, body: { online: false, availableTeachers: 0 } }))
    // What the backend answers for a conversation nobody asked a teacher about.
    b.on('GET', '/teacher-help/conversations/{conv_id}/request', () => ({
      status: 404,
      body: { detail: 'This conversation was never escalated to a teacher' },
    }))
    // What the backend answers for a student with no evidence yet (stoasystem/stoa-backend#81):
    // every supported subject, whatever subject is asked about, all counts at zero.
    b.on('GET', '/adaptive/students/me/memory', () => ({
      status: 200,
      body: {
        studentId: STUDENT.id,
        roleView: 'student',
        locale: {
          effectiveLocale: 'de',
          contentLanguage: 'de',
          supportedLocales: ['de', 'en', 'fr', 'it'],
          canonicalValuesStable: true,
        },
        subjects: [
          { id: 'math', label: 'Mathematics', rolloutState: 'active' },
          { id: 'physics', label: 'Physics', rolloutState: 'foundation' },
          { id: 'german', label: 'German', rolloutState: 'foundation' },
          { id: 'english', label: 'English', rolloutState: 'foundation' },
        ],
        subjectActivity: [
          {
            subject: 'math',
            label: 'Mathematics',
            rolloutState: 'active',
            questionCount: 0,
            aiResolvedCount: 0,
            teacherEscalationCount: 0,
            feedbackAverage: null,
          },
          {
            subject: 'physics',
            label: 'Physics',
            rolloutState: 'foundation',
            questionCount: 0,
            aiResolvedCount: 0,
            teacherEscalationCount: 0,
            feedbackAverage: null,
          },
          {
            subject: 'german',
            label: 'German',
            rolloutState: 'foundation',
            questionCount: 0,
            aiResolvedCount: 0,
            teacherEscalationCount: 0,
            feedbackAverage: null,
          },
          {
            subject: 'english',
            label: 'English',
            rolloutState: 'foundation',
            questionCount: 0,
            aiResolvedCount: 0,
            teacherEscalationCount: 0,
            feedbackAverage: null,
          },
        ],
        weakTopics: [],
        strengthTopics: [],
        memorySnapshots: [],
        recommendations: [],
        sequencingSummary: {
          recommendedCount: 0,
          topCandidateType: null,
          topTopicId: null,
          topConfidence: null,
          activeAssignments: 0,
          completedAssignments: 0,
          skippedAssignments: 0,
          archivedAssignments: 0,
          explanation: 'No reviewed next-work recommendation is available from current signals.',
        },
        freshness: { status: 'empty', staleCount: 0 },
        updatedAt: '2026-09-29T08:00:00Z',
      },
    }))
  }

  private accept(conversation: Conversation, key: string, question: string): Message {
    const ids = commandIds(conversation.id, key)
    const existing = conversation.messages.find((message) => message.id === ids.studentMessageId)
    if (existing) return existing
    const student = { id: ids.studentMessageId, conversationId: conversation.id, role: 'user', content: question, createdAt: this.now() }
    conversation.messages.push(student)
    const failed = this.failNextRetryably
    this.failNextRetryably = false
    this.commands.set(key, {
      key,
      conversationId: conversation.id,
      question,
      answer: this.answerFor(question),
      finished: false,
      failed,
      attempt: 1,
      reads: 0,
    })
    return student
  }

  private complete(command: Command) {
    if (command.finished) return
    command.finished = true
    const conversation = this.conversations.get(command.conversationId)!
    conversation.messages.push({
      id: commandIds(command.conversationId, command.key).assistantMessageId,
      conversationId: command.conversationId,
      role: 'assistant',
      content: command.answer,
      createdAt: this.now(),
    })
  }

  private summary(conversation: Conversation) {
    const last = conversation.messages[conversation.messages.length - 1]
    return {
      id: conversation.id,
      title: conversation.messages[0]?.content.slice(0, 60) ?? 'New conversation',
      subject: conversation.subject,
      grade: conversation.grade,
      updatedAt: last?.createdAt ?? conversation.createdAt,
      lastMessagePreview: last?.content.slice(0, 120) ?? null,
    }
  }

  private detail(conversation: Conversation) {
    return { ...this.summary(conversation), messages: conversation.messages.map((message) => ({ ...message })) }
  }
}

function user() {
  return {
    id: STUDENT.id,
    name: STUDENT.name,
    email: STUDENT.email,
    role: 'student',
    preferredLocale: 'en',
    effectiveLocale: 'en',
    mustChangePassword: false,
  }
}

function profile() {
  return {
    id: 'e2e-profile-1',
    userId: STUDENT.id,
    name: STUDENT.name,
    email: STUDENT.email,
    grade: 'Grade 6',
    primarySubjects: ['math'],
    guardianStatus: 'linked',
    createdAt: '2026-09-01T08:00:00Z',
    updatedAt: '2026-09-01T08:00:00Z',
  }
}

function lastSegment(pathname: string) {
  return pathname.split('/').filter(Boolean).pop() ?? ''
}

/** The backend's message ids: UUIDv5 from the conversation and the idempotency key (`stoa.conversation.send.v1`). */
export function commandIds(conversationId: string, key: string) {
  const commandId = uuid5('6ba7b811-9dad-11d1-80b4-00c04fd430c8', `stoa.conversation.send.v1:${conversationId}:${key}`)
  return {
    commandId,
    studentMessageId: uuid5(commandId, 'student-message'),
    assistantMessageId: uuid5(commandId, 'assistant-message'),
  }
}

function uuid5(namespace: string, name: string) {
  const bytes = createHash('sha1')
    .update(Buffer.from(namespace.replace(/-/g, ''), 'hex'))
    .update(name, 'utf8')
    .digest()
    .subarray(0, 16)
  bytes[6] = (bytes[6] & 0x0f) | 0x50
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = bytes.toString('hex')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}
