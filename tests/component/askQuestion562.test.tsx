/**
 * Asking a question (#562): the one way in, `ask()`, for the four ways a
 * question goes out, against an in-memory server.
 *
 * - into the open conversation, by `sendStreamingMessage`;
 * - from the list, as `POST /conversations`' first question (`initial-<id>`);
 * - from the list with a quote or a file: an empty conversation, then the
 *   question sent into it (`held-<id>`, #263);
 * - a refused first question asked again as it was: into the conversation the
 *   refusal named (`initial-<id>`, #327 K4), that question only, once (#370).
 *
 * And the question is the session's that asked it: once the tab holds
 * another, nothing of it is written, sent or remembered (ADR 0002, 0003).
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeQuote } from '@/features/ask/practiceContext'
import type { AskQuestionAdapter } from '@/features/ask/question/askQuestionAdapter'
import { AskServerProvider, serverAskServer, type AskServer } from '@/features/ask/server/askServer'
import { useAskQuestion, type AskedQuestion, type AskOutcome } from '@/features/ask/question/useAskQuestion'
import { clearPendingMessages, readPendingMessage, sendingFor } from '@/lib/pendingChatMessages'
import { ApiError } from '@/services/api/httpClient'
import type { Conversation, CreateConversationRequest } from '@/types/chat'

const practice = { context: { unitId: 'u', lessonId: 'l', challengeId: 'ch-1' } }
const exerciseQuote = () => makeQuote('2x + 3 = 7', { kind: 'challenge', id: 'ch-1' })
const wireQuote = { text: '2x + 3 = 7', source: { kind: 'challenge', id: 'ch-1' } }

function conversation(id: string): Conversation {
  return { id, title: id, subject: 'math', grade: '8', updatedAt: '2026-11-02T10:00:00Z', messages: [] } as never
}

function batch(references: Array<{ uploadId: string }> = []) {
  return {
    references,
    attachments: references.map(({ uploadId }) => ({ id: uploadId, fileName: `${uploadId}.png`, mimeType: 'image/png' }) as never),
    sent: vi.fn(),
  }
}

function refusal(conversationId?: string) {
  return new ApiError('You have reached today’s limit.', {
    status: 429,
    code: 'daily_message_limit',
    detail: { code: 'daily_message_limit', ...(conversationId ? { conversationId } : {}) },
  })
}

/** The server in memory: conversations c1, c2, ... unless a test says otherwise. */
function memoryServer() {
  let made = 0
  const server = {
    createConversation: vi.fn(async (payload: CreateConversationRequest) => {
      void payload
      made += 1
      return conversation(`c${made}`)
    }),
    sendMessage: vi.fn(async (conversationId: string, payload: unknown) => {
      void conversationId
      void payload
      return 'accepted'
    }),
  }
  return server
}

type MemoryServer = ReturnType<typeof memoryServer>

/** The server behind Ask, with this one answering the two requests a question makes (#571). */
function behindAsk(server: MemoryServer): AskServer {
  const asking: AskQuestionAdapter = {
    conversations: { createConversation: server.createConversation },
    stream: {
      streamConversationMessage: ({ conversationId, payload }) =>
        server.sendMessage(conversationId, payload) as ReturnType<AskServer['stream']['streamConversationMessage']>,
    },
  }
  return {
    ...serverAskServer,
    conversations: { ...serverAskServer.conversations, ...asking.conversations },
    stream: { ...serverAskServer.stream, ...asking.stream },
  }
}

type Props = { subject: string; grade: string; conversationId: string | null; isStreaming: boolean }

function mount(server: MemoryServer, initial: Partial<Props> = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  const sendStreamingMessage = vi.fn(async () => true)
  const value = behindAsk(server)
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <AskServerProvider value={value}>{children}</AskServerProvider>
    </QueryClientProvider>
  )
  const view = renderHook(
    (props: Props) => useAskQuestion({ ...props, sendStreamingMessage }),
    { wrapper, initialProps: { subject: 'math', grade: '8', conversationId: null, isStreaming: false, ...initial } },
  )
  const ask = async (question: Partial<AskedQuestion> & { content: string }) => {
    let outcome!: AskOutcome
    await act(async () => {
      outcome = await view.result.current.ask({ files: batch(), ...question })
    })
    return outcome
  }
  return { ...view, ask, sendStreamingMessage }
}

/** Another tab signs out, and someone else signs in to this one. */
function signOutAndLetBeaIn() {
  clearPendingMessages()
  sessionStorage.setItem('stoa_tab_access_token', 'token-b')
}

beforeEach(() => {
  vi.clearAllMocks()
  sessionStorage.clear()
  localStorage.clear()
  sessionStorage.setItem('stoa_tab_access_token', 'token-a')
})

