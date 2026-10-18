/**
 * An account read that fails without a 401 (#250). `/auth/me` answering 500 or
 * 403 is not retried, and before #250 nothing showed the failure: every
 * guarded page stayed on "Konto wird geladen…" for good, a refresh included.
 * Now the guard shows the failure with a retry and a sign-out. A session that
 * cannot be renewed right now (`session_unreachable`) keeps loading, and keeps
 * retrying by itself.
 */
import { onlineManager, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { AuthBootstrap } from '@/app/router/AuthBootstrap'
import { RoleRoute } from '@/app/router/RoleRoute'
import { FORBIDDEN_PATH } from '@/app/router/routeManifest'
import i18n from '@/i18n'
import { rememberTabAccount } from '@/lib/tabAccount'
import { rememberRefreshToken } from '@/services/auth/sessionRefresh'
import { TOKEN_KEY, useAuthStore } from '@/store/authStore'
import { mswServer } from '../mswServer'

const teacher = { id: 't-1', email: 'teacher@test.stoaedu.ch', name: 'Test Teacher', role: 'teacher' }
const student = { id: 's-1', email: 'student@test.stoaedu.ch', name: 'Test Student', role: 'student' }

let meAnswer: () => Response
let meCalls = 0
let refreshCalls = 0
let logoutCalls = 0

function renderGuardedPage() {
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter initialEntries={['/teacher']}>
        <AuthBootstrap />
        <Routes>
          <Route element={<RoleRoute allowedRoles={['teacher']} />}>
            <Route path="/teacher" element={<p>Teacher home</p>} />
          </Route>
          <Route path="/login" element={<p>Login page</p>} />
          <Route path={FORBIDDEN_PATH} element={<p>Forbidden page</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeAll(() => mswServer.listen({ onUnhandledRequest: 'bypass' }))
beforeEach(async () => {
  await i18n.changeLanguage('de')
  meCalls = 0
  refreshCalls = 0
  logoutCalls = 0
  localStorage.clear()
  sessionStorage.clear()
  sessionStorage.setItem(TOKEN_KEY, 'access-1')
  rememberRefreshToken('refresh-1')
  useAuthStore.setState({ user: null, accessToken: 'access-1', isAuthenticated: true })
  mswServer.use(
    http.get('https://api.test/auth/me', () => {
      meCalls += 1
      return meAnswer()
    }),
    http.post('https://api.test/auth/refresh', () => {
      refreshCalls += 1
      return HttpResponse.error()
    }),
    http.post('https://api.test/auth/logout', () => {
      logoutCalls += 1
      return new HttpResponse(null, { status: 204 })
    }),
  )
})
afterEach(() => {
  onlineManager.setOnline(true)
  mswServer.resetHandlers()
  useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })
})
afterAll(() => {
  mswServer.close()
  // The language this file chose must not outlive it in a shared storage file.
  localStorage.clear()
})

describe('an account read that fails without a 401 (#250)', () => {
  it.each([
    [500, { detail: 'internal error' }],
    [403, { detail: 'forbidden' }],
  ])('shows a %i with a retry, and the retry recovers', async (status, body) => {
    meAnswer = () => HttpResponse.json(body, { status })
    renderGuardedPage()

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Dein Konto konnte nicht geladen werden.')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.queryByText('Teacher home')).not.toBeInTheDocument()
    expect(meCalls).toBe(1)

    meAnswer = () => HttpResponse.json(teacher)
    fireEvent.click(screen.getByRole('button', { name: 'Erneut versuchen' }))

    expect(await screen.findByText('Teacher home')).toBeInTheDocument()
    expect(meCalls).toBe(2)
    expect(useAuthStore.getState().user?.email).toBe(teacher.email)
  })

  it('keeps loading while a retry waits for the network, and reads once it is back', async () => {
    meAnswer = () => HttpResponse.json({ detail: 'internal error' }, { status: 500 })
    renderGuardedPage()
    await screen.findByRole('alert')

    onlineManager.setOnline(false)
    meAnswer = () => HttpResponse.json(teacher)
    fireEvent.click(screen.getByRole('button', { name: 'Erneut versuchen' }))

    expect(await screen.findByRole('status')).toHaveTextContent('Konto wird geladen…')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()

    act(() => onlineManager.setOnline(true))
    expect(await screen.findByText('Teacher home')).toBeInTheDocument()
  })

  it('still holds the role guard when the retry brings back another role', async () => {
    meAnswer = () => HttpResponse.json({ detail: 'internal error' }, { status: 500 })
    renderGuardedPage()
    await screen.findByRole('alert')

    meAnswer = () => HttpResponse.json(student)
    fireEvent.click(screen.getByRole('button', { name: 'Erneut versuchen' }))

    expect(await screen.findByText('Forbidden page')).toBeInTheDocument()
    expect(screen.queryByText('Teacher home')).not.toBeInTheDocument()
  })

  it('signs out from the failure, through the one sign-out', async () => {
    meAnswer = () => HttpResponse.json({ detail: 'internal error' }, { status: 500 })
    renderGuardedPage()
    await screen.findByRole('alert')

    fireEvent.click(screen.getByRole('button', { name: 'Abmelden' }))

    expect(await screen.findByText('Login page')).toBeInTheDocument()
    expect(useAuthStore.getState().accessToken).toBeNull()
    expect(sessionStorage.getItem(TOKEN_KEY)).toBeNull()
    await waitFor(() => expect(logoutCalls).toBe(1))
  })

  it('addresses staff formally, from the account the tab remembers', async () => {
    rememberTabAccount(teacher)
    meAnswer = () => HttpResponse.json({ detail: 'internal error' }, { status: 500 })
    renderGuardedPage()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Ihr Konto konnte nicht geladen werden. Versuchen Sie es noch einmal oder melden Sie sich ab.',
    )
  })

  it('keeps loading while the session cannot be renewed, and retries by itself', async () => {
    // A 401 sends the interceptor to /auth/refresh, which cannot be reached.
    meAnswer = () => HttpResponse.json({ detail: 'expired' }, { status: 401 })
    renderGuardedPage()

    await waitFor(() => expect(refreshCalls).toBeGreaterThanOrEqual(2), { timeout: 4000 })
    expect(screen.getByRole('status')).toHaveTextContent('Konto wird geladen…')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(useAuthStore.getState().accessToken).toBe('access-1')
  })
})
