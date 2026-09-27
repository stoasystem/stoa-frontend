import { QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { delay, http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom'
import { AxiosError } from 'axios'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { queryClient } from '@/app/query/queryClient'
import { UPLOAD_HANDOFF_STORAGE_KEY } from '@/features/uploads/utils/uploadHandoff'
import { useSignOut } from '@/hooks/auth/useSignOut'
import { useCreateConversationMutation } from '@/hooks/chat/useCreateConversationMutation'
import { TAB_TOKEN_KEY } from '@/lib/devSessions'
import { httpClient } from '@/services/api/httpClient'
import { getConversations } from '@/services/chat/chatApi'
import { chatQueryKeys } from '@/services/chat/chatQueryKeys'
import { LOGOUT_TIMEOUT_MS } from '@/services/auth/authApi'
import { logger } from '@/services/logging/logger'
import { type CurrentUser, TOKEN_KEY, useAuthStore } from '@/store/authStore'
import { mswServer } from '../mswServer'

// Each test wraps the store's own action, never an earlier test's spy.
const storeClearAuth = useAuthStore.getState().clearAuth

const studentAConversations = {
  items: [{ id: 'conv-a', title: "A's question", subject: 'math', updatedAt: '2026-09-27T10:00:00Z' }],
}

type LogoutAnswer = 'ok' | 'network-error' | 'hang' | 500 | 401

// Every body the backend was sent.
function answerLogout(answer: LogoutAnswer): unknown[] {
  const bodies: unknown[] = []
  mswServer.use(
    http.post('https://api.test/auth/logout', async ({ request }) => {
      bodies.push(await request.json())
      if (answer === 'ok') return new HttpResponse(null, { status: 204 })
      if (answer === 'network-error') return HttpResponse.error()
      if (answer === 'hang') {
        await delay('infinite')
        return new HttpResponse(null, { status: 204 })
      }
      return HttpResponse.json({ detail: { code: 'refused', message: 'refused' } }, { status: answer })
    }),
  )
  return bodies
}

// A request of student A's that finishes when the test says so.
function gate() {
  let open!: () => void
  const opened = new Promise<void>((resolve) => {
    open = resolve
  })
  return { opened, open }
}

// Arrived at /chat from /home, so Back after signing out shows whether the
// /chat entry was replaced or merely pushed over.
function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/home', '/chat']} initialIndex={1}>
        {children}
      </MemoryRouter>
    </QueryClientProvider>
  )
}

function renderSignedIn() {
  localStorage.setItem(TOKEN_KEY, 'shared-token')
  const clearAuth = vi.fn(storeClearAuth)
  useAuthStore.setState({
    user: { id: 'u-a', name: 'Ada', email: 'ada@example.com', role: 'student' } as CurrentUser,
    accessToken: 'shared-token',
    isAuthenticated: true,
    clearAuth,
  })
  const { result } = renderHook(
    () => ({
      ...useSignOut(),
      pathname: useLocation().pathname,
      navigate: useNavigate(),
      createConversation: useCreateConversationMutation(),
    }),
    { wrapper },
  )
  return { result, clearAuth }
}

function expectSignedOutHere() {
  expect(useAuthStore.getState().isAuthenticated).toBe(false)
  expect(useAuthStore.getState().user).toBeNull()
  expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
  expect(sessionStorage.getItem(TAB_TOKEN_KEY)).toBeNull()
}

// On /login, and Back skips the page that was signed out of.
function expectLeftForLogin(result: ReturnType<typeof renderSignedIn>['result']) {
  expect(result.current.pathname).toBe('/login')
  act(() => result.current.navigate(-1))
  expect(result.current.pathname).toBe('/home')
}

