/**
 * A renewal that cannot reach the server does not end the session (#214).
 *
 * `/auth/refresh` answering 503 (a deploy), the network dropping, or the ten
 * second timeout came back from the renewal as the same `null` as "no refresh
 * token", and the response interceptor signed the reader out on it: access
 * token and refresh token gone, off to /login, and the account menu's saved
 * entry with them (F7). The server had refused nothing.
 *
 * These go through the interceptor, not `refreshAccessToken` alone: the
 * renewal already said "unreachable", it was the caller that dropped it.
 */
import { http, HttpResponse } from 'msw'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { readBrowserSignIn } from '@/lib/tabAccount'
import { httpClient, SESSION_UNREACHABLE } from '@/services/api/httpClient'
import { rememberRefreshToken } from '@/services/auth/sessionRefresh'
import { TOKEN_KEY, useAuthStore } from '@/store/authStore'
import { mswServer } from '../mswServer'

const TAB_REFRESH = 'stoa_tab_refresh_token'

let refreshCalls = 0

beforeAll(() => mswServer.listen({ onUnhandledRequest: 'bypass' }))
afterAll(() => mswServer.close())
beforeEach(() => {
  refreshCalls = 0
  localStorage.clear()
  sessionStorage.clear()
  mswServer.use(
    http.get('https://api.test/things', () => HttpResponse.json({ detail: 'expired' }, { status: 401 })),
  )
})
afterEach(() => {
  mswServer.resetHandlers()
  vi.useRealTimers()
  vi.unstubAllGlobals()
  useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })
})

/** This tab is on session S, which the account menu holds too. */
function onSession() {
  sessionStorage.setItem(TOKEN_KEY, 's-access')
  rememberRefreshToken('s-refresh')
  localStorage.setItem('stoa_sign_in', JSON.stringify({ id: 's', accessToken: 's-access', refreshToken: 's-refresh' }))
  sessionStorage.setItem('stoa_tab_sign_in', 's')
  useAuthStore.setState({ accessToken: 's-access', isAuthenticated: true })
}

function stubLocation() {
  const assign = vi.fn()
  vi.stubGlobal('location', { ...window.location, pathname: '/', assign })
  return assign
}

function expectEverythingKept() {
  expect(sessionStorage.getItem(TOKEN_KEY)).toBe('s-access')
  expect(sessionStorage.getItem(TAB_REFRESH)).toBe('s-refresh')
  expect(readBrowserSignIn()).toMatchObject({ accessToken: 's-access', refreshToken: 's-refresh' })
  expect(useAuthStore.getState().accessToken).toBe('s-access')
}

const failures: Array<[string, () => void]> = [
  ['answers 503', () => {
    mswServer.use(http.post('https://api.test/auth/refresh', () => {
      refreshCalls += 1
      return HttpResponse.json({ detail: 'deploying' }, { status: 503 })
    }))
  }],
  ['answers 429', () => {
    mswServer.use(http.post('https://api.test/auth/refresh', () => {
      refreshCalls += 1
      return HttpResponse.json({ detail: 'slow down' }, { status: 429 })
    }))
  }],
  ['answers 200 with no access token', () => {
    mswServer.use(http.post('https://api.test/auth/refresh', () => {
      refreshCalls += 1
      return HttpResponse.json({})
    }))
  }],
  ['fails on the network', () => {
    mswServer.use(http.post('https://api.test/auth/refresh', () => {
      refreshCalls += 1
      return HttpResponse.error()
    }))
  }],
]

describe('in a tab on its account', () => {
  const setUp = onSession

  it.each(failures)('a refresh that %s keeps every token and stays off /login', async (_how, failRefresh) => {
    failRefresh()
    const assign = stubLocation()
    setUp()

    await expect(httpClient.get('/things')).rejects.toMatchObject({ code: SESSION_UNREACHABLE })

    expect(refreshCalls).toBe(1)
    expect(assign).not.toHaveBeenCalled()
    expectEverythingKept()
  })

  it('a refresh that times out keeps every token and stays off /login', async () => {
    // The refresh never answers; only the renewal's own ten-second timeout
    // ends it, by aborting the request.
    const realFetch = globalThis.fetch
    vi.stubGlobal('fetch', (input: RequestInfo | URL, init?: RequestInit) => {
      if (!String(input).endsWith('/auth/refresh')) return realFetch(input, init)
      refreshCalls += 1
      return new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))
      })
    })
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const assign = stubLocation()
    setUp()

    const request = httpClient.get('/things')
    const settled = request.then(() => 'fulfilled', (error: unknown) => error)
    await vi.waitFor(() => expect(refreshCalls).toBe(1))
    await vi.advanceTimersByTimeAsync(10_000)

    expect(await settled).toMatchObject({ code: SESSION_UNREACHABLE })
    expect(assign).not.toHaveBeenCalled()
    expectEverythingKept()
  })

  it('tries the renewal again on the next 401, and resumes once it answers', async () => {
    let up = false
    mswServer.use(
      http.get('https://api.test/things', ({ request }) =>
        request.headers.get('authorization') === 'Bearer s-access-2'
          ? HttpResponse.json({ ok: true })
          : HttpResponse.json({ detail: 'expired' }, { status: 401 })),
      http.post('https://api.test/auth/refresh', () => {
        refreshCalls += 1
        return up
          ? HttpResponse.json({ accessToken: 's-access-2', refreshToken: 's-refresh-2' })
          : HttpResponse.json({ detail: 'deploying' }, { status: 503 })
      }),
    )
    const assign = stubLocation()
    setUp()

    await expect(httpClient.get('/things')).rejects.toMatchObject({ code: SESSION_UNREACHABLE })
    up = true
    await expect(httpClient.get('/things')).resolves.toMatchObject({ data: { ok: true } })

    expect(refreshCalls).toBe(2)
    expect(assign).not.toHaveBeenCalled()
    expect(useAuthStore.getState().accessToken).toBe('s-access-2')
    expect(readBrowserSignIn()).toMatchObject({ accessToken: 's-access-2', refreshToken: 's-refresh-2' })
  })

  it('a refused refresh still ends the session', async () => {
    mswServer.use(http.post('https://api.test/auth/refresh', () => {
      refreshCalls += 1
      return HttpResponse.json({ detail: 'refused' }, { status: 401 })
    }))
    const assign = stubLocation()
    setUp()

    await expect(httpClient.get('/things')).rejects.not.toMatchObject({ code: SESSION_UNREACHABLE })

    expect(refreshCalls).toBe(1)
    expect(assign).toHaveBeenCalledWith('/login')
    // The refused token is gone from this tab.
    expect(sessionStorage.getItem(TAB_REFRESH)).toBeNull()
  })
})
