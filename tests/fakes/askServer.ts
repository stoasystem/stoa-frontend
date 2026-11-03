/**
 * The server behind Ask, in memory (#571): what a test puts behind Ask with
 * `<AskServerProvider value={server}>` instead of mocking the service modules.
 *
 * It holds what the real one holds -- conversations and their messages, the
 * list of them, each conversation's request for a teacher, the commands that
 * answer messages, whether teachers are online, the student's profile and
 * learning memory -- and answers the eleven requests of `AskServer` from it.
 * Each test makes its own (`createFakeAskServer()`) and gives it only what that
 * test needs:
 *
 * - `seed({...})` puts data in, or replaces what is there under the same id;
 *   a test seeds again to make the server change its answer (a teacher
 *   replied, the request moved on, the command ended).
 * - `answerWith(...)` says how the next messages sent are answered: events
 *   streamed, a hold, and whether the answer came on the request
 *   (`streamed`) or only the message was stored (`accepted`); where the
 *   command stands meanwhile, what the server holds once it is through
 *   (`leaves`), and a refusal after all that (`refuse`). Past the ones
 *   given, a message is answered `streamed` with no events.
 * - `refuseNextWith(error, request)` refuses the next call of one request.
 * - `holdNext(request)` holds the next call of one request until the test
 *   lets it go, and it then answers from what the server holds by then.
 * - `availability`, `profile` and `memorySummary` are read as they stand when asked.
 *
 * Every request is a `vi.fn`, so a test can count its calls and read their
 * arguments (`server.stream.streamConversationMessage.mock.calls`), and, for
 * an answer no script says, put its own implementation in.
 *
 * Nothing is written on its own beyond what a request itself makes: a message
 * sent leaves its command, not messages in the conversation. What the
 * conversation reads back afterwards is what the test seeds, then or with
 * `leaves`.
 */
import { vi, type Mock } from 'vitest'
import type { AskServer } from '@/features/ask/server/askServer'
import { ApiError } from '@/services/api/httpClient'
import type { GenerationState, GenerationStatus, StreamOutcome } from '@/services/chat/chatStreamApi'
import type { MemorySummaryResponse } from '@/services/learning/memoryApi'
import type { ChatMessage, ChatStreamEvent, Conversation, ConversationSummary } from '@/types/chat'
import type { StudentProfile } from '@/types/student'
import type { TeacherAvailability, TeacherHelpRequest } from '@/types/teacherHelp'

/** Each request of the server, as the `vi.fn` it is here. */
export type MockedAskServer = {
  [Group in keyof AskServer]: {
    [Request in keyof AskServer[Group]]: AskServer[Group][Request] extends (...args: never[]) => unknown
      ? Mock<AskServer[Group][Request]>
      : never
  }
}

/** Any one of the eleven requests, by its name. */
export type AskRequest = {
  [Group in keyof AskServer]: keyof AskServer[Group]
}[keyof AskServer]

/** The command that answers one message, as `/generation` reports it. */
export type GenerationRecord = {
  conversationId: string
  idempotencyKey: string
  status: GenerationStatus
  steps?: string[]
  retryable?: boolean
}

export type AskServerSeed = {
  /** Conversations with their messages, by id. Not listed by that alone: see `list`. */
  conversations?: Conversation[]
  /** The list `GET /conversations` answers, as it is to stand. */
  list?: ConversationSummary[]
  /** Each conversation's request for a teacher, by conversation. */
  helpRequests?: TeacherHelpRequest[]
  /** Commands, by idempotency key. */
  generations?: GenerationRecord[]
  /** The ids the next conversations made are given, in order. */
  newConversationIds?: string[]
  /** What the next requests for a teacher are made with (an id, a time), in order, over the defaults. */
  newHelpRequests?: Array<Partial<TeacherHelpRequest>>
}

/** How one message sent is answered. */
export type StreamAnswer = {
  /** Streamed at once, in order. */
  events?: ChatStreamEvent[]
  /** Then the request waits for this. */
  until?: Promise<unknown>
  /** Streamed once it has. */
  after?: ChatStreamEvent[]
  /** The answer came on the request (`streamed`, the default) or comes later (`accepted`). */
  outcome?: StreamOutcome
  /** The steps the command reports while it runs. */
  steps?: string[]
  /** Where the command stands while the request is on: `ai_running` (the default), or already ended. */
  status?: GenerationStatus
  /** Whether a command that `failed` may be sent again under the same key. */
  retryable?: boolean
  /** What the server holds once the request is through, seeded before it answers: the answer written, say. */
  leaves?: AskServerSeed
  /** The request is then refused with this, and the command left as `status` says. */
  refuse?: unknown
}

