/**
 * Linking a child to a parent, on the two screens where it is decided.
 *
 * The backend has carried both paths for a long time: a parent's own request,
 * and an administrator's assignment. Card 008 made the first unreachable for
 * this product - a request is refused the moment either side is a minor, and a
 * date of birth nobody recorded counts as a minor - so a self-service form here
 * would be a form that is designed to fail. What was missing was the other
 * half: the administrator had no way to make the link, and the parent whose
 * child was not linked was told nothing true about what happens next.
 *
 * So: the console assigns, and the parent's empty state names the administrator
 * and shows the account number the administrator finds them by.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import deAdmin from '@/i18n/locales/de/admin.json'
import enAdmin from '@/i18n/locales/en/admin.json'
import frAdmin from '@/i18n/locales/fr/admin.json'
import itAdmin from '@/i18n/locales/it/admin.json'
import deParent from '@/i18n/locales/de/parent.json'
import enParent from '@/i18n/locales/en/parent.json'
import frParent from '@/i18n/locales/fr/parent.json'
import itParent from '@/i18n/locales/it/parent.json'
import { AdminAccountOperationsPage } from '@/pages/admin/AdminAccountOperationsPage'
import { ParentDashboardPage } from '@/pages/parent/ParentDashboardPage'
import { ParentReportsPage } from '@/pages/parent/ParentReportsPage'
import { assignParentLink, listAccounts } from '@/services/admin/accountsApi'
import { ApiError } from '@/services/api/httpClient'
import { type CurrentUser, useAuthStore } from '@/store/authStore'

const parentChildren = vi.hoisted(() => ({ items: [] as unknown[] }))

vi.mock('@/hooks/notifications/useNotificationsQuery', () => ({
  useNotificationsQuery: () => ({ data: { items: [] }, isLoading: false, isError: false }),
  useAdminNotificationsQuery: () => ({ data: { items: [] }, isLoading: false, isError: false }),
  useMarkNotificationReadMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useArchiveNotificationMutation: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/hooks/notifications/useRealtimeNotifications', () => ({
  useRealtimeNotifications: () => ({ status: 'disabled' }),
}))
vi.mock('@/hooks/parent/useParentChildrenQuery', () => ({
  useParentChildrenQuery: () => ({
    isLoading: false,
    isError: false,
    data: { items: parentChildren.items },
  }),
}))
vi.mock('@/hooks/parent/useParentAccountOperationsQuery', () => ({
  useParentAccountOperationsQuery: () => ({
    isLoading: false,
    isError: false,
    data: { supportState: { state: 'ready', blockers: [], warnings: [] }, children: [] },
  }),
}))
vi.mock('@/services/admin/accountsApi', async () => {
  const actual = await vi.importActual<typeof import('@/services/admin/accountsApi')>(
    '@/services/admin/accountsApi',
  )
  return { ...actual, listAccounts: vi.fn(), assignParentLink: vi.fn() }
})

const mockedList = vi.mocked(listAccounts)
const mockedAssign = vi.mocked(assignParentLink)

const ROWS = [
  {
    userId: 'parent-1',
    accountNumber: 'E26-0001',
    name: 'Rita Vogt',
    email: 'rita@example.ch',
    role: 'parent' as const,
    accountStatus: 'active' as const,
    isMinor: false,
    createdAt: '2026-01-05T08:00:00Z',
    lastLoginAt: '',
    linkedAccounts: [],
  },
  {
    userId: 'student-1',
    accountNumber: 'S26-0044',
    name: 'Nina Vogt',
    email: 'nina@example.ch',
    role: 'student' as const,
    accountStatus: 'active' as const,
    isMinor: true,
    createdAt: '2026-01-05T08:00:00Z',
    lastLoginAt: '',
    linkedAccounts: [],
  },
]

function wrap(path: string, page: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>{page}</MemoryRouter>
    </QueryClientProvider>,
  )
}

function signIn(role: CurrentUser['role'], extra: Partial<CurrentUser> = {}) {
  useAuthStore.setState({
    user: { id: 'u-1', name: 'Rita Vogt', email: 'rita@example.ch', role, ...extra } as CurrentUser,
    accessToken: 'token',
    isAuthenticated: true,
  })
}

beforeEach(async () => {
  await i18n.changeLanguage('en')
  parentChildren.items = []
  mockedList.mockReset()
  mockedAssign.mockReset()
  mockedList.mockImplementation(async (filters) => {
    const items = ROWS.filter((row) => !filters?.role || row.role === filters.role)
    return { items, count: items.length, groups: {}, nextCursor: null }
  })
  mockedAssign.mockResolvedValue({})
})

afterEach(() => {
  useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })
})

/** Picks both accounts on the rendered console and presses the button. */
async function assignOnConsole() {
  const user = userEvent.setup()
  signIn('admin')
  wrap('/admin/account-operations', <AdminAccountOperationsPage />)

  const parentSelect = await screen.findByLabelText(enAdmin.parentLinks.parentLabel)
  const studentSelect = await screen.findByLabelText(enAdmin.parentLinks.studentLabel)
  await waitFor(() => expect(parentSelect).toHaveTextContent('Rita Vogt'))
  await waitFor(() => expect(studentSelect).toHaveTextContent('Nina Vogt'))

  await user.selectOptions(parentSelect, 'parent-1')
  await user.selectOptions(studentSelect, 'student-1')
  await user.click(screen.getByRole('button', { name: enAdmin.parentLinks.submit }))
  // #336: the link takes effect at once, so it is confirmed first.
  const dialog = await screen.findByRole('dialog')
  await user.click(within(dialog).getByRole('button', { name: enAdmin.parentLinks.confirm.submit }))
  return user
}

