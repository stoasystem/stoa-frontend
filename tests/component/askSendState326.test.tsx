/**
 * #326: where a message on its way stands in Ask. A renewal of the session
 * while it is asked does not lock the composer (S1); a message that did not go
 * through survives later answers, another conversation and closing Ask (K1);
 * sending it again while another message is on its way does not lose it (K2);
 * stopping only stops the waiting (K5); and a send request that hangs is let go
 * once the command has ended, or after a time limit (K6).
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/services/analytics/analyticsClient', () => ({ trackEvent: vi.fn() }))

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
import { SEND_REQUEST_LIMIT_MS, useStreamingChat } from '@/hooks/chat/useStreamingChat'
import { clearPendingMessages, FAILED_MESSAGE_KEY_PREFIX } from '@/lib/pendingChatMessages'
import { chatQueryKeys } from '@/services/chat/chatQueryKeys'
import { useAuthStore } from '@/store/authStore'
import type { Conversation } from '@/types/chat'

const mockedStream = vi.mocked(streamConversationMessage)
const mockedProgress = vi.mocked(getGenerationProgress)

const ACCESS = 'stoa_tab_access_token'
const REFRESH = 'stoa_tab_refresh_token'

function state(overrides: Partial<GenerationState> = {}): GenerationState {
  return {
    conversationId: 'c1',
    steps: [],
    updatedAt: new Date(Date.now() + 60_000).toISOString(),
    commandId: 'command-1',
    attempt: 1,
    status: null,
    assistantMessageId: null,
    failureCategory: null,
    retryable: null,
    ...overrides,
  }
}

function setup(initial = 'c1') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  const hook = renderHook(({ id }: { id: string | null }) => useStreamingChat(id), {
    wrapper: Wrapper,
    initialProps: { id: initial as string | null },
  })
  return { ...hook, client }
}

type Hook = { current: ReturnType<typeof useStreamingChat> }

const failedStudent = (result: Hook) =>
  result.current.localMessages.find((message) => message.role === 'student' && message.status === 'failed')

function signIn(id = 'student-a') {
  useAuthStore.setState({ user: { id, email: `${id}@test.stoaedu.ch`, name: id, role: 'student' } as never })
}

async function failOnce(result: Hook, content = 'Was ist 2 + 2?') {
  mockedStream.mockRejectedValueOnce(new Error('Request failed with status code 503'))
  mockedProgress.mockResolvedValue(state({ status: 'failed', failureCategory: 'deadline_exceeded', retryable: true }))
  act(() => {
    void result.current.sendStreamingMessage({ content })
  })
  await act(async () => {
    await vi.advanceTimersByTimeAsync(3000)
  })
  await waitFor(() => expect(result.current.isStreaming).toBe(false))
  expect(failedStudent(result)?.content).toBe(content)
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  signIn()
})

afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
  sessionStorage.clear()
  localStorage.clear()
  useAuthStore.setState({ user: null })
})

describe('S1: a session renewed while a question is asked', () => {
  it('gives the composer back once the answer is in', async () => {
    sessionStorage.setItem(ACCESS, 'token-a')
    sessionStorage.setItem(REFRESH, 'refresh-a')
    let finish: () => void = () => {}
    mockedStream.mockImplementationOnce(
      () => new Promise<StreamOutcome>((resolve) => {
        finish = () => resolve('streamed')
      }),
    )
    mockedProgress.mockResolvedValue(state({ status: 'ai_running' }))
    const { result } = setup()
    act(() => {
      void result.current.sendStreamingMessage({ content: 'Was ist eine Primzahl?' })
    })
    await waitFor(() => expect(mockedStream).toHaveBeenCalled())

    // The access token runs out and is renewed: same session, new token.
    sessionStorage.setItem(ACCESS, 'token-a2')
    await act(async () => {
      finish()
      await vi.advanceTimersByTimeAsync(50)
    })

    await waitFor(() => expect(result.current.isStreaming).toBe(false))
    expect(sessionStorage.getItem('stoa_pending_chat_message:c1')).toBeNull()
  })

  it('gives the composer back, and shows nothing of the question, once another account holds the tab', async () => {
    sessionStorage.setItem(ACCESS, 'token-a')
    sessionStorage.setItem(REFRESH, 'refresh-a')
    let finish: () => void = () => {}
    mockedStream.mockImplementationOnce(
      () => new Promise<StreamOutcome>((resolve) => {
        finish = () => resolve('streamed')
      }),
    )
    mockedProgress.mockResolvedValue(state({ status: 'ai_running' }))
    const { result } = setup()
    act(() => {
      void result.current.sendStreamingMessage({ content: "A's question" })
    })
    await waitFor(() => expect(mockedStream).toHaveBeenCalled())

    clearPendingMessages()
    sessionStorage.setItem(ACCESS, 'token-b')
    sessionStorage.setItem(REFRESH, 'refresh-b')
    await act(async () => {
      finish()
      await vi.advanceTimersByTimeAsync(50)
    })

    await waitFor(() => expect(result.current.isStreaming).toBe(false))
    expect(result.current.localMessages).toEqual([])
  })
})

describe('K1: a message that did not go through', () => {
  it('stays, with its retry, after a later question is answered', async () => {
    const { result } = setup()
    await failOnce(result)

    mockedStream.mockResolvedValueOnce('streamed')
    await act(async () => {
      await result.current.sendStreamingMessage({ content: 'Und 3 + 3?' })
    })

    expect(failedStudent(result)?.retryPayload?.content).toBe('Was ist 2 + 2?')
  })

  it('stays across another conversation and closing Ask', async () => {
    const { result, rerender, unmount } = setup()
    await failOnce(result)

    rerender({ id: 'c2' })
    expect(failedStudent(result)).toBeUndefined()
    rerender({ id: 'c1' })
    expect(failedStudent(result)?.content).toBe('Was ist 2 + 2?')

    unmount()
    const reopened = setup()
    const failed = failedStudent(reopened.result)
    expect(failed?.retryPayload?.idempotencyKey).toBeDefined()
    // The failure in words stands in the answer's place again.
    expect(reopened.result.current.localMessages.map((message) => [message.role, message.status])).toEqual([
      ['student', 'failed'],
      ['assistant', 'failed'],
    ])

    mockedStream.mockResolvedValueOnce('streamed')
    await act(async () => {
      reopened.result.current.retryMessage!(failed!.id)
      await vi.advanceTimersByTimeAsync(100)
    })
    const keys = mockedStream.mock.calls.map((call) => call[0].payload.idempotencyKey)
    expect(keys).toHaveLength(2)
    expect(keys[1]).toBe(keys[0])
    // Sent again and answered: no longer kept.
    expect(Object.keys(sessionStorage).filter((key) => key.startsWith(FAILED_MESSAGE_KEY_PREFIX))).toEqual([])
  })

  it('is shown only to the account that wrote it, and goes with signing out', async () => {
    const { result, unmount } = setup()
    await failOnce(result)
    unmount()

    signIn('student-b')
    expect(failedStudent(setup().result)).toBeUndefined()

    signIn('student-a')
    clearPendingMessages()
    expect(failedStudent(setup().result)).toBeUndefined()
  })
})

describe('K2: sending a failed message again while another is on its way', () => {
  it('neither offers it nor loses it', async () => {
    const { result } = setup()
    await failOnce(result)
    const failed = failedStudent(result)!
    const staleRetry = result.current.retryMessage!

    mockedStream.mockImplementationOnce(() => new Promise<StreamOutcome>(() => {}))
    mockedProgress.mockResolvedValue(state({ status: 'ai_running' }))
    act(() => {
      void result.current.sendStreamingMessage({ content: 'Und 3 + 3?' })
    })
    await waitFor(() => expect(result.current.isStreaming).toBe(true))
    expect(result.current.retryMessage).toBeUndefined()

    act(() => staleRetry(failed.id))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100)
    })

    expect(failedStudent(result)?.id).toBe(failed.id)
    expect(mockedStream).toHaveBeenCalledTimes(2)
  })
})

describe('K5: stopping', () => {
  async function sendAndStop(serverHasIt: boolean) {
    mockedStream.mockImplementationOnce(() => new Promise<StreamOutcome>(() => {}))
    mockedProgress.mockResolvedValue(state({ status: 'ai_running' }))
    const { result, client } = setup()
    act(() => {
      void result.current.sendStreamingMessage({ content: 'Was ist eine Primzahl?' })
    })
    await waitFor(() => expect(mockedStream).toHaveBeenCalled())
    const key = mockedStream.mock.calls[0][0].payload.idempotencyKey
    const conversation = {
      id: 'c1',
      title: '',
      subject: 'math',
      grade: '',
      updatedAt: '',
      messages: serverHasIt
        ? [{ id: `student:c1:${key}`, conversationId: 'c1', role: 'student', content: 'Was ist eine Primzahl?', createdAt: '', status: 'completed' }]
        : [],
    } as Conversation
    client.setQueryData(chatQueryKeys.conversation('c1'), conversation)

    await act(async () => {
      result.current.stopStreaming()
      await vi.advanceTimersByTimeAsync(50)
    })
    await waitFor(() => expect(result.current.isStreaming).toBe(false))
    return { result, key }
  }

  it('does not call a question the server does not have sent', async () => {
    const { result, key } = await sendAndStop(false)

    const student = result.current.localMessages.find((message) => message.role === 'student')
    expect(student?.status).toBe('failed')
    expect(student?.retryPayload?.idempotencyKey).toBe(key)
  })

  it('leaves a question the server has to the server, its answer still to come', async () => {
    const { result } = await sendAndStop(true)

    expect(result.current.localMessages.map((message) => [message.role, message.status])).toEqual([
      ['assistant', 'stopped'],
    ])
  })
})

describe('K6: a send request that hangs', () => {
  it('is let go once the command has ended', async () => {
    // A request that never ends and ignores its signal.
    mockedStream.mockImplementationOnce(() => new Promise<StreamOutcome>(() => {}))
    mockedProgress.mockResolvedValue(state({ status: 'completed', assistantMessageId: 'a-1' }))
    const { result } = setup()
    act(() => {
      void result.current.sendStreamingMessage({ content: 'Was ist 2 + 2?' })
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500)
    })

    await waitFor(() => expect(result.current.isStreaming).toBe(false))
    expect(mockedStream.mock.calls[0][0].signal?.aborted).toBe(true)
    expect(result.current.localMessages).toEqual([])
  })

  it('is let go after the time limit, and the command is still waited for', async () => {
    mockedStream.mockImplementationOnce(() => new Promise<StreamOutcome>(() => {}))
    let answered = false
    mockedProgress.mockImplementation(async () =>
      state({ status: answered ? 'completed' : 'ai_running' }),
    )
    const { result } = setup()
    act(() => {
      void result.current.sendStreamingMessage({ content: 'Was ist 2 + 2?' })
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(SEND_REQUEST_LIMIT_MS + 1000)
    })
    expect(mockedStream.mock.calls[0][0].signal?.aborted).toBe(true)
    expect(result.current.isStreaming).toBe(true)

    answered = true
    await act(async () => {
      await vi.advanceTimersByTimeAsync(6000)
    })
    await waitFor(() => expect(result.current.isStreaming).toBe(false))
    expect(failedStudent(result)).toBeUndefined()
  })
})
