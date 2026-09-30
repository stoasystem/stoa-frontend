/**
 * The teacher, parent, administrator and organisation shells (#52; #13
 * point 6): what each role is offered beside the logo, that every place the
 * bar, the source list or the avatar menu leads to opens for the role that
 * sees it, and that the organisation roles' home is a page.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import '@/i18n'
import { navAreaForRole } from '@/app/router/routeManifest'
import { accountMenuFor, pathOf } from '@/components/shell/accountMenuTargets'
import { shellNavigationFor } from '@/components/shell/shellNavigation'
import { getDefaultRouteForRole } from '@/lib/authRoutes'
import { OrganizationHomePage } from '@/pages/organization/OrganizationHomePage'
import { type CurrentUser, useAuthStore } from '@/store/authStore'
import type { UserRole } from '@/types/user'
import { openAs } from './routeHarness'

vi.mock('@/app/router/lazyPage', () => import('./lazyPageStub'))
vi.mock('@/hooks/notifications/useNotificationsQuery', () => ({
  useNotificationsQuery: () => ({ data: { items: [] }, isLoading: false, isError: false }),
  useMarkNotificationReadMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useArchiveNotificationMutation: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/hooks/notifications/useRealtimeNotifications', () => ({
  useRealtimeNotifications: () => ({ status: 'disabled' }),
}))

const ROLES: readonly UserRole[] = [
  'student',
  'parent',
  'teacher',
  'admin',
  'organization_admin',
  'school_teacher',
  'school_viewer',
]
const ORGANIZATION_ROLES = ['organization_admin', 'school_teacher', 'school_viewer'] as const

const paths = (role: UserRole) => {
  const navigation = shellNavigationFor(role)
  return navigation.kind === 'none' ? [] : navigation.items.map((item) => item.path)
}

describe('what each role is offered beside the logo', () => {
  it('gives a teacher Requests | Availability', () => {
    expect(shellNavigationFor('teacher').kind).toBe('segmented')
    expect(paths('teacher')).toEqual(['/tutor', '/tutor/availability'])
  })

  it('gives a parent Overview | Reports', () => {
    expect(shellNavigationFor('parent').kind).toBe('segmented')
    expect(paths('parent')).toEqual(['/parent', '/parent/reports'])
  })

  it('gives an administrator the source list, in the order of #13 point 6', () => {
    const navigation = shellNavigationFor('admin')
    expect(navigation.kind).toBe('sourceList')
    if (navigation.kind !== 'sourceList') return
    expect(navigation.items.map((item) => [item.path, item.labelKey, item.covers ?? []])).toEqual([
      ['/admin/users', 'navigation.admin.users', ['/admin/account-operations']],
      ['/admin/teacher-applications', 'navigation.admin.teacherApplications', []],
      ['/admin/curriculum', 'navigation.admin.curriculum', []],
      ['/admin/moderation', 'navigation.admin.moderation', []],
      // Subscriptions and billing is frozen (card 007) and comes back here.
      ['/admin', 'navigation.admin.system', ['/admin/system', '/admin/learning-operations', '/admin/learning-automation']],
    ])
  })

  it.each(['student', ...ORGANIZATION_ROLES] as const)('gives a %s nothing', (role) => {
    expect(shellNavigationFor(role)).toEqual({ kind: 'none' })
  })
})

// Every place a role can be sent from its own shell, each covered page of a
// section included, and every item of its avatar menu.
function targetsOf(role: UserRole): string[] {
  const navigation = shellNavigationFor(role)
  const nav = navigation.kind === 'none' ? [] : navigation.items.flatMap((item) => [item.path, ...(item.covers ?? [])])
  const menu = accountMenuFor(navAreaForRole(role))
  const inMenu = [menu.profile, menu.password, menu.help, ...menu.extras.map((extra) => extra.to)]
  return [...new Set([getDefaultRouteForRole(role), ...nav, ...inMenu].filter((to): to is string => Boolean(to)).map(pathOf))]
}

describe('every target in a role\'s shell admits that role', () => {
  it.each(ROLES)('opens a page, not a refusal, for a %s', (role) => {
    const refused = targetsOf(role).flatMap((path) => {
      const landed = openAs(role, path)
      const ok =
        landed.pathname === path &&
        landed.page !== null &&
        !['ForbiddenPage', 'NotFoundPage', 'EntryPage', 'UnauthorizedPage'].includes(landed.page)
      return ok ? [] : [`${path} -> ${landed.pathname} ${landed.page}`]
    })
    expect(refused).toEqual([])
  })

  it('sends the organisation roles home to a page of their own, not a 404', () => {
    for (const role of ORGANIZATION_ROLES) {
      expect(getDefaultRouteForRole(role)).toBe('/organization')
      expect(openAs(role, '/organization')).toMatchObject({ pathname: '/organization', page: 'OrganizationHomePage' })
    }
  })

  it('still refuses the organisation home to everybody else', () => {
    expect(openAs('student', '/organization')).toMatchObject({ pathname: '/forbidden' })
    expect(openAs('parent', '/organization')).toMatchObject({ pathname: '/forbidden' })
    expect(openAs('teacher', '/organization')).toMatchObject({ pathname: '/forbidden' })
    expect(openAs('anonymous', '/organization')).toMatchObject({ pathname: '/login' })
  })
})

describe('the organisation home', () => {
  it('renders its title and the two organisation pages as rows', () => {
    useAuthStore.setState({
      user: { id: 'u-1', name: 'Ada Muster', email: 'ada@example.com', role: 'school_viewer' } as CurrentUser,
      accessToken: 'token',
      isAuthenticated: true,
    })
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={['/organization']}>
          <OrganizationHomePage />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(screen.getByRole('heading', { level: 1, name: 'Organization' })).toBeInTheDocument()
    const main = screen.getByRole('main')
    expect(within(main).getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual([
      '/organization/learning-operations',
      '/organization/learning-automation',
    ])
    // The logo leads back here.
    expect(screen.getByRole('link', { name: 'STOA home' })).toHaveAttribute('href', '/organization')
    useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })
  })
})
