/**
 * What the student sees while an answer is written, end to end through the
 * real hook and the real bubble: the steps read from `/generation` appear as
 * they land, the text only ever grows, the cursor blinks until the command
 * ends, and an answer that fails or never ends leaves a visible failure with a
 * way to send it again. (stoa-docs card 103, merged into E13.)
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock('@/services/analytics/analyticsClient', () => ({
  trackEvent: vi.fn(),
}))

vi.mock('@/services/chat/commandMessageIds', () => ({
  commandMessageIds: vi.fn(async (conversationId: string, key: string) => ({
    studentMessageId: `student:${conversationId}:${key}`,
    assistantMessageId: `assistant:${conversationId}:${key}`,
  })),
}))

vi.mock('@/services/chat/chatStreamApi', () => ({
  streamConversationMessage: vi.fn(),
  getGenerationProgress: vi.fn(),
}))

import { ChatMessageBubble } from '@/components/chat/ChatMessageBubble'
import { useStreamingChat } from '@/hooks/chat/useStreamingChat'
import {
  getGenerationProgress,
  streamConversationMessage,
  type GenerationState,
} from '@/services/chat/chatStreamApi'

const mockedStream = vi.mocked(streamConversationMessage)
const mockedProgress = vi.mocked(getGenerationProgress)

let send: (() => void) | null = null
let stop: (() => void) | null = null

function Chat() {
  const chat = useStreamingChat('c1')
  send = () => {
    void chat.sendStreamingMessage({ content: 'Wie kürze ich 12/18?' })
  }
  stop = chat.stopStreaming
  return (
    <div>
      {chat.localMessages.map((message) => (
        <div key={message.id} data-testid={message.role}>
          <ChatMessageBubble message={message} onRetry={() => chat.retryMessage(message.id)} />
        </div>
      ))}
    </div>
  )
}

function renderChat() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <Chat />
    </QueryClientProvider>,
  )
}

function running(steps: string[]): GenerationState {
  return {
    conversationId: 'c1',
    steps,
    updatedAt: new Date(Date.now() + 60_000).toISOString(),
    status: 'ai_running',
  }
}

const cursor = () => document.querySelector('[class*="animate-[blink"]')
// The answer's own text, without the role label, time and placeholder around it.
const answerText = () =>
  screen.getByTestId('assistant').querySelector('.whitespace-pre-wrap')?.textContent ?? ''
const assistantStatus = (key: string) =>
  within(screen.getByTestId('assistant')).queryByText(key) !== null

async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms)
  })
}

describe('an answer as the student sees it', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    mockedStream.mockResolvedValue('accepted')
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
    sessionStorage.clear()
    send = null
    stop = null
  })

  it('grows step by step with the cursor showing, until the command ends', async () => {
    const published = [
      ['Kürze durch den ggT.'],
      ['Kürze durch den ggT.', 'Der ggT von 12 und 18 ist 6.'],
      ['Kürze durch den ggT.', 'Der ggT von 12 und 18 ist 6.', '12/18 = 2/3.'],
    ]
    let read = 0
    mockedProgress.mockImplementation(async () =>
      read < published.length
        ? running(published[read++])
        : { ...running([]), status: 'failed', retryable: true },
    )
    renderChat()
    act(() => send?.())

    const lengths: number[] = []
    for (const steps of published) {
      await advance(1000)
      expect(answerText()).toContain(steps[steps.length - 1])
      lengths.push(answerText().length)
      expect(cursor()).not.toBeNull()
    }
    expect(lengths).toEqual([...lengths].sort((a, b) => a - b))
    expect(new Set(lengths).size).toBe(lengths.length)

    await advance(3000)
    expect(cursor()).toBeNull()
    expect(assistantStatus('messageStatus.failed')).toBe(true)
  })

  it('ends in a visible failure, not an endless cursor, when no end ever comes', async () => {
    mockedProgress.mockResolvedValue(running(['Kürze durch den ggT.']))
    renderChat()
    act(() => send?.())

    await advance(3000)
    expect(cursor()).not.toBeNull()

    await advance(400_000)
    expect(cursor()).toBeNull()
    expect(assistantStatus('messageStatus.failed')).toBe(true)
  })

  it('stops the cursor when the student stops waiting', async () => {
    mockedProgress.mockResolvedValue(running(['Kürze durch den ggT.']))
    renderChat()
    act(() => send?.())
    await advance(1500)
    expect(cursor()).not.toBeNull()

    act(() => stop?.())
    await advance(100)

    expect(cursor()).toBeNull()
    expect(assistantStatus('messageStatus.stopped')).toBe(true)
  })

  it('stops the cursor when the answer is complete', async () => {
    let finished = false
    mockedProgress.mockImplementation(async () =>
      finished ? { ...running([]), status: 'completed' } : running(['Kürze durch den ggT.']),
    )
    renderChat()
    act(() => send?.())
    await advance(1500)
    expect(cursor()).not.toBeNull()

    finished = true
    await advance(3000)

    expect(cursor()).toBeNull()
  })
})
