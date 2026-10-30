import { apiPath } from '@/services/api/apiPath'
import { ApiError, answerUnauthorized, apiErrorFromBody, httpClient } from '@/services/api/httpClient'
import { signOutIfReplacedElsewhere } from '@/services/auth/browserSignInChanges'
import { storedRefreshToken } from '@/services/auth/sessionRefresh'
import { currentSessionToken } from '@/store/authStore'
import { allowDemoFallback, apiBaseUrl } from '@/lib/env'
import { activeLanguage } from '@/i18n/languages'
import type { ChatStreamEvent, MessageQuote, PracticeContextRef } from '@/types/chat'
import type { AttachmentReference } from '@/types/file'

export type StreamMessagePayload = {
  content: string
  /** The files this question carries (see `wireBody`). */
  attachmentIds?: AttachmentReference[]
  // The backend requires this to make a retry safe; without it the request is
  // rejected before the message is ever read.
  idempotencyKey: string
  /**
   * The exercise on screen, by id (#56). Exactly three keys, or the backend
   * answers 422; absent altogether when the question was not asked beside one.
   */
  practiceContext?: PracticeContextRef
  /** The passage the student chose to ask about (#56). */
  quote?: MessageQuote
}

/**
 * How the send request ended: the answer came back on it (`streamed`), or the
 * request only stored the message and the answer arrives later (`accepted`),
 * which `/generation` reports. A failed request throws.
 */
export type StreamOutcome = 'streamed' | 'accepted'

/**
 * `SendMessageRequest.attachmentIds` is a list of references, not of ids:
 * each entry is `{attachmentId}` or `{uploadId}`, exactly one of the two, and
 * the backend answers 422 for anything else (openapi.json, AttachmentReference;
 * stoa-backend/src/stoa/models/attachment.py). A file chosen in the composer is
 * a validated upload, which `/files/.../complete` leaves without an attachment:
 * the message carrying `{uploadId}` is what makes one (#507). The references
 * are carried as they are; an empty list is no key at all.
 */
function wireBody({ attachmentIds, ...rest }: StreamMessagePayload) {
  return attachmentIds && attachmentIds.length > 0 ? { ...rest, attachmentIds } : rest
}