describe('the administrator assigns a child to a parent', () => {
  it('reads both account lists from the accounts service, filtered to the active ones', async () => {
    signIn('admin')
    wrap('/admin/account-operations', <AdminAccountOperationsPage />)

    await waitFor(() => expect(mockedList).toHaveBeenCalled())
    const filters = mockedList.mock.calls.map(([argument]) => argument)
    expect(filters).toContainEqual({ role: 'parent', status: 'active', q: '' })
    expect(filters).toContainEqual({ role: 'student', status: 'active', q: '' })
  })

  it('sends the parent, the student and the relationship, and says who was linked', async () => {
    await assignOnConsole()

    await waitFor(() => expect(mockedAssign).toHaveBeenCalledTimes(1))
    // The whole payload, not one field of it: the route forbids extra keys and
    // refuses a missing one with a validator message no administrator can act on.
    // react-query hands the mutation its own context as a second argument;
    // the payload is the first one, and it is asserted whole.
    expect(mockedAssign.mock.calls[0][0]).toEqual({
      parentId: 'parent-1',
      studentId: 'student-1',
      relationship: 'child',
    })

    const notice = await screen.findByTestId('parent-link-notice')
    expect(notice).toHaveTextContent('Nina Vogt')
    expect(notice).toHaveTextContent('Rita Vogt')
  })

  it('will not send until both accounts are chosen', async () => {
    signIn('admin')
    wrap('/admin/account-operations', <AdminAccountOperationsPage />)

    const submit = await screen.findByRole('button', { name: enAdmin.parentLinks.submit })
    expect(submit).toBeDisabled()
    expect(mockedAssign).not.toHaveBeenCalled()
  })

  // Only `code` carries through the user-facing error path, and only a code
  // with a phrase becomes a sentence. Without these two the administrator is
  // told the same generic thing whether they picked a suspended account or one
  // that was linked already.
  it.each([
    ['link_target_not_found', 404],
    ['link_already_exists', 409],
  ])('says which rule refused: %s', async (code, status) => {
    const phrase = (enAdmin.accounts.errors as Record<string, string>)[code]
    expect(phrase, `en/admin.json accounts.errors.${code}`).toBeTruthy()
    mockedAssign.mockRejectedValue(
      new ApiError(`Request failed with status code ${status}`, {
        status,
        detail: { code },
        code,
      }),
    )

    await assignOnConsole()

    const failure = await screen.findByTestId('parent-link-error')
    expect(failure).toHaveTextContent(phrase)
    expect(failure).not.toHaveTextContent(enAdmin.parentLinks.failed)
  })

  it('falls back without leaking the validator when the refusal carries no code', async () => {
    mockedAssign.mockRejectedValue(
      new ApiError('Request failed with status code 422', {
        status: 422,
        detail: [{ type: 'missing', loc: ['body', 'student_id'], msg: 'Field required' }],
      }),
    )

    await assignOnConsole()

    const failure = await screen.findByTestId('parent-link-error')
    expect(failure).toHaveTextContent(enAdmin.parentLinks.failed)
    expect(failure).not.toHaveTextContent('Field required')
  })
})

