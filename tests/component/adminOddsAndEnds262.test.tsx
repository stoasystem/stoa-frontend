/**
 * Four admin odds and ends from the 2026-10-18 audit (#262).
 *
 * 1. Linking a child with `?day=` set left the child list stale: the
 *    invalidation key ended in '' and missed the query keyed by the day.
 * 2. The account operations page title-cased enum codes into English.
 * 3. A decided teacher application stayed decidable, and its statement could
 *    say "Loading" forever.
 * 4. The system page showed a failed stats read as healthy zeros.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AdminOperationalNotificationsCard } from '@/components/admin/AdminOperationalNotificationsCard'
import { AdminTeacherSlaCard } from '@/components/admin/AdminTeacherSlaCard'
import i18n from '@/i18n'
import deAdmin from '@/i18n/locales/de/admin.json'
import enAdmin from '@/i18n/locales/en/admin.json'
import { AdminAccountOperationsPage } from '@/pages/admin/AdminAccountOperationsPage'
import { AdminTeacherApplicationsPage } from '@/pages/admin/AdminTeacherApplicationsPage'
import { assignParentLink, listAccounts } from '@/services/admin/accountsApi'
import { getAdminParentAccountOperations, type AdminTeacherSlaStats } from '@/services/admin/adminApi'
import type { AdminAccountOperations } from '@/types/adminAccountOperations'

const state = vi.hoisted(() => ({
  notifications: { data: undefined as unknown, isLoading: false, isError: false, isSuccess: false },
  applications: [] as Array<Record<string, unknown>>,
  detail: { data: undefined as unknown, isPending: false, isError: false, error: null as unknown },
}))

vi.mock('@/layouts/DashboardLayout', () => ({
  DashboardLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}))
vi.mock('@/components/parent/VerificationRecoveryEvidence', () => ({
  VerificationRecoveryEvidence: () => null,
}))
vi.mock('@/hooks/admin/useAdminBillingOperation', () => ({
  useAdminBillingOperation: () => ({
    query: { isLoading: false, isError: false, error: null, data: undefined },
    recheck: { mutate: vi.fn(), isPending: false },
  }),
}))
vi.mock('@/services/admin/accountsApi', async () => {
  const actual = await vi.importActual<typeof import('@/services/admin/accountsApi')>('@/services/admin/accountsApi')
  return { ...actual, listAccounts: vi.fn(), assignParentLink: vi.fn() }
})
vi.mock('@/services/admin/adminApi', async () => {
  const actual = await vi.importActual<typeof import('@/services/admin/adminApi')>('@/services/admin/adminApi')
  return { ...actual, getAdminParentAccountOperations: vi.fn() }
})
vi.mock('@/hooks/notifications/useNotificationsQuery', () => ({
  useAdminNotificationsQuery: () => state.notifications,
}))

const reviewMutate = vi.fn()
vi.mock('@/hooks/teacher/useTeacherApplication', () => ({
  useTeacherApplicationsQuery: (reviewState: string) => ({
    isSuccess: true,
    isError: false,
    data: {
      reviewState,
      items: state.applications.filter((row) => row.reviewState === reviewState),
      count: state.applications.filter((row) => row.reviewState === reviewState).length,
    },
  }),
  useTeacherApplicationDetailQuery: () => state.detail,
  useReviewTeacherApplicationMutation: () => ({ mutate: reviewMutate, isPending: false }),
  useReissueTeacherInvitationMutation: () => ({ mutate: vi.fn(), isPending: false }),
}))

const mockedList = vi.mocked(listAccounts)
const mockedAssign = vi.mocked(assignParentLink)
const mockedOperations = vi.mocked(getAdminParentAccountOperations)

const ROWS = [
  { userId: 'parent-1', accountNumber: 'E26-0001', name: 'Rita Vogt', email: 'rita@example.ch', role: 'parent' as const },
  { userId: 'student-1', accountNumber: 'S26-0044', name: 'Nina Vogt', email: 'nina@example.ch', role: 'student' as const },
].map((row) => ({
  ...row,
  accountStatus: 'active' as const,
  isMinor: false,
  createdAt: '2026-01-05T08:00:00Z',
  lastLoginAt: '',
  linkedAccounts: [],
}))

function operations(overrides: Partial<AdminAccountOperations> = {}): AdminAccountOperations {
  return {
    parentId: 'parent-1',
    supportState: { state: 'ready', blockers: [], warnings: [] },
    parent: { userId: 'parent-1', role: 'parent', name: 'Rita Vogt', email: 'rita@example.ch' },
    billing: { status: 'none', events: [] },
    children: [],
    usage: [],
    ...overrides,
  }
}

function wrap(path: string, page: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>{page}</MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(async () => {
  await i18n.changeLanguage('en')
  mockedList.mockReset()
  mockedAssign.mockReset()
  mockedOperations.mockReset()
  reviewMutate.mockReset()
  mockedList.mockImplementation(async (filters) => {
    const items = ROWS.filter((row) => !filters?.role || row.role === filters.role)
    return { items, count: items.length, groups: {}, nextCursor: null }
  })
  mockedAssign.mockResolvedValue({})
  state.notifications = { data: undefined, isLoading: false, isError: false, isSuccess: false }
  state.applications = []
  state.detail = { data: undefined, isPending: false, isError: false, error: null }
})
afterEach(async () => {
  await i18n.changeLanguage('en')
})
afterAll(() => {
  // On Node 26 the language persists into the --localstorage-file.
  try {
    localStorage.clear()
  } catch {
    // no storage in this environment
  }
})

describe('linking a child while a usage day is set', () => {
  it('reads the child list again for that day', async () => {
    mockedOperations.mockResolvedValue(operations())
    const user = userEvent.setup()
    wrap('/admin/account-operations?parentId=parent-1&day=2026-07-03', <AdminAccountOperationsPage />)

    await waitFor(() => expect(mockedOperations).toHaveBeenCalledTimes(1))
    expect(mockedOperations).toHaveBeenLastCalledWith('parent-1', '2026-07-03')

    const studentSelect = await screen.findByLabelText(enAdmin.parentLinks.studentLabel)
    await waitFor(() => expect(studentSelect).toHaveTextContent('Nina Vogt'))
    await user.selectOptions(studentSelect, 'student-1')
    await user.click(screen.getByRole('button', { name: enAdmin.parentLinks.submit }))

    await screen.findByTestId('parent-link-notice')
    await waitFor(() => expect(mockedOperations).toHaveBeenCalledTimes(2))
    expect(mockedOperations).toHaveBeenLastCalledWith('parent-1', '2026-07-03')
  })
})

describe('the account operations page in German', () => {
  it('names the enum codes in German instead of title-casing them', async () => {
    await i18n.changeLanguage('de')
    mockedOperations.mockResolvedValue(
      operations({
        supportState: { state: 'attention', blockers: [], warnings: [] },
        parent: {
          userId: 'parent-1',
          role: 'parent',
          name: 'Rita Vogt',
          email: 'rita@example.ch',
          verification: { emailVerificationStatus: 'pending_verification' },
        },
        billing: {
          status: 'past_due',
          mode: 'test',
          subscriptionTier: 'teacher_supported',
          requestedTier: 'family',
          lastProviderEventType: 'invoice.payment_failed',
          events: [
            {
              eventId: 'e-1',
              eventAt: '2026-07-03T08:00:00Z',
              eventType: 'customer.subscription.updated',
              billingStatus: 'payment_failed',
            },
          ],
        },
        children: [
          {
            studentId: 'student-1',
            profile: { userId: 'student-1', role: 'student', name: 'Nina Vogt', email: 'nina@example.ch' },
            binding: { status: 'pending' },
            entitlement: { effectivePlan: 'free_trial' },
          },
        ],
        usage: [
          {
            studentId: 'student-1',
            quotaPeriod: '2026-07-03',
            action: 'question_submission',
            consumed: 1,
            limit: 5,
            remaining: 4,
            supportAction: 'review_stale_counter',
          },
        ],
      }),
    )
    const { container } = wrap('/admin/account-operations?parentId=parent-1', <AdminAccountOperationsPage />)
    const codes = deAdmin.accountOperations.codes

    await screen.findByText(codes.billingStatus.past_due)
    expect(screen.getByRole('heading', { name: 'Bitte prüfen' })).toBeInTheDocument()
    expect(screen.getByText(codes.billingMode.test)).toBeInTheDocument()
    expect(screen.getByText(codes.plan.family)).toBeInTheDocument()
    expect(screen.getByText(codes.plan.free_trial)).toBeInTheDocument()
    expect(screen.getByText(codes.binding.pending)).toBeInTheDocument()
    expect(screen.getByText(codes.eventType.invoice_payment_failed)).toBeInTheDocument()
    expect(screen.getByText(codes.eventType.customer_subscription_updated)).toBeInTheDocument()
    expect(screen.getByText(codes.usageAction.question_submission)).toBeInTheDocument()

    const text = container.textContent ?? ''
    for (const english of [
      'Past due',
      'Attention',
      'Teacher supported',
      'Free trial',
      'Pending verification',
      'Invoice payment failed',
      'Customer subscription updated',
      'Payment failed',
      'Question submission',
      'Review stale counter',
    ]) {
      expect(text).not.toContain(english)
    }
    expect(text).toContain(codes.usageSupport.review_stale_counter)
    expect(text).toContain(codes.billingStatus.payment_failed)
  })
})

describe('reviewing a teacher application', () => {
  const pending = {
    applicationId: 'app-1',
    version: 2,
    reviewState: 'pending_review',
    fullName: 'Lea Muster',
    verifiedEmail: 'lea@example.ch',
    subjects: ['math'],
  }

  it('marks the selected row and drops the decision buttons once a decision is made', async () => {
    state.applications = [pending]
    state.detail = { data: { ...pending, statement: 'I teach maths.' }, isPending: false, isError: false, error: null }
    reviewMutate.mockImplementation((_input, options) => options.onSuccess({ invitationDelivered: true }))
    const user = userEvent.setup()
    wrap('/admin/teacher-applications', <AdminTeacherApplicationsPage />)

    const row = screen.getByRole('button', { name: /Lea Muster/ })
    expect(row).toHaveAttribute('aria-pressed', 'false')
    await user.click(row)
    expect(row).toHaveAttribute('aria-pressed', 'true')
    await user.click(screen.getByRole('button', { name: enAdmin.teacherApplications.approve }))

    expect(reviewMutate).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('button', { name: enAdmin.teacherApplications.approve })).toBeNull()
    expect(screen.queryByRole('button', { name: enAdmin.teacherApplications.reject })).toBeNull()
    expect(screen.getByRole('status')).toHaveTextContent(enAdmin.teacherApplications.approvedSent)
  })

  it('offers no decision on an application that was already decided', async () => {
    state.applications = [{ ...pending, reviewState: 'approved' }]
    state.detail = { data: { ...pending, statement: 'I teach maths.' }, isPending: false, isError: false, error: null }
    const user = userEvent.setup()
    wrap('/admin/teacher-applications', <AdminTeacherApplicationsPage />)

    await user.click(screen.getByRole('button', { name: enAdmin.teacherApplications.states.approved }))
    await user.click(screen.getByRole('button', { name: /Lea Muster/ }))

    expect(screen.queryByRole('button', { name: enAdmin.teacherApplications.approve })).toBeNull()
    expect(screen.queryByRole('button', { name: enAdmin.teacherApplications.reject })).toBeNull()
    expect(screen.getByRole('button', { name: enAdmin.teacherApplications.resend })).toBeInTheDocument()
  })

  it('says so when the statement fails to load or is empty, instead of loading forever', async () => {
    await i18n.changeLanguage('de')
    state.applications = [pending]
    state.detail = { data: undefined, isPending: false, isError: true, error: new Error('boom') }
    const user = userEvent.setup()
    const { unmount } = wrap('/admin/teacher-applications', <AdminTeacherApplicationsPage />)
    await user.click(screen.getByRole('button', { name: /Lea Muster/ }))
    expect(screen.queryByText(deAdmin.teacherApplications.loadingStatement)).toBeNull()
    expect(screen.getByText(deAdmin.teacherApplications.statementFailed)).toBeInTheDocument()
    unmount()

    state.detail = { data: { ...pending, statement: '' }, isPending: false, isError: false, error: null }
    wrap('/admin/teacher-applications', <AdminTeacherApplicationsPage />)
    await user.click(screen.getByRole('button', { name: /Lea Muster/ }))
    expect(screen.queryByText(deAdmin.teacherApplications.loadingStatement)).toBeNull()
    expect(screen.getByText(deAdmin.teacherApplications.noStatement)).toBeInTheDocument()
  })
})

describe('the system page when its reads fail', () => {
  it('shows no SLA figures and no invented target when the stats read failed', async () => {
    await i18n.changeLanguage('de')
    const { container } = render(<AdminTeacherSlaCard isError />)
    expect(screen.getByRole('alert')).toHaveTextContent(deAdmin.sla.unavailable)
    expect(container.textContent).not.toMatch(/\d/)
  })

  it('shows a dash rather than 30 minutes when no target was sent', async () => {
    const stats = {
      tracked_questions: 4,
      first_reply: { count: 2, average_seconds: 600, max_seconds: 900 },
      targets: { first_reply_seconds: null },
      buckets: { within_target: 2, at_risk: 1, breached: 1, unknown: 0 },
    } as unknown as AdminTeacherSlaStats
    render(<AdminTeacherSlaCard stats={stats} />)
    const target = screen.getByText(enAdmin.sla.target).parentElement as HTMLElement
    expect(within(target).getByText('-')).toBeInTheDocument()
    expect(screen.queryByText('30m')).toBeNull()
  })

  it('shows no event count next to the error line', async () => {
    await i18n.changeLanguage('de')
    state.notifications = { data: undefined, isLoading: false, isError: true, isSuccess: false }
    render(<AdminOperationalNotificationsCard />)
    expect(screen.getByText(deAdmin.operationalNotifications.unavailable)).toBeInTheDocument()
    expect(screen.queryByText('0 Ereignisse')).toBeNull()
  })
})
