/**
 * The sign-in page and the way in (#343, on map #324).
 *
 * S2: a tab that finds at start-up that the browser's sign-in ended or was
 *     replaced while it was closed or asleep remembers the page it was on, so
 *     the same person signing in again goes back there (docs/adr/0003).
 * S3: a signed-in tab on /login whose account is still being read, or could
 *     not be read, shows that, not an empty sign-in form: signing in from it
 *     would replace the browser's sign-in for every tab.
 * S4: a tab that signs out and then joins another account applies that
 *     account's language, not only the first account's.
 * S5: the German "invitation expired" sentence.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
  Trans: ({ children }: { children?: ReactNode }) => children ?? null,
}))

vi.mock('@/components/auth/LoginForm', () => ({
  LoginForm: () => <form aria-label="sign in" />,
}))

const changeLanguage = vi.fn<(language: string) => Promise<undefined>>(async () => undefined)
vi.mock('@/i18n', () => ({
  default: {
    get language() {
      return 'en'
    },
    changeLanguage: (language: string) => changeLanguage(language),
  },
}))

// The real read, unless a test says what it answered.
const accountRead = vi.hoisted(() => ({ answer: null as null | Record<string, unknown> }))
vi.mock('@/hooks/auth/accountRead', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/hooks/auth/accountRead')>()
  return {
    ...actual,
    useAccountRead: () => (accountRead.answer ?? actual.useAccountRead()) as ReturnType<typeof actual.useAccountRead>,
  }
})

import deAuth from '@/i18n/locales/de/auth.json'
import { useCurrentUserQuery } from '@/hooks/auth/useCurrentUserQuery'
import { initializeTab, joinBrowserSignIn, readTabSignOut, signInTab, signOutTab, tabToken } from '@/lib/tabAccount'
import { EntryPage } from '@/pages/entry/EntryPage'
import { useAuthStore } from '@/store/authStore'

const ada = { id: 'a', email: 'a@test.stoaedu.ch', name: 'Ada', role: 'parent' }
const bea = { id: 'b', email: 'b@test.stoaedu.ch', name: 'Bea', role: 'student' }

/** Run `act` as another tab of this browser: this tab's own storage is set aside. */
function inAnotherTab(act: () => void) {
  const mine = Object.fromEntries(Object.keys(sessionStorage).map((key) => [key, sessionStorage.getItem(key)]))
  const { user, accessToken, isAuthenticated } = useAuthStore.getState()
  sessionStorage.clear()
  try {
    act()
  } finally {
    sessionStorage.clear()
    for (const [key, value] of Object.entries(mine)) sessionStorage.setItem(key, value as string)
    useAuthStore.setState({ user, accessToken, isAuthenticated })
  }
}

function Where() {
  const location = useLocation()
  return <p>{`at ${location.pathname}${location.search}${location.hash}`}</p>
}

function renderLogin() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, enabled: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<EntryPage />} />
          <Route path="*" element={<Where />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  accountRead.answer = null
  changeLanguage.mockClear()
  useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 204, json: async () => undefined })))
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('S3: the sign-in page while this tab is signed in and its account is not in yet', () => {
  /** This tab is signed in as Ada, as after a refresh: the account is still to be read. */
  function signedInUnread() {
    useAuthStore.getState().setAuth(ada as never, 'ada-access', 'ada-refresh')
    useAuthStore.setState({ user: null })
  }

  it('says the account is loading, and offers no form to sign in over the session', () => {
    signedInUnread()

    renderLogin()

    expect(screen.getByRole('status')).toHaveTextContent('status.loadingAccount')
    expect(screen.queryByRole('form', { name: 'sign in' })).toBeNull()
  })

  it('says the read failed, with a retry and a sign-out, still with no form', () => {
    signedInUnread()
    accountRead.answer = { isError: true, fetchStatus: 'idle', refetch: vi.fn() }

    renderLogin()

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.queryByRole('form', { name: 'sign in' })).toBeNull()
    expect(tabToken()).toBe('ada-access')
  })

  it('lets the reader sign out from the failed read, and only then offers the form', async () => {
    signedInUnread()
    accountRead.answer = { isError: true, fetchStatus: 'idle', refetch: vi.fn() }
    renderLogin()

    fireEvent.click(screen.getByRole('button', { name: 'actions.logOut' }))

    await waitFor(() => expect(screen.getByRole('form', { name: 'sign in' })).toBeInTheDocument())
    expect(tabToken()).toBeNull()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it('waits on the read, then goes in once the account is read', () => {
    signedInUnread()
    renderLogin()
    expect(screen.getByRole('status')).toBeInTheDocument()

    act(() => useAuthStore.setState({ user: ada as never }))

    expect(screen.getByText('at /parent')).toBeInTheDocument()
  })
})

describe('S2: a tab that finds at start-up that its sign-in ended elsewhere', () => {
  function stubLocation(pathname: string, search = '', hash = '') {
    vi.stubGlobal('location', { ...window.location, pathname, search, hash, assign: vi.fn() })
  }

  /** This tab was on Ada's sign-in; another tab signed out and signed Ada in again. */
  function replacedBySameAccount() {
    useAuthStore.getState().setAuth(ada as never, 'ada-access', 'ada-refresh')
    inAnotherTab(() => {
      joinBrowserSignIn()
      signOutTab()
      signInTab('ada-access-2', 'ada-refresh-2', ada)
    })
  }

  it('remembers the page it opened on, query and hash included', () => {
    replacedBySameAccount()
    stubLocation('/parent/children/b/report', '?week=3', '#reading')

    initializeTab()

    expect(tabToken()).toBeNull()
    expect(readTabSignOut()).toMatchObject({
      reason: 'signed-out-elsewhere',
      account: { email: ada.email },
      returnTo: '/parent/children/b/report?week=3#reading',
    })
  })

  it('does not remember the sign-in page itself as the page to go back to', () => {
    replacedBySameAccount()
    stubLocation('/login')

    initializeTab()

    expect(readTabSignOut()).toEqual({ reason: 'signed-out-elsewhere', account: expect.objectContaining({ email: ada.email }) })
  })

  it('takes the same person, joined again, back to that page', async () => {
    replacedBySameAccount()
    stubLocation('/parent/children/b/report', '?week=3')
    initializeTab()
    vi.unstubAllGlobals()
    useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })

    renderLogin()
    await waitFor(() => expect(tabToken()).toBe('ada-access-2'))
    act(() => useAuthStore.setState({ user: ada as never }))

    expect(screen.getByText('at /parent/children/b/report?week=3')).toBeInTheDocument()
  })
})

