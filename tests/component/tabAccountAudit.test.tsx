/**
 * What the independent audit of the tab-account work found (#230-#232).
 *
 * F1 changing account carried the first account's stored state along;
 * F2 a sign-in over a tab still on another account replaced it in place, and
 *    that account's late /auth/me put it back on screen;
 * F3 a refusal answered after the tab changed account left the refused saved
 *    account in the list (now: must not end the sign-in that replaced it);
 * F4 storage the browser refuses stopped the app;
 * F5 a saved account's refresh token was taken without checking it (now: by
 *    the one-off move off the saved accounts, #320).
 *
 * The saved accounts and switching between them are gone (#320); what these
 * findings guard still applies to a sign-in over another account.
 */
import { QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router-dom'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { queryClient } from '@/app/query/queryClient'
import { UPLOAD_HANDOFF_STORAGE_KEY } from '@/features/uploads/utils/uploadHandoff'
import { readCurrentAccount } from '@/hooks/auth/accountRead'
import { useLoginMutation } from '@/hooks/auth/useLoginMutation'
import { PENDING_MESSAGE_KEY_PREFIX } from '@/lib/pendingChatMessages'
import { initializeTab, pinTabToSession, readBrowserSignIn, signInTab, tabToken } from '@/lib/tabAccount'
import { httpClient } from '@/services/api/httpClient'
import { storedRefreshToken } from '@/services/auth/sessionRefresh'
import { CHECKOUT_OPERATION_STORAGE_KEY } from '@/services/billing/billingApi'
import { currentSessionToken, useAuthStore } from '@/store/authStore'
import { mswServer } from '../mswServer'

const accountA = { id: 'a', email: 'a@test.stoaedu.ch', name: 'Ada', role: 'parent' }
const accountB = { id: 'b', email: 'b@test.stoaedu.ch', name: 'Bea', role: 'parent' }

function gate() {
  let open!: () => void
  const opened = new Promise<void>((resolve) => {
    open = resolve
  })
  return { opened, open }
}

/** Everything account A left in its tab that the next account must not get. */
function leaveAsState() {
  sessionStorage.setItem(`${PENDING_MESSAGE_KEY_PREFIX}conv-a`, JSON.stringify({ content: 'A secret' }))
  sessionStorage.setItem(CHECKOUT_OPERATION_STORAGE_KEY, JSON.stringify({ checkoutRef: 'a-checkout' }))
  sessionStorage.setItem('stoa_analytics_session_id', 'a-analytics')
  sessionStorage.setItem(UPLOAD_HANDOFF_STORAGE_KEY, '{}')
  sessionStorage.setItem('stoa.login.submittedAt', '123')
}

function expectNoneOfAs() {
  expect(Object.keys(sessionStorage).filter((key) => key.startsWith(PENDING_MESSAGE_KEY_PREFIX))).toEqual([])
  expect(sessionStorage.getItem(CHECKOUT_OPERATION_STORAGE_KEY)).toBeNull()
  expect(sessionStorage.getItem('stoa_analytics_session_id')).toBeNull()
  expect(sessionStorage.getItem(UPLOAD_HANDOFF_STORAGE_KEY)).toBeNull()
}

beforeAll(() => mswServer.listen({ onUnhandledRequest: 'bypass' }))
afterAll(() => mswServer.close())
beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
})
afterEach(() => {
  mswServer.resetHandlers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  queryClient.clear()
  useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })
})

describe('F1: changing account takes nothing of the first one along', () => {
  it('on a sign-in over it', () => {
    signInTab('a-access', 'a-refresh', accountA)
    leaveAsState()

    useAuthStore.getState().setAuth(accountB as never, 'b-access', 'b-refresh')

    expect(currentSessionToken()).toBe('b-access')
    expectNoneOfAs()
  })

  it('but a renewal of the same account keeps it all', () => {
    signInTab('a-access', 'a-refresh', accountA)
    leaveAsState()

    useAuthStore.getState().updateAccessToken('a-access-2')

    expect(sessionStorage.getItem(CHECKOUT_OPERATION_STORAGE_KEY)).not.toBeNull()
  })
})

describe('F2: a sign-in over a tab still on another account', () => {
  it('drops that account’s read still in flight instead of showing it', async () => {
    signInTab('a-access', 'a-refresh', accountA)
    const answer = gate()
    const asked = gate()
    mswServer.use(
      http.get('https://api.test/auth/me', async () => {
        asked.open()
        await answer.opened
        return HttpResponse.json(accountA)
      }),
    )

    const read = readCurrentAccount()
    await asked.opened
    signInTab('c-access', 'c-refresh', { email: 'c@test.stoaedu.ch' })
    answer.open()

    await expect(read).rejects.toMatchObject({ code: 'session_changed' })
  })

  it('keeps the read when only a renewal of the same session happened meanwhile', async () => {
    signInTab('a-access', 'a-refresh', accountA)
    const answer = gate()
    const asked = gate()
    mswServer.use(
      http.get('https://api.test/auth/me', async () => {
        asked.open()
        await answer.opened
        return HttpResponse.json(accountA)
      }),
    )

    const read = readCurrentAccount()
    await asked.opened
    useAuthStore.getState().updateAccessToken('a-access-2')
    answer.open()

    await expect(read).resolves.toMatchObject({ email: 'a@test.stoaedu.ch' })
  })

  it('lands with a full load', async () => {
    signInTab('a-access', 'a-refresh', accountA)
    useAuthStore.setState({ accessToken: 'a-access', isAuthenticated: true })
    const assign = vi.fn()
    vi.stubGlobal('location', { ...window.location, search: '', assign })
    mswServer.use(
      http.post('https://api.test/auth/login', () =>
        HttpResponse.json({ accessToken: 'c-access', refreshToken: 'c-refresh', user: { ...accountB, id: 'c', email: 'c@test.stoaedu.ch' } }),
      ),
    )
    function Form() {
      const login = useLoginMutation()
      return <button onClick={() => login.mutate({ email: 'c@test.stoaedu.ch', password: 'secret12' })}>go</button>
    }
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <Form />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    fireEvent.click(screen.getByText('go'))

    await waitFor(() => expect(assign).toHaveBeenCalledWith('/parent'))
    expect(currentSessionToken()).toBe('c-access')
  })
})

