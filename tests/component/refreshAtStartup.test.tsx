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
import { ApiError, httpClient, SESSION_UNREACHABLE } from '@/services/api/httpClient'
import { retryAccountRead } from '@/hooks/auth/accountRead'
import { rememberRefreshToken, storedRefreshToken } from '@/services/auth/sessionRefresh'
import { TOKEN_KEY, useAuthStore } from '@/store/authStore'
import { mswServer } from '../mswServer'

const meCalls: Array<string | null> = []

beforeAll(() => mswServer.listen({ onUnhandledRequest: 'bypass' }))
beforeEach(() => {
  meCalls.length = 0
  localStorage.clear()
  sessionStorage.clear()
  sessionStorage.setItem(TOKEN_KEY, 'expired-access')
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
    expect(sessionStorage.getItem(TOKEN_KEY)).toBe('fresh-access')
    expect(useAuthStore.getState().user?.role).toBe('teacher')
  })

  it('keeps the renewal in this tab, and writes nothing every tab shares (#216)', async () => {
    sessionStorage.setItem(TAB_TOKEN_KEY, 'expired-access')
    rememberRefreshToken('refresh-1')

    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <AuthBootstrap />
      </QueryClientProvider>,
    )

    await waitFor(() => expect(useAuthStore.getState().user?.email).toBe('teacher@test.stoaedu.ch'))
    expect(sessionStorage.getItem(TAB_TOKEN_KEY)).toBe('fresh-access')
    expect(localStorage.getItem('stoa_access_token')).toBeNull()
    expect(localStorage.getItem('stoa_refresh_token')).toBeNull()
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
    expect(sessionStorage.getItem(TOKEN_KEY)).toBeNull()
    expect(storedRefreshToken()).toBeNull()
  })

  it('reads the account under the session another tab renewed first', async () => {
    // Two restored tabs on one expired shared token both renew; the other one
    // finishes first. This tab must not store its own renewal (the session is
    // no longer the one it sent), but it must not sit on "Konto wird geladen…"
    // either: it reads the account under the token the other tab stored.
    mswServer.use(
      http.get('https://api.test/auth/me', ({ request }) => {
        const auth = request.headers.get('authorization')
        meCalls.push(auth)
        if (auth !== 'Bearer other-tab-access') return HttpResponse.json({ detail: 'expired' }, { status: 401 })
        return HttpResponse.json({ id: 't-1', email: 'teacher@test.stoaedu.ch', name: 'Test Teacher', role: 'teacher' })
      }),
      http.post('https://api.test/auth/refresh', async () => {
        await delay(150)
        return HttpResponse.json({ accessToken: 'fresh-access', refreshToken: 'refresh-2' })
      }),
    )
    // The application's own client: the guard asks that one to read the
    // account again.
    const { queryClient: appClient } = await import('@/app/query/queryClient')
    render(
      <QueryClientProvider client={appClient}>
        <AuthBootstrap />
      </QueryClientProvider>,
    )
    await delay(60)
    // What the other tab's renewal leaves in the shared storage.
    sessionStorage.setItem(TOKEN_KEY, 'other-tab-access')

    await waitFor(() => expect(useAuthStore.getState().user?.email).toBe('teacher@test.stoaedu.ch'), { timeout: 3000 })
    expect(useAuthStore.getState().accessToken).toBe('other-tab-access')
    expect(sessionStorage.getItem(TOKEN_KEY)).toBe('other-tab-access')
    expect(meCalls[meCalls.length - 1]).toBe('Bearer other-tab-access')
  })
})

describe('opening the app while /auth/refresh is out of reach (#214)', () => {
  it('keeps the session and reads the account once the server is back', { timeout: 15_000 }, async () => {
    let up = false
    let refreshes = 0
    mswServer.use(
      http.post('https://api.test/auth/refresh', () => {
        refreshes += 1
        return up
          ? HttpResponse.json({ accessToken: 'fresh-access', refreshToken: 'refresh-2' })
          : HttpResponse.json({ detail: 'deploying' }, { status: 503 })
      }),
    )
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <AuthBootstrap />
      </QueryClientProvider>,
    )

    // The reads fail on a renewal that could not be made: nothing is dropped,
    // and the account is still on its way rather than signed out. Down for
    // more than one retry, so a limit of one would not pass.
    await waitFor(() => expect(refreshes).toBe(3), { timeout: 5000 })
    expect(sessionStorage.getItem(TOKEN_KEY)).toBe('expired-access')
    expect(storedRefreshToken()).toBe('refresh-1')
    up = true

    await waitFor(() => expect(useAuthStore.getState().user?.email).toBe('teacher@test.stoaedu.ch'), { timeout: 8000 })
    expect(useAuthStore.getState().accessToken).toBe('fresh-access')
    expect(storedRefreshToken()).toBe('refresh-2')
  })
})

describe('which failed account reads are tried again (#214)', () => {
  it('a session that could not be renewed, however many times it failed', () => {
    const unreachable = new ApiError('The session could not be renewed right now.', { code: SESSION_UNREACHABLE })
    expect(retryAccountRead(0, unreachable)).toBe(true)
    expect(retryAccountRead(50, unreachable)).toBe(true)
  })

  it('nothing else', () => {
    expect(retryAccountRead(0, new ApiError('expired', { status: 401 }))).toBe(false)
    expect(retryAccountRead(0, new ApiError('changed', { status: 401, code: 'session_changed' }))).toBe(false)
    expect(retryAccountRead(0, new ApiError('down', { status: 503 }))).toBe(false)
    expect(retryAccountRead(0, new Error('session_ended'))).toBe(false)
  })
})