describe('the first question from the list', () => {
  it('goes out with POST /conversations, and waits for its answer under initial-<id>', async () => {
    const server = memoryServer()
    const { ask } = mount(server)
    const outcome = await ask({ content: 'Why subtract 3 first?', practice })

    expect(outcome).toEqual({ kind: 'opened', conversationId: 'c1' })
    expect(server.createConversation).toHaveBeenCalledWith({
      subject: 'math',
      grade: '8',
      initialMessage: 'Why subtract 3 first?',
      practiceContext: practice.context,
    })
    expect(server.sendMessage).not.toHaveBeenCalled()
    expect(readPendingMessage('c1')).toMatchObject({
      idempotencyKey: 'initial-c1',
      content: 'Why subtract 3 first?',
      practiceContext: practice.context,
    })
    expect(readPendingMessage('c1')).not.toHaveProperty('unconfirmed')
  })

  it('away from the stage carries no practiceContext key at all', async () => {
    const server = memoryServer()
    const { ask } = mount(server)
    await ask({ content: 'What is a prime?' })

    expect(server.createConversation.mock.calls[0][0]).not.toHaveProperty('practiceContext')
    expect(readPendingMessage('c1')).not.toHaveProperty('practiceContext')
  })
})

describe('a question with a quote or a file, held back from POST /conversations', () => {
  it('starts the conversation empty and goes into it under held-<id>, with its quote', async () => {
    const server = memoryServer()
    const files = batch()
    const { ask } = mount(server)
    const outcome = await ask({ content: 'Why subtract 3 first?', quote: exerciseQuote(), files, practice })

    expect(outcome).toEqual({ kind: 'opened', conversationId: 'c1' })
    expect(server.createConversation).toHaveBeenCalledWith({ subject: 'math', grade: '8', practiceContext: practice.context })
    expect(server.sendMessage).toHaveBeenCalledTimes(1)
    const [id, payload] = server.sendMessage.mock.calls[0]
    expect(id).toBe('c1')
    expect(payload).toEqual({
      content: 'Why subtract 3 first?',
      attachmentIds: undefined,
      idempotencyKey: 'held-c1',
      practiceContext: practice.context,
      quote: wireQuote,
    })
    expect(files.sent).toHaveBeenCalledTimes(1)
    // Kept as the conversation's pending message, confirmed once the server has it.
    expect(readPendingMessage('c1')).toMatchObject({ idempotencyKey: 'held-c1', quote: wireQuote })
    expect(readPendingMessage('c1')).not.toHaveProperty('unconfirmed')
  })

  it('carries its files, and no quote or practiceContext key it was not asked with', async () => {
    const server = memoryServer()
    const files = batch([{ uploadId: 'up-1' }])
    const { ask } = mount(server)
    await ask({ content: 'Is this right?', files })

    expect(server.createConversation.mock.calls[0][0]).not.toHaveProperty('initialMessage')
    const [, payload] = server.sendMessage.mock.calls[0]
    expect(payload).toEqual({ content: 'Is this right?', attachmentIds: [{ uploadId: 'up-1' }], idempotencyKey: 'held-c1' })
    expect(payload).not.toHaveProperty('quote')
    expect(payload).not.toHaveProperty('practiceContext')
    expect(readPendingMessage('c1')?.attachments).toEqual(files.attachments)
    expect(files.sent).toHaveBeenCalledTimes(1)
  })

  it('is kept unconfirmed, and its send counted as on its way, until the server has it', async () => {
    const server = memoryServer()
    let arrive!: () => void
    server.sendMessage.mockImplementationOnce(() => new Promise((resolve) => (arrive = () => resolve('accepted'))))
    const { ask } = mount(server)
    await ask({ content: 'Why?', quote: exerciseQuote() })

    expect(readPendingMessage('c1')?.unconfirmed).toBe(true)
    expect(sendingFor('held-c1')).toBeInstanceOf(Promise)

    await act(async () => {
      arrive()
      await sendingFor('held-c1')
    })
    expect(sendingFor('held-c1')).toBeUndefined()
    expect(readPendingMessage('c1')).not.toHaveProperty('unconfirmed')
  })

  it('stays unconfirmed when its send failed, and is no longer counted as on its way', async () => {
    const server = memoryServer()
    server.sendMessage.mockRejectedValueOnce(new Error('offline'))
    const { ask } = mount(server)
    await ask({ content: 'Why?', quote: exerciseQuote() })
    await act(async () => {
      await sendingFor('held-c1')
    })

    expect(sendingFor('held-c1')).toBeUndefined()
    expect(readPendingMessage('c1')?.unconfirmed).toBe(true)
  })
})

