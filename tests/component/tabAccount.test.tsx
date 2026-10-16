/**
 * Each tab holds its own account (#216, docs/adr/0002).
 *
 * Every unpinned tab read the browser's one shared session, so a sign-in, an
 * added account or a switch in one tab changed who every other tab was, while
 * their screens still showed the previous person. Now a tab changes account
 * only by something done in that tab.
 *
 * jsdom has one sessionStorage, so "another tab" here is the same window with
 * this tab's sessionStorage set aside while the other one acts: what the other
 * tab can reach is what every tab shares, localStorage.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
  Trans: ({ children }: { children?: ReactNode }) => children ?? null,
}))

vi.mock('@/components/auth/LoginForm', () => ({
  LoginForm: () => <form aria-label="sign in" />,
}))

import { pinTabToSession, readSessions, rememberSession, tabToken, TAB_TOKEN_KEY } from '@/lib/devSessions'
import {
  bindTab,
  initializeTab,
  migrateSharedSession,
  tabNeedsAccountChoice,
  tabSignedOut,
} from '@/lib/tabAccount'
import { EntryPage } from '@/pages/entry/EntryPage'
import { httpClient } from '@/services/api/httpClient'
import { storedRefreshToken } from '@/services/auth/sessionRefresh'
import { currentSessionToken, useAuthStore } from '@/store/authStore'

const TAB_REFRESH = 'stoa_tab_refresh_token'
const ada = { id: 'a', email: 'a@test.stoaedu.ch', name: 'Ada', role: 'parent' } as never
const bea = { id: 'b', email: 'b@test.stoaedu.ch', name: 'Bea', role: 'student' } as never
const cy = { id: 'c', email: 'c@test.stoaedu.ch', name: 'Cy', role: 'teacher' } as never

function held(email: string, role: string, name: string, token: string) {
  return { email, role, name, accessToken: `${token}-access`, refreshToken: `${token}-refresh` }
}

/** Run `act` as another tab of this browser: this tab's own storage is set aside. */
function inAnotherTab(act: () => void) {
  const mine = Object.fromEntries(Object.keys(sessionStorage).map((key) => [key, sessionStorage.getItem(key)]))
  sessionStorage.clear()
  try {
    act()
  } finally {
    sessionStorage.clear()
    for (const [key, value] of Object.entries(mine)) sessionStorage.setItem(key, value as string)
    useAuthStore.setState({ accessToken: tabToken(), isAuthenticated: Boolean(tabToken()) })
  }
}

/** The Authorization header this tab's next request would carry. */
function sentAs(): unknown {
  const handlers = (httpClient.interceptors.request as never as {
    handlers: { fulfilled: (config: unknown) => { headers: Record<string, string> } }[]
  }).handlers
  return handlers[0].fulfilled({ url: '/students/me/profile', method: 'get', headers: {} }).headers.Authorization
}

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('another tab cannot change who this tab is (#216)', () => {
  beforeEach(() => {
    // This tab, X, is Ada.
    useAuthStore.getState().setAuth(ada, 'a-access', 'a-refresh')
    rememberSession(held('a@test.stoaedu.ch', 'parent', 'Ada', 'a'))
  })

  function expectStillAda() {
    expect(currentSessionToken()).toBe('a-access')
    expect(storedRefreshToken()).toBe('a-refresh')
    expect(sentAs()).toBe('Bearer a-access')
  }

  it('when another tab signs out and signs in as someone else', () => {
    inAnotherTab(() => {
      bindTab('a-access', 'a-refresh')
      useAuthStore.getState().clearAuth()
      useAuthStore.getState().setAuth(bea, 'b-access', 'b-refresh')
    })

    expectStillAda()
  })

  it('when another tab adds an account', () => {
    inAnotherTab(() => {
      // /login?add=1 in a tab that was never pinned: what used to write the
      // shared session.
      useAuthStore.getState().setAuth(cy, 'c-access', 'c-refresh')
      rememberSession(held('c@test.stoaedu.ch', 'teacher', 'Cy', 'c'))
    })

    expectStillAda()
  })

  it('when another tab switches to a saved account', () => {
    inAnotherTab(() => bindTab('b-access', 'b-refresh'))

    expectStillAda()
  })

  it('and none of it is written where another tab could read it', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    useAuthStore.getState().updateAccessToken('a-access-2')
    useAuthStore.getState().setAuth(bea, 'b-access', 'b-refresh')
    useAuthStore.getState().clearAuth()

    const sharedWrites = setItem.mock.contexts
      .map((context, index) => [context, setItem.mock.calls[index][0]] as const)
      .filter(([context]) => context === localStorage)
      .map(([, key]) => key)
    expect(sharedWrites).toEqual([])
    setItem.mockRestore()
  })
})

