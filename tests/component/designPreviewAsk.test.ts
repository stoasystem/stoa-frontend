/**
 * The design preview's demo backend keeps what is sent in Ask (#123, audit
 * finding 5): a conversation started with a first question, and a message
 * sent in an existing one, come back with their answers when the
 * conversation is read again -- which is what the thread shows once the
 * answer's command is done and its local bubbles are dropped.
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { resetDemoServer } from '@/dev/preview/demoSource'
import { answer, streamedAnswer } from '@/dev/preview/handlers'
import { commandMessageIds } from '@/services/chat/commandMessageIds'
import type { Conversation, ConversationListResponse } from '@/types/chat'

const request = (method: string, path: string, body: unknown = null) =>
  Promise.resolve(answer({ method, path, query: new URLSearchParams(), body }))

async function read(id: string): Promise<Conversation> {
  return (await request('GET', `/conversations/${id}`))?.data as Conversation
}

beforeEach(() => {
  resetDemoServer()
})

describe('Ask in the design preview', () => {
  it('keeps a new conversation and its first question, with the answer, under the ids the app expects', async () => {
    const created = (await request('POST', '/conversations', { subject: 'math', grade: '9', initialMessage: 'Why is sin 30° one half?' }))?.data as Conversation
    const thread = await read(created.id)
    const { studentMessageId, assistantMessageId } = await commandMessageIds(created.id, `initial-${created.id}`)
    expect(thread.messages.map((message) => [message.id, message.role, message.status])).toEqual([
      [studentMessageId, 'student', 'completed'],
      [assistantMessageId, 'assistant', 'completed'],
    ])
    expect(thread.messages[0].content).toBe('Why is sin 30° one half?')
    expect(thread.messages[1].content).toMatch(/no assistant is answering/)
    const list = (await request('GET', '/conversations'))?.data as ConversationListResponse
    expect(list.items[0]).toMatchObject({ id: created.id, title: 'Why is sin 30° one half?' })
  })

  it('keeps a message sent in an existing conversation, and its streamed answer', async () => {
    const before = await read('demo-ask-sine')
    const events = await Promise.resolve(streamedAnswer('demo-ask-sine', 'And sin 60°?', 'key-1'))
    const after = await read('demo-ask-sine')
    const { studentMessageId, assistantMessageId } = await commandMessageIds('demo-ask-sine', 'key-1')
    expect(after.messages).toHaveLength(before.messages.length + 2)
    expect(after.messages.slice(-2).map((message) => [message.id, message.role, message.content.includes('sin 60°')])).toEqual([
      [studentMessageId, 'student', true],
      [assistantMessageId, 'assistant', true],
    ])
    // The stream names the answer by the id the conversation stores it under.
    expect(events).toContain(`"messageId":"${assistantMessageId}"`)
  })
})