describe('a question in the open conversation', () => {
  it('is answered there, with what it was asked with', async () => {
    const server = memoryServer()
    const files = batch([{ uploadId: 'up-1' }])
    const { ask, sendStreamingMessage } = mount(server, { conversationId: 'open-1' })
    const outcome = await ask({ content: 'And then?', quote: exerciseQuote(), files, practice })

    expect(outcome).toEqual({ kind: 'opened', conversationId: 'open-1' })
    expect(server.createConversation).not.toHaveBeenCalled()
    expect(server.sendMessage).not.toHaveBeenCalled()
    expect(sendStreamingMessage).toHaveBeenCalledWith({
      content: 'And then?',
      practiceContext: practice.context,
      quote: wireQuote,
      attachmentIds: [{ uploadId: 'up-1' }],
      attachments: files.attachments,
    })
    expect(files.sent).toHaveBeenCalledTimes(1)
  })

  it('carries no key for what it was not asked with', async () => {
    const { ask, sendStreamingMessage } = mount(memoryServer(), { conversationId: 'open-1' })
    await ask({ content: 'And then?' })
    expect(sendStreamingMessage).toHaveBeenCalledWith({ content: 'And then?' })
  })

  it('does not go out while an answer is being written', async () => {
    const { ask, sendStreamingMessage, result } = mount(memoryServer(), { conversationId: 'open-1', isStreaming: true })
    expect(result.current.canAsk()).toBe(false)
    expect((await ask({ content: 'And then?' })).kind).toBe('failed')
    expect(sendStreamingMessage).not.toHaveBeenCalled()
  })
})

describe('a conversation that could not be made', () => {
  it('comes back as failed, with nothing written or sent', async () => {
    const server = memoryServer()
    const error = new ApiError('Down', { status: 503 })
    server.createConversation.mockRejectedValueOnce(error)
    const files = batch([{ uploadId: 'up-1' }])
    const { ask, result } = mount(server)
    const outcome = await ask({ content: 'Why?', files })

    expect(outcome).toEqual({ kind: 'failed', error })
    expect(server.sendMessage).not.toHaveBeenCalled()
    expect(files.sent).not.toHaveBeenCalled()
    expect(Object.keys(sessionStorage).filter((key) => key.startsWith('stoa_pending_chat_message:'))).toEqual([])
    await waitFor(() => expect(result.current.startError).toBe(error))
  })

  it('starts one conversation for two questions sent in one tick', async () => {
    const server = memoryServer()
    const { result } = mount(server)
    let outcomes!: AskOutcome[]
    await act(async () => {
      outcomes = await Promise.all([
        result.current.ask({ content: 'One', files: batch() }),
        result.current.ask({ content: 'Two', files: batch() }),
      ])
    })
    expect(server.createConversation).toHaveBeenCalledTimes(1)
    expect(outcomes.map((outcome) => outcome.kind)).toEqual(['opened', 'failed'])
  })
})

describe('a first question refused after its conversation was made (#327 K4, #370)', () => {
  function refusedOnce(conversationId?: string) {
    const server = memoryServer()
    server.createConversation.mockRejectedValueOnce(refusal(conversationId))
    return server
  }

  it('asked again as it was, goes into that conversation under initial-<id>, once', async () => {
    const server = refusedOnce('made-1')
    const { ask, result } = mount(server)
    expect((await ask({ content: 'Why subtract 3 first?', practice })).kind).toBe('failed')
    await waitFor(() => expect(result.current.startError).not.toBeNull())

    const again = await ask({ content: 'Why subtract 3 first?', practice })

    expect(again).toEqual({ kind: 'opened', conversationId: 'made-1' })
    expect(server.createConversation).toHaveBeenCalledTimes(1)
    expect(server.sendMessage).toHaveBeenCalledWith('made-1', {
      content: 'Why subtract 3 first?',
      attachmentIds: undefined,
      idempotencyKey: 'initial-made-1',
      practiceContext: practice.context,
    })
    expect(readPendingMessage('made-1')?.idempotencyKey).toBe('initial-made-1')
    // The refusal is no longer standing once the question is on its way again.
    await waitFor(() => expect(result.current.startError).toBeNull())

    // Remembered for one asking only.
    await ask({ content: 'Why subtract 3 first?', practice })
    expect(server.createConversation).toHaveBeenCalledTimes(2)
    expect(server.sendMessage).toHaveBeenCalledTimes(1)
  })

  it('starts a new conversation when the refusal names none', async () => {
    const server = refusedOnce()
    const { ask } = mount(server)
    await ask({ content: 'Why subtract 3 first?' })
    await ask({ content: 'Why subtract 3 first?' })
    expect(server.createConversation).toHaveBeenCalledTimes(2)
    expect(server.sendMessage).not.toHaveBeenCalled()
  })

  it('is not remembered for a question held back from POST /conversations', async () => {
    const server = refusedOnce('made-1')
    const { ask } = mount(server)
    await ask({ content: 'Why?', quote: exerciseQuote() })
    await ask({ content: 'Why?' })
    expect(server.createConversation).toHaveBeenCalledTimes(2)
    expect(server.sendMessage.mock.calls.map(([id]) => id)).not.toContain('made-1')
  })

  const otherwise: Array<[string, Partial<Props>, Partial<AskedQuestion> & { content: string }]> = [
    ['different words', {}, { content: 'Why not divide first?', practice }],
    ['another subject', { subject: 'physics' }, { content: 'Why subtract 3 first?', practice }],
    ['another year group', { grade: '9' }, { content: 'Why subtract 3 first?', practice }],
    ['a passage', {}, { content: 'Why subtract 3 first?', practice, quote: exerciseQuote() }],
    ['a file', {}, { content: 'Why subtract 3 first?', practice, files: batch([{ uploadId: 'up-1' }]) }],
    ['another exercise', {}, { content: 'Why subtract 3 first?', practice: { context: { ...practice.context, challengeId: 'ch-2' } } }],
    ['no exercise', {}, { content: 'Why subtract 3 first?' }],
  ]
  it.each(otherwise)('asked with %s, starts a conversation of its own', async (_, props, question) => {
    const server = refusedOnce('made-1')
    const view = mount(server)
    await view.ask({ content: 'Why subtract 3 first?', practice })

    view.rerender({ subject: 'math', grade: '8', conversationId: null, isStreaming: false, ...props })
    const outcome = await view.ask(question)

    expect(server.createConversation).toHaveBeenCalledTimes(2)
    expect(server.sendMessage.mock.calls.map(([id]) => id)).not.toContain('made-1')
    expect(outcome).toEqual({ kind: 'opened', conversationId: 'c1' })
  })
})

