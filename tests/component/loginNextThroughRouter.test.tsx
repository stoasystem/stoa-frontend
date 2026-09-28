/**
 * Where signing in lands, through the real router.
 *
 * `/login` is rendered by EntryPage, not LoginPage, so a test that mounts the
 * login form on its own cannot see what happens once the session exists. This
 * mounts the whole AppRouter -- generated from the route manifest, with the
 * real EntryPage, login form and mutation, ProtectedRoute, RoleRoute and the
 * legacy redirects -- against MSW, and reads the address bar.
 *
 * Only the destination pages are stubbed: what they render is not under test,
 * and the real ones would each fetch their own data.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { useParams, useSearchParams } from 'react-router-dom'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import { AppRouter } from '@/app/router/AppRouter'
import { TOKEN_KEY, useAuthStore } from '@/store/authStore'
import type { User, UserRole } from '@/types/user'
import { mswServer } from '../mswServer'

vi.mock('@/pages/map/MapPages', () => ({
  MapHomePage: () => <h1>student home</h1>,
  MapSubjectPage: function MapSubjectStub() {
    return <h1>{`star map ${useParams().subjectId}`}</h1>
  },
  MapNebulaPage: function MapNebulaStub() {
    const { subjectId, topicId } = useParams()
    return <h1>{`nebula ${subjectId}/${topicId}`}</h1>
  },
  MapStarPage: () => <h1>star</h1>,
}))
vi.mock('@/pages/me/MePage', () => ({ MePage: () => <h1>student account</h1> }))
vi.mock('@/pages/ask/AskPage', () => ({
  AskPage: function AskStub() {
    return <h1>{`ask ${useParams().conversationId ?? 'without a conversation'}`}</h1>
  },
}))
vi.mock('@/pages/parent/ParentDashboardPage', () => ({
  ParentDashboardPage: () => <h1>parent home</h1>,
}))
vi.mock('@/pages/tutor/TutorDashboardPage', () => ({
  TutorDashboardPage: () => <h1>teacher home</h1>,
}))
vi.mock('@/pages/auth/TeacherActivatePage', () => ({
  TeacherActivatePage: function TeacherActivateStub() {
    const [params] = useSearchParams()
    return <h1>{`teacher activation ${params.get('token') ?? 'without a token'}`}</h1>
  },
}))
vi.mock('@/pages/auth/ChangePasswordPage', () => ({
  ChangePasswordPage: () => <h1>password change</h1>,
}))

function account(role: UserRole, mustChangePassword = false): User {
  return {
    id: `${role}-1`,
    name: 'Ada',
    email: `${role}@example.com`,
    role,
    mustChangePassword,
  } as User
}

function serve(user: User) {
  mswServer.use(
    http.post('https://api.test/auth/login', () =>
      HttpResponse.json({ accessToken: 'fresh-token', user }),
    ),
    http.get('https://api.test/auth/me', () => HttpResponse.json(user)),
    // Anything else the shell asks for (the student's conversation prefetch)
    // is not what these tests are about.
    http.all('https://api.test/*', () => HttpResponse.json({ items: [], nextToken: null })),
  )
}

function openAt(url: string) {
  window.history.replaceState(null, '', url)
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <AppRouter />
    </QueryClientProvider>,
  )
}

async function signIn() {
  fireEvent.change(await screen.findByLabelText('Email'), {
    target: { value: 'ada@example.com' },
  })
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Pass!word123' } })
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
}

async function expectToLandOn(pathname: string, heading: string) {
  expect(await screen.findByRole('heading', { name: heading }, { timeout: 3000 })).toBeInTheDocument()
  await waitFor(() => expect(window.location.pathname).toBe(pathname))
}

beforeAll(() => mswServer.listen({ onUnhandledRequest: 'error' }))
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

describe('signing in from /login', () => {
  it('lands on the ?next= page when the role may use it', async () => {
    serve(account('student'))
    openAt('/login?next=/me')

    await signIn()

    await expectToLandOn('/me', 'student account')
  })

  it('keeps the query and the hash on a ?next= page', async () => {
    serve(account('student'))
    openAt(`/login?next=${encodeURIComponent('/map/math?focus=u-3#algebra')}`)

    await signIn()

    await expectToLandOn('/map/math', 'star map math')
    expect(window.location.search).toBe('?focus=u-3')
    expect(window.location.hash).toBe('#algebra')
  })

  it('resumes a teacher activation with its token', async () => {
    // Built exactly as TeacherActivatePage builds its "sign in to resume" link.
    const token = 'act-9f3c2e'
    serve(account('teacher'))
    openAt(`/login?next=${encodeURIComponent(`/teacher-activate?token=${token}`)}`)

    await signIn()

    await expectToLandOn('/teacher-activate', `teacher activation ${token}`)
    expect(window.location.search).toBe(`?token=${token}`)
  })

  it.each([
    // An old conversation link lands on that conversation in Ask.
    ['/chat/c-9', '/ask/c-9', 'ask c-9'],
    // An old planet link lands on the same place in the star map.
    ['/planet/math', '/map/math', 'star map math'],
    // The old signed-out "start practising" link: practice now forwards home.
    ['/practice', '/', 'student home'],
  ])('follows the legacy ?next=%s through its redirect to %s', async (next, pathname, heading) => {
    serve(account('student'))
    openAt(`/login?next=${encodeURIComponent(next)}`)

    await signIn()

    await expectToLandOn(pathname, heading)
  })

  it('returns to the protected page that sent the visitor to sign in', async () => {
    serve(account('student'))
    openAt('/map/math/algebra')
    await waitFor(() => expect(window.location.pathname).toBe('/login'))

    await signIn()

    await expectToLandOn('/map/math/algebra', 'nebula math/algebra')
  })

  it("goes to the role's home when the page it was sent away from belongs to another role", async () => {
    serve(account('parent'))
    openAt('/map/math/algebra')
    await waitFor(() => expect(window.location.pathname).toBe('/login'))

    await signIn()

    await expectToLandOn('/parent', 'parent home')
  })

  it.each([
    ['parent', '/parent', 'parent home'],
    ['teacher', '/tutor', 'teacher home'],
  ] as const)("sends a %s whose ?next= belongs to a student to the role's home", async (role, home, heading) => {
    serve(account(role))
    openAt('/login?next=/map/math')

    await signIn()

    await expectToLandOn(home, heading)
  })

  it.each([
    '//evil.example',
    'https://evil.example',
    '//evil.example/me',
    '/\\evil.example',
    '/\\evil.example/me',
    '/%5C%5Cevil.example',
    '\\\\evil.example',
    '/.//evil.example',
    '/ask/..//evil.example',
    '/map/../\\evil.example',
    '/me/../admin',
    '/map/../admin',
  ])(
    "goes to the role's home when ?next=%s points off the site or out of the role",
    async (next) => {
      serve(account('student'))
      openAt(`/login?next=${encodeURIComponent(next)}`)

      await signIn()

      await expectToLandOn('/', 'student home')
      expect(window.location.host).toBe('localhost:3000')
    },
  )

  it("goes to the role's home on the address an earlier review probed", async () => {
    // Exactly as typed into the address bar: `next` decodes to `/map/../\evil.com`,
    // which starts with `/map/` as a string but loads `//evil.com`.
    serve(account('student'))
    openAt('/login?next=/map/..%2F%5Cevil.com')

    await signIn()

    await expectToLandOn('/', 'student home')
    expect(window.location.host).toBe('localhost:3000')
  })

  it('sends a reset account to the password change first, whatever ?next= says', async () => {
    serve(account('student', true))
    openAt('/login?next=/me')

    await signIn()

    await expectToLandOn('/settings/password', 'password change')
  })
})

describe('opening /login while already signed in', () => {
  function alreadySignedInAs(user: User) {
    serve(user)
    localStorage.setItem(TOKEN_KEY, 'stored-token')
    useAuthStore.setState({ user, accessToken: 'stored-token', isAuthenticated: true })
  }

  it('goes straight to the ?next= page when the role may use it', async () => {
    alreadySignedInAs(account('student'))

    openAt('/login?next=/me')

    await expectToLandOn('/me', 'student account')
  })

  it("goes to the role's home when the role may not use it", async () => {
    alreadySignedInAs(account('student'))

    openAt('/login?next=/admin')

    await expectToLandOn('/', 'student home')
  })

  it('is not stopped by a role the destination table does not know', async () => {
    // A session can carry a role this build has never heard of; the login
    // screen must still move it on rather than throw while rendering.
    alreadySignedInAs({ ...account('student'), role: 'janitor' as UserRole })

    openAt('/login?next=/me')

    // The manifest has no home for it, so it is refused; what matters is that
    // the login screen moved it on instead of failing.
    await waitFor(() => expect(window.location.pathname).toBe('/forbidden'))
    expect(screen.queryByLabelText('Email')).not.toBeInTheDocument()
  })
})
