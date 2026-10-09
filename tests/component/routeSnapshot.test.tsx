/**
 * #45 reshapes the student routes only. For everybody else -- signed out,
 * parent, teacher, administrator, the organisation roles -- every path the
 * router registered before #45 must end exactly where it ended then: same
 * address, same page, same refusal. And a student is still refused on every
 * path that was not the student's. The fixture was read off the hand-written
 * router at origin/redesign/planet e363be5; this renders the generated one.
 */
import { describe, expect, it, vi } from 'vitest'
import { getNavItemsForRole } from '@/lib/navigation'
import before from './fixtures/routesBefore45.json'
import { openAs, type Viewer } from './routeHarness'

vi.mock('@/app/router/lazyPage', () => import('./lazyPageStub'))

type Recorded = { path: string; viewer: Viewer; pathname: string; page: string }

const outcomes = before.outcomes as Recorded[]

/*
 * The navigation, too, is what it was before #45 -- except where #52 gave the
 * teacher and the administrator their shells (#13 point 6): the teacher's
 * profile and Help moved into the avatar menu, and the administrator's list
 * became Users, Teacher applications, Curriculum, Moderation and System
 * (Subscriptions and billing is frozen, card 007). Only the navigation moved;
 * every route above still ends where it ended.
 */
const expectedNav = {
  ...before.nav,
  teacher: {
    desktop: [
      ['/teacher', 'Requests', 'primary', 'requests', true, 'navigation.requests'],
      ['/teacher/availability', 'Availability', 'primary', 'settings', true, 'navigation.availability'],
    ],
    mobile: ['/teacher', '/teacher/availability'],
  },
  admin: {
    desktop: [
      ['/admin/users', 'Users', 'primary', 'students', false, 'navigation.admin.users'],
      ['/admin/teacher-applications', 'Teacher applications', 'primary', 'tutors', false, 'navigation.admin.teacherApplications'],
      ['/admin/curriculum', 'Curriculum', 'primary', 'curriculum', false, 'navigation.admin.curriculum'],
      ['/admin/moderation', 'Moderation', 'primary', 'moderation', true, 'navigation.admin.moderation'],
      ['/admin', 'System', 'primary', 'settings', true, 'navigation.admin.system'],
    ],
    mobile: ['/admin/moderation', '/admin'],
  },
}
const viewers = [...new Set(outcomes.map((outcome) => outcome.viewer))]

/*
 * The old paths whose ending changed on purpose since.
 *
 * `/assistant` sent every signed-in role but the student to /forbidden. Since
 * #104 it sends each of them to their own home. Signed out, it still ends on
 * the sign-in.
 *
 * The teacher area moved off the legacy prefix in #69. Its old addresses now
 * forward to the same page under /teacher, so a teacher ends one redirect
 * later than before and everybody else is refused exactly as before.
 */
const changedSince45: Record<string, Partial<Record<Viewer, { pathname: string; page: string }>>> = {
  '/assistant': {
    parent: { pathname: '/parent', page: 'ParentDashboardPage' },
    teacher: { pathname: '/teacher', page: 'TutorDashboardPage' },
    admin: { pathname: '/admin', page: 'AdminDashboardPage' },
    organization_admin: { pathname: '/organization', page: 'OrganizationHomePage' },
    school_teacher: { pathname: '/organization', page: 'OrganizationHomePage' },
    school_viewer: { pathname: '/organization', page: 'OrganizationHomePage' },
  },
  '/tutor': { teacher: { pathname: '/teacher', page: 'TutorDashboardPage' } },
  '/tutor/availability': { teacher: { pathname: '/teacher/availability', page: 'TutorAvailabilityPage' } },
  '/tutor/profile': { teacher: { pathname: '/teacher/profile', page: 'TutorProfilePage' } },
  '/tutor/learning-automation': {
    teacher: { pathname: '/teacher/learning-automation', page: 'LearningAutomationConsolePage' },
  },
  '/tutor/requests/requestId-1': {
    teacher: { pathname: '/teacher/requests/requestId-1', page: 'TutorHelpRequestDetailPage' },
  },
}
const expectedOutcome = (recorded: Recorded) => changedSince45[recorded.path]?.[recorded.viewer] ?? recorded

describe('non-student routes are unchanged by the route manifest', () => {
  it('covers every registered path for every non-student viewer', () => {
    expect(viewers).not.toContain('student')
    expect(viewers).toHaveLength(7)
    expect(new Set(outcomes.map((outcome) => outcome.path)).size).toBeGreaterThan(60)
  })

  it.each(viewers)('ends every old path where it ended before (%s)', (viewer) => {
    const changed = outcomes
      .filter((recorded) => recorded.viewer === viewer)
      .flatMap((recorded) => {
        const now = openAs(viewer, recorded.path)
        const expected = expectedOutcome(recorded)
        const same = now.pathname === expected.pathname && now.page === expected.page
        return same
          ? []
          : [{ path: recorded.path, before: `${expected.pathname} ${expected.page}`, now: `${now.pathname} ${now.page}` }]
      })

    expect(changed).toEqual([])
  })

  it('refuses a student everywhere that is not the student\'s own, as before', () => {
    // A student admitted to a teacher, parent, admin or organisation route
    // would pass every check above: they only look at the other viewers.
    const recorded = before.studentOutcomes as Omit<Recorded, 'viewer'>[]
    expect(recorded.length).toBeGreaterThan(30)

    const changed = recorded.flatMap((entry) => {
      const now = openAs('student', entry.path)
      const same = now.pathname === entry.pathname && now.page === entry.page
      return same
        ? []
        : [{ path: entry.path, before: `${entry.pathname} ${entry.page}`, now: `${now.pathname} ${now.page}` }]
    })

    expect(changed).toEqual([])
  })

  it.each(['parent', 'teacher', 'admin', 'organization'] as const)(
    'shows the same navigation as before, apart from #52 (%s)',
    (area) => {
      const desktop = getNavItemsForRole(area, { includeSecondary: true }).map((item) => [
        item.path,
        item.label,
        item.priority,
        item.icon,
        Boolean(item.mobile),
        item.labelKey ?? item.label,
      ])
      const mobile = getNavItemsForRole(area, { mobileOnly: true })
        .slice(0, 5)
        .map((item) => item.path)

      expect({ desktop, mobile }).toEqual(expectedNav[area])
    },
  )
})