export async function streamConversationMessage({
  conversationId,
  payload,
  signal,
  onEvent,
}: {
  conversationId: string
  payload: StreamMessagePayload
  signal?: AbortSignal
  onEvent: (event: ChatStreamEvent) => void
}): Promise<StreamOutcome> {
  // This request bypasses httpClient, so it answers for the session itself: the
  // token of the account this tab is on (#215), never once another tab has
  // signed out or signed in as someone else (#320), and an expired one is renewed and
  // the message sent again, by the same rules as every other request. The
  // idempotency key makes sending it again safe.
  const send = async (
    token: string | null,
    again: { retried: boolean; resent: boolean },
  ): Promise<Response> => {
    // Read beside the token, so a 401 can tell this session renewed since
    // from another one signed in (#218, #219).
    const refresh = token ? storedRefreshToken() : null
    if (token && signOutIfReplacedElsewhere()) {
      throw new ApiError('Signed out in another tab.', { status: 401, code: 'session_changed' })
    }
    const response = await fetch(
      `${apiBaseUrl}${apiPath`/conversations/${conversationId}/messages/stream`}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // The assistant answers in the reader's language.
          'Accept-Language': activeLanguage(),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(wireBody(payload)),
        signal,
      },
    )
    // The demo answers whatever the server says; it has no session to renew.
    if (response.status !== 401 || allowDemoFallback) return response
    const answered = answerUnauthorized({ token, refresh }, again, (fresh, renewed) =>
      send(fresh, renewed ? { ...again, retried: true } : { ...again, resent: true }),
    )
    if (!answered) return response
    // Nothing will read this answer; let its connection go before the retry.
    void response.body?.cancel().catch(() => {})
    return answered
  }
  let response: Response

  try {
    response = await send(currentSessionToken(), { retried: false, resent: false })
  } catch (error) {
    if (!allowDemoFallback) {
      throw error
    }
    await emitDemoStream({ payload, onEvent })
    return 'streamed'
  }

  if (!response.ok) {
    if (!allowDemoFallback) {
      throw await streamRequestError(response)
    }
    await emitDemoStream({ payload, onEvent })
    return 'streamed'
  }

  // Stored, answer to follow: nothing to read from this response.
  if (response.status === 202) {
    return 'accepted'
  }

  if (!response.body) {
    throw new Error('Streaming response body is empty.')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let done = false
  const receive = (event: ChatStreamEvent) => {
    if (event.type === 'message_done') done = true
    onEvent(event)
  }

  while (true) {
    const { done: ended, value } = await reader.read()

    if (ended) break

    buffer += decoder.decode(value, { stream: true })
    const parts = buffer.split('\n\n')
    buffer = parts.pop() ?? ''

    for (const part of parts) {
      const event = parseStreamEvent(part)
      if (event) receive(event)
    }
  }

  buffer += decoder.decode()

  if (buffer.trim()) {
    const event = parseStreamEvent(buffer)
    if (event) receive(event)
  }
  // A stream that ended without its answer leaves the answer to `/generation`.
  return done ? 'streamed' : 'accepted'
}

/** The refusal as `httpClient` would report it: the server's message and code. */
async function streamRequestError(response: Response) {
  let body: unknown
  try {
    body = await response.json()
  } catch {
    body = undefined
  }
  return apiErrorFromBody(body, {
    status: response.status,
    // Said as axios says it, so `toUserFacingError` knows it for a bare status
    // and shows its own words (#183: "Streaming request failed with status 503"
    // reached the student).
    fallback: `Request failed with status code ${response.status}`,
  })
}

async function emitDemoStream({
  payload,
  onEvent,
}: {
  payload: StreamMessagePayload
  onEvent: (event: ChatStreamEvent) => void
}) {
  const messageId = `assistant-${Date.now()}`
  const createdAt = new Date().toISOString()
  onEvent({ type: 'message_start', messageId, role: 'assistant', createdAt })
  await new Promise((resolve) => window.setTimeout(resolve, 100))
  onEvent({
    type: 'message_delta',
    messageId,
    delta: `Here is a clear explanation for "${payload.content}". The key is to isolate the unknown step by step.`,
  })
  onEvent({ type: 'message_done', messageId, status: 'completed' })
}

function parseStreamEvent(raw: string): ChatStreamEvent | null {
  const lines = raw.split('\n').map((line) => line.trimEnd())
  const eventLine = lines.find((line) => line.startsWith('event:'))
  const dataLines = lines
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.replace(/^data:\s?/, ''))

  if (!eventLine || dataLines.length === 0) return null

  const type = eventLine.replace('event:', '').trim()
  const data = JSON.parse(dataLines.join('\n'))

  return {
    type,
    ...data,
  } as ChatStreamEvent
}

export type GenerationStatus = 'message_committed' | 'ai_running' | 'completed' | 'failed'

/**
 * The steps of an answer still being written and, when the message's
 * idempotency key is given, where that message's command stands. A `failed`
 * command that is `retryable` may be sent again with the same key.
 */
export type GenerationState = {
  conversationId: string
  steps: string[]
  updatedAt: string
  commandId?: string | null
  status?: GenerationStatus | null
  attempt?: number | null
  assistantMessageId?: string | null
  failureCategory?: string | null
  retryable?: boolean | null
}

export async function getGenerationProgress(
  conversationId: string,
  signal?: AbortSignal,
  idempotencyKey?: string,
) {
  const response = await httpClient.get<GenerationState>(
    apiPath`/conversations/${conversationId}/generation`,
    { signal, params: idempotencyKey ? { idempotencyKey } : undefined },
  )
  return response.data
}
