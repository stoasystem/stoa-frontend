/**
 * The switcher is a convenience for the test accounts. What matters is that
 * nobody who registers is offered it, and that a tab keeps its own role.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/services/auth/authApi', () => ({ login: vi.fn() }))

import { RoleSwitcher } from '@/components/dev/RoleSwitcher'
import {
  isTestAccount,
  pinTabToSession,
  readSessions,
  rememberSession,
  tabToken,
} from '@/lib/devSessions'
import { useAuthStore } from '@/store/authStore'

function renderSwitcher() {
  const client = new QueryClient()
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
  return render(<RoleSwitcher />, { wrapper: Wrapper })
}

function signedInAs(email: string, role = 'student') {
  useAuthStore.setState({
    user: { id: 'u1', email, role, name: 'Someone' },
    isAuthenticated: true,
  } as never)
}

describe('switching between the test roles', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    useAuthStore.setState({ user: null, isAuthenticated: false } as never)
  })

  it('is not offered to somebody who registered', () => {
    signedInAs('a.real.student@gmail.com')

    renderSwitcher()

    expect(screen.queryByRole('button', { name: /student/i })).not.toBeInTheDocument()
  })

  it('is offered to a test account', () => {
    signedInAs('student@test.stoaedu.ch')

    renderSwitcher()

    expect(screen.getByRole('button', { name: /student/i })).toBeInTheDocument()
  })

  it('refuses to hold a session for anyone outside the test accounts', () => {
    rememberSession({
      email: 'a.real.parent@gmail.com',
      role: 'parent',
      name: 'Real',
      accessToken: 'token',
    })

    expect(readSessions()).toEqual([])
  })

  it('holds a session for a test account', () => {
    rememberSession({
      email: 'teacher@test.stoaedu.ch',
      role: 'teacher',
      name: 'Demo',
      accessToken: 'token-t',
    })

    expect(readSessions().map((entry) => entry.email)).toEqual(['teacher@test.stoaedu.ch'])
  })

  it('keeps one role per tab rather than one per browser', () => {
    localStorage.setItem('stoa_access_token', 'the-shared-one')

    pinTabToSession('this-tab-only')

    expect(tabToken()).toBe('this-tab-only')
    expect(localStorage.getItem('stoa_access_token')).toBe('the-shared-one')
  })

  it('reads a pinned tab ahead of the shared session', () => {
    // This is the path the app takes on every load.
    localStorage.setItem('stoa_access_token', 'the-shared-one')
    pinTabToSession('this-tab-only')

    useAuthStore.getState().hydrateFromStorage()

    expect(useAuthStore.getState().accessToken).toBe('this-tab-only')
  })

  it('falls back to the shared session in a tab that picked nothing', () => {
    localStorage.setItem('stoa_access_token', 'the-shared-one')

    useAuthStore.getState().hydrateFromStorage()

    expect(useAuthStore.getState().accessToken).toBe('the-shared-one')
  })

  it('recognises which addresses are test accounts', () => {
    expect(isTestAccount('admin@test.stoaedu.ch')).toBe(true)
    expect(isTestAccount('AGENT@TEST.STOAEDU.CH')).toBe(true)
    expect(isTestAccount('someone@stoaedu.ch')).toBe(false)
    expect(isTestAccount('test.stoaedu.ch@gmail.com')).toBe(false)
    expect(isTestAccount(undefined)).toBe(false)
  })
})
