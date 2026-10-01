/**
 * #13 point 2: no old student link ends on a 404. Each old route is sent to
 * its agreed target, one test per redirect. The expectations are written out
 * here rather than read from the manifest, so deleting a redirect there turns
 * its test red instead of taking the test with it.
 */
import { describe, expect, it, vi } from 'vitest'
import '@/i18n'
import { mapPathForLegacyPlanet } from '@/app/router/routeManifest'
import { getPostLoginPath } from '@/lib/authRoutes'
import type { UserRole } from '@/types/user'
import { ALL_VIEWERS, openAs } from './routeHarness'

vi.mock('@/app/router/lazyPage', () => import('./lazyPageStub'))

describe('legacy student routes redirect to the star map routes', () => {
  it.each([
    // /learn*
    ['/learn', '/', 'MapHomePage'],
    ['/learn/mistakes', '/', 'MapHomePage'],
    // /dashboard
    ['/dashboard', '/', 'MapHomePage'],
    // /practice*
    ['/practice', '/', 'MapHomePage'],
    ['/practice/math/fractions/lessons/l-1/result', '/', 'MapHomePage'],
    // /question-bank*
    ['/question-bank', '/', 'MapHomePage'],
    ['/question-bank/sets/s-1', '/', 'MapHomePage'],
    // /classroom*
    ['/classroom', '/', 'MapHomePage'],
    ['/classroom/sessions/s-1/room', '/', 'MapHomePage'],
    // learning history is gone (#13 point 3)
    ['/learning-history', '/', 'MapHomePage'],
    // /chat, /assistant
    ['/chat', '/ask', 'AskPage'],
    ['/assistant', '/ask', 'AskPage'],
    // /planet* became /map* (#72 point 8)
    ['/planet/math', '/map/math', 'MapSubjectPage'],
    ['/planet/math/fractions', '/map/math/fractions', 'MapNebulaPage'],
    ['/planet/math/fractions/u-1', '/map/math/fractions/u-1', 'MapStarPage'],
    ['/planet', '/', 'MapHomePage'],
    ['/planet/math/fractions/u-1/extra', '/', 'MapHomePage'],
    // /profile, /settings/password
    ['/profile', '/me', 'MePage'],
    ['/settings/password', '/me', 'MePage'],
  ])('%s -> %s', (from, pathname, page) => {
    const landed = openAs('student', from)

    expect(landed.pathname).toBe(pathname)
    expect(landed.page).toBe(page)
  })
})

describe('an old /planet link cannot leave /map (decoded once, plain ids only)', () => {
  it.each([
    ['/planet/..', '/'],
    ['/planet/math/..', '/'],
    ['/planet/%2e%2e', '/'],
    ['/planet/math/%2E%2E/u-1', '/'],
    ['/planet/%252e%252e', '/'],
    ['/planet/a%2Fb', '/'],
    ['/planet/math/a%2fb', '/'],
    ['/planet/%5C', '/'],
    ['/planet/math/%5Cfoo', '/'],
    ['/planet/math/%E0%A4%A', '/'],
    ['/planet/math/fractions/u-1/x', '/'],
    ['/planet', '/'],
    ['/planetarium/x', '/'],
    ['/planet/math', '/map/math'],
    ['/planet/math/fractions/u-1', '/map/math/fractions/u-1'],
    ['/planet/math/u.1', '/map/math/u.1'],
    ['/Planet/math', '/map/math'],
    ['/PLANET/math/fractions', '/map/math/fractions'],
    ['/Planet/%2e%2e', '/'],
  ])('%s -> %s', (from, to) => {
    expect(mapPathForLegacyPlanet(from)).toBe(to)
  })

  it('matches /Planet in any case, as the router does', () => {
    expect(openAs('student', '/Planet/math')).toMatchObject({ pathname: '/map/math', page: 'MapSubjectPage' })
  })

  it.each(['/planet/%2e%2e', '/planet/%252e%252e', '/planet/a%2Fb', '/planet/%5C'])('the router sends %s home', (from) => {
    expect(openAs('student', from)).toMatchObject({ pathname: '/', page: 'MapHomePage' })
  })
})

describe('an old /planet link keeps its query', () => {
  it('carries the query string to /map', () => {
    expect(openAs('student', '/planet/math?points=500')).toMatchObject({ pathname: '/map/math', search: '?points=500', page: 'MapSubjectPage' })
  })

})

