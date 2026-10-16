/**
 * A renewal that cannot reach the server does not end the session (#214).
 *
 * `/auth/refresh` answering 503 (a deploy), the network dropping, or the ten
 * second timeout came back from the renewal as the same `null` as "no refresh
 * token", and the response interceptor signed the reader out on it: access
 * token and refresh token gone, off to /login. In a tab pinned to the shared
 * account it took the shared refresh token with it, so every tab lost the
 * longer session (F7). The server had refused nothing.
 *
 * These go through the interceptor, not `refreshAccessToken` alone: the
 * renewal already said "unreachable", it was the caller that dropped it.
 */
import { http, HttpResponse } from 'msw'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { pinTabToSession, readSessions, rememberSession, TAB_TOKEN_KEY } from '@/lib/devSessions'
import { httpClient, SESSION_UNREACHABLE } from '@/services/api/httpClient'
import { rememberRefreshToken } from '@/services/auth/sessionRefresh'
import { TOKEN_KEY, useAuthStore } from '@/store/authStore'
import { mswServer } from '../mswServer'

const SHARED_REFRESH = 'stoa_refresh_token'
const TAB_REFRESH = 'stoa_tab_refresh_token'
const HELD = { email: 'reader@test.stoaedu.ch', role: 'student', name: 'Reader' }

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

/** This tab shares the browser's session S, which the account menu holds too. */
function onShared() {
  localStorage.setItem(TOKEN_KEY, 's-access')
  rememberRefreshToken('s-refresh')
  rememberSession({ ...HELD, accessToken: 's-access', refreshToken: 's-refresh' })
  useAuthStore.setState({ accessToken: 's-access', isAuthenticated: true })
}

/**
 * This tab picked the shared account in the account menu: it is pinned to S,
 * and the switcher copied S's own refresh token into the tab.
 */
function pinnedToShared() {
  onShared()
  pinTabToSession('s-access')
  rememberRefreshToken('s-refresh')
  useAuthStore.setState({ accessToken: 's-access', isAuthenticated: true })
}

function stubLocation() {
  const assign = vi.fn()
  vi.stubGlobal('location', { ...window.location, pathname: '/', assign })
  return assign
}

function expectEverythingKept(pinned: boolean) {
  expect(localStorage.getItem(TOKEN_KEY)).toBe('s-access')
  expect(localStorage.getItem(SHARED_REFRESH)).toBe('s-refresh')
  if (pinned) {
    expect(sessionStorage.getItem(TAB_TOKEN_KEY)).toBe('s-access')
    expect(sessionStorage.getItem(TAB_REFRESH)).toBe('s-refresh')
  }
  expect(readSessions().map((entry) => [entry.accessToken, entry.refreshToken])).toEqual([['s-access', 's-refresh']])
  expect(useAuthStore.getState().accessToken).toBe('s-access')
}

const failures: Array<[string, () => void]> = [
  ['answers 503', () => {
    mswServer.use(http.post('https://api.test/auth/refresh', () => {
      refreshCalls += 1
      return HttpResponse.json({ detail: 'deploying' }, { status: 503 })
    }))
  }],
  ['fails on the network', () => {
    mswServer.use(http.post('https://api.test/auth/refresh', () => {
      refreshCalls += 1
      return HttpResponse.error()
    }))
  }],
]

const tabs: Array<[string, () => void, boolean]> = [
  ['an unpinned tab', onShared, false],
  ['a tab pinned to the shared account', pinnedToShared, true],
]

describe.each(tabs)('in %s', (_tab, setUp, pinned) => {
  it.each(failures)('a refresh that %s keeps every token and stays off /login', async (_how, failRefresh) => {
    failRefresh()
    const assign = stubLocation()
    setUp()

    await expect(httpClient.get('/things')).rejects.toMatchObject({ code: SESSION_UNREACHABLE })

    expect(refreshCalls).toBe(1)
    expect(assign).not.toHaveBeenCalled()
    expectEverythingKept(pinned)
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
    expectEverythingKept(pinned)
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
    expect(readSessions().map((entry) => [entry.accessToken, entry.refreshToken])).toEqual([['s-access-2', 's-refresh-2']])
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
    // The refused token is gone from wherever this tab kept it — in a tab
    // pinned to the shared account that is the shared one too (#212 audit).
    expect(localStorage.getItem(SHARED_REFRESH)).toBeNull()
    expect(sessionStorage.getItem(TAB_REFRESH)).toBeNull()
  })
})
