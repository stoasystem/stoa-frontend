/**
 * #405: what Ask reads, counted at the API. The list of conversations stays
 * mounted while a conversation is open and nothing else reads it again, so it
 * follows the open conversation: a change of its last message, or of its help
 * status as the teacher help module reads it (#558), reads the list again --
 * once. An answer reads the
 * conversation once, not twice: the list's key is a prefix of the
 * conversation's, and invalidating both read the conversation a second time.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AskServerProvider } from '@/features/ask/server/askServer'
import { useTeacherHelp } from '@/features/ask/teacherHelp/useTeacherHelp'
import { useAskConversation } from '@/features/ask/useAskConversation'
import { useConversationsQuery } from '@/hooks/chat/useConversationsQuery'
import type { ChatMessage, Conversation } from '@/types/chat'
import type { TeacherHelpRequest } from '@/types/teacherHelp'
import { createFakeAskServer, type FakeAskServer } from '../fakes/askServer'

/** The server behind Ask, in memory (#571): each test seeds the conversation and its help. */
let server: FakeAskServer
let listMock: FakeAskServer['conversations']['getConversations']
let conversationMock: FakeAskServer['conversations']['getConversation']
let helpMock: FakeAskServer['teacherHelp']['getTeacherHelpRequest']

/** What the conversations read back from now on. */
function readBack(...conversations: Conversation[]) {
  server.seed({ conversations })
}

/** The conversation's request for a teacher, as the server reports it from now on. */
function helpIs(request: TeacherHelpRequest) {
  server.seed({ helpRequests: [request] })
}

function message(id: string, role: ChatMessage['role'], content: string, conversationId = 'c1'): ChatMessage {
  return { id, conversationId, role, content, createdAt: '2026-10-20T10:00:00.000Z', status: 'completed' }
}

function conversation(messages: ChatMessage[], id = 'c1'): Conversation {
  return { id, title: 'Linear equations', subject: 'math', grade: '8', updatedAt: '2026-10-20T10:00:00.000Z', messages }
}

function help(status: TeacherHelpRequest['status']): TeacherHelpRequest {
  return { requestId: 'r1', conversationId: 'c1', status, createdAt: '2026-10-20T10:00:00.000Z' }
}

const asked = [message('s-1', 'student', 'Wie loese ich 2x = 8?'), message('a-1', 'assistant', 'x = 4')]

/** AskPanel as far as reading goes: the list mounted beside the open conversation, and its teacher help. */
function openAsk(conversationId: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <AskServerProvider value={server}>{children}</AskServerProvider>
    </QueryClientProvider>
  )
  return renderHook(
    ({ id }) => {
      useConversationsQuery()
      const ask = useAskConversation(id)
      useTeacherHelp({ conversationId: id, messages: ask.messages, isStreaming: ask.isStreaming })
      return ask
    },
    { wrapper, initialProps: { id: conversationId } },
  )
}

/** Advance the clock, then let what that set off land: a read reaches React on a later timer. */
async function advance(ms: number) {
  for (const step of [ms, 10]) {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(step)
    })
  }
}

beforeEach(() => {
  vi.useFakeTimers()
  // No conversation escalated unless a test says so: the fake's own default.
  server = createFakeAskServer()
  ;({ getConversations: listMock, getConversation: conversationMock } = server.conversations)
  helpMock = server.teacherHelp.getTeacherHelpRequest
  // The list as the conversations are first read: a first read the list is
  // behind on reads it again of its own (#452, askListFirstRead452).
  server.seed({
    list: ['c1', 'c2'].map((id) => ({ id, title: 'Linear equations', subject: 'math', grade: '8', updatedAt: '2026-10-20T10:00:00.000Z' })),
  })
  server.availability = { online: true, availableTeachers: 1, teacherSupport: null }
})

afterEach(() => {
  vi.useRealTimers()
  vi.resetAllMocks()
  sessionStorage.clear()
})

describe('the list follows the open conversation', () => {
  it('is read again when a poll brings a teacher reply, and only then', async () => {
    helpIs(help('in_progress'))
    readBack(conversation(asked))
    openAsk('c1')
    await advance(0)
    expect(listMock).toHaveBeenCalledTimes(1)
    expect(conversationMock).toHaveBeenCalledTimes(1)

    // Read again at the pace of help a teacher has: nothing new, nothing read.
    await advance(5_000)
    expect(conversationMock).toHaveBeenCalledTimes(2)
    expect(listMock).toHaveBeenCalledTimes(1)

    readBack(conversation([...asked, message('t-1', 'teacher', 'Teile beide Seiten durch 2.')]))
    await advance(5_000)
    expect(conversationMock).toHaveBeenCalledTimes(3)
    expect(listMock).toHaveBeenCalledTimes(2)

    await advance(5_000)
    expect(listMock).toHaveBeenCalledTimes(2)
  })

  it('is read again when the help status changes', async () => {
    helpIs(help('pending'))
    readBack(conversation(asked))
    openAsk('c1')
    await advance(0)
    expect(listMock).toHaveBeenCalledTimes(1)

    helpIs(help('assigned'))
    await advance(15_000)
    expect(helpMock).toHaveBeenCalledTimes(2)
    expect(listMock).toHaveBeenCalledTimes(2)
  })

  it('is not read again for the first reading of a conversation', async () => {
    readBack(conversation(asked), conversation([message('s-9', 'student', 'Was ist eine Primzahl?', 'c2')], 'c2'))
    const { rerender } = openAsk('c1')
    await advance(0)

    rerender({ id: 'c2' })
    await advance(0)
    expect(conversationMock).toHaveBeenLastCalledWith('c2')
    expect(listMock).toHaveBeenCalledTimes(1)
  })
})

describe('an answer', () => {
  it('reads the conversation once, and the list once', async () => {
    readBack(conversation(asked))
    // Answered on the request, the answer written into the conversation.
    server.answerWith({
      leaves: {
        conversations: [conversation([...asked, message('s-2', 'student', 'Und 3x = 9?'), message('a-2', 'assistant', 'x = 3')])],
      },
    })
    const { result } = openAsk('c1')
    await advance(0)
    expect(conversationMock).toHaveBeenCalledTimes(1)
    expect(listMock).toHaveBeenCalledTimes(1)

    await act(async () => {
      await result.current.sendStreamingMessage({ content: 'Und 3x = 9?' })
    })
    await advance(0)

    expect(result.current.messages.map((shown) => shown.id)).toEqual(['s-1', 'a-1', 's-2', 'a-2'])
    expect(conversationMock).toHaveBeenCalledTimes(2)
    expect(listMock).toHaveBeenCalledTimes(2)
  })
})