describe('a /chat link that names a conversation opens it in Ask', () => {
  it('carries a conversation id in the path to /ask/:id', () => {
    expect(openAs('student', '/chat/c-42')).toMatchObject({ pathname: '/ask/c-42', page: 'AskPage' })
  })

  it('carries a conversation id in the query to /ask/:id and drops it from the query', () => {
    const landed = openAs('student', '/chat?conversationId=c-42&source=practice-upload')

    expect(landed).toMatchObject({ pathname: '/ask/c-42', search: '?source=practice-upload', page: 'AskPage' })
  })

  it('reads the id from the path when the query names another, and drops the query one', () => {
    // Ask reads only the path's id; a second one left in the query would be
    // a second answer to "which conversation".
    const landed = openAs('student', '/chat/c1?conversationId=c2&source=bell')

    expect(landed).toMatchObject({ pathname: '/ask/c1', search: '?source=bell', page: 'AskPage' })
  })

  it('carries it through /assistant too', () => {
    expect(openAs('student', '/assistant?conversationId=c-7')).toMatchObject({ pathname: '/ask/c-7' })
  })

  it.each([
    ['/chat/..'],
    ['/chat/%2E%2E'],
    ['/chat/%2e'],
    ['/chat?conversationId=..'],
    ['/chat?conversationId=%2E%2E'],
    ['/chat?conversationId=.'],
    ['/chat?conversationId=a%2Fb'],
    ['/chat?conversationId=%3Cscript%3E'],
    ['/assistant?conversationId=..'],
  ])('treats %s as naming no conversation and opens plain /ask', (from) => {
    // `/ask/..` would resolve to the parent and land on `/`.
    expect(openAs('student', from)).toMatchObject({ pathname: '/ask', page: 'AskPage' })
  })

  it('accepts the UUIDs the backend issues', () => {
    const id = '3f2b8c1e-9d4a-4b7e-8a61-0c5d2e7f9a13'
    expect(openAs('student', `/chat/${id}`).pathname).toBe(`/ask/${id}`)
  })

  it('opens plain /ask when the id is empty', () => {
    expect(openAs('student', '/chat?conversationId=').pathname).toBe('/ask')
  })

  it('keeps the practice hand-off in location state', () => {
    const state = { practiceContext: { lessonId: 'l-1' } }
    const landed = openAs('student', { pathname: '/chat', state })

    expect(landed.pathname).toBe('/ask')
    expect(landed.state).toEqual(state)
  })
})

/*
 * #104: `/assistant` was a public page, so old links to it may come from
 * anyone. A student lands in Ask, as from /chat; every other role at its own
 * home, not on /forbidden; a signed-out visitor signs in first and is then
 * brought back here to be sent on by role.
 */
describe('/assistant sends each visitor where they belong', () => {
  const landings = {
    anonymous: ['/login', '/login', 'EntryPage'],
    student: ['/ask', '/ask/c-7', 'AskPage'],
    parent: ['/parent', '/parent', 'ParentDashboardPage'],
    teacher: ['/tutor', '/tutor', 'TutorDashboardPage'],
    admin: ['/admin', '/admin', 'AdminDashboardPage'],
    organization_admin: ['/organization', '/organization', 'OrganizationHomePage'],
    school_teacher: ['/organization', '/organization', 'OrganizationHomePage'],
    school_viewer: ['/organization', '/organization', 'OrganizationHomePage'],
  } as const

  it('covers every viewer', () => {
    expect(Object.keys(landings).sort()).toEqual([...ALL_VIEWERS].sort())
  })

  it.each(ALL_VIEWERS)('%s, plain /assistant', (viewer) => {
    const [pathname, , page] = landings[viewer]
    expect(openAs(viewer, '/assistant')).toMatchObject({ pathname, search: '', page })
  })

  it.each(ALL_VIEWERS)('%s, /assistant naming a conversation', (viewer) => {
    const [, pathname, page] = landings[viewer]
    // The id is consumed into the path (or, away from Ask, dropped); the rest of the query rides along.
    const landed = openAs(viewer, '/assistant?conversationId=c-7&source=bell')
    expect(landed).toMatchObject({ pathname, page })
    if (viewer !== 'anonymous') expect(landed.search).toBe('?source=bell')
  })

  it('remembers the whole old address for a signed-out visitor', () => {
    expect(openAs('anonymous', '/assistant?conversationId=c-7').state).toMatchObject({
      from: { pathname: '/assistant', search: '?conversationId=c-7' },
    })
  })

  it.each(ALL_VIEWERS.filter((viewer): viewer is UserRole => viewer !== 'anonymous'))(
    'brings %s back from the sign-in and on to the same landing',
    (role) => {
      const { state } = openAs('anonymous', '/assistant?conversationId=c-7')
      const back = getPostLoginPath({ role }, { search: '', state })

      expect(back).toBe('/assistant?conversationId=c-7')
      const [, pathname, page] = landings[role]
      expect(openAs(role, back)).toMatchObject({ pathname, search: '', page })
    },
  )

  it('waits for the account after a refresh before deciding', () => {
    const landed = openAs('pending', '/assistant?conversationId=c-7')

    expect(landed).toMatchObject({ pathname: '/assistant', page: null })
    expect(landed.text).toContain('Loading account')
  })
})

describe('the change-password redirect is for students only', () => {
  it.each(['parent', 'teacher', 'admin', 'organization_admin'] as const)(
    'leaves the page in place for %s',
    (viewer) => {
      expect(openAs(viewer, '/settings/password')).toMatchObject({
        pathname: '/settings/password',
        page: 'ChangePasswordPage',
      })
    },
  )

  it('does not move a student under a forced password change', () => {
    // /me cannot change a password yet, and ProtectedRoute sends a reset
    // account back here: redirecting would loop and lock the student out.
    expect(openAs('student', '/settings/password', { mustChangePassword: true })).toMatchObject({
      pathname: '/settings/password',
      page: 'ChangePasswordPage',
    })
  })
})

describe('/assignments', () => {
  it('stays reachable for a student', () => {
    expect(openAs('student', '/assignments')).toMatchObject({
      pathname: '/assignments',
      page: 'StudentAssignmentsPage',
    })
  })
})
