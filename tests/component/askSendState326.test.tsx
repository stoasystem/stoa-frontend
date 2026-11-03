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
import { mergeWithServerMessages, SEND_REQUEST_LIMIT_MS, useStreamingChat } from '@/hooks/chat/useStreamingChat'
import { AskServerProvider } from '@/features/ask/server/askServer'
import { clearPendingMessages, FAILED_MESSAGE_KEY_PREFIX } from '@/lib/pendingChatMessages'
import { chatQueryKeys } from '@/services/chat/chatQueryKeys'
import { commandMessageIds } from '@/services/chat/commandMessageIds'
import { useAuthStore } from '@/store/authStore'
import type { Conversation } from '@/types/chat'
import { createFakeAskServer, type FakeAskServer } from '../fakes/askServer'

/** The server behind Ask, in memory (#571): each test says how its messages are answered. */
let server: FakeAskServer
let mockedStream: FakeAskServer['stream']['streamConversationMessage']

/** A send request that never ends, and ignores its signal; the command reads as running unless said otherwise. */
const never = () => new Promise<never>(() => {})

const ACCESS = 'stoa_tab_access_token'
const REFRESH = 'stoa_tab_refresh_token'

function setup(initial = 'c1') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <AskServerProvider value={server}>{children}</AskServerProvider>
    </QueryClientProvider>
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
  // Refused, and its command read back as failed, to be sent again under the same key.
  server.answerWith({ refuse: new Error('Request failed with status code 503'), status: 'failed', retryable: true })
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
  server = createFakeAskServer()
  mockedStream = server.stream.streamConversationMessage
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
    // Held open, the command running, until the answer is in.
    server.answerWith({ until: new Promise<void>((resolve) => (finish = resolve)) })
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
    // Held open, the command running, until the answer is in.
    server.answerWith({ until: new Promise<void>((resolve) => (finish = resolve)) })
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

    server.answerWith({ outcome: 'streamed' })
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

    server.answerWith({ outcome: 'streamed' })
    await act(async () => {
      reopened.result.current.retryMessage!(failed!.id)
      await vi.advanceTimersByTimeAsync(100)
    })
    // The ids are worked out first (real SHA-1, off the fake clock): wait for the send itself.
    await waitFor(() => expect(mockedStream).toHaveBeenCalledTimes(2))
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

    server.answerWith({ until: never() })
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
    server.answerWith({ until: never() })
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
        ? [{ id: (await commandMessageIds('c1', key)).studentMessageId, conversationId: 'c1', role: 'student', content: 'Was ist eine Primzahl?', createdAt: '', status: 'completed' }]
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
    // The command ends while the request hangs.
    server.answerWith({ until: never(), status: 'completed' })
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
    server.answerWith({ until: never() })
    const { result } = setup()
    act(() => {
      void result.current.sendStreamingMessage({ content: 'Was ist 2 + 2?' })
    })
    // The ids are worked out first (real SHA-1, off the fake clock): the limit runs from the send.
    await waitFor(() => expect(mockedStream).toHaveBeenCalled())
    await act(async () => {
      await vi.advanceTimersByTimeAsync(SEND_REQUEST_LIMIT_MS + 1000)
    })
    expect(mockedStream.mock.calls[0][0].signal?.aborted).toBe(true)
    expect(result.current.isStreaming).toBe(true)

    const { idempotencyKey } = mockedStream.mock.calls[0][0].payload
    server.seed({ generations: [{ conversationId: 'c1', idempotencyKey, status: 'completed' }] })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(6000)
    })
    await waitFor(() => expect(result.current.isStreaming).toBe(false))
    expect(failedStudent(result)).toBeUndefined()
  })
})

// The independent audit of this change (#326) found these three.
describe('a failed message, after the audit', () => {
  it('is kept when the conversation is left while a stop is still asking the server (B1)', async () => {
    server.answerWith({ until: never() })
    const { result, client, rerender } = setup()
    act(() => {
      void result.current.sendStreamingMessage({ content: 'Was ist eine Primzahl?' })
    })
    await waitFor(() => expect(mockedStream).toHaveBeenCalled())
    // The read of the conversation that the stop waits for never comes back.
    vi.spyOn(client, 'invalidateQueries').mockImplementation(() => new Promise<void>(() => {}))

    await act(async () => {
      result.current.stopStreaming()
      await vi.advanceTimersByTimeAsync(50)
    })
    rerender({ id: 'c2' })
    rerender({ id: 'c1' })

    expect(failedStudent(result)?.content).toBe('Was ist eine Primzahl?')
  })

  it('is the server\u2019s once the server has answered it (B2)', async () => {
    const merged = mergeWithServerMessages(
      [
        { id: 's-1', conversationId: 'c1', role: 'student', content: 'Frage', createdAt: '', status: 'completed' },
        { id: 'a-1', conversationId: 'c1', role: 'assistant', content: 'Antwort', createdAt: '', status: 'completed' },
      ],
      [
        { id: 's-1', conversationId: 'c1', role: 'student' as const, content: 'Frage', createdAt: '', status: 'failed' as const, failedAnswerId: 'a-local' },
        { id: 'a-local', conversationId: 'c1', role: 'assistant' as const, content: 'failed', createdAt: '', status: 'failed' as const },
      ],
    )
    expect(merged.map((message) => [message.id, message.status])).toEqual([
      ['s-1', 'completed'],
      ['a-1', 'completed'],
    ])

    const { result, client } = setup()
    await failOnce(result)
    const failed = failedStudent(result)!
    client.setQueryData(chatQueryKeys.conversation('c1'), {
      id: 'c1', title: '', subject: 'math', grade: '', updatedAt: '',
      messages: [
        { ...failed, status: 'completed' },
        { id: 'a-late', conversationId: 'c1', role: 'assistant', content: '4', createdAt: '', status: 'completed' },
      ],
    } as Conversation)
    server.answerWith({ outcome: 'streamed' })
    await act(async () => {
      await result.current.sendStreamingMessage({ content: 'Und 3 + 3?' })
    })

    expect(failedStudent(result)).toBeUndefined()
    expect(Object.keys(sessionStorage).filter((key) => key.startsWith(FAILED_MESSAGE_KEY_PREFIX))).toEqual([])
  })

  it('stays on screen through a later answer when the tab cannot store it (B4)', async () => {
    const setItem = Storage.prototype.setItem
    const blocked = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key: string, value: string) {
      if (key.startsWith(FAILED_MESSAGE_KEY_PREFIX)) throw new DOMException('full', 'QuotaExceededError')
      setItem.call(this, key, value)
    })
    try {
      const { result } = setup()
      await failOnce(result)
      server.answerWith({ outcome: 'streamed' })
      await act(async () => {
        await result.current.sendStreamingMessage({ content: 'Und 3 + 3?' })
      })
      expect(failedStudent(result)?.content).toBe('Was ist 2 + 2?')
    } finally {
      blocked.mockRestore()
    }
  })
})
