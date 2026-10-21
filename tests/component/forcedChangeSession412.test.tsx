/**
 * The page a forced password change carries, where the tab's session code
 * meets it (#412, from the independent audit of #445).
 *
 * - A session that ends while the tab is on the change records where the tab
 *   was for the same account to come back to. That was the change itself,
 *   which is never gone back to, so the page the change carried was lost.
 * - A sign-in over a tab still on another account lands with a full load,
 *   which starts with no history state, so a reset account lost the page
 *   there too.
 */
import { QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router-dom'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { queryClient } from '@/app/query/queryClient'
import { CHANGE_PASSWORD_PATH } from '@/app/router/routeManifest'
import { useLoginMutation } from '@/hooks/auth/useLoginMutation'
import { FORCED_CHANGE_PAGE, readTabSignOut, returnToHere, signInTab } from '@/lib/tabAccount'
import { signOutIfReplacedElsewhere } from '@/services/auth/browserSignInChanges'
import { useAuthStore } from '@/store/authStore'
import { mswServer } from '../mswServer'

const CARRIED = { from: { pathname: '/teacher/requests/r-1', search: '?tab=notes', hash: '#reply' } }

function at(url: string, state: unknown = null) {
  window.history.replaceState(state, '', url)
}

beforeAll(() => mswServer.listen({ onUnhandledRequest: 'bypass' }))
afterAll(() => mswServer.close())
beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
})
afterEach(() => {
  vi.unstubAllGlobals()
  mswServer.resetHandlers()
  useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })
  window.history.replaceState(null, '', '/')
})

describe('where a tab whose session ends was', () => {
  it('is the page the forced change carries, while it is on the change', () => {
    at(CHANGE_PASSWORD_PATH, { usr: CARRIED, key: 'k', idx: 0 })

    expect(returnToHere()).toEqual({ returnTo: '/teacher/requests/r-1?tab=notes#reply' })
  })

  it('is nothing on a change that carries no page: the change is never gone back to', () => {
    at(CHANGE_PASSWORD_PATH)

    expect(returnToHere()).toEqual({})
  })

  it('is the page itself anywhere else, query and hash included', () => {
    at('/teacher/requests/r-2?tab=notes#reply', { usr: CARRIED, key: 'k', idx: 0 })

    expect(returnToHere()).toEqual({ returnTo: '/teacher/requests/r-2?tab=notes#reply' })
  })

  it('is nothing on the sign-in page', () => {
    at('/login?next=/teacher')

    expect(returnToHere()).toEqual({})
  })

  it('reads the change at the address the router registers it', () => {
    expect(FORCED_CHANGE_PAGE).toBe(CHANGE_PASSWORD_PATH)
  })

  it('is what a tab signed out from elsewhere remembers, on the change', () => {
    // This tab holds a sign-in the browser no longer has.
    signInTab('a-access', 'a-refresh', { id: 'teacher-1', email: 'teacher@example.com', role: 'teacher' })
    localStorage.clear()
    at(CHANGE_PASSWORD_PATH, { usr: CARRIED, key: 'k', idx: 0 })
    // Read where the tab is, and do not leave it.
    vi.stubGlobal('location', { ...window.location, assign: vi.fn() })

    expect(signOutIfReplacedElsewhere()).toBe(true)

    expect(readTabSignOut()).toMatchObject({
      reason: 'signed-out-elsewhere',
      returnTo: '/teacher/requests/r-1?tab=notes#reply',
    })
  })
})

describe('a reset account signing in over a tab on another account', () => {
  function signInAs(user: { id: string; email: string; name: string; role: string; mustChangePassword: boolean }, url: string) {
    at(url)
    const assign = vi.fn()
    const reload = vi.fn()
    const [pathname, search = ''] = url.split('?')
    vi.stubGlobal('location', { ...window.location, pathname, search: search ? `?${search}` : '', assign, reload })
    mswServer.use(
      http.post('https://api.test/auth/login', () =>
        HttpResponse.json({ accessToken: `${user.id}-access`, refreshToken: `${user.id}-refresh`, user }),
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
    return { assign, reload }
  }

  beforeEach(() => {
    signInTab('a-access', 'a-refresh', { id: 'a', email: 'a@test.stoaedu.ch', name: 'Ada', role: 'parent' })
    useAuthStore.setState({ accessToken: 'a-access', isAuthenticated: true })
  })

  it('loads the change again in this entry, carrying the ?next= page', async () => {
    const { assign, reload } = signInAs(
      { id: 'c', email: 'c@test.stoaedu.ch', name: 'Cleo', role: 'teacher', mustChangePassword: true },
      `/login?next=${encodeURIComponent('/teacher/requests/r-1?tab=notes#reply')}`,
    )

    await waitFor(() => expect(reload).toHaveBeenCalledTimes(1))
    expect(assign).not.toHaveBeenCalled()
    expect(new URL(document.URL).pathname).toBe(CHANGE_PASSWORD_PATH)
    expect((window.history.state as { usr?: unknown }).usr).toEqual(CARRIED)
  })

  it('still lands an account nobody reset with a plain full load', async () => {
    const { assign, reload } = signInAs(
      { id: 'c', email: 'c@test.stoaedu.ch', name: 'Cleo', role: 'teacher', mustChangePassword: false },
      '/login?next=/teacher/requests/r-1',
    )

    await waitFor(() => expect(assign).toHaveBeenCalledWith('/teacher/requests/r-1'))
    expect(reload).not.toHaveBeenCalled()
  })
})