// The shared sign-out every account menu calls (stoasystem/stoa-frontend#19):
// clear this device and leave at once, then tell the backend without waiting.
describe('useSignOut', () => {
  beforeAll(() => mswServer.listen({ onUnhandledRequest: 'error' }))
  afterEach(() => {
    vi.useRealTimers()
    mswServer.resetHandlers()
    useAuthStore.setState({ clearAuth: storeClearAuth })
    queryClient.clear()
    vi.restoreAllMocks()
  })
  afterAll(() => mswServer.close())
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it('posts the shared token it read before clearing, and logs ok', async () => {
    const info = vi.spyOn(logger, 'info')
    const bodies = answerLogout('ok')
    const { result, clearAuth } = renderSignedIn()

    await act(() => result.current.signOut())

    expect(bodies).toEqual([{ access_token: 'shared-token' }])
    expect(info).toHaveBeenCalledWith('Backend logout confirmed', { outcome: 'ok' })
    expect(clearAuth).toHaveBeenCalledOnce()
    expectSignedOutHere()
    expectLeftForLogin(result)
  })

  it('posts the token a pinned tab holds, not the one the browser shares', async () => {
    const bodies = answerLogout('ok')
    const { result } = renderSignedIn()
    sessionStorage.setItem(TAB_TOKEN_KEY, 'tab-token')

    await act(() => result.current.signOut())

    expect(bodies).toEqual([{ access_token: 'tab-token' }])
    expectSignedOutHere()
  })

  it('empties the query cache, so the next person on this tab is not served these answers', async () => {
    answerLogout('ok')
    const { result } = renderSignedIn()
    queryClient.setQueryData(chatQueryKeys.conversations(), studentAConversations)

    await act(() => result.current.signOut())

    expect(queryClient.getQueryData(chatQueryKeys.conversations())).toBeUndefined()
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0)
  })

  it('drops a query of the signed-out person that answers only after sign-out', async () => {
    answerLogout('ok')
    const late = gate()
    const served = gate()
    mswServer.use(
      http.get('https://api.test/conversations', async () => {
        served.open()
        await late.opened
        return HttpResponse.json(studentAConversations)
      }),
    )
    const { result } = renderSignedIn()
    void queryClient.prefetchQuery({ queryKey: chatQueryKeys.conversations(), queryFn: getConversations })
    await served.opened

    await act(() => result.current.signOut())
    late.open()
    await act(() => delay(50))

    expect(queryClient.getQueryData(chatQueryKeys.conversations())).toBeUndefined()
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0)
  })

  it('drops a mutation of the signed-out person that succeeds only after sign-out', async () => {
    answerLogout('ok')
    const late = gate()
    const served = gate()
    mswServer.use(
      http.post('https://api.test/conversations', async () => {
        served.open()
        await late.opened
        return HttpResponse.json({
          id: 'conv-a',
          title: "A's question",
          subject: 'math',
          updatedAt: '2026-09-27T10:00:00Z',
          messages: [],
        })
      }),
    )
    const { result } = renderSignedIn()
    act(() => result.current.createConversation.mutate({ subject: 'math' } as never))
    await served.opened

    await act(() => result.current.signOut())
    late.open()
    await waitFor(() => expect(result.current.createConversation.isError).toBe(true))

    expect(queryClient.getQueryData(chatQueryKeys.conversations())).toBeUndefined()
    expect(queryClient.getQueryData(chatQueryKeys.conversation('conv-a'))).toBeUndefined()
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0)
  })

  it('has cleared this device and left for /login before the backend answers', async () => {
    const bodies = answerLogout('hang')
    const { result } = renderSignedIn()

    act(() => void result.current.signOut())

    expectSignedOutHere()
    expect(result.current.pathname).toBe('/login')
    await waitFor(() => expect(bodies).toEqual([{ access_token: 'shared-token' }]))
    expect(result.current.isSigningOut).toBe(true)
  })

  it('gives up on a backend that hangs after 8 seconds, logging a timeout', async () => {
    // Under MSW, jsdom's XMLHttpRequest is not sent on while the handler still
    // hangs, so its own timeout never fires. Axios's fetch adapter applies the
    // same request timeout with its own timer, which the fake clock drives.
    vi.spyOn(httpClient.defaults, 'adapter', 'get').mockReturnValue('fetch')
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const warn = vi.spyOn(logger, 'warn')
    const bodies = answerLogout('hang')
    const { result } = renderSignedIn()

    let settled = false
    act(() => {
      void result.current.signOut().then(() => {
        settled = true
      })
    })
    expectSignedOutHere()
    await waitFor(() => expect(bodies).toHaveLength(1))

    await act(() => vi.advanceTimersByTimeAsync(LOGOUT_TIMEOUT_MS - 1000))
    expect(settled).toBe(false)
    await act(() => vi.advanceTimersByTimeAsync(1000))
    await waitFor(() => expect(settled).toBe(true))

    expect(LOGOUT_TIMEOUT_MS).toBe(8000)
    expect(warn).toHaveBeenCalledExactlyOnceWith('Backend logout not confirmed; signed out locally', {
      outcome: 'timeout',
    })
    expect(result.current.isSigningOut).toBe(false)
    expectSignedOutHere()
    expectLeftForLogin(result)
  })

  it('logs a timeout as a timeout on the XHR path the browser takes', async () => {
    // The fetch adapter above always says ETIMEDOUT. The XHR adapter production
    // uses says so only when asked, and ECONNABORTED otherwise
    // (axios/lib/adapters/xhr.js, request.ontimeout). This stand-in answers the
    // way it does, so dropping the request's clarifyTimeoutError shows up here.
    vi.spyOn(httpClient.defaults, 'adapter', 'get').mockReturnValue((config) =>
      Promise.reject(
        new AxiosError(
          `timeout of ${config.timeout}ms exceeded`,
          config.transitional?.clarifyTimeoutError ? AxiosError.ETIMEDOUT : AxiosError.ECONNABORTED,
          config,
        ),
      ),
    )
    const warn = vi.spyOn(logger, 'warn')
    const { result } = renderSignedIn()

    await act(() => result.current.signOut())

    expect(warn).toHaveBeenCalledExactlyOnceWith('Backend logout not confirmed; signed out locally', {
      outcome: 'timeout',
    })
    expectSignedOutHere()
  })

  it.each([
    ['network-error', { outcome: 'network', transportCode: 'ERR_NETWORK' }],
    [500, { outcome: 'http', status: 500 }],
    [401, { outcome: 'http', status: 401 }],
  ] as const)(
    'still signs out here when the backend call fails (%s), logging how',
    async (answer, logged) => {
      const warn = vi.spyOn(logger, 'warn')
      const bodies = answerLogout(answer)
      const { result, clearAuth } = renderSignedIn()

      await act(() => result.current.signOut())

      expect(bodies).toEqual([{ access_token: 'shared-token' }])
      expect(warn).toHaveBeenCalledExactlyOnceWith('Backend logout not confirmed; signed out locally', logged)
      expect(clearAuth).toHaveBeenCalledOnce()
      expectSignedOutHere()
      expectLeftForLogin(result)
    },
  )

  it('runs once for a double click', async () => {
    const bodies = answerLogout('ok')
    const { result, clearAuth } = renderSignedIn()

    await act(async () => {
      const first = result.current.signOut()
      const second = result.current.signOut()
      await Promise.all([first, second])
    })

    expect(bodies).toHaveLength(1)
    expect(clearAuth).toHaveBeenCalledOnce()
  })

  it('forgets what the signed-out person left behind for the next one', async () => {
    answerLogout('ok')
    const { result } = renderSignedIn()
    sessionStorage.setItem(UPLOAD_HANDOFF_STORAGE_KEY, JSON.stringify({ prompt: "A's question" }))
    localStorage.setItem('stoa_role_switcher', 'on')
    localStorage.setItem(
      'stoa_dev_sessions',
      JSON.stringify([
        { email: 'ada@example.com', role: 'student', name: 'Ada', accessToken: 'shared-token', savedAt: '' },
        { email: 'pa@example.com', role: 'parent', name: 'Pa', accessToken: 'parent-token', savedAt: '' },
      ]),
    )

    await act(() => result.current.signOut())

    expect(sessionStorage.getItem(UPLOAD_HANDOFF_STORAGE_KEY)).toBeNull()
    // The signed-out session goes; another role held on purpose stays.
    expect(JSON.parse(localStorage.getItem('stoa_dev_sessions') ?? '[]')).toEqual([
      expect.objectContaining({ email: 'pa@example.com', accessToken: 'parent-token' }),
    ])
  })
})
