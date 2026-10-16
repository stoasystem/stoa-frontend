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
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { pinTabToSession } from '@/lib/devSessions'
import { rememberRefreshToken, storedRefreshToken } from '@/services/auth/sessionRefresh'
import { TOKEN_KEY, useAuthStore } from '@/store/authStore'

const bea = { id: 'b', email: 'b@test.stoaedu.ch', name: 'B', role: 'student' } as never

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
})
afterEach(() => {
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
