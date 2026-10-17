/**
 * A tab whose session ended stays signed out, and says whose it was (#217).
 *
 * The audit's scenario: child B's tab, parent A's session shared. B's access
 * token ran out, the renewal was refused, the tab was signed out and sent to
 * /login, and the sign-in page found A's session and took the tab straight
 * into A's home. Nothing said anything had happened.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
  Trans: ({ children }: { children?: ReactNode }) => children ?? null,
}))

vi.mock('@/components/auth/LoginForm', () => ({
  LoginForm: ({ initialEmail }: { initialEmail?: string }) => (
    <form aria-label="sign in" data-email={initialEmail ?? ''} />
  ),
}))

import { queryClient } from '@/app/query/queryClient'
import { forgetHeldRefreshToken, readSessions, rememberSession, tabToken } from '@/lib/devSessions'
import { bindTab, initializeTab, readTabSignOut, signOutTab, tabNeedsAccountChoice, tabSignedOut } from '@/lib/tabAccount'
import { EntryPage } from '@/pages/entry/EntryPage'
import { httpClient, SESSION_UNREACHABLE } from '@/services/api/httpClient'
import { storedRefreshToken } from '@/services/auth/sessionRefresh'
import { currentSessionToken, useAuthStore } from '@/store/authStore'
import { mswServer } from '../mswServer'

const parentA = { email: 'a@test.stoaedu.ch', role: 'parent', name: 'Ada', accessToken: 'a-access', refreshToken: 'a-refresh' }
const childB = { id: 'b-id', email: 'b@test.stoaedu.ch', role: 'student', name: 'Bea', accessToken: 'b-access', refreshToken: 'b-refresh' }

let refreshAnswer: () => Response = () => HttpResponse.json({ detail: 'refused' }, { status: 401 })

beforeAll(() => mswServer.listen({ onUnhandledRequest: 'bypass' }))
afterAll(() => mswServer.close())
beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  refreshAnswer = () => HttpResponse.json({ detail: 'refused' }, { status: 401 })
  mswServer.use(
    http.get('https://api.test/things', () => HttpResponse.json({ detail: 'expired' }, { status: 401 })),
    http.post('https://api.test/auth/refresh', () => refreshAnswer()),
  )
  useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })
})
afterEach(() => {
  mswServer.resetHandlers()
  vi.unstubAllGlobals()
  queryClient.clear()
})

/** Parent A and child B are both saved; this tab is B's, on the page `path`. */
function childTabOn(path: string) {
  rememberSession(parentA)
  rememberSession(childB)
  bindTab(childB.accessToken, childB.refreshToken, childB)
  useAuthStore.setState({ accessToken: childB.accessToken, isAuthenticated: true })
  const assign = vi.fn()
  const [pathname, search = ''] = path.split('?')
  vi.stubGlobal('location', { ...window.location, pathname, search: search ? `?${search}` : '', hash: '', assign })
  return assign
}

describe('the session ending under the reader (#217)', () => {
  it('leaves the tab signed out, not on the parent’s account, across a refresh and a duplicate', async () => {
    const assign = childTabOn('/me?section=password')

    await expect(httpClient.get('/things')).rejects.toBeDefined()

    expect(assign).toHaveBeenCalledWith('/login')
    expect(currentSessionToken()).toBeNull()
    expect(storedRefreshToken()).toBeNull()
    expect(readTabSignOut()).toEqual({
      reason: 'expired',
      account: { id: 'b-id', email: 'b@test.stoaedu.ch', name: 'Bea', role: 'student' },
      returnTo: '/me?section=password',
    })

    // A refresh, or a duplicate of the tab (which copies its sessionStorage),
    // starts the tab again on the same storage.
    initializeTab()
    expect(currentSessionToken()).toBeNull()
    expect(tabSignedOut()).toBe(true)
    expect(tabNeedsAccountChoice()).toBe(false)
  })

  it('drops the saved account whose refresh token was refused, and only that one', async () => {
    childTabOn('/')

    await expect(httpClient.get('/things')).rejects.toBeDefined()

    expect(readSessions().map((entry) => entry.email)).toEqual(['a@test.stoaedu.ch'])
  })

  it('keeps a saved account that has signed in again elsewhere since', async () => {
    childTabOn('/')
    // B signed in again in another tab: a new session under the same address.
    rememberSession({ ...childB, accessToken: 'b-access-new', refreshToken: 'b-refresh-new' })

    await expect(httpClient.get('/things')).rejects.toBeDefined()

    expect(readSessions().map((entry) => entry.refreshToken).sort()).toEqual(['a-refresh', 'b-refresh-new'])
  })

  it('is not an ending when the server cannot be reached', async () => {
    const assign = childTabOn('/')
    refreshAnswer = () => HttpResponse.json({ detail: 'deploying' }, { status: 503 })

    await expect(httpClient.get('/things')).rejects.toMatchObject({ code: SESSION_UNREACHABLE })

    expect(assign).not.toHaveBeenCalled()
    expect(tabSignedOut()).toBe(false)
    expect(tabToken()).toBe('b-access')
    expect(readSessions()).toHaveLength(2)
  })

  it('forgets everything of the account’s the tab kept, and its cached answers', async () => {
    childTabOn('/')
    sessionStorage.setItem('stoa.ask', JSON.stringify({ ownerId: 'b-id', open: true }))
    sessionStorage.setItem('stoa_upload_handoff', '{}')
    queryClient.setQueryData(['auth', 'me'], { id: 'b-id' })

    await expect(httpClient.get('/things')).rejects.toBeDefined()

    expect(Object.keys(sessionStorage)).toEqual(['stoa_tab_state'])
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0)
  })
})

