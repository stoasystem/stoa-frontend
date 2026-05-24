import { DEFAULT_API_BASE_URL } from '@/lib/constants'
import type { ChatStreamEvent } from '@/types/chat'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL

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
  const response = await fetch(
    `${API_BASE_URL}/conversations/${conversationId}/messages/stream`,
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

  if (!response.ok) {
    throw new Error('Failed to start streaming response.')
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