export type FakeAskServer = MockedAskServer & {
  seed(data: AskServerSeed): void
  answerWith(...answers: StreamAnswer[]): void
  refuseNextWith(error: unknown, request?: AskRequest): void
  /** Hold the next call of `request`; the function returned lets it go. */
  holdNext(request: AskRequest): () => void
  availability: TeacherAvailability
  profile: StudentProfile
  memorySummary: MemorySummaryResponse
}

const notFound = (message: string, code?: string) => new ApiError(message, { status: 404, code })

export function createFakeAskServer(): FakeAskServer {
  const summaries = new Map<string, ConversationSummary>()
  const messages = new Map<string, ChatMessage[]>()
  let list: ConversationSummary[] = []
  const helpRequests = new Map<string, TeacherHelpRequest>()
  const generations = new Map<string, GenerationState & { idempotencyKey: string }>()
  const newConversationIds: string[] = []
  const newHelpRequests: Array<Partial<TeacherHelpRequest>> = []
  const answers: StreamAnswer[] = []
  const refusals = new Map<AskRequest, unknown[]>()
  const holds = new Map<AskRequest, Array<Promise<void>>>()
  let made = 0
  let asked = 0

  function record({ conversationId, idempotencyKey, status, steps = [], retryable }: GenerationRecord) {
    generations.set(idempotencyKey, {
      conversationId,
      idempotencyKey,
      status,
      steps,
      updatedAt: new Date().toISOString(),
      ...(retryable === undefined ? {} : { retryable }),
    })
  }

  // What each request answers, from what the server holds.
  const answer: AskServer = {
    conversations: {
      getConversations: async () => ({ items: [...list] }),
      getConversation: async (conversationId) => {
        const summary = summaries.get(conversationId)
        if (!summary) throw notFound('Conversation not found', 'conversation_not_found')
        return { ...summary, messages: messages.get(conversationId) ?? [] }
      },
      createConversation: async (payload) => {
        made += 1
        const id = newConversationIds.shift() ?? `conversation-${made}`
        const summary: ConversationSummary = {
          id,
          title: payload.initialMessage ?? 'New conversation',
          subject: payload.subject,
          grade: payload.grade,
          updatedAt: new Date().toISOString(),
        }
        summaries.set(id, summary)
        messages.set(id, [])
        list = [summary, ...list.filter((item) => item.id !== id)]
        // The first question goes out with the conversation, under
        // `initial-<id>`, and is answered unless the test seeded otherwise.
        const key = `initial-${id}`
        if (payload.initialMessage && !generations.has(key)) {
          record({ conversationId: id, idempotencyKey: key, status: 'completed' })
        }
        return { ...summary, messages: [] }
      },
    },
    stream: {
      streamConversationMessage: async ({ conversationId, payload, onEvent }) => {
        const reply = answers.shift() ?? {}
        const { idempotencyKey } = payload
        record({ conversationId, idempotencyKey, status: reply.status ?? 'ai_running', steps: reply.steps, retryable: reply.retryable })
        for (const event of reply.events ?? []) onEvent(event)
        if (reply.until) await reply.until
        for (const event of reply.after ?? []) onEvent(event)
        if (reply.leaves) server.seed(reply.leaves)
        if ('refuse' in reply) throw reply.refuse
        const outcome = reply.outcome ?? 'streamed'
        if (outcome === 'streamed') record({ conversationId, idempotencyKey, status: 'completed' })
        return outcome
      },
      getGenerationProgress: async (conversationId, _signal, idempotencyKey) => {
        const command = idempotencyKey
          ? generations.get(idempotencyKey)
          : [...generations.values()].reverse().find((each) => each.conversationId === conversationId)
        if (!command || command.conversationId !== conversationId) {
          throw notFound('Message command not found', 'message_command_not_found')
        }
        const { idempotencyKey: key, ...state } = command
        void key
        return { ...state, steps: [...state.steps] }
      },
    },
    teacherHelp: {
      getTeacherAvailability: async () => server.availability,
      getTeacherHelpRequest: async (conversationId) => {
        const help = helpRequests.get(conversationId)
        if (!help) throw notFound('This conversation was never escalated to a teacher')
        return help
      },
      createTeacherHelpRequest: async ({ conversationId }) => {
        asked += 1
        const help: TeacherHelpRequest = {
          requestId: `request-${asked}`,
          createdAt: new Date().toISOString(),
          ...newHelpRequests.shift(),
          conversationId,
          status: 'pending',
        }
        helpRequests.set(conversationId, help)
        return help
      },
      withdrawTeacherHelpRequest: async (conversationId) => {
        const help = helpRequests.get(conversationId)
        if (!help) throw notFound('This conversation was never escalated to a teacher')
        const withdrawn: TeacherHelpRequest = { ...help, status: 'withdrawn', updatedAt: new Date().toISOString() }
        helpRequests.set(conversationId, withdrawn)
        return withdrawn
      },
    },
    student: {
      getStudentProfile: async () => server.profile,
    },
    memory: {
      getMyMemorySummary: async () => server.memorySummary,
    },
  }

  /** A request as a test sees it: a refusal it queued first, then a hold, then the answer. */
  function gated<Answer extends (...args: never[]) => Promise<unknown>>(name: AskRequest, respond: Answer): Mock<Answer> {
    const call = async (...args: Parameters<Answer>) => {
      const refusal = refusals.get(name)
      if (refusal?.length) throw refusal.shift()
      const hold = holds.get(name)?.shift()
      if (hold) await hold
      return respond(...args)
    }
    return vi.fn(call as unknown as Answer)
  }

  const { conversations, stream, teacherHelp, student, memory } = answer
  const server: FakeAskServer = {
    conversations: {
      getConversations: gated('getConversations', conversations.getConversations),
      getConversation: gated('getConversation', conversations.getConversation),
      createConversation: gated('createConversation', conversations.createConversation),
    },
    stream: {
      streamConversationMessage: gated('streamConversationMessage', stream.streamConversationMessage),
      getGenerationProgress: gated('getGenerationProgress', stream.getGenerationProgress),
    },
    teacherHelp: {
      getTeacherAvailability: gated('getTeacherAvailability', teacherHelp.getTeacherAvailability),
      getTeacherHelpRequest: gated('getTeacherHelpRequest', teacherHelp.getTeacherHelpRequest),
      createTeacherHelpRequest: gated('createTeacherHelpRequest', teacherHelp.createTeacherHelpRequest),
      withdrawTeacherHelpRequest: gated('withdrawTeacherHelpRequest', teacherHelp.withdrawTeacherHelpRequest),
    },
    student: {
      getStudentProfile: gated('getStudentProfile', student.getStudentProfile),
    },
    memory: {
      getMyMemorySummary: gated('getMyMemorySummary', memory.getMyMemorySummary),
    },

    seed(data) {
      for (const { messages: thread, ...summary } of data.conversations ?? []) {
        summaries.set(summary.id, summary)
        messages.set(summary.id, thread)
      }
      if (data.list) list = [...data.list]
      for (const help of data.helpRequests ?? []) helpRequests.set(help.conversationId, help)
      for (const generation of data.generations ?? []) record(generation)
      newConversationIds.push(...(data.newConversationIds ?? []))
      newHelpRequests.push(...(data.newHelpRequests ?? []))
    },
    answerWith(...next) {
      answers.push(...next)
    },
    refuseNextWith(error, name = 'streamConversationMessage') {
      refusals.set(name, [...(refusals.get(name) ?? []), error])
    },
    holdNext(name) {
      let release!: () => void
      const held = new Promise<void>((resolve) => {
        release = resolve
      })
      holds.set(name, [...(holds.get(name) ?? []), held])
      return () => release()
    },
    availability: { online: true, availableTeachers: 2 },
    // As much of them as Ask reads.
    profile: { grade: '8', primarySubjects: ['math'] } as StudentProfile,
    memorySummary: { recommendations: [], weakTopics: [] } as unknown as MemorySummaryResponse,
  }
  return server
}