describe('a tab keeps its account', () => {
  it('across a refresh or a duplicated tab, whatever is saved', () => {
    // Refreshing or duplicating keeps (or copies) sessionStorage; the
    // start-up runs again on it.
    bindTab('b-access', 'b-refresh')
    rememberSession(held('a@test.stoaedu.ch', 'parent', 'Ada', 'a'))
    rememberSession(held('c@test.stoaedu.ch', 'teacher', 'Cy', 'c'))

    initializeTab()

    expect(tabToken()).toBe('b-access')
    expect(storedRefreshToken()).toBe('b-refresh')
    expect(tabNeedsAccountChoice()).toBe(false)
  })

  it('stays signed out once its sign-in ended, even with only one saved account', () => {
    bindTab('b-access', 'b-refresh')
    rememberSession(held('a@test.stoaedu.ch', 'parent', 'Ada', 'a'))
    useAuthStore.getState().clearAuth()

    initializeTab()

    expect(tabSignedOut()).toBe(true)
    expect(tabToken()).toBeNull()
    expect(tabNeedsAccountChoice()).toBe(false)
  })

  it('leaves the signed-out state only by a sign-in in this tab', () => {
    useAuthStore.getState().clearAuth()

    useAuthStore.getState().setAuth(bea, 'b-access', 'b-refresh')

    expect(tabSignedOut()).toBe(false)
    expect(tabToken()).toBe('b-access')
  })
})

describe('a new tab', () => {
  it('with no saved account has none', () => {
    initializeTab()

    expect(tabToken()).toBeNull()
    expect(tabNeedsAccountChoice()).toBe(false)
  })

  it('with exactly one saved account takes it, refresh token and all', () => {
    rememberSession(held('b@test.stoaedu.ch', 'student', 'Bea', 'b'))

    initializeTab()

    expect(tabToken()).toBe('b-access')
    expect(storedRefreshToken()).toBe('b-refresh')
  })

  it('with several saved accounts takes none and asks', () => {
    rememberSession(held('a@test.stoaedu.ch', 'parent', 'Ada', 'a'))
    rememberSession(held('b@test.stoaedu.ch', 'student', 'Bea', 'b'))

    initializeTab()

    expect(tabToken()).toBeNull()
    expect(sessionStorage.getItem(TAB_REFRESH)).toBeNull()
    expect(tabNeedsAccountChoice()).toBe(true)
  })
})