describe('re-audit of the fixes', () => {
  function signInAs(user: { id: string; email: string; name: string; role: string }, search = '') {
    const assign = vi.fn()
    vi.stubGlobal('location', { ...window.location, search, assign })
    mswServer.use(
      http.post('https://api.test/auth/login', () =>
        HttpResponse.json({ accessToken: `${user.id}-access-2`, refreshToken: `${user.id}-refresh-2`, user }),
      ),
    )
    function Form() {
      const login = useLoginMutation()
      return <button onClick={() => login.mutate({ email: user.email, password: 'secret12' })}>go</button>
    }
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <Form />
        </MemoryRouter>
      </QueryClientProvider>,
    )
    fireEvent.click(screen.getByText('go'))
    return assign
  }

  it('a sign-in over another account still honours ?next=', async () => {
    signInTab('a-access', 'a-refresh', accountA)
    useAuthStore.setState({ accessToken: 'a-access', isAuthenticated: true })

    const assign = signInAs({ ...accountB, role: 'parent' }, '?next=/parent/reports')

    await waitFor(() => expect(assign).toHaveBeenCalledWith('/parent/reports'))
  })

  it('the same account signing in again keeps its own state and is not reloaded', async () => {
    signInTab('a-access', 'a-refresh', accountA)
    useAuthStore.setState({ accessToken: 'a-access', isAuthenticated: true })
    leaveAsState()

    const assign = signInAs(accountA)

    await waitFor(() => expect(currentSessionToken()).toBe('a-access-2'))
    expect(assign).not.toHaveBeenCalled()
    expect(sessionStorage.getItem(CHECKOUT_OPERATION_STORAGE_KEY)).not.toBeNull()
  })

  it('signing in with storage blocked does not stop the sign-in', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('blocked', 'QuotaExceededError')
    })

    expect(() => useAuthStore.getState().setAuth(accountB as never, 'b-access', 'b-refresh')).not.toThrow()
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
  })
})

describe('F3: a refusal answered after the tab changed account', () => {
  it('does not end the sign-in that replaced the refused one', async () => {
    signInTab('b-access', 'b-refresh', accountB)
    useAuthStore.setState({ accessToken: 'b-access', isAuthenticated: true })
    const refused = gate()
    const asked = gate()
    mswServer.use(
      http.get('https://api.test/things', () => HttpResponse.json({ detail: 'expired' }, { status: 401 })),
      http.post('https://api.test/auth/refresh', async () => {
        asked.open()
        await refused.opened
        return HttpResponse.json({ detail: 'refused' }, { status: 401 })
      }),
    )

    const request = httpClient.get('/things')
    await asked.opened
    signInTab('c-access', 'c-refresh', { email: 'c@test.stoaedu.ch' })
    refused.open()

    await expect(request).rejects.toMatchObject({ code: 'session_changed' })
    expect(readBrowserSignIn()).toMatchObject({ accessToken: 'c-access', refreshToken: 'c-refresh' })
    expect(currentSessionToken()).toBe('c-access')
  })
})

describe('F4: storage the browser refuses', () => {
  it('leaves the tab without a session rather than stopping the app', () => {
    const real = Object.getOwnPropertyDescriptor(window, 'sessionStorage')
    Object.defineProperty(window, 'sessionStorage', {
      configurable: true,
      get() {
        throw new DOMException('blocked', 'SecurityError')
      },
    })
    try {
      expect(tabToken()).toBeNull()
      expect(() => pinTabToSession('x')).not.toThrow()
      expect(() => initializeTab()).not.toThrow()
      expect(storedRefreshToken()).toBeNull()
    } finally {
      if (real) Object.defineProperty(window, 'sessionStorage', real)
    }
  })
})

describe('F5: a saved account with a malformed refresh token', () => {
  it('is kept by the move off the saved accounts without one', () => {
    localStorage.setItem(
      'stoa_dev_sessions',
      JSON.stringify([{ ...accountB, accessToken: 'b-access', refreshToken: 42 }]),
    )

    initializeTab()

    expect(tabToken()).toBe('b-access')
    expect(storedRefreshToken()).toBeNull()
  })
})