describe('S2: what the remembered page is not', () => {
  function stubLocation(pathname: string) {
    vi.stubGlobal('location', { ...window.location, pathname, search: '', hash: '', assign: vi.fn() })
  }

  /** This tab was on Ada's sign-in when it closed; it starts on `pathname` after `elsewhere` happened. */
  function startAfter(elsewhere: () => void, pathname: string) {
    useAuthStore.getState().setAuth(ada as never, 'ada-access', 'ada-refresh')
    inAnotherTab(elsewhere)
    stubLocation(pathname)
    initializeTab()
    vi.unstubAllGlobals()
    useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })
  }

  it('is not where anyone else goes: continuing as another person lands on their own home', async () => {
    startAfter(() => signInTab('bea-access', 'bea-refresh', bea), '/parent/children/b/report')
    renderLogin()

    fireEvent.click(screen.getByRole('button', { name: 'auth:switched.continue' }))
    await waitFor(() => expect(tabToken()).toBe('bea-access'))
    act(() => useAuthStore.setState({ user: bea as never }))

    expect(screen.getByText('at /')).toBeInTheDocument()
  })

  it.each(['//evil.example/parent', '/\\evil.example/parent'])('is never off the site: %s goes home', async (pathname) => {
    startAfter(() => {
      joinBrowserSignIn()
      signOutTab()
      signInTab('ada-access-2', 'ada-refresh-2', ada)
    }, pathname)
    renderLogin()
    await waitFor(() => expect(tabToken()).toBe('ada-access-2'))

    act(() => useAuthStore.setState({ user: ada as never }))

    expect(screen.getByText('at /parent')).toBeInTheDocument()
  })
})

describe('S4: the language of each account this tab joins', () => {
  function readAs(id: string, preferredLocale: string) {
    accountRead.answer = { data: { id, email: `${id}@test.stoaedu.ch`, name: id, role: 'student', preferredLocale } }
  }

  it('applies the next account\'s language after signing out and joining it', () => {
    readAs('a', 'de')
    const { rerender } = renderHook(() => useCurrentUserQuery())
    expect(changeLanguage).toHaveBeenLastCalledWith('de')

    readAs('b', 'fr')
    rerender()

    expect(changeLanguage).toHaveBeenLastCalledWith('fr')
  })

  it('still does not re-apply one account\'s stored language on a later read of it', () => {
    readAs('a', 'de')
    const { rerender } = renderHook(() => useCurrentUserQuery())
    changeLanguage.mockClear()

    // The reader switched to Italian; the read that follows the switcher's
    // write can still carry the old preference.
    readAs('a', 'de')
    rerender()

    expect(changeLanguage).not.toHaveBeenCalled()
  })
})

describe('S5: the German "invitation expired" sentence', () => {
  it('addresses the teacher formally and asks once', () => {
    const text = deAuth.activate.errors.invitation_expired

    expect(text).toBe('Diese Einladung ist abgelaufen. Bitten Sie um eine neue Einladung.')
    expect(text.match(/bitte/gi)).toHaveLength(1)
  })
})
