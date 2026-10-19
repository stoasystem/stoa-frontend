/**
 * What one tab's sign-out, sign-in or renewal does to the other tabs of the
 * browser (#320, docs/adr/0003; before it #232).
 *
 * jsdom has one window and one sessionStorage, so each tab is that storage set
 * up as the tab's; the other tabs' storage event is raised by hand with what
 * the acting tab wrote.
 */
import { QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { queryClient } from '@/app/query/queryClient'
import { useSignOut } from '@/hooks/auth/useSignOut'
import {
  BROWSER_SIGN_IN_KEY,
  joinBrowserSignIn,
  readBrowserSignIn,
  readTabSignOut,
  renewBrowserSignIn,
  signInTab,
  tabToken,
} from '@/lib/tabAccount'
import { listenForBrowserSignInChanges } from '@/services/auth/browserSignInChanges'
import { useAuthStore } from '@/store/authStore'
import { mswServer } from '../mswServer'

const ada = { id: 'a', email: 'a@test.stoaedu.ch', name: 'Ada', role: 'parent' }
const bea = { id: 'b', email: 'b@test.stoaedu.ch', name: 'Bea', role: 'student' }

let stopListening: () => void = () => {}

beforeAll(() => mswServer.listen({ onUnhandledRequest: 'bypass' }))
afterAll(() => mswServer.close())
beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  mswServer.use(http.post('https://api.test/auth/logout', () => new HttpResponse(null, { status: 204 })))
  stopListening = listenForBrowserSignInChanges()
})
afterEach(() => {
  stopListening()
  mswServer.resetHandlers()
  vi.unstubAllGlobals()
  queryClient.clear()
  useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })
})

function stubLocation(pathname = '/parent') {
  const assign = vi.fn()
  vi.stubGlobal('location', { ...window.location, pathname, search: '', hash: '', assign })
  return assign
}

/** Set up this window's sessionStorage as a tab that joined the browser's sign-in. */
function joinedTab() {
  sessionStorage.clear()
  joinBrowserSignIn()
  useAuthStore.setState({ accessToken: tabToken(), isAuthenticated: true })
}

function arrives(key: string | null = BROWSER_SIGN_IN_KEY, storageArea: Storage = localStorage) {
  window.dispatchEvent(
    new StorageEvent('storage', { key, newValue: key ? localStorage.getItem(key) : null, storageArea }),
  )
}

describe('signing out in one tab', () => {
  it('signs out every other tab of the browser, through the one shared sign-out', async () => {
    signInTab('ada-access', 'ada-refresh', ada)
    useAuthStore.setState({ accessToken: 'ada-access', isAuthenticated: true })
    stubLocation()
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/parent']}>{children}</MemoryRouter>
      </QueryClientProvider>
    )
    const { result } = renderHook(() => useSignOut(), { wrapper })
    await act(() => result.current.signOut())
    expect(readBrowserSignIn()).toBeNull()

    // The other tab, which joined before the sign-out.
    sessionStorage.clear()
    sessionStorage.setItem('stoa_tab_access_token', 'ada-access')
    sessionStorage.setItem('stoa_tab_sign_in', 'whatever-it-joined')
    useAuthStore.setState({ accessToken: 'ada-access', isAuthenticated: true })
    const assign = stubLocation('/parent/children')

    arrives()

    expect(tabToken()).toBeNull()
    expect(readTabSignOut()?.reason).toBe('signed-out-elsewhere')
    expect(assign).toHaveBeenCalledWith('/login')
  })

  it('leaves no credential behind in what every tab shares', async () => {
    signInTab('ada-access', 'ada-refresh', ada)
    useAuthStore.setState({ accessToken: 'ada-access', isAuthenticated: true })
    stubLocation()
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/parent']}>{children}</MemoryRouter>
      </QueryClientProvider>
    )
    const { result } = renderHook(() => useSignOut(), { wrapper })
    await act(() => result.current.signOut())

    const everything = [...Object.values(localStorage), ...Object.values(sessionStorage)].join(' ')
    expect(everything).not.toContain('ada-access')
    expect(everything).not.toContain('ada-refresh')
  })
})

describe('what another tab can do to this one', () => {
  it('nothing, with an unrelated event or one from sessionStorage', () => {
    signInTab('ada-access', 'ada-refresh', ada)
    joinedTab()
    const assign = stubLocation()
    localStorage.setItem('something_else', 'x')

    arrives('something_else')
    arrives(BROWSER_SIGN_IN_KEY, sessionStorage)

    expect(tabToken()).toBe('ada-access')
    expect(assign).not.toHaveBeenCalled()
  })

  it('nothing, when it only renewed the same sign-in', () => {
    signInTab('ada-access', 'ada-refresh', ada)
    joinedTab()
    const assign = stubLocation()

    renewBrowserSignIn('ada-access-2')
    arrives()

    expect(tabToken()).toBe('ada-access')
    expect(assign).not.toHaveBeenCalled()
  })

  it('at most sign it out: never put it on the account it signed in as', () => {
    signInTab('ada-access', 'ada-refresh', ada)
    joinedTab()
    stubLocation()

    const mine = sessionStorage.getItem('stoa_tab_sign_in')
    sessionStorage.clear()
    signInTab('bea-access', 'bea-refresh', bea)
    sessionStorage.clear()
    sessionStorage.setItem('stoa_tab_access_token', 'ada-access')
    sessionStorage.setItem('stoa_tab_sign_in', mine as string)
    sessionStorage.setItem('stoa_tab_account', JSON.stringify(ada))
    arrives()

    expect(tabToken()).toBeNull()
    expect(readTabSignOut()?.account).toMatchObject({ email: ada.email })
  })

  it('nothing to a tab with no account', () => {
    const assign = stubLocation()
    signInTab('ada-access', 'ada-refresh', ada)
    sessionStorage.clear()

    arrives()

    expect(assign).not.toHaveBeenCalled()
    expect(readTabSignOut()).toBeNull()
  })

  it('reacts to the storage being cleared, which names no key', () => {
    signInTab('ada-access', 'ada-refresh', ada)
    joinedTab()
    const assign = stubLocation()

    localStorage.clear()
    arrives(null)

    expect(tabToken()).toBeNull()
    expect(assign).toHaveBeenCalledWith('/login')
  })
})
