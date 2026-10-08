import { QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { delay, http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterAll, afterEach, beforeAll, beforeEach, expect, it, vi } from 'vitest'
import { queryClient } from '@/app/query/queryClient'
import { useLoginMutation } from '@/hooks/auth/useLoginMutation'
import { useSignOut } from '@/hooks/auth/useSignOut'
import { httpClient } from '@/services/api/httpClient'
import { TOKEN_KEY, useAuthStore } from '@/store/authStore'
import { mswServer } from '../mswServer'

function SignedInPage() {
  const { signOut } = useSignOut()
  return <button onClick={() => void signOut()}>Sign out</button>
}

function LoginPage() {
  const login = useLoginMutation()
  return <button onClick={() => login.mutate({ email: 'a@example.com', password: 'test' })}>Sign in</button>
}

function renderPages(initialEntry = '/signed-in') {
  localStorage.setItem(TOKEN_KEY, 'old-token')
  useAuthStore.setState({ accessToken: 'old-token', isAuthenticated: true })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/signed-in" element={<SignedInPage />} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeAll(() => mswServer.listen({ onUnhandledRequest: 'error' }))
afterAll(() => mswServer.close())
beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  queryClient.clear()
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  mswServer.resetHandlers()
  queryClient.clear()
  useAuthStore.getState().clearAuth()
})

it.each(['success', 'http failure', 'network failure'] as const)(
  'waits across the route change and releases login after logout %s', async (outcome) => {
  let finishLogout!: () => void
  const gate = new Promise<void>((resolve) => { finishLogout = resolve })
  const requests: string[] = []
  mswServer.use(
    http.post('https://api.test/auth/logout', async () => {
      requests.push('logout')
      await gate
      if (outcome === 'network failure') return HttpResponse.error()
      return new HttpResponse(null, { status: outcome === 'success' ? 204 : 503 })
    }),
    http.post('https://api.test/auth/login', () => {
      requests.push('login')
      return HttpResponse.json({ detail: 'test login refused' }, { status: 503 })
    }),
  )
  renderPages()
  fireEvent.click(screen.getByText('Sign out'))
  fireEvent.click(await screen.findByText('Sign in'))
  await waitFor(() => expect(requests).toContain('logout'))
  try {
    await act(() => new Promise((resolve) => setTimeout(resolve, 40)))
    expect(requests).toEqual(['logout'])
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
  } finally {
    finishLogout()
  }
  await waitFor(() => expect(requests).toEqual(['logout', 'login']))
})

it('releases the waiting login when the logout request times out after 8 seconds', async () => {
  // MSW does not start jsdom's XHR timeout while its handler is pending.
  // Exercise the real Axios timeout with the fetch adapter and a fake clock.
  vi.spyOn(httpClient.defaults, 'adapter', 'get').mockReturnValue('fetch')
  vi.useFakeTimers({ shouldAdvanceTime: true })
  const requests: string[] = []
  mswServer.use(
    http.post('https://api.test/auth/logout', async () => {
      requests.push('logout')
      await delay('infinite')
      return new HttpResponse(null, { status: 204 })
    }),
    http.post('https://api.test/auth/login', () => {
      requests.push('login')
      return HttpResponse.json({ detail: 'test login refused' }, { status: 503 })
    }),
  )
  renderPages()
  fireEvent.click(screen.getByText('Sign out'))
  fireEvent.click(await screen.findByText('Sign in'))
  await waitFor(() => expect(requests).toEqual(['logout']))

  await act(() => vi.advanceTimersByTimeAsync(7000))
  expect(requests).toEqual(['logout'])
  expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
  await act(() => vi.advanceTimersByTimeAsync(1000))
  await waitFor(() => expect(requests).toEqual(['logout', 'login']))
})

it('sends login immediately when no logout is pending', async () => {
  let loginRequests = 0
  mswServer.use(http.post('https://api.test/auth/login', () => {
    loginRequests += 1
    return HttpResponse.json({ detail: 'test login refused' }, { status: 503 })
  }))
  renderPages('/login')
  useAuthStore.getState().clearAuth()
  fireEvent.click(screen.getByText('Sign in'))
  await waitFor(() => expect(loginRequests).toBe(1))
})

it('holds the account that just signed in, with its refresh token', async () => {
  // 「添加账号」 in the account menu goes to the login screen and nothing put
  // the result in the list the switcher reads, so signing in a second account
  // offered you nothing to switch to. The refresh token goes with it: without
  // one, a held account is over an hour later whatever anyone does with it.
  mswServer.use(http.post('https://api.test/auth/login', () =>
    HttpResponse.json({
      accessToken: 'access-for-parent',
      refreshToken: 'refresh-for-parent',
      user: { id: 'u-2', email: 'parent@example.com', role: 'parent', name: 'A Parent' },
    }),
  ))
  renderPages('/login')
  useAuthStore.getState().clearAuth()

  fireEvent.click(screen.getByText('Sign in'))

  await waitFor(() => {
    const held = JSON.parse(localStorage.getItem('stoa_dev_sessions') ?? '[]')
    expect(held).toHaveLength(1)
    expect(held[0].email).toBe('parent@example.com')
    expect(held[0].accessToken).toBe('access-for-parent')
    expect(held[0].refreshToken).toBe('refresh-for-parent')
  })
})
