import { answerUnauthorized, ApiError, httpClient } from '@/services/api/httpClient'
import { currentSessionToken } from '@/store/authStore'
import { allowDemoFallback, apiBaseUrl } from '@/lib/env'
import { activeLanguage } from '@/i18n/languages'
import type { ChatStreamEvent, MessageQuote, PracticeContextRef } from '@/types/chat'

export type StreamMessagePayload = {
  content: string
  /** The saved attachments this question carries, by id (see `wireBody`). */
  attachmentIds?: string[]
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
 * stoa-backend/src/stoa/models/attachment.py). The app has only saved
 * attachments to send -- `/files/.../complete` gives their ids -- so the
 * reference is made here, at the one place that writes the wire body, rather
 * than being carried through the hooks.
 */
function wireBody({ attachmentIds, ...rest }: StreamMessagePayload) {
  return attachmentIds && attachmentIds.length > 0
    ? { ...rest, attachmentIds: attachmentIds.map((attachmentId) => ({ attachmentId })) }
    : rest
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
  // token of the account this tab is on - a tab pinned to one account sends
  // that one's, not the browser's (#215) - and an expired one is renewed and
  // the message sent again, by the same rules as every other request. The
  // idempotency key makes sending it again safe.
  const send = async (token: string | null, retried: boolean): Promise<Response> => {
    const response = await fetch(
      `${apiBaseUrl}/conversations/${conversationId}/messages/stream`,
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
    const answered = answerUnauthorized(token, retried, (fresh) => send(fresh, true))
    if (!answered) return response
    // Nothing will read this answer; let its connection go before the retry.
    void response.body?.cancel().catch(() => {})
    return answered
  }
  let response: Response

  try {
    response = await send(currentSessionToken(), false)
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
  // Said as axios says it, so `toUserFacingError` knows it for a bare status
  // and shows its own words (#183: "Streaming request failed with status 503"
  // reached the student).
  const fallback = `Request failed with status code ${response.status}`
  let detail: unknown
  try {
    const body = (await response.json()) as { detail?: unknown }
    detail = body?.detail
  } catch {
    detail = undefined
  }
  const record = typeof detail === 'object' && detail !== null ? (detail as Record<string, unknown>) : null
  return new ApiError(
    typeof record?.message === 'string' ? record.message : typeof detail === 'string' ? detail : fallback,
    {
      status: response.status,
      detail,
      code: typeof record?.code === 'string' ? record.code : undefined,
    },
  )
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
    `/conversations/${conversationId}/generation`,
    { signal, params: idempotencyKey ? { idempotencyKey } : undefined },
  )
  return response.data
}
