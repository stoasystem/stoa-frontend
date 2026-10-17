/**
 * Signing out in one tab signs out every tab holding the same sign-in (#232).
 *
 * The backend's sign-out ends one sign-in, named by `origin_jti`: the tabs
 * that hold it are over that moment. Without this they went on showing the
 * account while every request failed, and called it an expired session.
 *
 * Tabs here: X and Y hold A's sign-in s1, Z holds A's other sign-in s2, W
 * holds B. jsdom has one window and one sessionStorage, so each tab is that
 * storage set up as the tab's; the other tabs' storage event is raised by
 * hand with exactly what the signing-out tab wrote.
 */
import { QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { queryClient } from '@/app/query/queryClient'
import { useSignOut } from '@/hooks/auth/useSignOut'
import { readSessions, rememberSession, tabToken } from '@/lib/devSessions'
import { signInOf } from '@/lib/signIn'
import { bindTab, readTabSignOut, SIGN_IN_ENDED_KEY } from '@/lib/tabAccount'
import { listenForSignInsEndedElsewhere } from '@/services/auth/signInEndedElsewhere'
import { useAuthStore } from '@/store/authStore'
import { mswServer } from '../mswServer'

function base64url(value: unknown) {
  return btoa(JSON.stringify(value)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')
}

/** An access token of sign-in `signIn`; `n` tells its renewals apart. */
function token(signIn: string, n = 1) {
  return `${base64url({ alg: 'RS256' })}.${base64url({ origin_jti: signIn, sub: 'someone', n })}.signature`
}

const X = { access: token('s1', 1), refresh: 'a-refresh-1', account: { id: 'a', email: 'a@test.stoaedu.ch', name: 'Ada' } }
const Y = { access: token('s1', 2), refresh: 'a-refresh-1', account: X.account }
const Z = { access: token('s2'), refresh: 'a-refresh-2', account: X.account }
const W = { access: token('s3'), refresh: 'b-refresh', account: { id: 'b', email: 'b@test.stoaedu.ch', name: 'Bea' } }

let stopListening: () => void = () => {}

beforeAll(() => mswServer.listen({ onUnhandledRequest: 'bypass' }))
afterAll(() => mswServer.close())
beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  mswServer.use(http.post('https://api.test/auth/logout', () => new HttpResponse(null, { status: 204 })))
  stopListening = listenForSignInsEndedElsewhere()
})
afterEach(() => {
  stopListening()
  mswServer.resetHandlers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  queryClient.clear()
  useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })
})

function onTab(tab: typeof X) {
  sessionStorage.clear()
  bindTab(tab.access, tab.refresh, tab.account)
  useAuthStore.setState({ accessToken: tab.access, isAuthenticated: true })
}

function stubLocation(pathname = '/parent') {
  const assign = vi.fn()
  vi.stubGlobal('location', { ...window.location, pathname, search: '', hash: '', assign })
  return assign
}

/** Sign out in tab X; returns what it wrote for the other tabs, if anything. */
async function signOutInX(): Promise<string[]> {
  onTab(X)
  stubLocation()
  const setItem = vi.spyOn(Storage.prototype, 'setItem')
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/parent']}>{children}</MemoryRouter>
    </QueryClientProvider>
  )
  const { result } = renderHook(() => useSignOut(), { wrapper })
  await act(() => result.current.signOut())
  const written = setItem.mock.calls.filter(([key]) => key === SIGN_IN_ENDED_KEY).map(([, value]) => value)
  setItem.mockRestore()
  return written
}

/** Raise, in the tab now set up, the storage event the signing-out tab caused. */
function arrives(newValue: string | null, key = SIGN_IN_ENDED_KEY) {
  window.dispatchEvent(new StorageEvent('storage', { key, newValue, storageArea: localStorage }))
}

describe('signing out in one tab', () => {
  it('reads the sign-in off the token', () => {
    expect(signInOf(X.access)).toBe('s1')
    expect(signInOf(Y.access)).toBe('s1')
    expect(signInOf('demo:student')).toBeNull()
  })

  it('signs out a tab on the same sign-in at once, saying so, and naming the account', async () => {
    const [message] = await signOutInX()

    onTab(Y)
    const assign = stubLocation('/parent/reports')
    arrives(message)

    expect(tabToken()).toBeNull()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(readTabSignOut()).toEqual({
      reason: 'signed-out-elsewhere',
      account: X.account,
      returnTo: '/parent/reports',
    })
    expect(assign).toHaveBeenCalledWith('/login')
  })

  it('leaves the same account’s other sign-in, and other accounts, as they are', async () => {
    const [message] = await signOutInX()

    for (const tab of [Z, W]) {
      onTab(tab)
      const assign = stubLocation()
      arrives(message)

      expect(tabToken()).toBe(tab.access)
      expect(readTabSignOut()).toBeNull()
      expect(assign).not.toHaveBeenCalled()
    }
  })

  it('drops every saved copy of that sign-in, and only of that one', async () => {
    rememberSession({ ...X.account, role: 'parent', accessToken: Y.access, refreshToken: Y.refresh })
    rememberSession({ ...W.account, role: 'student', accessToken: W.access, refreshToken: W.refresh })

    await signOutInX()

    expect(readSessions().map((entry) => entry.email)).toEqual(['b@test.stoaedu.ch'])
  })

  it('keeps a saved copy of the account’s other sign-in', async () => {
    rememberSession({ ...X.account, role: 'parent', accessToken: Z.access, refreshToken: Z.refresh })

    await signOutInX()

    expect(readSessions().map((entry) => entry.accessToken)).toEqual([Z.access])
  })

  it('tells the other tabs the sign-in only, never a token, and leaves nothing behind', async () => {
    const written = await signOutInX()

    expect(written).toHaveLength(1)
    expect(JSON.parse(written[0])).toEqual({ signIn: 's1', at: expect.any(Number) })
    for (const secret of [X.access, X.refresh, Y.access]) expect(written[0]).not.toContain(secret)
    expect(localStorage.getItem(SIGN_IN_ENDED_KEY)).toBeNull()
  })
})

describe('what another tab can do to this one', () => {
  it('nothing, with a malformed or unrelated event', () => {
    onTab(Y)
    const assign = stubLocation()

    arrives('not json')
    arrives(JSON.stringify({ signIn: 42 }))
    arrives(JSON.stringify({}))
    arrives(null)
    arrives(JSON.stringify({ signIn: 's1' }), 'something_else')

    expect(tabToken()).toBe(Y.access)
    expect(assign).not.toHaveBeenCalled()
  })

  it('at most sign it out: never put it on an account', () => {
    rememberSession({ ...W.account, role: 'student', accessToken: W.access, refreshToken: W.refresh })
    onTab(Y)
    stubLocation()

    arrives(JSON.stringify({ signIn: 's1', accessToken: W.access, account: W.account }))

    expect(tabToken()).toBeNull()
    expect(readTabSignOut()?.account).toEqual(X.account)
  })

  it('nothing to a tab with no account', () => {
    sessionStorage.clear()
    const assign = stubLocation()

    arrives(JSON.stringify({ signIn: 's1' }))

    expect(assign).not.toHaveBeenCalled()
    expect(readTabSignOut()).toBeNull()
  })
})
