/**
 * The old password address, /settings/password (#412, part 3).
 *
 * It is the password change of teachers and parents, and of any account
 * under a forced change; a student who opens it otherwise is sent to /me.
 * Two things went wrong there:
 *
 * - the student landed at the top of /me, not on its password section
 *   (`#password`, where the avatar menu's "Change password" leads);
 * - with a session whose account was not read yet (a reload), the page
 *   decided on the missing account as "not a student" and showed the
 *   teachers' and parents' change first, and kept showing it for good when
 *   /auth/me failed with anything but a 401.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import { AppRoutes } from '@/app/router/AppRoutes'
import { accountMenuFor } from '@/components/shell/accountMenuTargets'
import { type CurrentUser, useAuthStore } from '@/store/authStore'
import type { UserRole } from '@/types/user'
import { mswServer } from '../mswServer'
import { openAs } from './routeHarness'

vi.mock('@/app/router/lazyPage', () => import('./lazyPageStub'))

function account(role: UserRole, mustChangePassword = false): CurrentUser {
  return { id: `${role}-1`, name: 'Ada', email: `${role}@example.com`, role, mustChangePassword } as CurrentUser
}

let where = ''
function Where() {
  const location = useLocation()
  where = `${location.pathname}${location.search}${location.hash}`
  return null
}

/** A reload on /settings/password: the session is there, its account is not yet. */
function reloadOnPasswordAddress() {
  useAuthStore.setState({ user: null, accessToken: 'token', isAuthenticated: true })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/settings/password']}>
        <AppRoutes />
        <Where />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const page = () => screen.queryByTestId('page')?.textContent ?? null

beforeAll(async () => {
  mswServer.listen({ onUnhandledRequest: 'error' })
  await i18n.changeLanguage('en')
})
afterAll(() => mswServer.close())
beforeEach(() => {
  where = ''
})
afterEach(() => {
  mswServer.resetHandlers()
  useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })
})

describe('a student on the old address', () => {
  it('lands on the password section of /me', () => {
    const landed = openAs('student', '/settings/password')

    expect(landed).toMatchObject({ pathname: '/me', hash: '#password', page: 'MePage' })
  })

  it('lands where the avatar menu leads a student to change it', () => {
    const landed = openAs('student', '/settings/password')

    expect(`${landed.pathname}${landed.hash}`).toBe(accountMenuFor('student').password)
  })

  it.each(['teacher', 'parent'] as const)('leaves a %s on the page, without a hash', (role) => {
    expect(openAs(role, '/settings/password')).toMatchObject({
      pathname: '/settings/password',
      hash: '',
      page: 'ChangePasswordPage',
    })
  })
})

describe('a reload on the old address, before the account is read', () => {
  it('shows that the account is loading, not the teachers\' and parents\' page', () => {
    // Never answered: the read stays under way.
    mswServer.use(http.get('https://api.test/auth/me', () => new Promise<Response>(() => {})))
    reloadOnPasswordAddress()

    expect(screen.getByRole('status')).toHaveTextContent('Loading account')
    expect(page()).toBeNull()
    expect(where).toBe('/settings/password')
  })

  it('sends a student on to /me#password once the account is in, without showing the other page first', () => {
    mswServer.use(http.get('https://api.test/auth/me', () => new Promise<Response>(() => {})))
    reloadOnPasswordAddress()
    expect(page()).toBeNull()

    act(() => useAuthStore.setState({ user: account('student') }))

    expect(where).toBe('/me#password')
    expect(page()).toBe('MePage')
  })

  it.each(['teacher', 'parent'] as const)('shows a %s the page once the account is in', (role) => {
    mswServer.use(http.get('https://api.test/auth/me', () => new Promise<Response>(() => {})))
    reloadOnPasswordAddress()

    act(() => useAuthStore.setState({ user: account(role) }))

    expect(where).toBe('/settings/password')
    expect(page()).toBe('ChangePasswordPage')
  })

  it('keeps a reset student on the change once the account is in', () => {
    mswServer.use(http.get('https://api.test/auth/me', () => new Promise<Response>(() => {})))
    reloadOnPasswordAddress()

    act(() => useAuthStore.setState({ user: account('student', true) }))

    expect(where).toBe('/settings/password')
    expect(page()).toBe('ChangePasswordPage')
  })

  it('says the account could not be read, with a retry and a sign-out, when /auth/me fails', async () => {
    mswServer.use(
      http.get('https://api.test/auth/me', () =>
        HttpResponse.json({ code: 'internal_error', message: 'boom' }, { status: 500 }),
      ),
    )
    reloadOnPasswordAddress()

    expect(await screen.findByRole('alert')).toHaveTextContent('Your account could not be loaded')
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Log out' })).toBeInTheDocument()
    expect(page()).toBeNull()
  })
})
