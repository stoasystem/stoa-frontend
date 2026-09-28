/**
 * The pages #52 restyled keep their jobs: a teacher's Requests holds the way
 * into learning automation, a parent's Overview the way into each child's
 * detail, and the administrator's System and Users pages the other pages of
 * their sections -- all as chevron rows in grouped lists.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import '@/i18n'
import { HelpRequestDetailCard } from '@/components/tutor/HelpRequestDetailCard'
import { AdminAccountsPage } from '@/pages/admin/AdminAccountsPage'
import { AdminDashboardPage } from '@/pages/admin/Dashboard'
import { OrganizationHomePage } from '@/pages/organization/OrganizationHomePage'
import { ParentDashboardPage } from '@/pages/parent/ParentDashboardPage'
import { ParentReportsPage } from '@/pages/parent/ParentReportsPage'
import { TutorDashboardPage } from '@/pages/tutor/TutorDashboardPage'
import { type CurrentUser, useAuthStore } from '@/store/authStore'
import type { AccountOperationsSupportState } from '@/types/parentAccountOperations'
import type { TutorHelpRequestDetail } from '@/types/tutor'
import type { UserRole } from '@/types/user'

const account = vi.hoisted(() => ({
  supportState: { state: 'attention', blockers: [], warnings: ['parent_email_unverified'] } as AccountOperationsSupportState,
}))

vi.mock('@/hooks/notifications/useNotificationsQuery', () => ({
  useNotificationsQuery: () => ({ data: { items: [] }, isLoading: false, isError: false }),
  useAdminNotificationsQuery: () => ({ data: { items: [] }, isLoading: false, isError: false }),
  useMarkNotificationReadMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useArchiveNotificationMutation: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/hooks/notifications/useRealtimeNotifications', () => ({
  useRealtimeNotifications: () => ({ status: 'disabled' }),
}))
vi.mock('@/hooks/tutor/useTutorHelpRequestsQuery', () => ({
  useTutorHelpRequestsQuery: () => ({
    isLoading: false,
    isError: false,
    data: {
      items: [
        {
          requestId: 'r-1',
          conversationId: 'c-1',
          studentName: 'Lina Meier',
          subject: 'Mathematics',
          grade: 'Grade 8',
          status: 'pending',
          requestMessage: 'Why do we divide both sides?',
          createdAt: '2026-09-28T09:00:00Z',
          sla: { status: 'at_risk', targetMinutes: 30 },
        },
        {
          requestId: 'r-2',
          conversationId: 'c-2',
          studentName: 'Noah Keller',
          subject: 'German',
          grade: 'Grade 7',
          status: 'assigned',
          priority: 'low',
          requestMessage: 'Which case after "mit"?',
          createdAt: '2026-09-28T08:00:00Z',
          sla: { status: 'breached', targetMinutes: 30 },
        },
      ],
    },
  }),
}))
vi.mock('@/hooks/tutor/useTutorStatsQuery', () => ({
  useTutorStatsQuery: () => ({ data: { pendingRequests: 4, resolvedToday: 6, averageResponseTimeMinutes: 12 } }),
}))
vi.mock('@/hooks/parent/useParentChildrenQuery', () => ({
  useParentChildrenQuery: () => ({
    isLoading: false,
    isError: false,
    data: {
      items: [
        { id: 'ch-1', userId: 'u-9', name: 'Lina Meier', email: 'l@example.ch', grade: 'Grade 8', subjects: ['Mathematics'], relationship: 'parent' },
      ],
    },
  }),
}))
vi.mock('@/hooks/parent/useParentAccountOperationsQuery', () => ({
  useParentAccountOperationsQuery: () => ({
    isLoading: false,
    isError: false,
    get data() {
      return { supportState: account.supportState, children: [{ childId: 'ch-1' }, { childId: 'ch-2' }] }
    },
  }),
}))
vi.mock('@/hooks/admin/useAdminPlatformStatsQuery', () => ({
  useAdminPlatformStatsQuery: () => ({ data: undefined }),
}))
vi.mock('@/services/admin/accountsApi', async () => {
  const actual = await vi.importActual<typeof import('@/services/admin/accountsApi')>('@/services/admin/accountsApi')
  return {
    ...actual,
    listAccounts: vi.fn(async () => ({
      items: [
        {
          userId: 'u-2',
          accountNumber: 'S-102',
          name: 'Lina Meier',
          email: 'lina@example.ch',
          role: 'student',
          accountStatus: 'active',
          isMinor: true,
          minorKnown: true,
          createdAt: '2026-08-01T09:00:00Z',
          lastLoginAt: '2026-09-28T09:00:00Z',
          linkedAccounts: [],
        },
      ],
      count: 1,
      groups: { student: 1 },
      nextCursor: null,
    })),
  }
})

afterEach(() => {
  useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })
  account.supportState = { state: 'attention', blockers: [], warnings: ['parent_email_unverified'] }
})

function renderAs(role: UserRole, path: string, page: ReactNode) {
  useAuthStore.setState({
    user: { id: 'u-1', name: 'Ada Muster', email: 'ada@example.com', role } as CurrentUser,
    accessToken: 'token',
    isAuthenticated: true,
  })
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={[path]}>{page}</MemoryRouter>
    </QueryClientProvider>,
  )
}

const rowLinks = () =>
  [...screen.getByRole('main').querySelectorAll('a[data-row]')].map((row) => row.getAttribute('href'))

describe('a teacher\'s Requests', () => {
  it('lists requests as chevron rows, filters with one segmented control, and leads into learning automation', () => {
    renderAs('teacher', '/tutor', <TutorDashboardPage />)

    expect(rowLinks()).toEqual(['/tutor/requests/r-1', '/tutor/requests/r-2', '/tutor/learning-automation'])
    expect(screen.getByRole('region', { name: 'Requests' })).toBeInTheDocument()
    const row = screen.getByRole('link', { name: /Lina Meier/ })
    expect(row.querySelector('[data-chevron]')).not.toBeNull()
    expect(within(row).getByText('Pending')).toBeInTheDocument()
    expect(within(row).getByText('At risk')).toBeInTheDocument()
    const filter = screen.getByRole('group', { name: 'Filter requests' })
    expect(within(filter).getAllByRole('button').map((button) => button.textContent)).toEqual([
      'All',
      'Pending',
      'Assigned',
      'In progress',
      'Resolved',
    ])
    expect(screen.getByText('12 min')).toBeInTheDocument()
  })

  it('tells a missed response time from one at risk, and keeps time and priority on a phone', () => {
    renderAs('teacher', '/tutor', <TutorDashboardPage />)

    const atRisk = screen.getByRole('link', { name: /Lina Meier/ })
    const breached = screen.getByRole('link', { name: /Noah Keller/ })
    expect(within(atRisk).getByText('At risk')).toHaveAttribute('data-tone', 'gold')
    expect(within(breached).getByText('Overdue')).toHaveAttribute('data-tone', 'danger')

    // Every priority is named, not only high; the trailing pill is for wide screens.
    const pill = within(breached).getByText('Low priority', { selector: '[data-tone]' })
    expect(pill).toHaveClass('hidden', 'sm:inline-flex')
    expect(pill).toHaveAttribute('data-tone', 'neutral')
    // On a phone the priority and a short time lead the subtitle instead.
    const phoneMeta = breached.querySelector('[data-phone-meta]')
    expect(phoneMeta).toHaveClass('sm:hidden')
    expect(phoneMeta?.querySelector('time')).toHaveAttribute('dateTime', '2026-09-28T08:00:00Z')
    expect(phoneMeta).toHaveTextContent(/^Low · /)
    expect(atRisk.querySelector('[data-phone-meta]')).not.toHaveTextContent(/Low|Normal|High/)
  })
})

describe('a teacher\'s request detail', () => {
  const detail: TutorHelpRequestDetail = {
    requestId: 'r-1',
    conversationId: 'c-1',
    student: { id: 's-1', name: 'Lina Meier', grade: 'Grade 8' },
    subject: 'Mathematics',
    status: 'assigned',
    messages: [],
  }

  it('shows the first tutor action, which the list rows leave out', () => {
    renderAs('teacher', '/tutor/requests/r-1', <HelpRequestDetailCard request={{ ...detail, firstTutorActionAt: '2026-09-28T09:12:00Z' }} />)
    expect(document.querySelector('[data-first-action]')).toHaveTextContent(/^First tutor action: .*\d/)
  })

  it('says when no tutor has acted yet', () => {
    renderAs('teacher', '/tutor/requests/r-1', <HelpRequestDetailCard request={detail} />)
    expect(document.querySelector('[data-first-action]')).toHaveTextContent('First tutor action: not recorded yet')
  })
})

describe('a parent\'s Overview and Reports', () => {
  it('leads from Overview into each child\'s detail, and to the account', () => {
    renderAs('parent', '/parent', <ParentDashboardPage />)

    expect(rowLinks()).toEqual(['/parent/children/ch-1', '/parent/account-operations'])
  })

  it.each([
    [{ state: 'ready', blockers: [], warnings: [] }, 'Ready · 2 linked children'],
    [{ state: 'attention', blockers: [], warnings: ['parent_email_unverified'] }, 'Needs attention: Parent email needs verification'],
    [
      { state: 'blocked', blockers: ['no_linked_children'], warnings: ['usage_unreconciled'] },
      'Blocked (2 items): No linked child account',
    ],
    // Billing is frozen (card 007): its codes count, but are never named.
    [{ state: 'attention', blockers: [], warnings: ['billing_inactive'] }, 'Needs attention: Open for details'],
  ] as const)('states the account as %j', (supportState, subtitle) => {
    account.supportState = { ...supportState, blockers: [...supportState.blockers], warnings: [...supportState.warnings] }
    renderAs('parent', '/parent', <ParentDashboardPage />)

    const row = screen.getByRole('link', { name: /Account and family/ })
    expect(row).toHaveTextContent(subtitle)
  })

  it('offers each child\'s summary and reports as rows', () => {
    renderAs('parent', '/parent/reports', <ParentReportsPage />)

    // The monthly report has no route yet (#78 review), so it has no row.
    expect(rowLinks()).toEqual(['/parent/children/ch-1', '/parent/children/ch-1/report'])
    expect(screen.queryByText('Monthly trends')).toBeNull()
  })
})

describe('the administrator\'s System', () => {
  it('holds system status, learning operations and learning automation', () => {
    renderAs('admin', '/admin', <AdminDashboardPage />)

    expect(screen.getByRole('heading', { level: 1, name: 'System' })).toBeInTheDocument()
    expect(rowLinks()).toEqual(['/admin/system', '/admin/learning-operations', '/admin/learning-automation'])
    // User management exists (Users); the scope card no longer calls it deferred.
    expect(screen.getByText('Operations scope')).toBeInTheDocument()
    expect(screen.getByRole('main')).not.toHaveTextContent(/deferred/i)
  })
})

// Base `Button` marks its weight as data-variant; the legacy ui/button marks
// its default (filled) variant as data-emphasis. Both count.
const FILLED = '[data-variant="filled"], [data-emphasis="filled"]'

describe('no screen carries more than one filled button', () => {
  it.each([
    ['teacher', '/tutor', <TutorDashboardPage key="t" />, 'Lina Meier'],
    ['parent', '/parent', <ParentDashboardPage key="p" />, 'Account and family'],
    ['parent', '/parent/reports', <ParentReportsPage key="r" />, 'Weekly report'],
    ['admin', '/admin', <AdminDashboardPage key="a" />, 'Operations scope'],
    ['admin', '/admin/users', <AdminAccountsPage key="u" />, 'lina@example.ch'],
    ['organization_admin', '/organization', <OrganizationHomePage key="o" />, 'Learning operations'],
  ] as const)('%s at %s', async (role, path, page, loaded) => {
    renderAs(role, path, page)
    await waitFor(() => expect(screen.getAllByText(loaded).length).toBeGreaterThan(0))
    expect(document.querySelectorAll(FILLED).length).toBeLessThanOrEqual(1)
  })

  it('sees the legacy filled button', () => {
    renderAs('admin', '/admin/users', <AdminAccountsPage />)
    expect(screen.getByRole('button', { name: 'Send invitation' })).toHaveAttribute('data-emphasis', 'filled')
    expect(screen.getByRole('button', { name: 'Assign directly' })).not.toHaveAttribute('data-emphasis')
  })
})
