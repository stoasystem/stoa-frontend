/**
 * The answer is generated behind a request that holds its connection until the
 * answer is whole, so the steps are read back on a second connection while
 * waiting. These tests pin that the steps actually reach the message a student
 * is looking at, which browser sampling could not establish.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/services/analytics/analyticsClient', () => ({
  trackEvent: vi.fn(),
}))

vi.mock('@/services/chat/chatStreamApi', () => ({
  streamConversationMessage: vi.fn(),
  getGenerationProgress: vi.fn(),
}))

import {
  getGenerationProgress,
  streamConversationMessage,
} from '@/services/chat/chatStreamApi'
import { useStreamingChat } from '@/hooks/chat/useStreamingChat'

const mockedStream = vi.mocked(streamConversationMessage)
const mockedProgress = vi.mocked(getGenerationProgress)

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

function assistantContent(result: {
  current: { localMessages: Array<{ role: string; content: string }> }
}) {
  const assistant = result.current.localMessages.filter(
    (message) => message.role === 'assistant',
  )
  return assistant[assistant.length - 1]?.content
}

describe('an answer being written', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('shows each step as it is published', async () => {
    let finishStream: () => void = () => {}
    mockedStream.mockImplementation(
      () => new Promise<void>((resolve) => {
        finishStream = resolve
      }),
    )
    mockedProgress
      .mockResolvedValueOnce({ conversationId: 'c1', steps: ['Schritt 1'], updatedAt: future() })
      .mockResolvedValue({
        conversationId: 'c1',
        steps: ['Schritt 1', 'Schritt 2'],
        updatedAt: future(),
      })

    const { result } = renderHook(() => useStreamingChat('c1'), { wrapper })

    act(() => {
      void result.current.sendStreamingMessage({ content: 'Wie loese ich 2x = 8?' })
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1100)
    })
    await waitFor(() => expect(assistantContent(result)).toBe('Schritt 1'))

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1100)
    })
    await waitFor(() => expect(assistantContent(result)).toBe('Schritt 1\n\nSchritt 2'))

    await act(async () => {
      finishStream()
    })
  })

  it('ignores steps written before this question', async () => {
    mockedStream.mockImplementation(() => new Promise<void>(() => {}))
    // Progress is held per conversation, so this is the previous answer.
    mockedProgress.mockResolvedValue({
      conversationId: 'c1',
      steps: ['an older answer'],
      updatedAt: '2000-01-01T00:00:00.000Z',
    })

    const { result } = renderHook(() => useStreamingChat('c1'), { wrapper })

    act(() => {
      void result.current.sendStreamingMessage({ content: 'Was ist eine Primzahl?' })
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2100)
    })

    expect(assistantContent(result)).toBe('')
  })
})

function future() {
  return new Date(Date.now() + 60_000).toISOString()
}
