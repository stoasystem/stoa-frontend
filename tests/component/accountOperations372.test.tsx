/**
 * #372 point 2: the account-operations pickers keep the last answer on screen
 * while the next keyword is read, and those rows stayed pickable with nothing
 * saying they were out of date. A quick hand picked a parent from the
 * previous search, and the confirmation took it. Point 1 is in
 * adminAccounts372.test.tsx.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import enAdmin from '@/i18n/locales/en/admin.json'
import { AdminAccountOperationsPage } from '@/pages/admin/AdminAccountOperationsPage'
import { assignParentLink, listAccounts, type AccountListFilters, type AccountListResponse } from '@/services/admin/accountsApi'
import { getAdminParentAccountOperations } from '@/services/admin/adminApi'

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

const mockedList = vi.mocked(listAccounts)
const mockedAssign = vi.mocked(assignParentLink)
const mockedOperations = vi.mocked(getAdminParentAccountOperations)

const ROWS = [
  { userId: 'parent-1', accountNumber: 'E26-0001', name: 'Rita Vogt', role: 'parent' as const },
  { userId: 'parent-2', accountNumber: 'E26-0002', name: 'Marco Keller', role: 'parent' as const },
  { userId: 'student-1', accountNumber: 'S26-0044', name: 'Nina Vogt', role: 'student' as const },
].map((row) => ({
  ...row,
  email: `${row.userId}@example.ch`,
  accountStatus: 'active' as const,
  isMinor: false,
  createdAt: '2026-01-05T08:00:00Z',
  lastLoginAt: '',
  linkedAccounts: [],
}))

function answer(filters?: AccountListFilters): AccountListResponse {
  const q = filters?.q?.toLowerCase() ?? ''
  const items = ROWS.filter(
    (row) => (!filters?.role || row.role === filters.role) && row.name.toLowerCase().includes(q),
  )
  return { items, count: items.length, groups: {}, nextCursor: null }
}

/** Holds back the parent picker's keyword reads until `release`. */
let release: () => void = () => {}
function holdParentSearches() {
  mockedList.mockImplementation((filters) =>
    filters?.role === 'parent' && filters.q
      ? new Promise((resolve) => (release = () => resolve(answer(filters))))
      : Promise.resolve(answer(filters)),
  )
}

function wrap() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/admin/account-operations']}>
        <AdminAccountOperationsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(async () => {
  await i18n.changeLanguage('en')
  mockedList.mockReset()
  mockedAssign.mockReset()
  mockedOperations.mockReset()
  mockedList.mockImplementation(async (filters) => answer(filters))
  mockedAssign.mockResolvedValue({})
  mockedOperations.mockRejectedValue(new Error('not under test'))
})

async function pickers() {
  const parentSelect = await screen.findByLabelText(enAdmin.parentLinks.parentLabel)
  const studentSelect = await screen.findByLabelText(enAdmin.parentLinks.studentLabel)
  await waitFor(() => expect(parentSelect).toHaveTextContent('Rita Vogt'))
  await waitFor(() => expect(studentSelect).toHaveTextContent('Nina Vogt'))
  return { parentSelect, studentSelect }
}

function searchParents(word: string) {
  fireEvent.change(screen.getAllByLabelText(enAdmin.parentLinks.filterLabel)[0], { target: { value: word } })
}

function submitButton() {
  return screen.getByRole('button', { name: enAdmin.parentLinks.submit })
}

describe('#372: rows from the previous search cannot be picked', () => {
  it('says the picker is loading and holds it while the next keyword is read', async () => {
    holdParentSearches()
    wrap()
    const { parentSelect } = await pickers()

    searchParents('keller')
    await waitFor(() => expect(mockedList.mock.calls.some(([filters]) => filters?.q === 'keller')).toBe(true))

    expect(parentSelect).toHaveTextContent('Rita Vogt')
    expect(parentSelect).toBeDisabled()
    expect(parentSelect).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByText(enAdmin.parentLinks.loading)).toBeInTheDocument()

    release()
    await waitFor(() => expect(parentSelect).toBeEnabled())
    expect(parentSelect).toHaveTextContent('Marco Keller')
    expect(screen.queryByText(enAdmin.parentLinks.loading)).toBeNull()
  })

  it('holds the link while a keyword is still being typed', async () => {
    const user = userEvent.setup()
    wrap()
    const { parentSelect, studentSelect } = await pickers()
    await user.selectOptions(parentSelect, 'parent-1')
    await user.selectOptions(studentSelect, 'student-1')
    expect(submitButton()).toBeEnabled()

    searchParents('vogt')

    // Before the pause is over, nothing has been asked for "vogt" yet.
    expect(submitButton()).toBeDisabled()
    await waitFor(() => expect(submitButton()).toBeEnabled())
  })
})

describe('#372: the confirmation takes only an account in the current answer', () => {
  it('does not link a parent picked from the previous search while the next one loaded', async () => {
    const user = userEvent.setup()
    holdParentSearches()
    wrap()
    const { parentSelect, studentSelect } = await pickers()
    await user.selectOptions(studentSelect, 'student-1')

    searchParents('keller')
    await waitFor(() => expect(mockedList.mock.calls.some(([filters]) => filters?.q === 'keller')).toBe(true))
    // The quick hand of the audit: Rita, from the answer to "", picked while
    // the answer to "keller" is on its way.
    fireEvent.change(parentSelect, { target: { value: 'parent-1' } })
    release()
    await waitFor(() => expect(parentSelect).toBeEnabled())

    expect(parentSelect).toHaveValue('')
    expect(submitButton()).toBeDisabled()
    await user.click(submitButton())
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(mockedAssign).not.toHaveBeenCalled()
  })

  it('lets go of a parent the new answer does not carry', async () => {
    const user = userEvent.setup()
    wrap()
    const { parentSelect, studentSelect } = await pickers()
    await user.selectOptions(parentSelect, 'parent-1')
    await user.selectOptions(studentSelect, 'student-1')

    searchParents('keller')
    await waitFor(() => expect(parentSelect).not.toHaveTextContent('Rita Vogt'))

    expect(parentSelect).toHaveValue('')
    expect(submitButton()).toBeDisabled()
  })

  it('keeps a parent the new answer still carries, and links it', async () => {
    // Negative control: a search that still finds the chosen parent changes nothing.
    const user = userEvent.setup()
    wrap()
    const { parentSelect, studentSelect } = await pickers()
    await user.selectOptions(parentSelect, 'parent-1')
    await user.selectOptions(studentSelect, 'student-1')

    searchParents('vogt')
    await waitFor(() => expect(parentSelect).not.toHaveTextContent('Marco Keller'))
    await waitFor(() => expect(submitButton()).toBeEnabled())
    expect(parentSelect).toHaveValue('parent-1')

    await user.click(submitButton())
    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveTextContent('Rita Vogt · E26-0001')
    expect(dialog).toHaveTextContent('Nina Vogt · S26-0044')
    await user.click(within(dialog).getByRole('button', { name: enAdmin.parentLinks.confirm.submit }))
    await waitFor(() => expect(mockedAssign).toHaveBeenCalledTimes(1))
    expect(mockedAssign.mock.calls[0][0]).toEqual({ parentId: 'parent-1', studentId: 'student-1', relationship: 'child' })
  })
})
