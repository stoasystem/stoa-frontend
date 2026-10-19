/**
 * One account per browser (#320, docs/adr/0003, superseding the multi-account
 * parts of 0002).
 *
 * The browser has one sign-in; every tab joins it, and signing out or signing
 * in as someone else in one tab signs the others out of the previous one. A
 * tab never goes on sending one account's token under a screen that shows it
 * while the browser has moved on, and is never put on another account while
 * it shows one: it signs out, and its sign-in page says who is signed in now.
 *
 * jsdom has one sessionStorage, so "another tab" here is the same window with
 * this tab's sessionStorage set aside while the other one acts: what the other
 * tab can reach is what every tab shares, localStorage. Its storage event is
 * raised by hand, as the browser raises it in every other tab.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
  Trans: ({ children }: { children?: ReactNode }) => children ?? null,
}))

vi.mock('@/components/auth/LoginForm', () => ({
  LoginForm: ({ initialEmail }: { initialEmail?: string }) => <form aria-label="sign in" data-email={initialEmail ?? ''} />,
}))

import {
  BROWSER_SIGN_IN_KEY,
  initializeTab,
  joinBrowserSignIn,
  readBrowserSignIn,
  readTabSignOut,
  signInTab,
  signOutTab,
  TAB_TOKEN_KEY,
  tabToken,
} from '@/lib/tabAccount'
import { holdTestRole, readTestRoles } from '@/lib/testRoles'
import { EntryPage } from '@/pages/entry/EntryPage'
import { httpClient } from '@/services/api/httpClient'
import { listenForBrowserSignInChanges } from '@/services/auth/browserSignInChanges'
import { storedRefreshToken } from '@/services/auth/sessionRefresh'
import { useAuthStore } from '@/store/authStore'

const ada = { id: 'a', email: 'a@test.stoaedu.ch', name: 'Ada', role: 'parent' }
const bea = { id: 'b', email: 'b@test.stoaedu.ch', name: 'Bea', role: 'student' }

/** Run `act` as another tab of this browser: this tab's own storage is set aside. */
function inAnotherTab(act: () => void) {
  const mine = Object.fromEntries(Object.keys(sessionStorage).map((key) => [key, sessionStorage.getItem(key)]))
  // The store is this tab's memory, which the other tab does not share either.
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

/** The storage event the browser raises in this tab when another one changes the sign-in. */
function storageEventHere() {
  window.dispatchEvent(
    new StorageEvent('storage', {
      key: BROWSER_SIGN_IN_KEY,
      newValue: localStorage.getItem(BROWSER_SIGN_IN_KEY),
      storageArea: localStorage,
    }),
  )
}

/** The Authorization header this tab's next request would carry; throws if it may send none. */
function sentAs(): unknown {
  const handlers = (httpClient.interceptors.request as never as {
    handlers: { fulfilled: (config: unknown) => { headers: Record<string, string> } }[]
  }).handlers
  return handlers[0].fulfilled({ url: '/students/me/profile', method: 'get', headers: {} }).headers.Authorization
}

function stubLocation(pathname = '/parent') {
  const assign = vi.fn()
  vi.stubGlobal('location', { ...window.location, pathname, search: '', hash: '', assign })
  return assign
}

/** Every POST /auth/logout and /auth/refresh this browser sends, answered as given. */
function stubServer(answer: (url: string, body: Record<string, string>) => { status: number; json?: unknown } = () => ({ status: 204 })) {
  const sent: Array<{ url: string; body: Record<string, string> }> = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: RequestInit) => {
      const body = init?.body ? (JSON.parse(String(init.body)) as Record<string, string>) : {}
      sent.push({ url: String(url), body })
      const reply = answer(String(url), body)
      return { ok: reply.status < 300, status: reply.status, json: async () => reply.json }
    }),
  )
  return sent
}

