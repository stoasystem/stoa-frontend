/**
 * The switcher is a convenience for the test accounts. What matters is that
 * nobody who registers is offered it, and that a tab keeps its own role.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
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
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true }) as never
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

    await waitFor(() => expect(assign).toHaveBeenCalledWith('/parent'))
    // The store is untouched; the reload establishes the role.
    expect(useAuthStore.getState().user?.email).toBe('student@test.stoaedu.ch')
    expect(sessionStorage.getItem('stoa_tab_access_token')).toBe('parent-token')
  })

  it('keeps the browser signed in when the held session has expired', async () => {
    // Adopting a dead token put it on the next request, and the 401 handler
    // answered by clearing the session this tab arrived with.
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 401 }) as never
    const assign = vi.fn()
    Object.defineProperty(window, 'location', {
      value: { assign, href: 'https://app.stoaedu.ch/chat' },
      writable: true,
    })
    localStorage.setItem('stoa_access_token', 'the-shared-one')
    rememberSession({
      email: 'parent@test.stoaedu.ch',
      role: 'parent',
      name: 'Demo Parent',
      accessToken: 'stale-parent-token',
    })
    signedInAs('student@test.stoaedu.ch')
    const user = (await import('@testing-library/user-event')).default.setup()
    renderSwitcher()

    await user.click(screen.getByRole('button', { name: /student/i }))
    await user.click(screen.getByRole('button', { name: /parent · parent/i }))

    await waitFor(() => expect(screen.getByText(/expired/i)).toBeInTheDocument())
    expect(assign).not.toHaveBeenCalled()
    expect(sessionStorage.getItem('stoa_tab_access_token')).toBeNull()
    expect(localStorage.getItem('stoa_access_token')).toBe('the-shared-one')
    expect(readSessions()).toHaveLength(0)
  })

  it('keeps the held role when the check could not be made', async () => {
    // Treating every failed check as a dead session deleted the stored token on
    // nothing worse than a dropped connection, and it cannot be recovered.
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('offline')) as never
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

    await waitFor(() => expect(screen.getByText(/could not reach/i)).toBeInTheDocument())
    expect(assign).not.toHaveBeenCalled()
    expect(readSessions()).toHaveLength(1)
    expect(sessionStorage.getItem('stoa_tab_access_token')).toBeNull()
  })

  it('keeps the held role when the server answers with a fault', async () => {
    // A 500 says nothing about the token, so the stored session stays.
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 }) as never
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

    await waitFor(() => expect(screen.getByText(/could not reach/i)).toBeInTheDocument())
    expect(readSessions()).toHaveLength(1)
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

  it('drops only the pin when the tab token is refused', async () => {
    // Clearing everything here took the session the rest of the browser shares
    // down with the expired one, so the whole app was signed out.
    const assign = vi.fn()
    Object.defineProperty(window, 'location', {
      value: { assign, pathname: '/chat' },
      writable: true,
    })
    localStorage.setItem('stoa_access_token', 'the-shared-one')
    pinTabToSession('this-tab-only')

    const { httpClient } = await import('@/services/api/httpClient')
    const handlers = (httpClient.interceptors.response as never as {
      handlers: { rejected: (error: unknown) => Promise<unknown> }[]
    }).handlers

    await expect(handlers[0].rejected({ response: { status: 401 } })).rejects.toBeTruthy()

    expect(tabToken()).toBeNull()
    expect(localStorage.getItem('stoa_access_token')).toBe('the-shared-one')
  })

  it('still signs out a tab that holds no pin', async () => {
    // The other half of the branch above. Without this, replacing the whole
    // handler with a bare releaseTab() left every test green while ordinary
    // users stopped being signed out on an expired token.
    const assign = vi.fn()
    Object.defineProperty(window, 'location', {
      value: { assign, pathname: '/chat' },
      writable: true,
    })
    localStorage.setItem('stoa_access_token', 'the-shared-one')

    const { httpClient } = await import('@/services/api/httpClient')
    const { useAuthStore } = await import('@/store/authStore')
    const handlers = (httpClient.interceptors.response as never as {
      handlers: { rejected: (error: unknown) => Promise<unknown> }[]
    }).handlers

    await expect(handlers[0].rejected({ response: { status: 401 } })).rejects.toBeTruthy()

    expect(localStorage.getItem('stoa_access_token')).toBeNull()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(assign).toHaveBeenCalledWith('/login')
  })
})
