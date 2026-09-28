/**
 * Where signing in lands, through the real router.
 *
 * `/login` is rendered by EntryPage, not LoginPage, so a test that mounts the
 * login form on its own cannot see what happens once the session exists. This
 * mounts the whole AppRouter -- EntryPage, the real login form and mutation,
 * ProtectedRoute and RoleRoute -- against MSW, and reads the address bar.
 *
 * Only the destination pages are stubbed: what they render is not under test,
 * and the real ones would each fetch their own data.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import '@/i18n'
import { AppRouter } from '@/app/router/AppRouter'
import { TOKEN_KEY, useAuthStore } from '@/store/authStore'
import type { User, UserRole } from '@/types/user'
import { mswServer } from '../mswServer'

vi.mock('@/pages/chat/ChatPage', () => ({ ChatPage: () => <h1>student home</h1> }))
vi.mock('@/pages/profile/StudentProfilePage', () => ({
  StudentProfilePage: () => <h1>student profile</h1>,
}))
vi.mock('@/pages/learn/LearnPage', () => ({ LearnPage: () => <h1>learn page</h1> }))
vi.mock('@/pages/parent/ParentDashboardPage', () => ({
  ParentDashboardPage: () => <h1>parent home</h1>,
}))
vi.mock('@/pages/auth/ChangePasswordPage', () => ({
  ChangePasswordPage: () => <h1>password change</h1>,
}))

function account(role: UserRole, mustChangePassword = false): User {
  return {
    id: `${role}-1`,
    name: 'Ada',
    email: `${role}@example.com`,
    role,
    mustChangePassword,
  } as User
}

function serve(user: User) {
  mswServer.use(
    http.post('https://api.test/auth/login', () =>
      HttpResponse.json({ accessToken: 'fresh-token', user }),
    ),
    http.get('https://api.test/auth/me', () => HttpResponse.json(user)),
    // Anything else the shell asks for (the student's conversation prefetch)
    // is not what these tests are about.
    http.all('https://api.test/*', () => HttpResponse.json({ items: [], nextToken: null })),
  )
}

function openAt(url: string) {
  window.history.replaceState(null, '', url)
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <AppRouter />
    </QueryClientProvider>,
  )
}

async function signIn() {
  fireEvent.change(await screen.findByLabelText('Email'), {
    target: { value: 'ada@example.com' },
  })
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Pass!word123' } })
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
}

async function expectToLandOn(pathname: string, heading: string) {
  expect(await screen.findByRole('heading', { name: heading }, { timeout: 3000 })).toBeInTheDocument()
  await waitFor(() => expect(window.location.pathname).toBe(pathname))
}

beforeAll(() => mswServer.listen({ onUnhandledRequest: 'error' }))
afterAll(() => mswServer.close())
beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })
})
afterEach(() => {
  mswServer.resetHandlers()
  useAuthStore.getState().clearAuth()
  window.history.replaceState(null, '', '/')
})

describe('signing in from /login', () => {
  it('lands on the ?next= page when the role may use it', async () => {
    serve(account('student'))
    openAt('/login?next=/profile')

    await signIn()

    await expectToLandOn('/profile', 'student profile')
  })

  it('returns to the protected page that sent the visitor to sign in', async () => {
    serve(account('student'))
    openAt('/learn/progress')
    await waitFor(() => expect(window.location.pathname).toBe('/login'))

    await signIn()

    await expectToLandOn('/learn/progress', 'learn page')
  })

  it("goes to the role's home when ?next= belongs to another role", async () => {
    serve(account('parent'))
    openAt('/login?next=/learn/progress')

    await signIn()

    await expectToLandOn('/parent', 'parent home')
  })

  it.each(['//evil.example', 'https://evil.example', '//evil.example/chat'])(
    "goes to the role's home when ?next=%s points off the site",
    async (next) => {
      serve(account('student'))
      openAt(`/login?next=${encodeURIComponent(next)}`)

      await signIn()

      await expectToLandOn('/chat', 'student home')
      expect(window.location.host).toBe('localhost:3000')
    },
  )

  it('sends a reset account to the password change first, whatever ?next= says', async () => {
    serve(account('student', true))
    openAt('/login?next=/profile')

    await signIn()

    await expectToLandOn('/settings/password', 'password change')
  })
})

describe('opening /login while already signed in', () => {
  function alreadySignedInAs(user: User) {
    serve(user)
    localStorage.setItem(TOKEN_KEY, 'stored-token')
    useAuthStore.setState({ user, accessToken: 'stored-token', isAuthenticated: true })
  }

  it('goes straight to the ?next= page when the role may use it', async () => {
    alreadySignedInAs(account('student'))

    openAt('/login?next=/profile')

    await expectToLandOn('/profile', 'student profile')
  })

  it("goes to the role's home when the role may not use it", async () => {
    alreadySignedInAs(account('student'))

    openAt('/login?next=/admin')

    await expectToLandOn('/chat', 'student home')
  })
})