function renderEntry() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, enabled: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<EntryPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })
  stubServer()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('signing in', () => {
  it('makes it the browser\'s one sign-in, and puts this tab on it', () => {
    useAuthStore.getState().setAuth(ada as never, 'ada-access', 'ada-refresh')

    expect(readBrowserSignIn()).toMatchObject({ accessToken: 'ada-access', refreshToken: 'ada-refresh', account: { email: ada.email } })
    expect(tabToken()).toBe('ada-access')
    expect(sentAs()).toBe('Bearer ada-access')
  })

  it('keeps no list of accounts anywhere', () => {
    useAuthStore.getState().setAuth(ada as never, 'ada-access', 'ada-refresh')
    useAuthStore.getState().setAuth(bea as never, 'bea-access', 'bea-refresh')

    expect(Object.keys(localStorage)).toEqual([BROWSER_SIGN_IN_KEY])
    expect(readBrowserSignIn()).toMatchObject({ accessToken: 'bea-access' })
  })

  it('ends the sign-in it replaces on the server, through the existing logout', async () => {
    const sent = stubServer()
    useAuthStore.getState().setAuth(ada as never, 'ada-access', 'ada-refresh')
    useAuthStore.getState().setAuth(bea as never, 'bea-access', 'bea-refresh')

    await waitFor(() => expect(sent.map((call) => [call.url, call.body.access_token])).toEqual([['https://api.test/auth/logout', 'ada-access']]))
  })

  it('does not end a sign-in the role switcher holds', async () => {
    const sent = stubServer()
    useAuthStore.getState().setAuth(ada as never, 'ada-access', 'ada-refresh')
    holdTestRole({ email: ada.email, role: 'parent', name: 'Ada', accessToken: 'ada-access', refreshToken: 'ada-refresh' })
    useAuthStore.getState().setAuth(bea as never, 'bea-access', 'bea-refresh')

    await Promise.resolve()
    expect(sent).toEqual([])
  })
})

describe('signing out in one tab', () => {
  it('signs the other tabs out at once, saying so and naming the account', () => {
    const assign = stubLocation('/parent/children')
    const stop = listenForBrowserSignInChanges()
    useAuthStore.getState().setAuth(ada as never, 'ada-access', 'ada-refresh')

    inAnotherTab(() => {
      joinBrowserSignIn()
      signOutTab()
    })
    storageEventHere()
    stop()

    expect(readBrowserSignIn()).toBeNull()
    expect(tabToken()).toBeNull()
    expect(storedRefreshToken()).toBeNull()
    expect(readTabSignOut()).toEqual({ reason: 'signed-out-elsewhere', account: expect.objectContaining({ email: ada.email }), returnTo: '/parent/children' })
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(assign).toHaveBeenCalledWith('/login')
  })

  it('sends nothing more as that account, even from a tab that missed the event', () => {
    const assign = stubLocation()
    useAuthStore.getState().setAuth(ada as never, 'ada-access', 'ada-refresh')

    inAnotherTab(() => {
      joinBrowserSignIn()
      signOutTab()
    })

    expect(() => sentAs()).toThrow()
    expect(tabToken()).toBeNull()
    expect(assign).toHaveBeenCalledWith('/login')
  })

  it('stays signed out across a refresh, and a new tab opens signed out too', () => {
    useAuthStore.getState().setAuth(ada as never, 'ada-access', 'ada-refresh')
    inAnotherTab(() => {
      joinBrowserSignIn()
      signOutTab()
    })

    initializeTab()
    expect(tabToken()).toBeNull()
    expect(readTabSignOut()?.reason).toBe('signed-out-elsewhere')

    inAnotherTab(() => {
      initializeTab()
      expect(tabToken()).toBeNull()
    })
  })

  it('leaves alone a tab that has no account', () => {
    const assign = stubLocation('/login')
    const stop = listenForBrowserSignInChanges()
    inAnotherTab(() => useAuthStore.getState().setAuth(ada as never, 'ada-access', 'ada-refresh'))
    inAnotherTab(() => {
      joinBrowserSignIn()
      signOutTab()
    })
    storageEventHere()
    stop()

    expect(readTabSignOut()).toBeNull()
    expect(assign).not.toHaveBeenCalled()
  })
})

