import { allowDemoFallback, apiBaseUrl } from '@/lib/env'
import type { ChatStreamEvent } from '@/types/chat'

export type StreamMessagePayload = {
  content: string
  attachmentIds?: string[]
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
}) {
  const token = localStorage.getItem('stoa_access_token')
  let response: Response

  try {
    response = await fetch(
      `${apiBaseUrl}/conversations/${conversationId}/messages/stream`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
    return
  }

  if (!response.ok) {
    if (!allowDemoFallback) {
      throw new Error(`Streaming request failed with status ${response.status}`)
    }
    await emitDemoStream({ payload, onEvent })
    return
  }

  if (!response.body) {
    throw new Error('Streaming response body is empty.')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()

    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const parts = buffer.split('\n\n')
    buffer = parts.pop() ?? ''

    for (const part of parts) {
      const event = parseStreamEvent(part)
      if (event) onEvent(event)
    }
  }

  buffer += decoder.decode()

  if (buffer.trim()) {
    const event = parseStreamEvent(buffer)
    if (event) onEvent(event)
  }
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
    delta: `The local backend saved your question. For "${payload.content}", the key is to isolate the unknown step by step.`,
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
