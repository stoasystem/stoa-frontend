/**
 * #452: the first reading of a conversation is not a change (#405), but it can
 * show the list of conversations is behind. A teacher replies to a
 * conversation that is not open while Ask sits on the list; opening it reads
 * the reply, and back on the list its preview and order were the old ones
 * until Ask was opened again a minute later. Now the first reading is held
 * against the list: another `updatedAt`, or no entry at all, reads the list
 * again -- once.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AskServerProvider } from '@/features/ask/server/askServer'
import { useAskConversation } from '@/features/ask/useAskConversation'
import { useConversationsQuery } from '@/hooks/chat/useConversationsQuery'
import type { ChatMessage, Conversation, ConversationSummary } from '@/types/chat'
import { createFakeAskServer, type FakeAskServer } from '../fakes/askServer'

/** The server behind Ask, in memory (#571): each test seeds the list and the conversation it reads. */
let server: FakeAskServer
let listMock: FakeAskServer['conversations']['getConversations']
let conversationMock: FakeAskServer['conversations']['getConversation']

/** What `GET /conversations` answers from now on. */
function listIs(items: ConversationSummary[]) {
  server.seed({ list: items })
}

/** What the conversation reads back from now on. */
function readBack(data: Conversation) {
  server.seed({ conversations: [data] })
}

const ASKED = '2026-10-20T10:00:00.000Z'
const REPLIED = '2026-10-20T10:05:00.000Z'

function message(id: string, role: ChatMessage['role'], content: string, conversationId = 'c2'): ChatMessage {
  return { id, conversationId, role, content, createdAt: ASKED, status: 'completed' }
}

const asked = [message('s-1', 'student', 'Was ist eine Primzahl?'), message('a-1', 'assistant', 'Eine Zahl mit genau zwei Teilern.')]
const reply = message('t-1', 'teacher', 'Denk an die 1: sie hat nur einen Teiler.')

function conversation(id: string, updatedAt: string, messages: ChatMessage[]): Conversation {
  return { id, title: 'Primzahlen', subject: 'math', grade: '8', updatedAt, messages }
}

function entry(id: string, updatedAt: string, lastMessagePreview: string): ConversationSummary {
  return { id, title: id === 'c1' ? 'Brueche' : 'Primzahlen', subject: 'math', grade: '8', updatedAt, lastMessagePreview }
}

/** AskPanel as far as reading goes: the list stays mounted while a conversation opens. */
function openAsk(conversationId: string | null) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <AskServerProvider value={server}>{children}</AskServerProvider>
    </QueryClientProvider>
  )
  return renderHook(
    ({ id }) => ({ list: useConversationsQuery(), ask: useAskConversation(id) }),
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
  // Nothing listed, and no conversation ever escalated: the fake's own defaults.
  server = createFakeAskServer()
  listMock = server.conversations.getConversations
  conversationMock = server.conversations.getConversation
})

afterEach(() => {
  vi.useRealTimers()
  vi.resetAllMocks()
  sessionStorage.clear()
})

describe('the first reading of a conversation', () => {
  it('reads the list again when the list has it at an older time', async () => {
    // Ask sits on the list; meanwhile a teacher replies to c2.
    listIs([entry('c1', ASKED, 'x = 4'), entry('c2', ASKED, asked[1].content)])
    const { result, rerender } = openAsk(null)
    await advance(0)
    expect(listMock).toHaveBeenCalledTimes(1)

    listIs([entry('c2', REPLIED, reply.content), entry('c1', ASKED, 'x = 4')])
    readBack(conversation('c2', REPLIED, [...asked, reply]))
    rerender({ id: 'c2' })
    await advance(0)

    expect(conversationMock).toHaveBeenCalledTimes(1)
    expect(listMock).toHaveBeenCalledTimes(2)
    // Back on the list, it shows the reply, first.
    expect(result.current.list.data?.items.map((item) => [item.id, item.lastMessagePreview])).toEqual([
      ['c2', reply.content],
      ['c1', 'x = 4'],
    ])

    // Once: a list that has caught up is not read again.
    await advance(60_000)
    expect(listMock).toHaveBeenCalledTimes(2)
  })

  it('reads the list again when the list does not have it', async () => {
    listIs([entry('c1', ASKED, 'x = 4')])
    const { rerender } = openAsk(null)
    await advance(0)

    readBack(conversation('c2', ASKED, asked))
    rerender({ id: 'c2' })
    await advance(0)

    expect(listMock).toHaveBeenCalledTimes(2)
  })

  it('does not read the list again when the list has it as it is', async () => {
    listIs([entry('c1', ASKED, 'x = 4'), entry('c2', ASKED, asked[1].content)])
    const { rerender } = openAsk(null)
    await advance(0)

    readBack(conversation('c2', ASKED, asked))
    rerender({ id: 'c2' })
    await advance(0)

    expect(conversationMock).toHaveBeenCalledTimes(1)
    expect(listMock).toHaveBeenCalledTimes(1)
  })

  it('does not ask again for a list that is still on its way', async () => {
    // Ask opened straight on a conversation: the list and the conversation are
    // asked for together, and the conversation comes first. The list has no
    // entry for it yet, so it is invalidated -- and TanStack joins the read in
    // flight rather than sending a second one. Nothing in this app decides
    // that; the test holds TanStack to it (#452 relies on it).
    const answerList = server.holdNext('getConversations')
    readBack(conversation('c2', REPLIED, [...asked, reply]))
    const { result } = openAsk('c2')
    await advance(0)
    expect(result.current.ask.conversation?.updatedAt).toBe(REPLIED)

    await act(async () => {
      listIs([entry('c2', REPLIED, reply.content)])
      answerList()
    })
    await advance(0)
    expect(listMock).toHaveBeenCalledTimes(1)
  })
})