describe('another tab signing in as someone else', () => {
  it('signs this tab out at once instead of showing the new account under the old one', () => {
    const assign = stubLocation('/parent')
    const stop = listenForBrowserSignInChanges()
    useAuthStore.getState().setAuth(ada as never, 'ada-access', 'ada-refresh')

    inAnotherTab(() => signInTab('bea-access', 'bea-refresh', bea))
    storageEventHere()
    stop()

    expect(tabToken()).toBeNull()
    expect(readTabSignOut()).toMatchObject({ reason: 'signed-out-elsewhere', account: { email: ada.email } })
    expect(assign).toHaveBeenCalledWith('/login')
    // The browser stays on Bea: this tab only signed itself out.
    expect(readBrowserSignIn()).toMatchObject({ accessToken: 'bea-access' })
  })

  it('never sends the old account\'s token after the change, even without the event', () => {
    stubLocation()
    useAuthStore.getState().setAuth(ada as never, 'ada-access', 'ada-refresh')

    inAnotherTab(() => signInTab('bea-access', 'bea-refresh', bea))

    expect(() => sentAs()).toThrow()
    expect(tabToken()).toBeNull()
  })

  it('never puts this tab on the new account by itself, not on a refresh either', () => {
    useAuthStore.getState().setAuth(ada as never, 'ada-access', 'ada-refresh')
    inAnotherTab(() => signInTab('bea-access', 'bea-refresh', bea))

    initializeTab()

    expect(tabToken()).toBeNull()
    expect(readTabSignOut()).toMatchObject({ reason: 'signed-out-elsewhere', account: { email: ada.email } })
  })

  it('has the sign-in page say who is signed in now, and continue as them only when asked', async () => {
    useAuthStore.getState().setAuth(ada as never, 'ada-access', 'ada-refresh')
    inAnotherTab(() => signInTab('bea-access', 'bea-refresh', bea))
    initializeTab()
    useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })

    renderEntry()

    expect(screen.getByText('auth:switched.title')).toBeInTheDocument()
    expect(tabToken()).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'auth:switched.continue' }))

    expect(tabToken()).toBe('bea-access')
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
  })

  it('lets the reader sign in as someone else there instead', () => {
    useAuthStore.getState().setAuth(ada as never, 'ada-access', 'ada-refresh')
    inAnotherTab(() => signInTab('bea-access', 'bea-refresh', bea))
    initializeTab()
    useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })

    renderEntry()
    fireEvent.click(screen.getByRole('button', { name: 'auth:login.signInOther' }))

    expect(screen.getByRole('form', { name: 'sign in' })).toHaveAttribute('data-email', '')
    expect(tabToken()).toBeNull()
  })
})

describe('a tab keeps its account', () => {
  it('across a refresh or a duplicated tab', () => {
    useAuthStore.getState().setAuth(ada as never, 'ada-access', 'ada-refresh')

    initializeTab()

    expect(tabToken()).toBe('ada-access')
    expect(storedRefreshToken()).toBe('ada-refresh')
    expect(sentAs()).toBe('Bearer ada-access')
  })

  it('and its renewals reach the browser\'s sign-in, so a new tab joins with them', () => {
    useAuthStore.getState().setAuth(ada as never, 'ada-access', 'ada-refresh')

    useAuthStore.getState().updateAccessToken('ada-access-2')

    expect(readBrowserSignIn()).toMatchObject({ accessToken: 'ada-access-2', refreshToken: 'ada-refresh' })
    inAnotherTab(() => {
      initializeTab()
      expect(tabToken()).toBe('ada-access-2')
    })
  })
})

describe('a new tab', () => {
  it('joins the browser\'s sign-in, refresh token and all', () => {
    inAnotherTab(() => useAuthStore.getState().setAuth(ada as never, 'ada-access', 'ada-refresh'))

    initializeTab()

    expect(tabToken()).toBe('ada-access')
    expect(storedRefreshToken()).toBe('ada-refresh')
  })

  it('has no account while the browser is signed out', () => {
    initializeTab()

    expect(tabToken()).toBeNull()
    expect(readTabSignOut()).toBeNull()
  })
})

describe('the sign-in page while the browser is signed in', () => {
  it('goes into the app: the tab joins the browser\'s sign-in', async () => {
    inAnotherTab(() => useAuthStore.getState().setAuth(ada as never, 'ada-access', 'ada-refresh'))

    renderEntry()

    await waitFor(() => expect(tabToken()).toBe('ada-access'))
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
    expect(screen.queryByRole('form', { name: 'sign in' })).toBeNull()
  })

  it('goes in from a tab that was signed out, once another tab signs in', async () => {
    signOutTab()
    renderEntry()
    expect(screen.getByRole('form', { name: 'sign in' })).toBeInTheDocument()

    act(() => {
      inAnotherTab(() => useAuthStore.getState().setAuth(ada as never, 'ada-access', 'ada-refresh'))
      storageEventHere()
    })

    await waitFor(() => expect(tabToken()).toBe('ada-access'))
  })

  it('goes back in as the same account whose session this tab saw end', async () => {
    useAuthStore.getState().setAuth(ada as never, 'ada-access', 'ada-refresh')
    inAnotherTab(() => {
      joinBrowserSignIn()
      signOutTab()
    })
    initializeTab()
    inAnotherTab(() => useAuthStore.getState().setAuth(ada as never, 'ada-access-2', 'ada-refresh-2'))
    useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })

    renderEntry()

    await waitFor(() => expect(tabToken()).toBe('ada-access-2'))
    expect(screen.queryByText('auth:switched.title')).toBeNull()
  })
})

