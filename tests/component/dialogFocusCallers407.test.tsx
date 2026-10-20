/**
 * The admin consoles whose confirmation dialogs open from page state (#407).
 *
 * Each gives focus back to the button it was opened from. Where confirming
 * takes that button away or leaves it disabled, focus goes to the place the
 * page names instead: the line that says what happened, or the heading of
 * the card the button was in.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import enAdmin from '@/i18n/locales/en/admin.json'
import { AdminAccountOperationsPage } from '@/pages/admin/AdminAccountOperationsPage'
import { AdminAccountsPage } from '@/pages/admin/AdminAccountsPage'
import { AdminCurriculumPage } from '@/pages/admin/AdminCurriculumPage'
import { AdminTeacherApplicationsPage } from '@/pages/admin/AdminTeacherApplicationsPage'
import {
  assignParentLink,
  changeAccountStatus,
  listAccounts,
  resetAccountPassword,
  type AccountListFilters,
  type AccountListResponse,
} from '@/services/admin/accountsApi'
import { getAdminParentAccountOperations } from '@/services/admin/adminApi'
import {
  applyCurriculumMigration,
  approveCurriculumVersion,
  dryRunCurriculumMigration,
  getCurriculumPreview,
  getCurriculumWorklist,
  publishCurriculumVersion,
} from '@/services/admin/curriculumApi'
import type { CurriculumMigrationDryRunResponse } from '@/types/curriculumOperations'

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
  return {
    ...actual,
    listAccounts: vi.fn(),
    changeAccountStatus: vi.fn(),
    resetAccountPassword: vi.fn(),
    assignParentLink: vi.fn(),
  }
})
vi.mock('@/services/admin/adminApi', async () => {
  const actual = await vi.importActual<typeof import('@/services/admin/adminApi')>('@/services/admin/adminApi')
  return { ...actual, getAdminParentAccountOperations: vi.fn() }
})
vi.mock('@/services/admin/curriculumApi', async () => {
  const actual = await vi.importActual<typeof import('@/services/admin/curriculumApi')>(
    '@/services/admin/curriculumApi',
  )
  return {
    ...actual,
    getCurriculumWorklist: vi.fn(),
    getCurriculumPreview: vi.fn(),
    approveCurriculumVersion: vi.fn(),
    publishCurriculumVersion: vi.fn(),
    dryRunCurriculumMigration: vi.fn(),
    applyCurriculumMigration: vi.fn(),
  }
})

const reviewMutate = vi.fn()
vi.mock('@/hooks/teacher/useTeacherApplication', () => ({
  useTeacherApplicationsQuery: (reviewState: string) => {
    const items = reviewState === 'pending_review' ? [LEA] : []
    return { isPending: false, isSuccess: true, isError: false, error: null, data: { reviewState, items, count: items.length } }
  },
  useTeacherApplicationDetailQuery: () => ({ data: undefined, isPending: false, isError: false, error: null }),
  useReviewTeacherApplicationMutation: () => ({ mutate: reviewMutate, isPending: false }),
  useReissueTeacherInvitationMutation: () => ({ mutate: vi.fn(), isPending: false }),
}))

const LEA = {
  applicationId: 'app-1',
  version: 2,
  reviewState: 'pending_review',
  fullName: 'Lea Muster',
  verifiedEmail: 'lea@example.ch',
  subjects: ['math'],
}

const mockedList = vi.mocked(listAccounts)
const mockedStatus = vi.mocked(changeAccountStatus)
const mockedReset = vi.mocked(resetAccountPassword)
const mockedAssign = vi.mocked(assignParentLink)
const mockedOperations = vi.mocked(getAdminParentAccountOperations)
const worklist = vi.mocked(getCurriculumWorklist)
const preview = vi.mocked(getCurriculumPreview)
const approve = vi.mocked(approveCurriculumVersion)
const publish = vi.mocked(publishCurriculumVersion)
const dryRun = vi.mocked(dryRunCurriculumMigration)
const apply = vi.mocked(applyCurriculumMigration)

const ROWS = [
  { userId: 'stud-b', accountNumber: 'S26-0002', name: 'Student B', role: 'student' as const },
  { userId: 'parent-1', accountNumber: 'E26-0001', name: 'Rita Vogt', role: 'parent' as const },
].map((row) => ({
  ...row,
  email: `${row.userId}@example.ch`,
  accountStatus: 'active' as const,
  isMinor: false,
  createdAt: '2026-03-01T09:00:00+00:00',
  lastLoginAt: '',
  linkedAccounts: [],
}))

function answer(filters?: AccountListFilters): AccountListResponse {
  const items = ROWS.filter((row) => !filters?.role || row.role === filters.role)
  return { items, count: items.length, groups: { student: 1, parent: 1 }, nextCursor: null }
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((done) => {
    resolve = done
  })
  return { promise, resolve }
}

function wrap(ui: ReactNode, path = '/') {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>
    </QueryClientProvider>,
  )
}

const dialog = () => screen.getByRole('dialog')
async function closed() {
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
}

beforeEach(async () => {
  await i18n.changeLanguage('en')
  vi.clearAllMocks()
  mockedList.mockImplementation(async (filters) => answer(filters))
  mockedOperations.mockRejectedValue(new Error('not under test'))
})

describe('accounts: a row action', () => {
  const copy = enAdmin.accounts
  const archive = () => screen.getByRole('button', { name: 'Archive: Student B (S26-0002)' })
  const reset = () => screen.getByRole('button', { name: 'Reset password: Student B (S26-0002)' })

  async function openArchive(user: ReturnType<typeof userEvent.setup>) {
    wrap(<AdminAccountsPage />, '/admin/users')
    await screen.findByText('Student B')
    await user.click(archive())
    await screen.findByRole('dialog')
  }

  it('cancelled, gives focus back to the row button', async () => {
    const user = userEvent.setup()
    await openArchive(user)

    await user.click(within(dialog()).getByRole('button', { name: copy.cancel }))

    await closed()
    await waitFor(() => expect(archive()).toHaveFocus())
  })

  it('archived, gives focus to the line that says so: the button has left the row', async () => {
    mockedStatus.mockResolvedValue({ userId: 'stud-b', accountStatus: 'archived', previousStatus: 'active' })
    const user = userEvent.setup()
    await openArchive(user)

    await user.type(within(dialog()).getByLabelText(copy.reasonPrompt), 'ticket 9')
    await user.click(within(dialog()).getByRole('button', { name: copy.moveTo.archived }))

    await closed()
    expect(screen.queryByRole('button', { name: 'Archive: Student B (S26-0002)' })).not.toBeInTheDocument()
    const line = screen.getByText('Status changed to Archived.')
    await waitFor(() => expect(line).toHaveFocus())
  })

  it('a password reset leaves its button in place, and focus goes back to it', async () => {
    mockedReset.mockResolvedValue({
      userId: 'stud-b',
      temporaryPassword: 'Tmp12345Abcdefg',
      mustChangePasswordAtNextSignIn: true,
    })
    const user = userEvent.setup()
    wrap(<AdminAccountsPage />, '/admin/users')
    await screen.findByText('Student B')
    await user.click(reset())
    await screen.findByRole('dialog')

    await user.type(within(dialog()).getByLabelText(copy.reasonPrompt), 'ticket 9')
    await user.click(within(dialog()).getByRole('button', { name: copy.resetPassword }))

    await closed()
    await waitFor(() => expect(reset()).toHaveFocus())
  })

  it('the assign dialog, closed with Esc, gives focus back to its button', async () => {
    const user = userEvent.setup()
    wrap(<AdminAccountsPage />, '/admin/users')
    await screen.findByText('Student B')
    await user.click(screen.getByRole('button', { name: copy.assign }))
    await screen.findByRole('dialog', { name: copy.assignDialogTitle })

    await user.keyboard('{Escape}')

    await closed()
    await waitFor(() => expect(screen.getByRole('button', { name: copy.assign })).toHaveFocus())
  })
})

describe('teacher applications: a decision', () => {
  const copy = enAdmin.teacherApplications

  async function openApprove(user: ReturnType<typeof userEvent.setup>) {
    wrap(<AdminTeacherApplicationsPage />)
    await user.click(screen.getByRole('button', { name: /Lea Muster/ }))
    await user.type(screen.getByRole('textbox', { name: copy.reasonLabel }), 'Strong maths background.')
    await user.click(screen.getByRole('button', { name: copy.approve }))
    await screen.findByRole('dialog')
  }

  it('cancelled, gives focus back to the button', async () => {
    const user = userEvent.setup()
    await openApprove(user)

    await user.click(within(dialog()).getByRole('button', { name: copy.confirm.cancel }))

    await closed()
    await waitFor(() => expect(screen.getByRole('button', { name: copy.approve })).toHaveFocus())
  })

  it('made, gives focus to the line that says so: the application has left the view', async () => {
    reviewMutate.mockImplementation((_input, options) => options.onSuccess({ invitationDelivered: true }))
    const user = userEvent.setup()
    await openApprove(user)

    await user.click(within(dialog()).getByRole('button', { name: copy.approve }))

    await closed()
    expect(screen.queryByRole('button', { name: copy.approve })).not.toBeInTheDocument()
    await waitFor(() => expect(screen.getByText(copy.approvedSent)).toHaveFocus())
  })
})

describe('account operations: a parent link', () => {
  const copy = enAdmin.parentLinks

  async function openLink(user: ReturnType<typeof userEvent.setup>) {
    wrap(<AdminAccountOperationsPage />, '/admin/account-operations')
    const parentSelect = await screen.findByLabelText(copy.parentLabel)
    const studentSelect = await screen.findByLabelText(copy.studentLabel)
    await waitFor(() => expect(parentSelect).toHaveTextContent('Rita Vogt'))
    await waitFor(() => expect(studentSelect).toHaveTextContent('Student B'))
    await user.selectOptions(parentSelect, 'parent-1')
    await user.selectOptions(studentSelect, 'stud-b')
    await user.click(screen.getByRole('button', { name: copy.submit }))
    await screen.findByRole('dialog')
  }

  it('cancelled, gives focus back to the button', async () => {
    const user = userEvent.setup()
    await openLink(user)

    await user.click(within(dialog()).getByRole('button', { name: copy.confirm.cancel }))

    await closed()
    await waitFor(() => expect(screen.getByRole('button', { name: copy.submit })).toHaveFocus())
  })

  it('confirmed, gives focus to the card heading: the button is disabled from then on', async () => {
    const pending = deferred<Awaited<ReturnType<typeof assignParentLink>>>()
    mockedAssign.mockReturnValue(pending.promise)
    const user = userEvent.setup()
    await openLink(user)

    await user.click(within(dialog()).getByRole('button', { name: copy.confirm.submit }))

    await closed()
    expect(screen.getByRole('button', { name: copy.submit })).toBeDisabled()
    await waitFor(() => expect(screen.getByRole('heading', { name: copy.title })).toHaveFocus())

    pending.resolve({} as Awaited<ReturnType<typeof assignParentLink>>)
    await screen.findByText('Student B · S26-0002 is now linked to Rita Vogt · E26-0001.')
    expect(screen.getByRole('heading', { name: copy.title })).toHaveFocus()
  })
})

describe('curriculum: a confirmed step', () => {
  const CANDIDATE = {
    publicLessonId: 'lesson-1',
    versionId: 'v3',
    state: 'approved',
    reviewState: 'approved',
    updatedAt: '2026-10-18T09:00:00Z',
    updatedBy: 'admin-1',
  }
  const DRY_RUN: CurriculumMigrationDryRunResponse = {
    migrationId: 'mig-1',
    confirmationToken: 'token-from-dry-run',
    source: {},
    summary: { total: 1, creates: 1, updates: 0, skips: 0, conflicts: 0, errors: 0 },
    rows: [],
    publishReady: true,
  }

  beforeEach(() => {
    worklist.mockResolvedValue({ items: [CANDIDATE], count: 1 })
    preview.mockResolvedValue({ ...CANDIDATE, lesson: {}, exercises: [] })
    approve.mockResolvedValue(CANDIDATE)
    publish.mockResolvedValue({ status: 'published' })
    dryRun.mockResolvedValue(DRY_RUN)
    apply.mockResolvedValue({ ...DRY_RUN, status: 'applied' })
  })

  async function openReview(user: ReturnType<typeof userEvent.setup>) {
    wrap(<AdminCurriculumPage />)
    const card = (await screen.findByText('v3', { exact: false })).closest('div.grid') as HTMLElement
    await user.click(within(card).getByRole('button', { name: 'Open' }))
    await user.click(screen.getByRole('tab', { name: 'Review' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Publish' })).toBeEnabled())
  }

  it('an approval leaves its button enabled, and focus goes back to it', async () => {
    const user = userEvent.setup()
    await openReview(user)

    await user.click(screen.getByRole('button', { name: 'Approve' }))
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Approve' }))

    await closed()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Approve' })).toHaveFocus())
  })

  it('a publish holds its button while the worklist is read again, so focus goes to the notice', async () => {
    const user = userEvent.setup()
    await openReview(user)
    const reread = deferred<Awaited<ReturnType<typeof getCurriculumWorklist>>>()
    worklist.mockReturnValue(reread.promise)

    await user.click(screen.getByRole('button', { name: 'Publish' }))
    await user.type(within(await screen.findByRole('dialog')).getByLabelText('Reason for the audit log'), 'Release')
    await user.click(within(dialog()).getByRole('button', { name: 'Publish' }))

    await closed()
    expect(screen.getByRole('button', { name: 'Publish' })).toBeDisabled()
    await waitFor(() => expect(screen.getByText('v3 is now published.')).toHaveFocus())
    reread.resolve({ items: [CANDIDATE], count: 1 })
  })

  it('an apply disables its button for good, so focus goes to the heading of its card', async () => {
    const user = userEvent.setup()
    wrap(<AdminCurriculumPage />)
    await user.click(screen.getByRole('tab', { name: 'Migration' }))
    await user.click(screen.getByRole('button', { name: 'Dry-run' }))
    await screen.findByText('Ready')

    await user.click(screen.getByRole('button', { name: 'Apply migration' }))
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Apply migration' }))

    await closed()
    await screen.findByText('Applied mig-1.')
    expect(screen.getByRole('button', { name: 'Apply migration' })).toBeDisabled()
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Dry-run and apply' })).toHaveFocus())
  })
})
