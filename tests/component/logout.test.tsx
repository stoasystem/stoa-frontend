import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { AccountMenu } from '@/components/shell/AccountMenu'
import { TAB_TOKEN_KEY } from '@/lib/devSessions'
import { logger } from '@/services/logging/logger'
import { type CurrentUser, TOKEN_KEY, useAuthStore } from '@/store/authStore'
import { mswServer } from '../mswServer'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { resolvedLanguage: 'en', language: 'en' },
  }),
}))

// Each test wraps the store's own action, never an earlier test's spy.
const storeClearAuth = useAuthStore.getState().clearAuth

type SeenLogout = { body: unknown; authorization: string | null }

function answerLogout(status: number): SeenLogout[] {
  const seen: SeenLogout[] = []
  mswServer.use(
    http.post('https://api.test/auth/logout', async ({ request }) => {
      seen.push({ body: await request.json(), authorization: request.headers.get('authorization') })
      if (status === 204) return new HttpResponse(null, { status: 204 })
      return HttpResponse.json({ detail: { code: 'invalid_token', message: 'refused' } }, { status })
    }),
  )
  return seen
}

function renderSignedIn() {
  localStorage.setItem(TOKEN_KEY, 'shared-token')
  const clearAuth = vi.fn(storeClearAuth)
  useAuthStore.setState({
    user: { id: 'u-1', name: 'Ada', email: 'ada@example.com', role: 'teacher' } as CurrentUser,
    accessToken: 'shared-token',
    isAuthenticated: true,
    clearAuth,
  })
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={['/teacher']}>
        <Routes>
          <Route path="/teacher" element={<AccountMenu />} />
          <Route path="/login" element={<p>login page</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
  return { clearAuth }
}

// The avatar menu signs out here and leaves first, then tells the backend
// without waiting for it; this waits until the backend's answer has been
// handled too.
async function logOut() {
  const handled = [vi.spyOn(logger, 'info'), vi.spyOn(logger, 'warn')]
  await userEvent.click(screen.getByRole('button', { name: 'accountMenu.open' }))
  await userEvent.click(await screen.findByRole('menuitem', { name: 'actions.logOut' }))
  expect(await screen.findByText('login page')).toBeInTheDocument()
  await waitFor(() => expect(handled.some((spy) => spy.mock.calls.length > 0)).toBe(true))
}

function expectSignedOutHere() {
  expect(useAuthStore.getState().isAuthenticated).toBe(false)
  expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
  expect(sessionStorage.getItem(TAB_TOKEN_KEY)).toBeNull()
}

// stoasystem/stoa-backend#5 revokes the session on POST /auth/logout; clearing
// only this browser left the old access token working until it expired
// (stoasystem/stoa-backend#49).
describe('logging out', () => {
  beforeAll(() => mswServer.listen({ onUnhandledRequest: 'error' }))
  afterEach(() => {
    mswServer.resetHandlers()
    useAuthStore.setState({ clearAuth: storeClearAuth })
    vi.restoreAllMocks()
  })
  afterAll(() => mswServer.close())
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it('signs out here and sends the token it held in the body of POST /auth/logout', async () => {
    const seen = answerLogout(204)
    renderSignedIn()

    await logOut()

    expect(seen).toEqual([{ body: { access_token: 'shared-token' }, authorization: null }])
    expectSignedOutHere()
  })

  it('revokes the token a pinned tab holds, not the one the browser shares', async () => {
    const seen = answerLogout(204)
    renderSignedIn()
    sessionStorage.setItem(TAB_TOKEN_KEY, 'tab-token')

    await logOut()

    expect(seen.map((request) => request.body)).toEqual([{ access_token: 'tab-token' }])
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(sessionStorage.getItem(TAB_TOKEN_KEY)).toBeNull()
    // The shared session is another account's and was not revoked (#34).
    expect(localStorage.getItem(TOKEN_KEY)).toBe('shared-token')
  })

  it('still signs out here when the backend call fails', async () => {
    answerLogout(500)
    renderSignedIn()

    await logOut()

    expectSignedOutHere()
  })

  // An expired or already revoked token answers 401. The session interceptor
  // must not race the menu with its own clear and hard reload.
  it('treats a 401 as a session already over and finishes the sign-out itself', async () => {
    const seen = answerLogout(401)
    const { clearAuth } = renderSignedIn()

    await logOut()

    expect(seen).toHaveLength(1)
    expect(clearAuth).toHaveBeenCalledOnce()
    expectSignedOutHere()
  })
})