describe('a question whose session ended while its conversation was made (ADR 0002, 0003)', () => {
  function createHeldOpen(server: ReturnType<typeof memoryServer>) {
    let answer!: (outcome: { made: Conversation } | { refused: unknown }) => void
    const answered = new Promise<Conversation>((resolve, reject) => {
      answer = (outcome) => ('made' in outcome ? resolve(outcome.made) : reject(outcome.refused))
    })
    server.createConversation.mockImplementationOnce(() => answered)
    return answer
  }

  async function askThenSignOut(server: ReturnType<typeof memoryServer>, question: Partial<AskedQuestion> & { content: string }, outcome: { made: Conversation } | { refused: unknown }) {
    const answer = createHeldOpen(server)
    const view = mount(server)
    let asked!: Promise<AskOutcome>
    act(() => {
      asked = view.result.current.ask({ files: batch(), ...question })
    })
    signOutAndLetBeaIn()
    let settled!: AskOutcome
    await act(async () => {
      answer(outcome)
      settled = await asked
    })
    return { view, settled }
  }

  const pendingKeys = () => Object.keys(sessionStorage).filter((key) => key.startsWith('stoa_pending_chat_message:'))

  it('the first question is not written down as waiting for its answer', async () => {
    const server = memoryServer()
    const { settled } = await askThenSignOut(server, { content: "A's question", practice }, { made: conversation('a-1') })
    expect(settled.kind).toBe('failed')
    expect(pendingKeys()).toEqual([])
  })

  it('the held question is neither written down nor sent', async () => {
    const server = memoryServer()
    const files = batch([{ uploadId: 'up-1' }])
    const { settled } = await askThenSignOut(server, { content: "A's question", quote: exerciseQuote(), files }, { made: conversation('a-1') })
    expect(settled.kind).toBe('failed')
    expect(pendingKeys()).toEqual([])
    expect(server.sendMessage).not.toHaveBeenCalled()
    expect(files.sent).not.toHaveBeenCalled()
  })

  it('a refusal is not remembered for the next session to ask into', async () => {
    const server = memoryServer()
    const { view } = await askThenSignOut(server, { content: 'Why subtract 3 first?' }, { refused: refusal('a-made') })

    await view.ask({ content: 'Why subtract 3 first?' })
    expect(server.sendMessage).not.toHaveBeenCalled()
    expect(server.createConversation).toHaveBeenCalledTimes(2)
  })

  it('the same session goes on as usual', async () => {
    const server = memoryServer()
    const answer = createHeldOpen(server)
    const view = mount(server)
    let asked!: Promise<AskOutcome>
    act(() => {
      asked = view.result.current.ask({ content: 'Why?', files: batch(), quote: exerciseQuote() })
    })
    let settled!: AskOutcome
    await act(async () => {
      answer({ made: conversation('a-1') })
      settled = await asked
    })
    expect(settled).toEqual({ kind: 'opened', conversationId: 'a-1' })
    expect(server.sendMessage).toHaveBeenCalledTimes(1)
  })
})
