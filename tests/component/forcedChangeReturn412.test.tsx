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
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

function account(role: UserRole, mustChangePassword: boolean): User {
  return { id: `${role}-1`, name: 'Ada', email: `${role}@example.com`, role, mustChangePassword } as User
}

const teacher = (mustChangePassword: boolean) => account('teacher', mustChangePassword)

/** What the app asked the backend, in order: `METHOD /path`. */
let asked: string[] = []

/** The backend: the reset stands until the change is confirmed, as on the server. */
function serve(user: User) {
  let forced = Boolean(user.mustChangePassword)
  const note = (request: Request) => asked.push(`${request.method} ${new URL(request.url).pathname}`)
  mswServer.use(
    http.post('https://api.test/auth/login', ({ request }) => {
      note(request)
      return HttpResponse.json({ accessToken: 'fresh-token', user: { ...user, mustChangePassword: forced } })
    }),
    http.get('https://api.test/auth/me', ({ request }) => {
      note(request)
      return HttpResponse.json({ ...user, mustChangePassword: forced })
    }),
    http.post('https://api.test/auth/password-change/request', ({ request }) => {
      note(request)
      return HttpResponse.json({ status: 'sent', maskedRecipient: 't******@example.com', expiresAt: 1_790_000_000 })
    }),
    http.post('https://api.test/auth/password-change/confirm', ({ request }) => {
      note(request)
      forced = false
      return HttpResponse.json({ status: 'changed' })
    }),
    // Anything else the shell asks for is noted, and answered with nothing.
    http.all('https://api.test/*', ({ request }) => {
      note(request)
      return HttpResponse.json({ items: [], nextToken: null })
    }),
  )
}

// What the backend answers while a reset stands (stoa-backend deps.py,
// FORCED_PASSWORD_CHANGE_EXEMPT_ROUTES); sign-in is not behind it.
const ANSWERED_WHILE_RESET = new Set([
  'POST /auth/login',
  'GET /auth/me',
  'POST /auth/password-change/request',
  'POST /auth/password-change/confirm',
])

/** Everything asked before the change went through that the reset refuses. */
function refusedWhileReset() {
  const through = asked.indexOf('POST /auth/password-change/confirm')
  return asked.slice(0, through === -1 ? asked.length : through).filter((call) => !ANSWERED_WHILE_RESET.has(call))
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
  asked = []
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

  it('another account signing in after a session ended: by the change to its own home', async () => {
    serve(account('parent', true))
    signOutTab({
      reason: 'expired',
      account: { id: 'teacher-1', email: 'teacher@example.com', role: 'teacher' },
      returnTo: REQUEST,
    })
    useAuthStore.setState({ user: account('parent', true), accessToken: 'fresh-token', isAuthenticated: true })
    openAt('/login')

    expect(await changePassword()).toHaveAttribute('href', '/parent')
  })

  it('a look at Help and back by the logo keeps the page', async () => {
    const user = userEvent.setup()
    alreadySignedInAs(teacher(true))
    openAt(REQUEST)
    expect(await screen.findByRole('heading', { name: 'Change your password' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Account' }))
    await user.click(await screen.findByRole('menuitem', { name: 'Help and support' }))
    await waitFor(() => expect(window.location.pathname).toBe('/support'))
    const bar = document.querySelector('[data-top-bar]') as HTMLElement
    await user.click(within(bar).getByRole('link', { name: 'STOA home' }))

    expect(await changePassword()).toHaveAttribute('href', REQUEST)
    expect(refusedWhileReset()).toEqual([])
  })
})

describe('every role, after a reload on a link of its own', () => {
  it.each<[UserRole, string]>([
    ['student', '/ask'],
    ['parent', '/parent/reports?week=3'],
    ['teacher', REQUEST],
    ['admin', '/admin/users?q=ada#list'],
    ['organization_admin', '/organization/learning-operations'],
  ])('a reset %s asks for nothing the reset refuses, and Continue leads back to %s', async (role, link) => {
    alreadySignedInAs(account(role, true))
    openAt(link)

    expect(await changePassword()).toHaveAttribute('href', link)
    expect(refusedWhileReset()).toEqual([])
  })

  it("reads a reset student's sky only once the change has gone through", async () => {
    alreadySignedInAs(account('student', true))
    openAt('/ask')

    await changePassword()

    await waitFor(() => expect(asked).toContain('GET /practice/knowledge-map'))
    expect(asked.indexOf('GET /practice/knowledge-map')).toBeGreaterThan(asked.indexOf('POST /auth/password-change/confirm'))
  })
})

describe('what "Continue" will not follow', () => {
  it.each([
    ['a page the role may not use', { pathname: '/admin/users' }],
    ['another site', { pathname: '//evil.example/x' }],
    ['a path walked out of a permitted one', { pathname: '/teacher/../admin' }],
    ['the change itself', { pathname: '/settings/password' }],
    ['no pathname', { search: '?x=1' }],
    ['a backslash', { pathname: '/\\evil.example' }],
    ['a tab before another site', { pathname: '/\t/evil.example' }],
    ['an encoded //', { pathname: '/%2F%2Fevil.example' }],
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

  it('a dot walk to // is no destination, before or after the change', () => {
    const student = { role: 'student' as const, mustChangePassword: true }
    const walked = location(`?next=${encodeURIComponent('/x/..//#@evil.example')}`)

    expect(pathFromState(getPostLoginTarget(student, walked).state)).toBe('/')
    expect(getReturnPath({ role: 'student' }, '/x/..//#@evil.example')).toBe('/')
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
