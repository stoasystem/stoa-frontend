/**
 * The pages #52 restyled keep their jobs: a teacher's Requests holds the way
 * into learning automation, a parent's Overview the way into each child's
 * detail, and the administrator's System and Users pages the other pages of
 * their sections -- all as chevron rows in grouped lists.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import '@/i18n'
import { AdminDashboardPage } from '@/pages/admin/Dashboard'
import { ParentDashboardPage } from '@/pages/parent/ParentDashboardPage'
import { ParentReportsPage } from '@/pages/parent/ParentReportsPage'
import { TutorDashboardPage } from '@/pages/tutor/TutorDashboardPage'
import { type CurrentUser, useAuthStore } from '@/store/authStore'
import type { UserRole } from '@/types/user'

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
    data: { supportState: { state: 'attention', blockers: [], warnings: ['parent_email_unverified'] }, children: [] },
  }),
}))
vi.mock('@/hooks/admin/useAdminPlatformStatsQuery', () => ({
  useAdminPlatformStatsQuery: () => ({ data: undefined }),
}))

afterEach(() => useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false }))

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

    expect(rowLinks()).toEqual(['/tutor/requests/r-1', '/tutor/learning-automation'])
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
})

describe('a parent\'s Overview and Reports', () => {
  it('leads from Overview into each child\'s detail, and to the account', () => {
    renderAs('parent', '/parent', <ParentDashboardPage />)

    expect(rowLinks()).toEqual(['/parent/children/ch-1', '/parent/account-operations'])
    expect(screen.getByText('1 item needs attention')).toBeInTheDocument()
  })

  it('offers each child\'s summary and reports as rows', () => {
    renderAs('parent', '/parent/reports', <ParentReportsPage />)

    expect(rowLinks()).toEqual([
      '/parent/children/ch-1',
      '/parent/children/ch-1/report',
      '/parent/children/ch-1/monthly-report',
    ])
  })
})

describe('the administrator\'s System', () => {
  it('holds system status, learning operations and learning automation', () => {
    renderAs('admin', '/admin', <AdminDashboardPage />)

    expect(screen.getByRole('heading', { level: 1, name: 'System' })).toBeInTheDocument()
    expect(rowLinks()).toEqual(['/admin/system', '/admin/learning-operations', '/admin/learning-automation'])
  })
})

describe('no screen carries more than one filled button', () => {
  it.each([
    ['teacher', '/tutor', <TutorDashboardPage key="t" />],
    ['parent', '/parent', <ParentDashboardPage key="p" />],
    ['parent', '/parent/reports', <ParentReportsPage key="r" />],
    ['admin', '/admin', <AdminDashboardPage key="a" />],
  ] as const)('%s at %s', (role, path, page) => {
    renderAs(role, path, page)
    expect(document.querySelectorAll('[data-variant="filled"]').length).toBeLessThanOrEqual(1)
  })
})
