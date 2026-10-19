/**
 * "/" after a reload, while the tab's account is still being read (#274).
 *
 * The star map is a student's and the entry page everyone else's, and which
 * of the two a tab is cannot be told before /auth/me answers. Until #274 the
 * router decided on the missing account: a reloading student was shown the
 * sign-in page until the answer came, and the entry page's one-time reads of
 * the tab (how the last session ended) were made then,
 * for nobody. Now "/" waits like every other role route, and the entry page
 * opens only once there is something to decide.
 *
 * The entry page here is the real one, behind the real router; every other
 * page is a stub that prints its name.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen } from '@testing-library/react'
import type { ComponentType } from 'react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import '@/i18n'
import { AppRoutes } from '@/app/router/AppRoutes'
import { readTabSignOut, tabToken } from '@/lib/tabAccount'
import { EntryPage } from '@/pages/entry/EntryPage'
import { type CurrentUser, useAuthStore } from '@/store/authStore'

// The real entry page, handed over once this file's imports are in: the
// manifest loads this mock, and the entry page leads back to the manifest.
const real = vi.hoisted(() => ({ EntryPage: null as ComponentType | null }))

vi.mock('@/app/router/lazyPage', async () => {
  const stub = await import('./lazyPageStub')
  const RealEntryPage = (props: object) => {
    const Page = real.EntryPage!
    return <Page {...props} />
  }
  return {
    ...stub,
    lazyPage: (pageName: string) =>
      pageName === 'EntryPage' ? Object.assign(RealEntryPage, { pageName }) : stub.lazyPage(pageName),
  }
})

vi.mock('@/lib/tabAccount', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/tabAccount')>()
  return {
    ...actual,
    readTabSignOut: vi.fn(actual.readTabSignOut),
  }
})

vi.mock('@/components/auth/LoginForm', () => ({
  LoginForm: ({ initialEmail }: { initialEmail?: string }) => (
    <form aria-label="sign in" data-email={initialEmail ?? ''} />
  ),
}))

real.EntryPage = EntryPage

let pathname = ''
function Probe() {
  pathname = useLocation().pathname
  return null
}

function reloadHome() {
  // A stored token, and an account /auth/me has not returned yet.
  useAuthStore.setState({ user: null, accessToken: 'token', isAuthenticated: true })
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
        <Probe />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function accountArrives(role: CurrentUser['role'], options: { mustChangePassword?: boolean } = {}) {
  act(() =>
    useAuthStore
      .getState()
      .setUser({ id: `u-${role}`, name: 'Ada', email: 'ada@test.stoaedu.ch', role, ...options } as CurrentUser),
  )
}

beforeEach(() => {
  sessionStorage.clear()
  localStorage.clear()
  vi.mocked(readTabSignOut).mockClear()
})
afterAll(() => {
  useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })
  sessionStorage.clear()
  localStorage.clear()
})

describe('"/" while the account is being read', () => {
  it('shows the loading line, not the sign-in page', () => {
    reloadHome()

    expect(screen.getByRole('status')).toHaveTextContent('Loading account')
    expect(screen.queryByRole('form', { name: 'sign in' })).toBeNull()
    expect(screen.queryByTestId('page')).toBeNull()
  })

  it('does not read the tab for the entry page while it waits', () => {
    reloadHome()

    expect(readTabSignOut).not.toHaveBeenCalled()
  })

  it('opens the star map once the account turns out to be a student', () => {
    reloadHome()
    accountArrives('student')

    expect(screen.getByTestId('page')).toHaveTextContent('MapHomePage')
    expect(screen.queryByRole('form', { name: 'sign in' })).toBeNull()
    expect(pathname).toBe('/')
  })

  it.each([
    ['teacher', '/teacher'],
    ['parent', '/parent'],
    ['admin', '/admin'],
  ] as const)('sends a %s to their own home once the account is in', (role, home) => {
    reloadHome()
    accountArrives(role)

    expect(pathname).toBe(home)
    expect(screen.queryByRole('form', { name: 'sign in' })).toBeNull()
  })

  it('sends a reset student to the password change once the account is in', () => {
    reloadHome()
    accountArrives('student', { mustChangePassword: true })

    expect(pathname).toBe('/settings/password')
    expect(screen.getByTestId('page')).toHaveTextContent('ChangePasswordPage')
  })

  it('asks the same account to sign in again when the session turns out to have ended (ADR 0002)', () => {
    reloadHome()
    act(() =>
      useAuthStore.getState().clearAuth({
        reason: 'expired',
        account: { email: 'ada@test.stoaedu.ch', name: 'Ada', role: 'student' },
        returnTo: '/',
      }),
    )

    // How the session ended is read now that it has, not before.
    expect(screen.getByRole('form', { name: 'sign in' })).toHaveAttribute('data-email', 'ada@test.stoaedu.ch')
    expect(pathname).toBe('/')
  })

  it('shows a plain sign-in page to a tab that signed out while it waited', () => {
    reloadHome()
    act(() => useAuthStore.getState().clearAuth())

    expect(screen.getByRole('form', { name: 'sign in' })).toHaveAttribute('data-email', '')
  })
})

describe('"/" in a tab without a session', () => {
  it('joins the browser\'s sign-in, and reads its account (ADR 0003)', () => {
    localStorage.setItem(
      'stoa_sign_in',
      JSON.stringify({ id: 'b', accessToken: 'browser-access', account: { email: 'ada@test.stoaedu.ch', name: 'Ada' } }),
    )
    useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={['/']}>
          <AppRoutes />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(tabToken()).toBe('browser-access')
    expect(screen.getByRole('status')).toHaveTextContent('Loading account')
    expect(screen.queryByRole('form', { name: 'sign in' })).toBeNull()
  })
})
