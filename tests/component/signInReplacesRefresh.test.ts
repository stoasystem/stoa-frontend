/**
 * Signing in opens a new session, so it replaces the tab's refresh token,
 * including with none (#208).
 *
 * `setAuth` read a missing refresh token as "keep the one there". Its only
 * callers are sign-in and registration, both of which start a session. So a
 * sign-in from "Weiteres Konto hinzufügen" whose response carried no refresh
 * token left the previous account's in the tab, and the next 401 spent it and
 * quietly turned the tab back into that account.
 */
import { http, HttpResponse } from 'msw'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { pinTabToSession } from '@/lib/devSessions'
import { httpClient } from '@/services/api/httpClient'
import { rememberRefreshToken, storedRefreshToken } from '@/services/auth/sessionRefresh'
import { TOKEN_KEY, useAuthStore } from '@/store/authStore'
import { mswServer } from '../mswServer'

const bea = { id: 'b', email: 'b@test.stoaedu.ch', name: 'B', role: 'student' } as never

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

describe('signing in without a refresh token in the response', () => {
  it('leaves a pinned tab with no refresh token, not the previous account’s', () => {
    pinTabToSession('a-access')
    rememberRefreshToken('a-refresh')

    useAuthStore.getState().setAuth(bea, 'b-access', undefined)

    expect(sessionStorage.getItem('stoa_tab_access_token')).toBe('b-access')
    expect(storedRefreshToken()).toBeNull()
  })

  it('leaves the shared session with no refresh token, not the previous account’s', () => {
    localStorage.setItem(TOKEN_KEY, 'a-access')
    rememberRefreshToken('a-refresh')

    useAuthStore.getState().setAuth(bea, 'b-access', undefined)

    expect(localStorage.getItem(TOKEN_KEY)).toBe('b-access')
    expect(storedRefreshToken()).toBeNull()
  })

  it('clears only this tab’s place: the shared refresh token other tabs use stays', () => {
    rememberRefreshToken('shared-refresh')
    pinTabToSession('a-access')
    rememberRefreshToken('a-refresh')

    useAuthStore.getState().setAuth(bea, 'b-access', undefined)

    expect(sessionStorage.getItem('stoa_tab_refresh_token')).toBeNull()
    expect(localStorage.getItem('stoa_refresh_token')).toBe('shared-refresh')
  })
})

describe('signing in with a refresh token', () => {
  it('stores the new one in place of the previous account’s', () => {
    pinTabToSession('a-access')
    rememberRefreshToken('a-refresh')

    useAuthStore.getState().setAuth(bea, 'b-access', 'b-refresh')

    expect(storedRefreshToken()).toBe('b-refresh')
  })
})

describe('the next 401 after such a sign-in (the #208 scenario, end to end)', () => {
  it('ends the session rather than spending the previous account’s refresh token', async () => {
    const refreshesWith: string[] = []
    mswServer.use(
      http.get('https://api.test/things', () => HttpResponse.json({ detail: 'expired' }, { status: 401 })),
      http.post('https://api.test/auth/refresh', async ({ request }) => {
        refreshesWith.push(((await request.json()) as { refresh_token: string }).refresh_token)
        return HttpResponse.json({ accessToken: 'a-new', refreshToken: 'a-refresh-2' })
      }),
    )
    const assign = vi.fn()
    vi.stubGlobal('location', { ...window.location, pathname: '/', assign })
    pinTabToSession('a-access')
    rememberRefreshToken('a-refresh')

    // Signed in from "Weiteres Konto hinzufügen"; the response carried no refresh token.
    useAuthStore.getState().setAuth(bea, 'b-access', undefined)
    await expect(httpClient.get('/things')).rejects.toBeDefined()

    expect(refreshesWith).toEqual([])
    expect(assign).toHaveBeenCalledWith('/login')
    expect(useAuthStore.getState().accessToken).not.toBe('a-new')
  })
})

describe('where a refresh token goes in a tab whose pin is empty', () => {
  it('lands beside the access token, in the shared session', () => {
    // The store treats an empty pin as "not pinned"; the refresh token follows
    // the same rule, so the two cannot end up in different places (#209 audit).
    sessionStorage.setItem('stoa_tab_access_token', '')

    useAuthStore.getState().setAuth(bea, 'b-access', 'b-refresh')

    expect(localStorage.getItem(TOKEN_KEY)).toBe('b-access')
    expect(localStorage.getItem('stoa_refresh_token')).toBe('b-refresh')
    expect(sessionStorage.getItem('stoa_tab_refresh_token')).toBeNull()
  })
})
