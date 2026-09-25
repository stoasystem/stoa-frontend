import { ApiError, httpClient } from '@/services/api/httpClient'
import { allowDemoFallback, apiBaseUrl } from '@/lib/env'
import { activeLanguage } from '@/i18n/languages'
import type { ChatStreamEvent } from '@/types/chat'

export type StreamMessagePayload = {
  content: string
  attachmentIds?: string[]
  // The backend requires this to make a retry safe; without it the request is
  // rejected before the message is ever read.
  idempotencyKey: string
}

/**
 * How the send request ended: the answer came back on it (`streamed`), or the
 * request only stored the message and the answer arrives later (`accepted`),
 * which `/generation` reports. A failed request throws.
 */
export type StreamOutcome = 'streamed' | 'accepted'

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
  const token = localStorage.getItem('stoa_access_token')
  let response: Response

  try {
    response = await fetch(
      `${apiBaseUrl}/conversations/${conversationId}/messages/stream`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // This request bypasses httpClient, so it carries the reader's
          // language itself — the assistant answers in it.
          'Accept-Language': activeLanguage(),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
        signal,
      },
    )
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
  const fallback = `Streaming request failed with status ${response.status}`
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
