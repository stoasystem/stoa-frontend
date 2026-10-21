/**
 * A forced password change keeps the page it interrupted (#412, part 1).
 *
 * An administrator resets a teacher's password. The teacher opens the link
 * to a request, signs in, is sent to the password change, sets a new
 * password and presses "Continue". Before #412 that led to /teacher and the
 * request was gone: ProtectedRoute's redirect to the change carried nothing,
 * the login screen answered "the change" before it read `next` or `from`,
 * and "Continue" went to the role's home.
 *
 * The router, EntryPage, the login form, ProtectedRoute and the change page
 * are the real ones, against MSW; only the destination pages are stubs.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { useParams, useSearchParams } from 'react-router-dom'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import { AppRouter } from '@/app/router/AppRouter'
import { getPostLoginTarget, getReturnPath, getReturnTarget, pathFromState } from '@/lib/authRoutes'
import { signOutTab } from '@/lib/tabAccount'
import { TOKEN_KEY, useAuthStore } from '@/store/authStore'
import type { User, UserRole } from '@/types/user'
import { mswServer } from '../mswServer'

vi.mock('@/pages/teacher/TeacherDashboardPage', () => ({
  TeacherDashboardPage: () => <h1>teacher home</h1>,
}))
vi.mock('@/pages/teacher/TeacherHelpRequestDetailPage', () => ({
  TeacherHelpRequestDetailPage: function RequestStub() {
    return <h1>{`request ${useParams().requestId}`}</h1>
  },
}))
vi.mock('@/pages/auth/TeacherActivatePage', () => ({
  TeacherActivatePage: function TeacherActivateStub() {
    const [params] = useSearchParams()
    return <h1>{`teacher activation ${params.get('token') ?? 'without a token'}`}</h1>
  },
}))

const REQUEST = '/teacher/requests/r-1?tab=notes#reply'

function teacher(mustChangePassword: boolean): User {
  return { id: 'teacher-1', name: 'Ada', email: 'teacher@example.com', role: 'teacher', mustChangePassword } as User
}

/** The backend: the reset stands until the change is confirmed, as on the server. */
function serve(user: User) {
  let forced = Boolean(user.mustChangePassword)
  mswServer.use(
    http.post('https://api.test/auth/login', () =>
      HttpResponse.json({ accessToken: 'fresh-token', user: { ...user, mustChangePassword: forced } }),
    ),
    http.get('https://api.test/auth/me', () => HttpResponse.json({ ...user, mustChangePassword: forced })),
    http.post('https://api.test/auth/password-change/request', () =>
      HttpResponse.json({ status: 'sent', maskedRecipient: 't******@example.com', expiresAt: 1_790_000_000 }),
    ),
    http.post('https://api.test/auth/password-change/confirm', () => {
      forced = false
      return HttpResponse.json({ status: 'changed' })
    }),
    // Anything else the shell asks for is not what these tests are about.
    http.all('https://api.test/*', () => HttpResponse.json({ items: [], nextToken: null })),
  )
}

function openAt(url: string, state: unknown = null) {
  window.history.replaceState(state, '', url)
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <AppRouter />
    </QueryClientProvider>,
  )
}

function alreadySignedInAs(user: User) {
  serve(user)
  sessionStorage.setItem(TOKEN_KEY, 'stored-token')
  useAuthStore.setState({ user, accessToken: 'stored-token', isAuthenticated: true })
}

async function signIn() {
  fireEvent.change(await screen.findByLabelText('Email'), { target: { value: 'teacher@example.com' } })
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Temp!Pass123' } })
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
}

/** Through the change page's two steps; resolves to its "Continue". */
async function changePassword() {
  expect(await screen.findByRole('heading', { name: 'Change your password' })).toBeInTheDocument()
  await waitFor(() => expect(window.location.pathname).toBe('/settings/password'))
  fireEvent.change(screen.getByLabelText('Current password'), { target: { value: 'Temp!Pass123' } })
  fireEvent.click(screen.getByRole('button', { name: 'Send code' }))
  fireEvent.change(await screen.findByLabelText('Email code'), { target: { value: '123456' } })
  fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'New!Pass1234' } })
  fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'New!Pass1234' } })
  fireEvent.click(screen.getByRole('button', { name: 'Set new password' }))
  return screen.findByRole('link', { name: 'Continue' })
}

async function expectToLandOn(heading: string, path: string) {
  expect(await screen.findByRole('heading', { name: heading })).toBeInTheDocument()
  await waitFor(() =>
    expect(`${window.location.pathname}${window.location.search}${window.location.hash}`).toBe(path),
  )
}

beforeAll(async () => {
  mswServer.listen({ onUnhandledRequest: 'error' })
  // Cold lazy pages: the first test would spend findBy's wait importing them.
  await Promise.all([import('@/pages/entry/EntryPage'), import('@/pages/auth/ChangePasswordPage')])
})
afterAll(() => mswServer.close())
beforeEach(async () => {
  await i18n.changeLanguage('en')
  localStorage.clear()
  sessionStorage.clear()
  useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })
})
afterEach(() => {
  mswServer.resetHandlers()
  useAuthStore.getState().clearAuth()
  window.history.replaceState(null, '', '/')
})