describe('signing out', () => {
  it('is remembered without naming anyone, and a refresh does not take the only saved account', () => {
    rememberSession(childB)
    bindTab(childB.accessToken, childB.refreshToken, childB)

    useAuthStore.getState().clearAuth()
    initializeTab()

    expect(readTabSignOut()).toEqual({ reason: 'signed-out' })
    expect(tabToken()).toBeNull()
  })
})

describe('the sign-in page after the session ended', () => {
  function Where() {
    const location = useLocation()
    return <p>{`at ${location.pathname}`}</p>
  }

  function renderLogin() {
    return render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<EntryPage />} />
            <Route path="*" element={<Where />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )
  }

  async function endChildSessionOn(path: string) {
    childTabOn(path)
    await expect(httpClient.get('/things')).rejects.toBeDefined()
    vi.unstubAllGlobals()
  }

  function signIn(user: { id: string; email: string; role: string; name: string }) {
    act(() => useAuthStore.getState().setAuth(user as never, `${user.id}-access`, `${user.id}-refresh`))
  }

  it('says whose session ended and has the form ready for that account', async () => {
    await endChildSessionOn('/me')

    renderLogin()

    expect(screen.getByText('auth:reauth.expiredTitle')).toBeInTheDocument()
    expect(screen.getByRole('form', { name: 'sign in' })).toHaveAttribute('data-email', 'b@test.stoaedu.ch')
    expect(screen.queryByText('Ada')).not.toBeInTheDocument()
  })

  it('takes the same account back to the page the tab was on', async () => {
    await endChildSessionOn('/me')
    renderLogin()

    signIn({ id: 'b-id', email: 'b@test.stoaedu.ch', role: 'student', name: 'Bea' })

    expect(screen.getByText('at /me')).toBeInTheDocument()
  })

  it('takes anyone else to their own home, even where they could follow', async () => {
    await endChildSessionOn('/me')
    renderLogin()

    // Another student: /me is a page they may see, and still not theirs to
    // be sent back to.
    signIn({ id: 'c-id', email: 'c@test.stoaedu.ch', role: 'student', name: 'Cy' })

    expect(screen.getByText('at /')).toBeInTheDocument()
  })

  it('takes a parent who signs in there to the parent home', async () => {
    await endChildSessionOn('/me')
    renderLogin()

    signIn({ id: 'a-id', email: 'a@test.stoaedu.ch', role: 'parent', name: 'Ada' })

    expect(screen.getByText('at /parent')).toBeInTheDocument()
  })

  it('takes the same account home once "another account" was chosen', async () => {
    await endChildSessionOn('/me')
    renderLogin()

    fireEvent.click(screen.getByRole('button', { name: 'auth:chooser.signInOther' }))
    expect(screen.getByRole('form', { name: 'sign in' })).toHaveAttribute('data-email', '')
    signIn({ id: 'b-id', email: 'b@test.stoaedu.ch', role: 'student', name: 'Bea' })

    expect(screen.getByText('at /')).toBeInTheDocument()
  })

  it('says so when the sign-in was signed out in another tab (#232)', () => {
    signOutTab({ reason: 'signed-out-elsewhere', account: { email: 'b@test.stoaedu.ch', name: 'Bea' } })

    renderLogin()

    expect(screen.getByText('auth:reauth.elsewhereTitle')).toBeInTheDocument()
    expect(screen.getByRole('form', { name: 'sign in' })).toHaveAttribute('data-email', 'b@test.stoaedu.ch')
  })

  it('shows the plain sign-in after signing out', () => {
    bindTab(childB.accessToken, childB.refreshToken, childB)
    useAuthStore.getState().clearAuth()

    renderLogin()

    expect(screen.getByText('auth:login.title')).toBeInTheDocument()
    expect(screen.getByRole('form', { name: 'sign in' })).toHaveAttribute('data-email', '')
  })
})

describe('forgetting a refused saved session', () => {
  it('matches the refresh token, not the address', () => {
    rememberSession(childB)
    rememberSession(parentA)

    forgetHeldRefreshToken('b-refresh-old')
    expect(readSessions()).toHaveLength(2)

    forgetHeldRefreshToken('b-refresh')
    expect(readSessions().map((entry) => entry.email)).toEqual(['a@test.stoaedu.ch'])
  })
})
