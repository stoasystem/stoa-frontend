/**
 * A held account whose token the app renewed.
 *
 * The account menu holds each signed-in account under the tokens it signed in
 * with. When the open account's access token ran out, the 401 interceptor
 * renewed it but left the held entry on the old one. Signing out then revoked
 * the sign-in and dropped the held entry carrying the *current* token, which
 * was none of them, so the dead account stayed in "Konto wechseln". Choosing it
 * answered 401 on /auth/me and 401 on /auth/refresh: "Diese Sitzung ist
 * abgelaufen" (app.stoaedu.ch, student@ held beside teacher@, 2026-10-16, #162).
 */
import { http, HttpResponse } from 'msw'
import { act, renderHook } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { useHeldAccounts } from '@/hooks/auth/useHeldAccounts'
import { forgetSessionHolding, pinTabToSession, readSessions, rememberSession, tabToken } from '@/lib/devSessions'
import { httpClient } from '@/services/api/httpClient'
import { rememberRefreshToken, storedRefreshToken } from '@/services/auth/sessionRefresh'
import { TOKEN_KEY, useAuthStore } from '@/store/authStore'
import { mswServer } from '../mswServer'

beforeAll(() => mswServer.listen({ onUnhandledRequest: 'bypass' }))
beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  localStorage.setItem(TOKEN_KEY, 'expired-access')
  rememberRefreshToken('refresh-1')
  useAuthStore.setState({ user: null, accessToken: 'expired-access', isAuthenticated: true })
  rememberSession({
    email: 'teacher@test.stoaedu.ch',
    role: 'teacher',
    name: 'Test Teacher',
    accessToken: 'teacher-access',
    refreshToken: 'teacher-refresh',
  })
  rememberSession({
    email: 'student@test.stoaedu.ch',
    role: 'student',
    name: 'Test Student',
    accessToken: 'expired-access',
    refreshToken: 'refresh-1',
  })
  mswServer.use(
    http.get('https://api.test/auth/me', ({ request }) => {
      if (request.headers.get('authorization') !== 'Bearer fresh-access') {
        return HttpResponse.json({ detail: 'expired' }, { status: 401 })
      }
      return HttpResponse.json({ id: 's-1', email: 'student@test.stoaedu.ch', name: 'Test Student', role: 'student' })
    }),
    http.post('https://api.test/auth/refresh', () =>
      HttpResponse.json({ accessToken: 'fresh-access', refreshToken: 'refresh-2' }),
    ),
  )
})
afterEach(() => {
  mswServer.resetHandlers()
  useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })
})
afterAll(() => mswServer.close())

const held = (email: string) => readSessions().find((entry) => entry.email === email)

describe('renewing the open account', () => {
  it('moves its held entry onto the new tokens and leaves the other accounts alone', async () => {
    await httpClient.get('/auth/me')

    expect(storedRefreshToken()).toBe('refresh-2')
    expect(held('student@test.stoaedu.ch')).toMatchObject({ accessToken: 'fresh-access', refreshToken: 'refresh-2' })
    expect(held('teacher@test.stoaedu.ch')).toMatchObject({ accessToken: 'teacher-access', refreshToken: 'teacher-refresh' })
  })

  it('lets signing out afterwards drop that held entry', async () => {
    await httpClient.get('/auth/me')

    // What signing out does with the token the tab holds.
    forgetSessionHolding(useAuthStore.getState().accessToken ?? '')

    expect(held('student@test.stoaedu.ch')).toBeUndefined()
    expect(held('teacher@test.stoaedu.ch')).toBeDefined()
  })

  it('keeps the refresh token it spent when the server sends none back', async () => {
    mswServer.use(http.post('https://api.test/auth/refresh', () => HttpResponse.json({ accessToken: 'fresh-access' })))

    await httpClient.get('/auth/me')

    expect(held('student@test.stoaedu.ch')).toMatchObject({ accessToken: 'fresh-access', refreshToken: 'refresh-1' })
  })

  it('leaves an entry whose refresh token is not the one the renewal spent', async () => {
    // The same access token, but the tab is holding a different refresh token:
    // the renewal is not this entry's, whatever its access token says.
    rememberRefreshToken('someone-elses-refresh')

    await httpClient.get('/auth/me')

    expect(held('student@test.stoaedu.ch')).toMatchObject({ accessToken: 'expired-access', refreshToken: 'refresh-1' })
  })

  it('leaves an entry held without a refresh token', async () => {
    const entries = readSessions().map((entry) =>
      entry.email === 'student@test.stoaedu.ch' ? { ...entry, refreshToken: undefined } : entry,
    )
    localStorage.setItem('stoa_dev_sessions', JSON.stringify(entries))

    await httpClient.get('/auth/me')

    expect(held('student@test.stoaedu.ch')).toMatchObject({ accessToken: 'expired-access' })
    expect(held('student@test.stoaedu.ch')?.refreshToken).toBeUndefined()
  })
})

describe("switching a tab to an account held without a refresh token (#205 audit)", () => {
  // The tab is pinned to A and holds A's refresh token. B was held before
  // refresh tokens were kept with the account. Switching to B used to leave A's
  // refresh token in the tab; the next 401 spent it, got A's tokens back, and
  // wrote them into B's entry under B's name.
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    pinTabToSession('a-access')
    rememberRefreshToken('a-refresh-1')
    rememberSession({ email: 'a@test.stoaedu.ch', role: 'teacher', name: 'A', accessToken: 'a-access', refreshToken: 'a-refresh-1' })
    rememberSession({ email: 'b@test.stoaedu.ch', role: 'student', name: 'B', accessToken: 'b-access' })
    mswServer.use(
      http.get('https://api.test/auth/me', ({ request }) =>
        request.headers.get('authorization') === 'Bearer b-access'
          ? HttpResponse.json({ id: 'b', email: 'b@test.stoaedu.ch', name: 'B', role: 'student' })
          : HttpResponse.json({ detail: 'expired' }, { status: 401 }),
      ),
      http.get('https://api.test/student/anything', () => HttpResponse.json({ detail: 'expired' }, { status: 401 })),
      http.post('https://api.test/auth/refresh', () => HttpResponse.json({ accessToken: 'a-new', refreshToken: 'a-refresh-2' })),
    )
  })

  it("does not carry A's refresh token over, so B's entry never takes A's tokens", async () => {
    const assign = vi.fn()
    vi.stubGlobal('location', { ...window.location, assign })
    const { result } = renderHook(() => useHeldAccounts())

    await act(() => result.current.switchTo(held('b@test.stoaedu.ch')!))

    expect(assign).toHaveBeenCalled()
    expect(tabToken()).toBe('b-access')
    expect(storedRefreshToken()).toBeNull()

    useAuthStore.setState({ accessToken: 'b-access', isAuthenticated: true })
    await httpClient.get('/student/anything').catch(() => undefined)

    expect(held('b@test.stoaedu.ch')).toMatchObject({ accessToken: 'b-access', name: 'B' })
    expect(held('b@test.stoaedu.ch')?.refreshToken).toBeUndefined()
    expect(held('a@test.stoaedu.ch')).toMatchObject({ accessToken: 'a-access', refreshToken: 'a-refresh-1' })
    vi.unstubAllGlobals()
  })
})
