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
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { forgetSessionHolding, readSessions, rememberSession } from '@/lib/devSessions'
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

  it('keeps the held refresh token when the server sends none back', async () => {
    mswServer.use(http.post('https://api.test/auth/refresh', () => HttpResponse.json({ accessToken: 'fresh-access' })))

    await httpClient.get('/auth/me')

    expect(held('student@test.stoaedu.ch')).toMatchObject({ accessToken: 'fresh-access', refreshToken: 'refresh-1' })
  })
})
