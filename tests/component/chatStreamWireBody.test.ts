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
import { toUserFacingError } from '@/lib/userFacingText'
import { ApiError } from '@/services/api/httpClient'

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

  it('reports a refusal with no detail as a bare status, the way axios does (#183)', async () => {
    // A student read "Streaming request failed with status 503" in the thread:
    // toUserFacingError knows axios's wording for a bare status, and only that.
    globalThis.fetch = vi.fn(async () => new Response(JSON.stringify({}), { status: 503 })) as typeof fetch
    const refused = await streamConversationMessage({
      conversationId: 'c-1',
      payload: { content: 'Why?', idempotencyKey: 'k-1' },
      onEvent: () => {},
    }).catch((error: unknown) => error)

    expect(refused).toBeInstanceOf(Error)
    expect((refused as Error).message).toBe('Request failed with status code 503')
    expect(toUserFacingError(refused, 'fallback')).toBe('fallback')
  })
})

describe('a refused stream request, read the way httpClient reads one (#252)', () => {
  async function refusedWith(body: unknown, status = 403) {
    globalThis.fetch = vi.fn(async () => new Response(JSON.stringify(body), { status })) as typeof fetch
    return streamConversationMessage({
      conversationId: 'c-1',
      payload: { content: 'Why?', idempotencyKey: 'k-1' },
      onEvent: () => {},
    }).catch((error: unknown) => error)
  }

  it('reads the code and message under detail', async () => {
    const refused = await refusedWith({ detail: { code: 'quota_exceeded', message: 'Daily limit reached.' } }, 429)

    expect(refused).toBeInstanceOf(ApiError)
    expect(refused).toMatchObject({ status: 429, code: 'quota_exceeded', message: 'Daily limit reached.' })
  })

  it('reads the flat code and message too (safe_error_body), which were lost', async () => {
    const refused = await refusedWith({ code: 'content_refused', message: 'This question was refused.', correlationId: 'x' })

    expect(refused).toBeInstanceOf(ApiError)
    expect(refused).toMatchObject({ status: 403, code: 'content_refused', message: 'This question was refused.' })
  })

  it('prefers the code under detail when both are sent', async () => {
    const refused = await refusedWith({ detail: { code: 'inner', message: 'Inner.' }, code: 'outer' })

    expect(refused).toMatchObject({ code: 'inner', message: 'Inner.' })
  })

  it('keeps a string detail as the message, with no code', async () => {
    const refused = await refusedWith({ detail: 'Conversation not found.' }, 404)

    expect(refused).toMatchObject({ status: 404, code: undefined, message: 'Conversation not found.' })
  })
})
