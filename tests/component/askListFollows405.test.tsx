/**
 * #405: what Ask reads, counted at the API. The list of conversations stays
 * mounted while a conversation is open and nothing else reads it again, so it
 * follows the open conversation: a change of its last message or of its help
 * status, as read, reads the list again -- once. An answer reads the
 * conversation once, not twice: the list's key is a prefix of the
 * conversation's, and invalidating both read the conversation a second time.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAskConversation } from '@/features/ask/useAskConversation'
import { useConversationsQuery } from '@/hooks/chat/useConversationsQuery'
import { ApiError } from '@/services/api/httpClient'
import type { ChatMessage, Conversation } from '@/types/chat'
import type { TeacherHelpRequest } from '@/types/teacherHelp'

vi.mock('@/services/analytics/analyticsClient', () => ({ trackEvent: vi.fn() }))
vi.mock('@/services/chat/commandMessageIds', () => ({
  commandMessageIds: vi.fn(async (conversationId: string, key: string) => ({
    studentMessageId: `student:${conversationId}:${key}`,
    assistantMessageId: `assistant:${conversationId}:${key}`,
  })),
}))
vi.mock('@/services/chat/chatApi', () => ({
  getConversations: vi.fn(),
  getConversation: vi.fn(),
}))
vi.mock('@/services/chat/chatStreamApi', () => ({
  streamConversationMessage: vi.fn(),
  getGenerationProgress: vi.fn(),
}))
vi.mock('@/services/teacherHelp/teacherHelpApi', () => ({
  getTeacherHelpRequest: vi.fn(),
}))

import { getConversation, getConversations } from '@/services/chat/chatApi'
import { getGenerationProgress, streamConversationMessage } from '@/services/chat/chatStreamApi'
import { getTeacherHelpRequest } from '@/services/teacherHelp/teacherHelpApi'

const listMock = vi.mocked(getConversations)
const conversationMock = vi.mocked(getConversation)
const streamMock = vi.mocked(streamConversationMessage)
const progressMock = vi.mocked(getGenerationProgress)
const helpMock = vi.mocked(getTeacherHelpRequest)

const NEVER_ESCALATED = new ApiError('This conversation was never escalated to a teacher', { status: 404 })

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

/** AskPanel as far as reading goes: the list mounted beside the open conversation. */
function openAsk(conversationId: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  return renderHook(
    ({ id }) => {
      useConversationsQuery()
      return useAskConversation(id)
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
  listMock.mockResolvedValue({ items: [] })
  progressMock.mockResolvedValue({ conversationId: 'c1', steps: [], updatedAt: '2026-10-20T10:00:00.000Z' })
})

afterEach(() => {
  vi.useRealTimers()
  vi.resetAllMocks()
  sessionStorage.clear()
})

describe('the list follows the open conversation', () => {
  it('is read again when a poll brings a teacher reply, and only then', async () => {
    helpMock.mockResolvedValue(help('in_progress'))
    let replied = false
    conversationMock.mockImplementation(async () => conversation(replied ? [...asked, message('t-1', 'teacher', 'Teile beide Seiten durch 2.')] : asked),
    )
    openAsk('c1')
    await advance(0)
    expect(listMock).toHaveBeenCalledTimes(1)
    expect(conversationMock).toHaveBeenCalledTimes(1)

    // Read again at the pace of help a teacher has: nothing new, nothing read.
    await advance(5_000)
    expect(conversationMock).toHaveBeenCalledTimes(2)
    expect(listMock).toHaveBeenCalledTimes(1)

    replied = true
    await advance(5_000)
    expect(conversationMock).toHaveBeenCalledTimes(3)
    expect(listMock).toHaveBeenCalledTimes(2)

    await advance(5_000)
    expect(listMock).toHaveBeenCalledTimes(2)
  })

  it('is read again when the help status changes', async () => {
    helpMock.mockResolvedValue(help('pending'))
    conversationMock.mockResolvedValue(conversation(asked))
    openAsk('c1')
    await advance(0)
    expect(listMock).toHaveBeenCalledTimes(1)

    helpMock.mockResolvedValue(help('assigned'))
    await advance(15_000)
    expect(helpMock).toHaveBeenCalledTimes(2)
    expect(listMock).toHaveBeenCalledTimes(2)
  })

  it('is not read again for the first reading of a conversation', async () => {
    helpMock.mockRejectedValue(NEVER_ESCALATED)
    conversationMock.mockImplementation(async (id) =>
      conversation(id === 'c1' ? asked : [message('s-9', 'student', 'Was ist eine Primzahl?', id)], id),
    )
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
    helpMock.mockRejectedValue(NEVER_ESCALATED)
    let answered = false
    conversationMock.mockImplementation(async () =>
      conversation(
        answered
          ? [...asked, message('s-2', 'student', 'Und 3x = 9?'), message('a-2', 'assistant', 'x = 3')]
          : asked,
      ),
    )
    streamMock.mockImplementation(async () => {
      answered = true
      return 'streamed'
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
