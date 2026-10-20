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
import { TAB_TOKEN_KEY } from '@/lib/tabAccount'
import { CHECKOUT_OPERATION_STORAGE_KEY } from '@/services/billing/billingApi'
import { httpClient } from '@/services/api/httpClient'
import { getConversations } from '@/services/chat/chatApi'
import { chatQueryKeys } from '@/services/chat/chatQueryKeys'
import { LOGOUT_TIMEOUT_MS } from '@/services/auth/authApi'
import { TAB_REFRESH_KEY } from '@/services/auth/sessionRefresh'
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
  sessionStorage.setItem(TOKEN_KEY, 'shared-token')
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
  expect(sessionStorage.getItem(TOKEN_KEY)).toBeNull()
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
    const late = gate()
    const bodies: unknown[] = []
    mswServer.use(http.post('https://api.test/auth/logout', async ({ request }) => {
      bodies.push(await request.json())
      await late.opened
      return new HttpResponse(null, { status: 204 })
    }))
    const { result } = renderSignedIn()
    let pending!: Promise<void>
    act(() => { pending = result.current.signOut() })

    try {
      expectSignedOutHere()
      expect(result.current.pathname).toBe('/login')
      await waitFor(() => expect(bodies).toEqual([{ access_token: 'shared-token' }]))
      expect(result.current.isSigningOut).toBe(true)
    } finally {
      await act(async () => { late.open(); await pending })
    }
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
    sessionStorage.setItem(
      CHECKOUT_OPERATION_STORAGE_KEY,
      JSON.stringify({ idempotencyKey: 'key-of-a-checkout', checkoutRef: 'ref-a' }),
    )
    sessionStorage.setItem('stoa_analytics_session_id', 'analytics-session-of-a')
    localStorage.setItem('stoa_role_switcher', 'on')
    localStorage.setItem('stoa_sign_in', JSON.stringify({ id: 'sign-in-a', accessToken: 'shared-token' }))
    sessionStorage.setItem('stoa_tab_sign_in', 'sign-in-a')
    localStorage.setItem(
      'stoa_test_roles',
      JSON.stringify([
        { email: 'ada@test.stoaedu.ch', role: 'student', name: 'Ada', accessToken: 'shared-token', savedAt: '' },
        { email: 'pa@test.stoaedu.ch', role: 'parent', name: 'Pa', accessToken: 'parent-token', savedAt: '' },
      ]),
    )

    await act(() => result.current.signOut())

    expect(sessionStorage.getItem(UPLOAD_HANDOFF_STORAGE_KEY)).toBeNull()
    // B's billing page would poll A's checkout, and refuse B's own (#34).
    expect(sessionStorage.getItem(CHECKOUT_OPERATION_STORAGE_KEY)).toBeNull()
    // The next person's events start an analytics session of their own.
    expect(sessionStorage.getItem('stoa_analytics_session_id')).toBeNull()
    // The browser's sign-in ends with it, so the other tabs sign out (#320).
    expect(localStorage.getItem('stoa_sign_in')).toBeNull()
    // A test role the switcher held for this sign-in goes; another held role
    // stays (#34 decided to keep them).
    expect(JSON.parse(localStorage.getItem('stoa_test_roles') ?? '[]')).toEqual([
      expect.objectContaining({ email: 'pa@test.stoaedu.ch', accessToken: 'parent-token' }),
    ])
  })

  // stoasystem/stoa-frontend#399: a page left idle for over an hour holds an
  // access token that has run out. The backend refuses to sign it out and
  // records nothing, while the refresh token beside it stays good for 30 days.
  describe('with an access token that has run out', () => {
    type RefreshAnswer = 'renewed' | 'rotated' | 'network-error' | 401

    // The logout refuses the token the tab held and accepts a fresh one as told;
    // the refresh answers as told. Every body each endpoint was sent, in order.
    function answerExpired({
      refused = 401,
      refresh = 'renewed',
      freshLogout = 204,
      refreshGate,
    }: {
      refused?: 401 | 403
      refresh?: RefreshAnswer
      freshLogout?: 204 | 401 | 500
      refreshGate?: Promise<void>
    } = {}) {
      const logouts: unknown[] = []
      const refreshes: unknown[] = []
      mswServer.use(
        http.post('https://api.test/auth/logout', async ({ request }) => {
          const body = (await request.json()) as { access_token: string }
          logouts.push(body)
          if (body.access_token === 'shared-token') {
            return HttpResponse.json({ detail: { code: 'token_expired', message: 'expired' } }, { status: refused })
          }
          return new HttpResponse(null, { status: freshLogout })
        }),
        http.post('https://api.test/auth/refresh', async ({ request }) => {
          refreshes.push(await request.json())
          await refreshGate
          if (refresh === 'network-error') return HttpResponse.error()
          if (refresh === 401) return HttpResponse.json({ detail: 'refused' }, { status: 401 })
          return HttpResponse.json({
            accessToken: 'fresh-token',
            ...(refresh === 'rotated' ? { refreshToken: 'rotated-refresh' } : {}),
          })
        }),
      )
      return { logouts, refreshes }
    }

    function renderSignedInWithRefresh() {
      sessionStorage.setItem(TAB_REFRESH_KEY, 'refresh-a')
      return renderSignedIn()
    }

    // Every value this browser keeps, to show no credential stayed behind.
    function everythingStored(): string {
      const values: string[] = []
      for (const storage of [sessionStorage, localStorage]) {
        for (let index = 0; index < storage.length; index += 1) {
          values.push(storage.getItem(storage.key(index) ?? '') ?? '')
        }
      }
      return values.join('\n')
    }

    it.each([401, 403] as const)(
      'spends the refresh token once and signs the fresh token out when the logout is refused (%s)',
      async (refused) => {
        const info = vi.spyOn(logger, 'info')
        const warn = vi.spyOn(logger, 'warn')
        const { logouts, refreshes } = answerExpired({ refused })
        const { result, clearAuth } = renderSignedInWithRefresh()

        await act(() => result.current.signOut())

        expect(logouts).toEqual([{ access_token: 'shared-token' }, { access_token: 'fresh-token' }])
        expect(refreshes).toEqual([{ refresh_token: 'refresh-a' }])
        expect(info).toHaveBeenCalledWith('Backend logout confirmed', { outcome: 'ok', afterRefresh: true })
        expect(warn).not.toHaveBeenCalled()
        expect(clearAuth).toHaveBeenCalledOnce()
        expectSignedOutHere()
        expectLeftForLogin(result)
      },
    )

    it('keeps the fresh tokens out of this tab, the browser and the log', async () => {
      const logged = [vi.spyOn(logger, 'info'), vi.spyOn(logger, 'warn'), vi.spyOn(logger, 'error')]
      const { logouts } = answerExpired({ refresh: 'rotated' })
      const { result } = renderSignedInWithRefresh()

      await act(() => result.current.signOut())

      expect(logouts).toHaveLength(2)
      expect(everythingStored()).not.toMatch(/fresh-token|rotated-refresh|refresh-a|shared-token/)
      expect(sessionStorage.getItem(TAB_REFRESH_KEY)).toBeNull()
      expect(useAuthStore.getState().accessToken).toBeNull()
      expect(JSON.stringify(logged.map((spy) => spy.mock.calls))).not.toMatch(/fresh-token|rotated-refresh|refresh-a/)
    })

    it('has cleared this tab and left for /login while the refresh is still out', async () => {
      const late = gate()
      const { logouts, refreshes } = answerExpired({ refreshGate: late.opened })
      const { result } = renderSignedInWithRefresh()
      let pending!: Promise<void>
      act(() => { pending = result.current.signOut() })

      try {
        expectSignedOutHere()
        expect(sessionStorage.getItem(TAB_REFRESH_KEY)).toBeNull()
        expect(result.current.pathname).toBe('/login')
        await waitFor(() => expect(refreshes).toHaveLength(1))
        expect(logouts).toEqual([{ access_token: 'shared-token' }])
        expect(result.current.isSigningOut).toBe(true)
      } finally {
        await act(async () => { late.open(); await pending })
      }
      expect(logouts).toEqual([{ access_token: 'shared-token' }, { access_token: 'fresh-token' }])
      expect(result.current.isSigningOut).toBe(false)
      expectSignedOutHere()
    })

    it('logs a token that is still good out once, never spending the refresh token', async () => {
      const bodies = answerLogout('ok')
      const refreshes: unknown[] = []
      mswServer.use(http.post('https://api.test/auth/refresh', async ({ request }) => {
        refreshes.push(await request.json())
        return HttpResponse.json({ accessToken: 'fresh-token' })
      }))
      const { result } = renderSignedInWithRefresh()

      await act(() => result.current.signOut())

      expect(bodies).toEqual([{ access_token: 'shared-token' }])
      expect(refreshes).toEqual([])
    })

    // Only a refusal says the access token can no longer name its sign-in. A
    // logout that failed may well have ended it; the refresh token stays unspent.
    it.each(['network-error', 500] as const)(
      'does not spend the refresh token when the logout fails without refusing (%s)',
      async (answer) => {
        const bodies = answerLogout(answer)
        const refreshes: unknown[] = []
        mswServer.use(http.post('https://api.test/auth/refresh', async ({ request }) => {
          refreshes.push(await request.json())
          return HttpResponse.json({ accessToken: 'fresh-token' })
        }))
        const { result } = renderSignedInWithRefresh()

        await act(() => result.current.signOut())

        expect(bodies).toEqual([{ access_token: 'shared-token' }])
        expect(refreshes).toEqual([])
        expectSignedOutHere()
      },
    )

    it('does not spend the refresh token when the logout times out', async () => {
      // The XHR stand-in from the timeout test above: no request leaves, the
      // logout reports a timeout, and any refresh would reach MSW unhandled.
      vi.spyOn(httpClient.defaults, 'adapter', 'get').mockReturnValue((config) =>
        Promise.reject(new AxiosError(`timeout of ${config.timeout}ms exceeded`, AxiosError.ETIMEDOUT, config)),
      )
      const refreshes: unknown[] = []
      mswServer.use(http.post('https://api.test/auth/refresh', async ({ request }) => {
        refreshes.push(await request.json())
        return HttpResponse.json({ accessToken: 'fresh-token' })
      }))
      const warn = vi.spyOn(logger, 'warn')
      const { result } = renderSignedInWithRefresh()

      await act(() => result.current.signOut())

      expect(refreshes).toEqual([])
      expect(warn).toHaveBeenCalledExactlyOnceWith('Backend logout not confirmed; signed out locally', {
        outcome: 'timeout',
      })
    })

    it('sends nothing more for a refused logout when the tab holds no refresh token', async () => {
      const warn = vi.spyOn(logger, 'warn')
      const { logouts, refreshes } = answerExpired()
      const { result } = renderSignedIn()

      await act(() => result.current.signOut())

      expect(logouts).toEqual([{ access_token: 'shared-token' }])
      expect(refreshes).toEqual([])
      expect(warn).toHaveBeenCalledExactlyOnceWith('Backend logout not confirmed; signed out locally', {
        outcome: 'http',
        status: 401,
      })
    })

    it.each([
      ['the refresh is refused', { refresh: 401 }, 1, 'refresh-refused'],
      ['the refresh cannot be reached', { refresh: 'network-error' }, 1, 'refresh-unreachable'],
      ['the fresh token\'s logout fails', { freshLogout: 500 }, 2, 'logout-failed'],
      ['the fresh token\'s logout is refused', { freshLogout: 401 }, 2, 'logout-refused'],
    ] as const)('ends quietly, signed out here, when %s', async (_, answers, logoutsSent, afterRefresh) => {
      const warn = vi.spyOn(logger, 'warn')
      const error = vi.spyOn(logger, 'error')
      const { logouts, refreshes } = answerExpired(answers)
      const { result } = renderSignedInWithRefresh()

      await act(() => result.current.signOut())

      expect(refreshes).toEqual([{ refresh_token: 'refresh-a' }])
      expect(logouts).toHaveLength(logoutsSent)
      expect(warn).toHaveBeenCalledExactlyOnceWith('Backend logout not confirmed; signed out locally', {
        outcome: 'http',
        status: 401,
        afterRefresh,
      })
      expect(error).not.toHaveBeenCalled()
      expect(result.current.isSigningOut).toBe(false)
      expectSignedOutHere()
      expectLeftForLogin(result)
    })
  })
})