const ADMIN_BUNDLES = { de: deAdmin, fr: frAdmin, it: itAdmin }
const PARENT_BUNDLES = { de: deParent, fr: frParent, it: itParent }

function leaves(value: unknown, prefix = ''): [string, string][] {
  if (typeof value === 'string') return [[prefix, value]]
  if (!value || typeof value !== 'object') return []
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
    leaves(child, prefix ? `${prefix}.${key}` : key),
  )
}

function at(bundle: unknown, path: string) {
  return path
    .split('.')
    .reduce<unknown>((value, key) => (value as Record<string, unknown>)?.[key], bundle)
}

describe('the new sentences ship in all four languages', () => {
  // Not one literal: every phrase the two features added. A key translated in
  // three files and left in English in the fourth is how a German page ends up
  // half English, and the parity test only checks that the key is present.
  it.each([
    ['parentLinks', () => enAdmin.parentLinks, ADMIN_BUNDLES],
    ['accounts.errors.link', () => ({
      link_target_not_found: (enAdmin.accounts.errors as Record<string, string>).link_target_not_found,
      link_already_exists: (enAdmin.accounts.errors as Record<string, string>).link_already_exists,
    }), ADMIN_BUNDLES],
    ['noChildrenNotice', () => enParent.noChildrenNotice, PARENT_BUNDLES],
  ])('%s', (label, english, bundles) => {
    const entries = leaves(english())
    expect(entries.length).toBeGreaterThan(0)
    for (const [path, englishText] of entries) {
      expect(englishText, `en ${label}.${path}`).toBeTruthy()
      for (const [locale, bundle] of Object.entries(bundles)) {
        const prefix = label === 'accounts.errors.link' ? 'accounts.errors' : label
        const translated = at(bundle, `${prefix}.${path}`)
        expect(translated, `${locale} ${prefix}.${path}`).toBeTruthy()
        expect(translated, `${locale} ${prefix}.${path} is still English`).not.toEqual(englishText)
      }
    }
  })
})

describe('a parent with no linked child', () => {
  it.each([
    ['reports', () => <ParentReportsPage />, '/parent/reports'],
    ['overview', () => <ParentDashboardPage />, '/parent'],
  ])('says the administrator makes the link, and shows the number on %s', async (_name, page, path) => {
    signIn('parent', { accountNumber: 'E26-0001' })
    wrap(path, page())

    expect(await screen.findByText(enParent.noChildrenNotice.body)).toBeInTheDocument()
    expect(screen.getByTestId('parent-account-number')).toHaveTextContent('E26-0001')
    expect(screen.getByText(enParent.noChildrenNotice.hint)).toBeInTheDocument()
  })

  // The line above the empty state used to tell a parent to open a report, on
  // a page that had just said there was none to open.
  it('does not tell them to open a report that does not exist', async () => {
    signIn('parent', { accountNumber: 'E26-0001' })
    wrap('/parent/reports', <ParentReportsPage />)

    expect(await screen.findByText(enParent.reports.noChildren)).toBeInTheDocument()
    expect(screen.queryByText(enParent.reports.studentReportsDescription)).toBeNull()
  })

  it('says how it will be found instead when the account has no number yet', async () => {
    signIn('parent', { accountNumber: '' })
    wrap('/parent/reports', <ParentReportsPage />)

    expect(await screen.findByText(enParent.noChildrenNotice.accountNumberMissing)).toBeInTheDocument()
    expect(screen.queryByTestId('parent-account-number')).toBeNull()
  })

  it('shows none of this once a child is linked', async () => {
    parentChildren.items = [
      { id: 'ch-1', userId: 'u-9', name: 'Nina Vogt', grade: 'Grade 8', subjects: ['Mathematics'], relationship: 'parent' },
    ]
    signIn('parent', { accountNumber: 'E26-0001' })
    wrap('/parent/reports', <ParentReportsPage />)

    expect(await screen.findByText(enParent.reports.studentReportsDescription)).toBeInTheDocument()
    expect(screen.queryByText(enParent.noChildrenNotice.body)).toBeNull()
    expect(screen.queryByTestId('parent-account-number')).toBeNull()
  })
})
