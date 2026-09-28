/**
 * Typing a protected address straight into the address bar is refused, not
 * merely left out of the navigation: signed out goes to sign-in, the wrong
 * role goes to /forbidden, as the guards always did. These are what the
 * browser shows; the backend still decides every request on its own.
 *
 * The expectations are written out, not read from the manifest, so loosening
 * an entry's `access` there turns these red.
 */
import { describe, expect, it, vi } from 'vitest'
import { openAs, type Viewer } from './routeHarness'

vi.mock('@/app/router/lazyPage', () => import('./lazyPageStub'))

const STUDENT_ROUTES = [
  ['/map/math', 'MapSubjectPage'],
  ['/map/math/fractions', 'MapNebulaPage'],
  ['/map/math/fractions/u-1', 'MapStarPage'],
  ['/chapter/u-1', 'ChapterPage'],
  ['/chapter/u-1/l-1', 'LessonStagePage'],
  ['/ask', 'AskPage'],
  ['/ask/c-1', 'AskPage'],
  ['/me', 'MePage'],
  ['/assignments', 'StudentAssignmentsPage'],
] as const

const OTHER_ROLES: readonly Viewer[] = [
  'parent',
  'teacher',
  'admin',
  'organization_admin',
  'school_teacher',
  'school_viewer',
]

describe('student routes', () => {
  it.each(STUDENT_ROUTES)('open for a student (%s)', (path, page) => {
    expect(openAs('student', path)).toMatchObject({ pathname: path, page })
  })

  it.each(STUDENT_ROUTES)('send a signed-out visitor to sign in, remembering %s', (path) => {
    const landed = openAs('anonymous', path)

    expect(landed.pathname).toBe('/login')
    expect(landed.page).toBe('EntryPage')
    expect(landed.state).toMatchObject({ from: { pathname: path } })
  })

  for (const viewer of OTHER_ROLES) {
    it.each(STUDENT_ROUTES)(`refuse ${viewer} (%s)`, (path) => {
      expect(openAs(viewer, path)).toMatchObject({ pathname: '/forbidden', page: 'ForbiddenPage' })
    })
  }

  it.each(STUDENT_ROUTES)('wait for the account after a refresh before deciding (%s)', (path) => {
    // A stored token and no account yet: the guard neither shows the page nor
    // sends the visitor away while /auth/me is still on its way.
    const landed = openAs('pending', path)

    expect(landed).toMatchObject({ pathname: path, page: null })
    expect(landed.text).toContain('Loading account')
  })

  it('send a reset student to the password change first', () => {
    expect(openAs('student', '/ask', { mustChangePassword: true })).toMatchObject({
      pathname: '/settings/password',
      page: 'ChangePasswordPage',
    })
  })
})

describe('/ is the star map for a student and the front door for everyone else', () => {
  it('shows a student the star map', () => {
    expect(openAs('student', '/')).toMatchObject({ pathname: '/', page: 'MapHomePage' })
  })

  it.each(['anonymous', ...OTHER_ROLES] as Viewer[])('shows %s the entry page, not the star map', (viewer) => {
    // EntryPage signs the visitor in, or sends them to their own home.
    expect(openAs(viewer, '/')).toMatchObject({ pathname: '/', page: 'EntryPage' })
  })

  it('sends a reset student to the password change first', () => {
    expect(openAs('student', '/', { mustChangePassword: true })).toMatchObject({
      pathname: '/settings/password',
    })
  })
})

describe('other roles cannot reach each other either', () => {
  it.each([
    ['student', '/tutor'],
    ['student', '/parent'],
    ['student', '/admin/users'],
    ['student', '/organization/learning-operations'],
    ['teacher', '/admin'],
    ['parent', '/tutor/requests/r-1'],
  ] as const)('refuses %s at %s', (viewer, path) => {
    expect(openAs(viewer, path).pathname).toBe('/forbidden')
  })

  it.each(['/tutor', '/parent', '/admin', '/settings/password'])(
    'sends a signed-out visitor at %s to sign in',
    (path) => {
      expect(openAs('anonymous', path).pathname).toBe('/login')
    },
  )
})
