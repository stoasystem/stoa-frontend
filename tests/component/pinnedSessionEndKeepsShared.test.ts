/**
 * A pinned tab whose session ends clears its own refresh token, not the one
 * the rest of the browser shares (#211).
 *
 * `clearAuth` and `endSession` both cleared the tab's and the shared refresh
 * token. Signing out in a tab pinned to a held account (Konto wechseln) left
 * the other tabs on their access token with no refresh token behind it, and
 * within the hour their next 401 signed them out too.
 */
import { http, HttpResponse } from 'msw'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { pinTabToSession } from '@/lib/devSessions'
import { httpClient } from '@/services/api/httpClient'
import { rememberRefreshToken } from '@/services/auth/sessionRefresh'
import { TOKEN_KEY, useAuthStore } from '@/store/authStore'
import { mswServer } from '../mswServer'

const SHARED_REFRESH = 'stoa_refresh_token'
const TAB_REFRESH = 'stoa_tab_refresh_token'

beforeAll(() => mswServer.listen({ onUnhandledRequest: 'bypass' }))
afterAll(() => mswServer.close())
beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
})
afterEach(() => {
  mswServer.resetHandlers()
  vi.unstubAllGlobals()
  useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })
})

/** Tab 1 holds the shared session S; this tab is pinned to a held account P. */
function pinnedBesideShared(tabRefresh: string | null = 'p-refresh') {
  localStorage.setItem(TOKEN_KEY, 's-access')
  rememberRefreshToken('s-refresh')
  pinTabToSession('p-access')
  if (tabRefresh) rememberRefreshToken(tabRefresh)
}

/** This tab shares the browser's session S. */
function onShared() {
  localStorage.setItem(TOKEN_KEY, 's-access')
  rememberRefreshToken('s-refresh')
}

function onLoginPage() {
  const assign = vi.fn()
  vi.stubGlobal('location', { ...window.location, pathname: '/', assign })
  return assign
}

describe('signing out (clearAuth)', () => {
  it('in a pinned tab clears its own refresh token and leaves the shared one', () => {
    pinnedBesideShared()

    useAuthStore.getState().clearAuth()

    expect(sessionStorage.getItem(TAB_REFRESH)).toBeNull()
    expect(localStorage.getItem(SHARED_REFRESH)).toBe('s-refresh')
    expect(localStorage.getItem(TOKEN_KEY)).toBe('s-access')
  })

  it('in a tab pinned to the shared session itself clears the shared refresh token too', () => {
    // Choosing the current account in Konto wechseln pins the tab to the very
    // tokens the browser shares. That session is the one ending; left behind,
    // its refresh token would sign it back in at the next 401 (#212 audit).
    onShared()
    pinTabToSession('s-access')
    rememberRefreshToken('s-refresh')

    useAuthStore.getState().clearAuth()

    expect(sessionStorage.getItem(TAB_REFRESH)).toBeNull()
    expect(localStorage.getItem(SHARED_REFRESH)).toBeNull()
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
  })

  it('in an unpinned tab clears the shared refresh token', () => {
    onShared()

    useAuthStore.getState().clearAuth()

    expect(localStorage.getItem(SHARED_REFRESH)).toBeNull()
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
  })
})

describe('the session ending on a 401 (endSession)', () => {
  it('in a pinned tab with no refresh token leaves the shared one', async () => {
    // No refresh token in the tab: nothing is exchanged, and the session ends
    // straight away, through endSession and clearAuth alone.
    const refreshes = vi.fn()
    mswServer.use(
      http.get('https://api.test/things', () => HttpResponse.json({ detail: 'expired' }, { status: 401 })),
      http.post('https://api.test/auth/refresh', () => {
        refreshes()
        return HttpResponse.json({ detail: 'refused' }, { status: 401 })
      }),
    )
    const assign = onLoginPage()
    pinnedBesideShared(null)

    await expect(httpClient.get('/things')).rejects.toBeDefined()

    expect(refreshes).not.toHaveBeenCalled()
    expect(assign).toHaveBeenCalledWith('/login')
    expect(localStorage.getItem(SHARED_REFRESH)).toBe('s-refresh')
    expect(localStorage.getItem(TOKEN_KEY)).toBe('s-access')
  })

  it('in a pinned tab whose refresh is refused leaves the shared one', async () => {
    mswServer.use(
      http.get('https://api.test/things', () => HttpResponse.json({ detail: 'expired' }, { status: 401 })),
      http.post('https://api.test/auth/refresh', () => HttpResponse.json({ detail: 'refused' }, { status: 401 })),
    )
    const assign = onLoginPage()
    pinnedBesideShared()

    await expect(httpClient.get('/things')).rejects.toBeDefined()

    expect(assign).toHaveBeenCalledWith('/login')
    expect(sessionStorage.getItem(TAB_REFRESH)).toBeNull()
    expect(localStorage.getItem(SHARED_REFRESH)).toBe('s-refresh')
  })

  it('in an unpinned tab clears the shared refresh token', async () => {
    mswServer.use(
      http.get('https://api.test/things', () => HttpResponse.json({ detail: 'expired' }, { status: 401 })),
      http.post('https://api.test/auth/refresh', () => HttpResponse.json({ detail: 'refused' }, { status: 401 })),
    )
    const assign = onLoginPage()
    onShared()

    await expect(httpClient.get('/things')).rejects.toBeDefined()

    expect(assign).toHaveBeenCalledWith('/login')
    expect(localStorage.getItem(SHARED_REFRESH)).toBeNull()
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
  })
})