describe('the move off the shared session, once (#216)', () => {
  it('hands the shared refresh token to the saved account holding its access token, if it has none', () => {
    rememberSession({ email: 'a@test.stoaedu.ch', role: 'parent', name: 'Ada', accessToken: 'a-access' })
    localStorage.setItem('stoa_access_token', 'a-access')
    localStorage.setItem('stoa_refresh_token', 'a-refresh')

    migrateSharedSession()

    expect(readSessions().map((entry) => [entry.accessToken, entry.refreshToken])).toEqual([['a-access', 'a-refresh']])
    expect(localStorage.getItem('stoa_access_token')).toBeNull()
    expect(localStorage.getItem('stoa_refresh_token')).toBeNull()
  })

  it('never overwrites what a saved account already holds', () => {
    rememberSession(held('a@test.stoaedu.ch', 'parent', 'Ada', 'a'))
    localStorage.setItem('stoa_access_token', 'a-access')
    localStorage.setItem('stoa_refresh_token', 'stale-refresh')

    migrateSharedSession()

    expect(readSessions().map((entry) => entry.refreshToken)).toEqual(['a-refresh'])
  })

  it('drops a shared session no saved account holds: the token does not say whose it is', () => {
    localStorage.setItem('stoa_access_token', 'orphan-access')
    localStorage.setItem('stoa_refresh_token', 'orphan-refresh')

    initializeTab()

    expect(readSessions()).toEqual([])
    expect(tabToken()).toBeNull()
    expect(localStorage.getItem('stoa_access_token')).toBeNull()
  })

  it('keeps a tab that was pinned on its account', () => {
    pinTabToSession('b-access')
    sessionStorage.setItem(TAB_REFRESH, 'b-refresh')
    localStorage.setItem('stoa_access_token', 'a-access')
    rememberSession(held('a@test.stoaedu.ch', 'parent', 'Ada', 'a'))

    initializeTab()

    expect(tabToken()).toBe('b-access')
    expect(storedRefreshToken()).toBe('b-refresh')
  })

  it('starts a tab that was not pinned as a new tab, not as the shared account', () => {
    rememberSession(held('a@test.stoaedu.ch', 'parent', 'Ada', 'a'))
    rememberSession(held('b@test.stoaedu.ch', 'student', 'Bea', 'b'))
    localStorage.setItem('stoa_access_token', 'a-access')
    localStorage.setItem('stoa_refresh_token', 'a-refresh')

    initializeTab()

    expect(tabToken()).toBeNull()
    expect(tabNeedsAccountChoice()).toBe(true)
  })
})

describe('the account chooser', () => {
  function renderAt(entry = '/login') {
    return render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter initialEntries={[entry]}>
          <Routes>
            <Route path="/login" element={<EntryPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )
  }

  beforeEach(() => {
    rememberSession(held('a@test.stoaedu.ch', 'parent', 'Ada', 'a'))
    rememberSession(held('b@test.stoaedu.ch', 'student', 'Bea', 'b'))
  })

  it('lists the saved accounts and asks for nothing before one is chosen', () => {
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)

    renderAt()

    expect(screen.getByText('Ada')).toBeInTheDocument()
    expect(screen.getByText('Bea')).toBeInTheDocument()
    expect(screen.queryByRole('form', { name: 'sign in' })).not.toBeInTheDocument()
    expect(fetch).not.toHaveBeenCalled()
    expect(tabToken()).toBeNull()
  })

  it('puts this tab on the account chosen, and loads it', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 200 })))
    const assign = vi.fn()
    vi.stubGlobal('location', { ...window.location, assign })

    renderAt()
    fireEvent.click(screen.getByText('Bea'))

    await waitFor(() => expect(assign).toHaveBeenCalledWith('/'))
    expect(tabToken()).toBe('b-access')
    expect(storedRefreshToken()).toBe('b-refresh')
  })

  it('offers signing in with another account instead', () => {
    renderAt()

    fireEvent.click(screen.getByRole('button', { name: 'auth:chooser.signInOther' }))

    expect(screen.getByRole('form', { name: 'sign in' })).toBeInTheDocument()
  })

  it('is not shown to a tab whose sign-in ended', () => {
    useAuthStore.getState().clearAuth()

    renderAt()

    expect(screen.getByRole('form', { name: 'sign in' })).toBeInTheDocument()
  })

  it('is not shown for "add another account"', () => {
    renderAt('/login?add=1')

    expect(screen.getByRole('form', { name: 'sign in' })).toBeInTheDocument()
  })
})

it('keeps the tab’s token under the key every part of the app reads', () => {
  bindTab('x-access', 'x-refresh')
  expect(sessionStorage.getItem(TAB_TOKEN_KEY)).toBe('x-access')
})
