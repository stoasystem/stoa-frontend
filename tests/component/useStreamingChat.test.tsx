/**
 * The answer is generated behind a request that holds its connection until the
 * answer is whole, so the steps are read back on a second connection while
 * waiting. These tests pin that the steps actually reach the message a student
 * is looking at, which browser sampling could not establish.
 *
 * Where the message stands is the command's state, read from `/generation`
 * with the message's idempotency key (#18, E13): the request may be cut off at
 * 29 seconds, or (after E21) return as soon as the message is stored, and the
 * answer still arrives. A retry sends the same key, so it is the same message.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/services/analytics/analyticsClient', () => ({
  trackEvent: vi.fn(),
}))

// The derivation itself is pinned against the backend in commandMessageIds.test;
// here it only has to be the one the hook uses, and to settle within a tick.
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

import {
  getGenerationProgress,
  streamConversationMessage,
  type GenerationState,
  type StreamOutcome,
} from '@/services/chat/chatStreamApi'
import { ApiError } from '@/services/api/httpClient'
import { mergeWithServerMessages, useStreamingChat } from '@/hooks/chat/useStreamingChat'

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
    sessionStorage.clear()
  })

  it('shows each step as it is published', async () => {
    let finishStream: () => void = () => {}
    mockedStream.mockImplementation(
      () => new Promise<StreamOutcome>((resolve) => {
        finishStream = () => resolve('streamed')
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
    mockedStream.mockImplementation(() => new Promise<StreamOutcome>(() => {}))
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

describe('where the message stands', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
    sessionStorage.clear()
  })

  it('takes the answer from the stream when the request carries it', async () => {
    mockedStream.mockResolvedValue('streamed')
    mockedProgress.mockResolvedValue(state({ status: 'ai_running' }))
    const { result, invalidated } = render()

    await act(async () => {
      await result.current.sendStreamingMessage({ content: 'Was ist 2 + 2?' })
    })

    expect(result.current.localMessages).toEqual([])
    expect(invalidated()).toBe(true)
    expect(result.current.isStreaming).toBe(false)
  })

  it('waits for the command when the request only stored the message', async () => {
    mockedStream.mockResolvedValue('accepted')
    let finished = false
    mockedProgress.mockImplementation(async () =>
      finished
        ? state({ status: 'completed', assistantMessageId: 'a-1' })
        : state({ status: 'ai_running', steps: ['Schritt 1'] }),
    )
    const { result, invalidated } = render()

    act(() => {
      void result.current.sendStreamingMessage({ content: 'Was ist 2 + 2?' })
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000)
    })
    expect(result.current.isStreaming).toBe(true)
    expect(assistantContent(result)).toBe('Schritt 1')

    finished = true
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000)
    })

    await waitFor(() => expect(result.current.isStreaming).toBe(false))
    expect(result.current.localMessages).toEqual([])
    expect(invalidated()).toBe(true)
    const polls = mockedProgress.mock.calls.length
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000)
    })
    expect(mockedProgress.mock.calls.length).toBe(polls)
  })

  it('still shows the answer when the request is cut off before it arrives', async () => {
    mockedStream.mockRejectedValue(new Error('Streaming request failed with status 504'))
    mockedProgress.mockResolvedValue(state({ status: 'completed', assistantMessageId: 'a-1' }))
    const { result, invalidated } = render()

    act(() => {
      void result.current.sendStreamingMessage({ content: 'Was ist 2 + 2?' })
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000)
    })

    await waitFor(() => expect(result.current.isStreaming).toBe(false))
    expect(result.current.localMessages).toEqual([])
    expect(invalidated()).toBe(true)
  })

  it('offers a failed answer again under the same key', async () => {
    mockedStream.mockRejectedValueOnce(new Error('Streaming request failed with status 503'))
    mockedProgress.mockResolvedValue(
      state({ status: 'failed', failureCategory: 'deadline_exceeded', retryable: true }),
    )
    const { result } = render()

    await failOnce(result)
    const failed = result.current.localMessages.find((message) => message.status === 'failed' && message.role === 'student')
    expect(failed).toBeDefined()

    mockedStream.mockResolvedValueOnce('streamed')
    await act(async () => {
      result.current.retryMessage(failed!.id)
      await vi.advanceTimersByTimeAsync(100)
    })

    const keys = mockedStream.mock.calls.map((call) => call[0].payload.idempotencyKey)
    expect(keys).toHaveLength(2)
    expect(keys[1]).toBe(keys[0])
  })

  it('sends an answer that was paid for but unusable as a new message', async () => {
    mockedStream.mockRejectedValueOnce(new Error('Streaming request failed with status 503'))
    mockedProgress.mockResolvedValue(
      state({ status: 'failed', failureCategory: 'incomplete_output', retryable: false }),
    )
    const { result } = render()

    await failOnce(result)
    const failed = result.current.localMessages.find((message) => message.status === 'failed' && message.role === 'student')

    mockedStream.mockResolvedValueOnce('streamed')
    await act(async () => {
      result.current.retryMessage(failed!.id)
      await vi.advanceTimersByTimeAsync(100)
    })

    const keys = mockedStream.mock.calls.map((call) => call[0].payload.idempotencyKey)
    expect(keys).toHaveLength(2)
    expect(keys[1]).not.toBe(keys[0])
  })

  it('treats a message the server never stored as safe to send again', async () => {
    mockedStream.mockRejectedValueOnce(new Error('Streaming request failed with status 429'))
    mockedProgress.mockRejectedValue(notFound())
    const { result } = render()

    await failOnce(result)
    const failed = result.current.localMessages.find((message) => message.status === 'failed' && message.role === 'student')
    expect(failed).toBeDefined()

    mockedStream.mockResolvedValueOnce('streamed')
    await act(async () => {
      result.current.retryMessage(failed!.id)
      await vi.advanceTimersByTimeAsync(100)
    })
    const keys = mockedStream.mock.calls.map((call) => call[0].payload.idempotencyKey)
    expect(keys[1]).toBe(keys[0])
  })

  it('picks the same message up again after the page reloads', async () => {
    sessionStorage.setItem(
      'stoa_pending_chat_message:c1',
      JSON.stringify({
        idempotencyKey: 'student-earlier',
        content: 'Was ist eine Primzahl?',
        askedAt: new Date().toISOString(),
      }),
    )
    mockedProgress
      .mockResolvedValueOnce(state({ status: 'ai_running', steps: ['Schritt 1'] }))
      .mockResolvedValue(state({ status: 'completed', assistantMessageId: 'a-1' }))
    const { result, invalidated } = render()

    await waitFor(() => expect(result.current.isStreaming).toBe(true))
    // The server's ids, so the page shows its copy of the question, not a second one.
    expect(result.current.localMessages.map((message) => message.id)).toEqual([
      'student:c1:student-earlier',
      'assistant:c1:student-earlier',
    ])
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000)
    })

    await waitFor(() => expect(result.current.isStreaming).toBe(false))
    expect(mockedProgress.mock.calls.every((call) => call[2] === 'student-earlier')).toBe(true)
    expect(mockedStream).not.toHaveBeenCalled()
    expect(invalidated()).toBe(true)
    expect(sessionStorage.getItem('stoa_pending_chat_message:c1')).toBeNull()
  })

  it('stops waiting after a bounded time and offers the same message again', async () => {
    mockedStream.mockResolvedValue('accepted')
    mockedProgress.mockResolvedValue(state({ status: 'ai_running' }))
    const { result } = render()

    act(() => {
      void result.current.sendStreamingMessage({ content: 'Was ist 2 + 2?' })
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300_000)
    })

    await waitFor(() => expect(result.current.isStreaming).toBe(false))
    const failed = result.current.localMessages.find((message) => message.status === 'failed' && message.role === 'student')
    expect(failed).toBeDefined()
    const polls = mockedProgress.mock.calls.length
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000)
    })
    expect(mockedProgress.mock.calls.length).toBe(polls)
  })
})

function state(overrides: Partial<GenerationState> = {}): GenerationState {
  return {
    conversationId: 'c1',
    steps: [],
    updatedAt: future(),
    commandId: 'command-1',
    attempt: 1,
    status: null,
    assistantMessageId: null,
    failureCategory: null,
    retryable: null,
    ...overrides,
  }
}

function notFound() {
  return new ApiError('This message request is unavailable. Send it again.', {
    status: 409,
    code: 'message_command_not_found',
  })
}

function render() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const invalidate = vi.spyOn(client, 'invalidateQueries')
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  const { result } = renderHook(() => useStreamingChat('c1'), { wrapper: Wrapper })
  return { result, invalidated: () => invalidate.mock.calls.length > 0 }
}

async function failOnce(result: { current: ReturnType<typeof useStreamingChat> }) {
  act(() => {
    void result.current.sendStreamingMessage({ content: 'Was ist 2 + 2?' })
  })
  await act(async () => {
    await vi.advanceTimersByTimeAsync(3000)
  })
  await waitFor(() => expect(result.current.isStreaming).toBe(false))
}

function future() {
  return new Date(Date.now() + 60_000).toISOString()
}

describe('a message that is replaced before it ends', () => {
  afterEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
  })

  it('does not undo the waiting of the conversation opened next', async () => {
    // The first conversation's send request finishes only after the student
    // has moved on: it must not clear what the next conversation shows.
    let finishFirst: () => void = () => {}
    mockedStream.mockImplementationOnce(
      () => new Promise<StreamOutcome>((resolve) => {
        finishFirst = () => resolve('streamed')
      }),
    )
    sessionStorage.setItem(
      'stoa_pending_chat_message:c2',
      JSON.stringify({ idempotencyKey: 'key-c2', content: 'Frage', askedAt: new Date().toISOString() }),
    )
    mockedProgress.mockResolvedValue(state({ status: 'ai_running' }))
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const Wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    )
    const { result, rerender } = renderHook(({ id }) => useStreamingChat(id), {
      wrapper: Wrapper,
      initialProps: { id: 'c1' },
    })
    act(() => {
      void result.current.sendStreamingMessage({ content: 'Erste Frage' })
    })
    await waitFor(() => expect(mockedStream).toHaveBeenCalled())

    rerender({ id: 'c2' })
    await waitFor(() => expect(result.current.isStreaming).toBe(true))
    await act(async () => {
      finishFirst()
      await new Promise((resolve) => setTimeout(resolve, 50))
    })

    expect(result.current.isStreaming).toBe(true)
    expect(result.current.localMessages.map((message) => message.id)).toEqual([
      'student:c2:key-c2',
      'assistant:c2:key-c2',
    ])
  })

  it('does not leave an earlier attempt of the same message beside the retry', async () => {
    mockedStream.mockRejectedValueOnce(new Error('Streaming request failed with status 503'))
    mockedProgress.mockResolvedValue(
      state({ status: 'failed', failureCategory: 'deadline_exceeded', retryable: true }),
    )
    const { result } = render()
    act(() => {
      void result.current.sendStreamingMessage({ content: 'Was ist 2 + 2?' })
    })
    await waitFor(
      () =>
        expect(
          result.current.localMessages.some(
            (message) => message.role === 'student' && message.status === 'failed',
          ),
        ).toBe(true),
      { timeout: 3000 },
    )
    const failed = result.current.localMessages.find((message) => message.role === 'student')!

    mockedStream.mockImplementationOnce(() => new Promise<StreamOutcome>(() => {}))
    act(() => {
      result.current.retryMessage(failed.id)
    })
    await waitFor(() => expect(result.current.isStreaming).toBe(true))

    const ids = result.current.localMessages.map((message) => message.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids).toHaveLength(2)
  })
})

describe('the conversation shown', () => {
  const server = (id: string, role: 'student' | 'assistant') =>
    ({ id, conversationId: 'c1', role, content: id, createdAt: '2026-09-25T08:00:00Z', status: 'completed' }) as const

  it('shows a message the server holds once, as the server has it', () => {
    const merged = mergeWithServerMessages(
      [server('s-1', 'student')],
      [{ ...server('s-1', 'student'), status: 'sending' as const }, { ...server('a-1', 'assistant'), status: 'streaming' as const }],
    )

    expect(merged.map((message) => [message.id, message.status])).toEqual([
      ['s-1', 'completed'],
      ['a-1', 'streaming'],
    ])
  })

  it('keeps the local copy of a failed question, which carries its retry', () => {
    const merged = mergeWithServerMessages(
      [server('s-1', 'student')],
      [{ ...server('s-1', 'student'), status: 'failed' as const }],
    )

    expect(merged.map((message) => [message.id, message.status])).toEqual([['s-1', 'failed']])
  })
})