describe('the one-off move off the saved accounts (#320)', () => {
  const saved = (entries: object[]) => localStorage.setItem('stoa_dev_sessions', JSON.stringify(entries))
  const entry = (who: { email: string; name: string; role: string }, token: string, savedAt: string) => ({
    ...who,
    accessToken: `${token}-access`,
    refreshToken: `${token}-refresh`,
    savedAt,
  })

  it('keeps this tab\'s sign-in, drops the list, and ends every other saved one on the server', async () => {
    const sent = stubServer()
    saved([entry(ada, 'ada', '2026-10-18T10:00:00Z'), entry(bea, 'bea', '2026-10-18T09:00:00Z')])
    // A tab from before #320: a token of its own and no sign-in id.
    sessionStorage.setItem(TAB_TOKEN_KEY, 'bea-access')
    sessionStorage.setItem('stoa_tab_refresh_token', 'bea-refresh')

    initializeTab()

    expect(localStorage.getItem('stoa_dev_sessions')).toBeNull()
    expect(readBrowserSignIn()).toMatchObject({ accessToken: 'bea-access', refreshToken: 'bea-refresh' })
    expect(tabToken()).toBe('bea-access')
    expect(sentAs()).toBe('Bearer bea-access')
    await waitFor(() => expect(sent.map((call) => call.body.access_token)).toEqual(['ada-access']))
  })

  it('keeps the saved account when the list holds only one person, and the tab joins it', async () => {
    const sent = stubServer()
    saved([entry(bea, 'bea-old', '2026-10-18T10:00:00Z'), entry(bea, 'bea', '2026-10-18T12:00:00Z')])

    initializeTab()

    expect(readBrowserSignIn()).toMatchObject({ accessToken: 'bea-access', account: { email: bea.email } })
    expect(tabToken()).toBe('bea-access')
    await waitFor(() => expect(sent.map((call) => call.body.access_token)).toEqual(['bea-old-access']))
  })

  it('keeps nobody when no tab is signed in and the list holds several people (audit F6)', async () => {
    // On a shared computer the one saved last may be the parent's: a child's
    // next tab must not open in it without anyone choosing it.
    const sent = stubServer()
    saved([entry(ada, 'ada', '2026-10-18T12:00:00Z'), entry(bea, 'bea', '2026-10-18T10:00:00Z')])

    initializeTab()

    expect(readBrowserSignIn()).toBeNull()
    expect(tabToken()).toBeNull()
    await waitFor(() => expect(sent.map((call) => call.body.access_token).sort()).toEqual(['ada-access', 'bea-access']))
  })

  it('ends a saved sign-in whose access token ran out by renewing it once and signing that out', async () => {
    const sent = stubServer((url, body) => {
      if (url.endsWith('/auth/refresh')) return { status: 200, json: { accessToken: 'ada-fresh' } }
      return body.access_token === 'ada-access' ? { status: 401 } : { status: 204 }
    })
    saved([entry(ada, 'ada', '2026-10-18T10:00:00Z'), entry(bea, 'bea', '2026-10-18T12:00:00Z')])
    sessionStorage.setItem(TAB_TOKEN_KEY, 'bea-access')
    sessionStorage.setItem('stoa_tab_refresh_token', 'bea-refresh')

    initializeTab()

    await waitFor(() =>
      expect(sent.map((call) => [call.url.replace('https://api.test', ''), call.body.access_token ?? call.body.refresh_token])).toEqual([
        ['/auth/logout', 'ada-access'],
        ['/auth/refresh', 'ada-refresh'],
        ['/auth/logout', 'ada-fresh'],
      ]),
    )
  })

  it('leaves no saved account to be clicked into, and puts none in the role switcher', () => {
    saved([entry(ada, 'ada', '2026-10-18T10:00:00Z'), entry(bea, 'bea', '2026-10-18T12:00:00Z')])

    initializeTab()

    expect(Object.keys(localStorage)).toEqual([])
    expect(readTestRoles()).toEqual([])
  })

  it('signs out an old tab on an account the browser did not keep, and ends that sign-in', async () => {
    const sent = stubServer()
    saved([entry(ada, 'ada', '2026-10-18T10:00:00Z')])
    // Another tab migrated first and kept Ada.
    inAnotherTab(() => initializeTab())
    sessionStorage.setItem(TAB_TOKEN_KEY, 'bea-access')
    sessionStorage.setItem('stoa_tab_refresh_token', 'bea-refresh')
    sessionStorage.setItem('stoa_tab_account', JSON.stringify(bea))

    initializeTab()

    expect(tabToken()).toBeNull()
    expect(readTabSignOut()).toMatchObject({ reason: 'signed-out-elsewhere', account: { email: bea.email } })
    expect(readBrowserSignIn()).toMatchObject({ accessToken: 'ada-access' })
    await waitFor(() => expect(sent.map((call) => call.body.access_token)).toEqual(['bea-access']))
  })

  it('retires the session tabs shared before #216 the same way', async () => {
    const sent = stubServer()
    localStorage.setItem('stoa_access_token', 'shared-access')
    localStorage.setItem('stoa_refresh_token', 'shared-refresh')
    sessionStorage.setItem(TAB_TOKEN_KEY, 'ada-access')

    initializeTab()

    expect(localStorage.getItem('stoa_access_token')).toBeNull()
    expect(localStorage.getItem('stoa_refresh_token')).toBeNull()
    expect(readBrowserSignIn()).toMatchObject({ accessToken: 'ada-access' })
    await waitFor(() => expect(sent.map((call) => call.body.access_token)).toEqual(['shared-access']))
  })

  it('runs once: a browser already moved has nothing left to move', async () => {
    saved([entry(ada, 'ada', '2026-10-18T10:00:00Z')])
    initializeTab()
    const sent = stubServer()

    initializeTab()

    await Promise.resolve()
    expect(sent).toEqual([])
  })
})

