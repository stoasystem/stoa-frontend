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

  it('leaves the page alone until the load, so no guard can reject the new role', async () => {
    // Telling the store about the new role while the old role's page is still
    // mounted lets its route guard land on the forbidden page first.
    const assign = vi.fn()
    Object.defineProperty(window, 'location', {
      value: { assign, href: 'https://app.stoaedu.ch/chat' },
      writable: true,
    })
    rememberSession({
      email: 'parent@test.stoaedu.ch',
      role: 'parent',
      name: 'Demo Parent',
      accessToken: 'parent-token',
    })
    signedInAs('student@test.stoaedu.ch')
    const user = (await import('@testing-library/user-event')).default.setup()
    renderSwitcher()

    await user.click(screen.getByRole('button', { name: /student/i }))
    await user.click(screen.getByRole('button', { name: /parent · parent/i }))

    expect(assign).toHaveBeenCalledWith('/parent')
    // The store is untouched; the reload establishes the role.
    expect(useAuthStore.getState().user?.email).toBe('student@test.stoaedu.ch')
    expect(sessionStorage.getItem('stoa_tab_access_token')).toBe('parent-token')
  })

  it('sends each role to its own home rather than through the root', async () => {
    // Going through the root reloads before the role is known, which lands on
    // the forbidden page.
    const { getDefaultRouteForRole } = await import('@/lib/authRoutes')

    expect(getDefaultRouteForRole('parent')).toBe('/parent')
    expect(getDefaultRouteForRole('teacher')).toBe('/tutor')
    expect(getDefaultRouteForRole('admin')).toBe('/admin')
    expect(getDefaultRouteForRole('student')).toBe('/chat')
  })

  it('recognises which addresses are test accounts', () => {
    expect(isTestAccount('admin@test.stoaedu.ch')).toBe(true)
    expect(isTestAccount('AGENT@TEST.STOAEDU.CH')).toBe(true)
    expect(isTestAccount('someone@stoaedu.ch')).toBe(false)
    expect(isTestAccount('test.stoaedu.ch@gmail.com')).toBe(false)
    expect(isTestAccount(undefined)).toBe(false)
  })
})

describe('a tab holding its own role', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it('sends its own token, not the one the browser shares', async () => {
    // Without this the tab asks the server who it is using the previous
    // role's token, and the answer puts it straight back.
    localStorage.setItem('stoa_access_token', 'the-shared-one')
    pinTabToSession('this-tab-only')

    const { httpClient } = await import('@/services/api/httpClient')
    const handlers = (httpClient.interceptors.request as never as {
      handlers: { fulfilled: (config: unknown) => { headers: Record<string, string> } }[]
    }).handlers

    const config = handlers[0].fulfilled({
      url: '/students/me/profile',
      method: 'get',
      headers: {},
    })

    expect(config.headers.Authorization).toBe('Bearer this-tab-only')
  })

  it('sends the shared token when the tab has picked nothing', async () => {
    localStorage.setItem('stoa_access_token', 'the-shared-one')

    const { httpClient } = await import('@/services/api/httpClient')
    const handlers = (httpClient.interceptors.request as never as {
      handlers: { fulfilled: (config: unknown) => { headers: Record<string, string> } }[]
    }).handlers

    const config = handlers[0].fulfilled({
      url: '/students/me/profile',
      method: 'get',
      headers: {},
    })

    expect(config.headers.Authorization).toBe('Bearer the-shared-one')
  })
})