describe('a reset account that opened a link goes back to it after the change', () => {
  it('signed out on a request: sign-in, the change, then Continue opens the request', async () => {
    serve(teacher(true))
    openAt(REQUEST)

    await signIn()
    const next = await changePassword()

    expect(next).toHaveAttribute('href', REQUEST)
    fireEvent.click(next)
    await expectToLandOn('request r-1', REQUEST)
  })

  it('signing in from a ?next= link', async () => {
    serve(teacher(true))
    openAt(`/login?next=${encodeURIComponent(REQUEST)}`)

    await signIn()

    expect(await changePassword()).toHaveAttribute('href', REQUEST)
  })

  it('a public ?next= page: the change still comes first, the page after it', async () => {
    serve(teacher(true))
    openAt(`/login?next=${encodeURIComponent('/teacher-activate?token=t-1')}`)

    await signIn()
    const next = await changePassword()

    expect(screen.queryByRole('heading', { name: /teacher activation/ })).not.toBeInTheDocument()
    fireEvent.click(next)
    await expectToLandOn('teacher activation t-1', '/teacher-activate?token=t-1')
  })

  it('already signed in (a reload on the link): the guard carries the page to the change', async () => {
    alreadySignedInAs(teacher(true))
    openAt(REQUEST)

    const next = await changePassword()

    expect(next).toHaveAttribute('href', REQUEST)
    fireEvent.click(next)
    await expectToLandOn('request r-1', REQUEST)
  })

  it('records the page in the redirect state, not in the address', async () => {
    alreadySignedInAs(teacher(true))
    openAt(REQUEST)

    expect(await screen.findByRole('heading', { name: 'Change your password' })).toBeInTheDocument()
    expect(`${window.location.pathname}${window.location.search}${window.location.hash}`).toBe('/settings/password')
    expect((window.history.state as { usr?: unknown }).usr).toEqual({
      from: { pathname: '/teacher/requests/r-1', search: '?tab=notes', hash: '#reply' },
    })
  })

  it('a session that ended: signed in again, by the change to the page the tab was on', async () => {
    serve(teacher(true))
    signOutTab({
      reason: 'expired',
      account: { id: 'teacher-1', email: 'teacher@example.com', role: 'teacher' },
      returnTo: REQUEST,
    })
    useAuthStore.setState({ user: teacher(true), accessToken: 'fresh-token', isAuthenticated: true })
    openAt('/login')

    expect(await changePassword()).toHaveAttribute('href', REQUEST)
  })
})

describe('what "Continue" will not follow', () => {
  it.each([
    ['a page the role may not use', { pathname: '/admin/users' }],
    ['another site', { pathname: '//evil.example/x' }],
    ['a path walked out of a permitted one', { pathname: '/teacher/../admin' }],
    ['the change itself', { pathname: '/settings/password' }],
    ['no pathname', { search: '?x=1' }],
  ])('%s: the role\'s home instead', async (_case, from) => {
    alreadySignedInAs(teacher(true))
    openAt('/settings/password', { usr: { from }, key: 'forged', idx: 0 })

    expect(await changePassword()).toHaveAttribute('href', '/teacher')
  })

  it('a change nobody forced: home, as before', async () => {
    alreadySignedInAs(teacher(false))
    openAt('/settings/password')

    expect(await changePassword()).toHaveAttribute('href', '/teacher')
  })
})

describe('the decisions themselves', () => {
  const location = (search: string, state?: unknown) => ({ search, state })

  it.each<[string, { search: string; state?: unknown }, string]>([
    ['a ?next= link', location(`?next=${encodeURIComponent(REQUEST)}`), REQUEST],
    ['state.from', location('', { from: { pathname: '/teacher/requests/r-1', search: '?tab=notes', hash: '#reply' } }), REQUEST],
    ['a ?next= the role may not use', location('?next=/admin/users'), '/teacher'],
    ['a ?next= on another site', location('?next=//evil.example'), '/teacher'],
    ['nothing asked for', location(''), '/teacher'],
  ])('a reset account signing in with %s: the change, carrying where it was going', (_case, at, carried) => {
    const target = getPostLoginTarget(teacher(true), at)

    expect(target.to).toBe('/settings/password')
    expect(pathFromState(target.state)).toBe(carried)
  })

  it('an account nobody reset goes straight there, carrying nothing', () => {
    expect(getPostLoginTarget(teacher(false), location(`?next=${encodeURIComponent(REQUEST)}`))).toEqual({ to: REQUEST })
  })

  it('a reset account signing in again after its session ended: the change, carrying the page', () => {
    const target = getReturnTarget(teacher(true), REQUEST)

    expect(target.to).toBe('/settings/password')
    expect(pathFromState(target.state)).toBe(REQUEST)
    expect(getReturnTarget(teacher(false), REQUEST)).toEqual({ to: REQUEST })
  })

  it('getReturnPath is the path alone: the change while the reset stands, the page once it is lifted', () => {
    expect(getReturnPath(teacher(true), REQUEST)).toBe('/settings/password')
    expect(getReturnPath(teacher(false), REQUEST)).toBe(REQUEST)
  })

  it.each<UserRole>(['student', 'parent', 'admin'])('carries a %s to its own home when nothing was asked for', (role) => {
    const target = getPostLoginTarget({ role, mustChangePassword: true }, location(''))

    expect(pathFromState(target.state)).toBe({ student: '/', parent: '/parent', admin: '/admin' }[role as string])
  })

  it.each([null, undefined, 'x', 7, {}, { from: null }, { from: { pathname: 3 } }])(
    'reads no path from the state %o',
    (state) => {
      expect(pathFromState(state)).toBeUndefined()
    },
  )
})
