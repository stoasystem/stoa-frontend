import { act, renderHook } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { useSignOut } from '@/hooks/auth/useSignOut'
import { TAB_TOKEN_KEY } from '@/lib/devSessions'
import { logger } from '@/services/logging/logger'
import { type CurrentUser, TOKEN_KEY, useAuthStore } from '@/store/authStore'
import { mswServer } from '../mswServer'

// Each test wraps the store's own action, never an earlier test's spy.
const storeClearAuth = useAuthStore.getState().clearAuth

// What the backend saw, and whether this device still counted as signed in at
// the moment it saw it: the token must be revoked before it is thrown away.
type SeenLogout = { body: unknown; signedInHere: boolean }

function answerLogout(answer: 'ok' | 'network-error' | 500 | 401): SeenLogout[] {
  const seen: SeenLogout[] = []
  mswServer.use(
    http.post('https://api.test/auth/logout', async ({ request }) => {
      seen.push({
        body: await request.json(),
        signedInHere: useAuthStore.getState().isAuthenticated && localStorage.getItem(TOKEN_KEY) !== null,
      })
      if (answer === 'ok') return new HttpResponse(null, { status: 204 })
      if (answer === 'network-error') return HttpResponse.error()
      return HttpResponse.json({ detail: { code: 'refused', message: 'refused' } }, { status: answer })
    }),
  )
  return seen
}

function wrapper({ children }: { children: ReactNode }) {
  return <MemoryRouter initialEntries={['/chat']}>{children}</MemoryRouter>
}

function renderSignedIn() {
  localStorage.setItem(TOKEN_KEY, 'shared-token')
  const clearAuth = vi.fn(storeClearAuth)
  useAuthStore.setState({
    user: { id: 'u-1', name: 'Ada', email: 'ada@example.com', role: 'student' } as CurrentUser,
    accessToken: 'shared-token',
    isAuthenticated: true,
    clearAuth,
  })
  const { result } = renderHook(() => ({ signOut: useSignOut(), pathname: useLocation().pathname }), { wrapper })
  return { result, clearAuth }
}

function expectSignedOutHere() {
  expect(useAuthStore.getState().isAuthenticated).toBe(false)
  expect(useAuthStore.getState().user).toBeNull()
  expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
  expect(sessionStorage.getItem(TAB_TOKEN_KEY)).toBeNull()
}

// The shared sign-out every account menu calls (stoasystem/stoa-frontend#19):
// tell the backend, then clear this device and leave, whatever the backend said.
describe('useSignOut', () => {
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

  it('posts the current token to /auth/logout, then clears local auth and goes to /login', async () => {
    const seen = answerLogout('ok')
    const { result, clearAuth } = renderSignedIn()

    await act(() => result.current.signOut())

    expect(seen).toEqual([{ body: { access_token: 'shared-token' }, signedInHere: true }])
    expect(clearAuth).toHaveBeenCalledOnce()
    expectSignedOutHere()
    expect(result.current.pathname).toBe('/login')
  })

  it.each(['network-error', 500, 401] as const)(
    'still clears local auth and goes to /login when the backend call fails (%s)',
    async (answer) => {
      const warn = vi.spyOn(logger, 'warn')
      const seen = answerLogout(answer)
      const { result, clearAuth } = renderSignedIn()

      await act(() => result.current.signOut())

      expect(seen).toHaveLength(1)
      expect(warn).toHaveBeenCalledOnce()
      expect(clearAuth).toHaveBeenCalledOnce()
      expectSignedOutHere()
      expect(result.current.pathname).toBe('/login')
    },
  )
})