describe('what the independent audit of #320 found', () => {
  it('F2: a sign-in with storage refusing the record keeps the tab working, and ends nothing it cannot replace', async () => {
    const sent = stubServer()
    inAnotherTab(() => useAuthStore.getState().setAuth(ada as never, 'ada-access', 'ada-refresh'))
    sent.length = 0
    const setItem = Storage.prototype.setItem
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key: string, value: string) {
      if (this === localStorage) throw new DOMException('full', 'QuotaExceededError')
      return setItem.call(this, key, value)
    })
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(function () {
      throw new DOMException('blocked', 'SecurityError')
    })

    useAuthStore.getState().setAuth(bea as never, 'bea-access', 'bea-refresh')
    vi.restoreAllMocks()

    // Ada is still the browser's: this tab does not end it under the other tabs.
    expect(readBrowserSignIn()).toMatchObject({ accessToken: 'ada-access' })
    await Promise.resolve()
    expect(sent).toEqual([])
  })

  it('F2: with no other sign-in to disagree with, the tab stays on its own sign-in', () => {
    stubLocation()
    const setItem = Storage.prototype.setItem
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key: string, value: string) {
      if (this === localStorage) throw new DOMException('full', 'QuotaExceededError')
      return setItem.call(this, key, value)
    })

    useAuthStore.getState().setAuth(bea as never, 'bea-access', 'bea-refresh')
    vi.restoreAllMocks()

    expect(sentAs()).toBe('Bearer bea-access')
    expect(tabToken()).toBe('bea-access')
  })

  it('F3: the sign-in page joins only the sign-in it decided on', () => {
    useAuthStore.getState().setAuth(ada as never, 'ada-access', 'ada-refresh')
    const decided = readBrowserSignIn()!.id
    inAnotherTab(() => signInTab('bea-access', 'bea-refresh', bea))
    signOutTab()

    expect(joinBrowserSignIn(decided)).toBe(false)
    expect(tabToken()).toBeNull()
  })

  it('F7: an old tab on the kept sign-in, renewed separately, is the same sign-in and is not ended', async () => {
    const sent = stubServer()
    const jwt = (n: number) =>
      `${btoa(JSON.stringify({ alg: 'RS256' }))}.${btoa(JSON.stringify({ origin_jti: 's1', n }))}.sig`
    localStorage.setItem(BROWSER_SIGN_IN_KEY, JSON.stringify({ id: 'kept', accessToken: jwt(1) }))
    sessionStorage.setItem(TAB_TOKEN_KEY, jwt(2))

    initializeTab()

    expect(tabToken()).toBe(jwt(2))
    expect(readTabSignOut()).toBeNull()
    await Promise.resolve()
    expect(sent).toEqual([])
  })
})
