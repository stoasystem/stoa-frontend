/**
 * What `POST /conversations/:id/messages/stream` actually receives (#125).
 *
 * `SendMessageRequest.attachmentIds` is a list of references -- `{attachmentId}`
 * or `{uploadId}`, exactly one of the two -- not a list of ids
 * (stoa-backend/docs/api/openapi.json, AttachmentReference;
 * src/stoa/models/attachment.py enforces the "exactly one"). A list of strings
 * is a 422 before the message is ever read, which is what the app would have
 * sent: the hooks carry ids, so the reference is made here, and a test watches
 * the body rather than trusting the type.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { streamConversationMessage } from '@/services/chat/chatStreamApi'

const originalFetch = globalThis.fetch

/** The request body of the one call made, parsed. */
function sentBody() {
  const call = vi.mocked(globalThis.fetch).mock.calls[0]
  return JSON.parse(String((call[1] as RequestInit).body))
}

beforeEach(() => {
  globalThis.fetch = vi.fn(async () => new Response(null, { status: 202 })) as typeof fetch
})

afterEach(() => {
  globalThis.fetch = originalFetch
  vi.clearAllMocks()
})

describe('the attachments on a message, on the wire', () => {
  it('sends each id as the reference object the backend requires', async () => {
    await streamConversationMessage({
      conversationId: 'c1',
      payload: { content: 'What did I do wrong?', idempotencyKey: 'k1', attachmentIds: ['att-1', 'att-2'] },
      onEvent: () => {},
    })

    expect(sentBody().attachmentIds).toEqual([{ attachmentId: 'att-1' }, { attachmentId: 'att-2' }])
  })

  it('leaves the key out altogether when the question carries no file', async () => {
    await streamConversationMessage({
      conversationId: 'c1',
      payload: { content: 'Just a question', idempotencyKey: 'k1' },
      onEvent: () => {},
    })

    const body = sentBody()
    expect('attachmentIds' in body).toBe(false)
    expect(body).toEqual({ content: 'Just a question', idempotencyKey: 'k1' })
  })

  it('leaves it out for an empty list too, rather than sending one', async () => {
    await streamConversationMessage({
      conversationId: 'c1',
      payload: { content: 'Just a question', idempotencyKey: 'k1', attachmentIds: [] },
      onEvent: () => {},
    })

    expect('attachmentIds' in sentBody()).toBe(false)
  })
})
