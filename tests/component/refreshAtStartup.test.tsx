/**
 * Opening the app with an access token that has run out. `/auth/me` answers
 * 401, the refresh token buys a new access token, and the account has to be
 * read again with it. The interceptor stored the new token with
 * `setAuth(user!, token)`, but at start-up no account has been read yet, so
 * `user` is null and storing it threw: the account was never read and the page
 * stayed on "Konto wird geladen…" (app.stoaedu.ch, teacher@, 2026-10-11).
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, waitFor } from '@testing-library/react'
import { delay, http, HttpResponse } from 'msw'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { AuthBootstrap } from '@/app/router/AuthBootstrap'
import { TAB_TOKEN_KEY } from '@/lib/devSessions'
import { httpClient } from '@/services/api/httpClient'
import { rememberRefreshToken, storedRefreshToken } from '@/services/auth/sessionRefresh'
import { TOKEN_KEY, useAuthStore } from '@/store/authStore'
import { mswServer } from '../mswServer'

const meCalls: Array<string | null> = []

beforeAll(() => mswServer.listen({ onUnhandledRequest: 'bypass' }))
beforeEach(() => {
  meCalls.length = 0
  localStorage.clear()
  sessionStorage.clear()
  localStorage.setItem(TOKEN_KEY, 'expired-access')
  rememberRefreshToken('refresh-1')
  useAuthStore.setState({ user: null, accessToken: 'expired-access', isAuthenticated: true })
  mswServer.use(
    http.get('https://api.test/auth/me', ({ request }) => {
      const auth = request.headers.get('authorization')
      meCalls.push(auth)
      if (auth !== 'Bearer fresh-access') return HttpResponse.json({ detail: 'expired' }, { status: 401 })
      return HttpResponse.json({ id: 't-1', email: 'teacher@test.stoaedu.ch', name: 'Test Teacher', role: 'teacher' })
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

describe('opening the app on an access token that has run out', () => {
  it('reads the account again with the refreshed token, and keeps it', async () => {
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <AuthBootstrap />
      </QueryClientProvider>,
    )

    await waitFor(() => expect(useAuthStore.getState().user?.email).toBe('teacher@test.stoaedu.ch'))
    expect(meCalls).toEqual(['Bearer expired-access', 'Bearer fresh-access'])
    expect(useAuthStore.getState().accessToken).toBe('fresh-access')
    expect(localStorage.getItem(TOKEN_KEY)).toBe('fresh-access')
    expect(useAuthStore.getState().user?.role).toBe('teacher')
  })

  it('keeps the renewal in a tab that holds its own account, and leaves the shared one', async () => {
    localStorage.setItem(TOKEN_KEY, 'someone-elses-access')
    sessionStorage.setItem(TAB_TOKEN_KEY, 'expired-access')
    rememberRefreshToken('refresh-1')

    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <AuthBootstrap />
      </QueryClientProvider>,
    )

    await waitFor(() => expect(useAuthStore.getState().user?.email).toBe('teacher@test.stoaedu.ch'))
    expect(sessionStorage.getItem(TAB_TOKEN_KEY)).toBe('fresh-access')
    expect(localStorage.getItem(TOKEN_KEY)).toBe('someone-elses-access')
  })
})

describe('a renewal and the session around it', () => {
  it('keeps the account already read when a token is renewed mid-session', async () => {
    useAuthStore.setState({
      user: { id: 't-1', email: 'teacher@test.stoaedu.ch', name: 'Test Teacher', role: 'teacher' } as never,
      accessToken: 'expired-access',
      isAuthenticated: true,
    })

    const { data } = await httpClient.get('/auth/me')

    expect(data.email).toBe('teacher@test.stoaedu.ch')
    expect(useAuthStore.getState().user?.name).toBe('Test Teacher')
    expect(useAuthStore.getState().accessToken).toBe('fresh-access')
  })

  it('stores nothing when the user signs out while the renewal is in flight', async () => {
    // The #172 audit's race: storing the renewed token after a sign-out signed
    // the old account straight back in, on the login screen.
    mswServer.use(
      http.post('https://api.test/auth/refresh', async () => {
        await delay(150)
        return HttpResponse.json({ accessToken: 'fresh-access', refreshToken: 'refresh-2' })
      }),
    )
    useAuthStore.setState({
      user: { id: 't-1', email: 'teacher@test.stoaedu.ch', name: 'Test Teacher', role: 'teacher' } as never,
      accessToken: 'expired-access',
      isAuthenticated: true,
    })

    const request = httpClient.get('/auth/me')
    await delay(40)
    useAuthStore.getState().clearAuth()

    await expect(request).rejects.toMatchObject({ code: 'session_changed' })
    expect(meCalls).toEqual(['Bearer expired-access'])
    expect(useAuthStore.getState().accessToken).toBeNull()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
    expect(storedRefreshToken()).toBeNull()
  })
})
