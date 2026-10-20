/**
 * #384: since #372 the parent-link form only took a parent found in the
 * picker's current answer, and the picker no longer kept an option of its
 * own for the parent the page was opened for. That read is of active parents,
 * stops after a page budget and narrows with the filter, so a looked-up parent
 * it did not carry showed as unselected and could not be linked. The lookup
 * names that parent on its own; the #372 tests in accountOperations372 still
 * hold for every row of a search.
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
import type { AdminAccountOperations } from '@/types/adminAccountOperations'

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

// Lea Brunner (parent-9) is the looked-up parent; no read of the picker
// returns her, as when she lies past the page budget.
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

function lookup(userId: string, name: string): AdminAccountOperations {
  return {
    parentId: userId,
    supportState: { state: 'ready', blockers: [], warnings: [] },
    parent: { userId, role: 'parent', name, email: `${userId}@example.ch` },
    billing: { status: 'none', events: [] },
    children: [],
    usage: [],
  }
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

function wrap(path: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
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
  mockedOperations.mockImplementation(async (parentId) => lookup(parentId, 'Lea Brunner'))
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

async function confirmLink() {
  const user = userEvent.setup()
  await user.click(submitButton())
  const dialog = await screen.findByRole('dialog')
  await user.click(within(dialog).getByRole('button', { name: enAdmin.parentLinks.confirm.submit }))
  await waitFor(() => expect(mockedAssign).toHaveBeenCalledTimes(1))
  return dialog
}

describe('#384: the looked-up parent can be linked whatever the picker carries', () => {
  it('links the looked-up parent the picker never returned', async () => {
    const user = userEvent.setup()
    wrap('/admin/account-operations?parentId=parent-9')
    const { parentSelect, studentSelect } = await pickers()

    await waitFor(() => expect(parentSelect).toHaveValue('parent-9'))
    expect(within(parentSelect).getByRole('option', { name: 'Lea Brunner' })).toBeInTheDocument()
    await user.selectOptions(studentSelect, 'student-1')
    expect(submitButton()).toBeEnabled()

    const dialog = await confirmLink()
    expect(dialog).toHaveTextContent('Nina Vogt · S26-0044')
    expect(dialog).toHaveTextContent('Lea Brunner')
    expect(mockedAssign.mock.calls[0][0]).toEqual({ parentId: 'parent-9', studentId: 'student-1', relationship: 'child' })
  })

  it('keeps the looked-up parent through a search that does not find it', async () => {
    const user = userEvent.setup()
    wrap('/admin/account-operations?parentId=parent-9')
    const { parentSelect, studentSelect } = await pickers()
    await waitFor(() => expect(parentSelect).toHaveValue('parent-9'))
    await user.selectOptions(studentSelect, 'student-1')

    searchParents('keller')
    await waitFor(() => expect(parentSelect).not.toHaveTextContent('Rita Vogt'))

    expect(parentSelect).toHaveTextContent('Marco Keller')
    expect(parentSelect).toHaveValue('parent-9')
    await waitFor(() => expect(submitButton()).toBeEnabled())
    await confirmLink()
    expect(mockedAssign.mock.calls[0][0]).toMatchObject({ parentId: 'parent-9' })
  })

  it('can be picked again after another parent was hand-picked', async () => {
    const user = userEvent.setup()
    wrap('/admin/account-operations?parentId=parent-9')
    const { parentSelect, studentSelect } = await pickers()
    await waitFor(() => expect(parentSelect).toHaveValue('parent-9'))
    await user.selectOptions(parentSelect, 'parent-2')
    await user.selectOptions(studentSelect, 'student-1')

    await user.selectOptions(parentSelect, 'parent-9')

    expect(parentSelect).toHaveValue('parent-9')
    await confirmLink()
    expect(mockedAssign.mock.calls[0][0]).toMatchObject({ parentId: 'parent-9' })
  })

  it('lists a looked-up parent the answer carries once, as the answer names it', async () => {
    // Negative control: when the read does return the parent, nothing is added.
    mockedOperations.mockImplementation(async (parentId) => lookup(parentId, 'Rita Vogt'))
    wrap('/admin/account-operations?parentId=parent-1')
    const { parentSelect } = await pickers()
    await waitFor(() => expect(mockedOperations).toHaveBeenCalled())
    await screen.findByText('Rita Vogt / parent-1@example.ch')

    expect(within(parentSelect).getAllByRole('option', { name: /Rita Vogt/ })).toHaveLength(1)
    expect(within(parentSelect).getByRole('option', { name: 'Rita Vogt · E26-0001' })).toBeInTheDocument()
    expect(parentSelect).toHaveValue('parent-1')
  })

  it('offers nothing when the lookup did not find the parent', async () => {
    // Negative control: an id nobody could find is not an account anyone knows.
    mockedOperations.mockRejectedValue(new Error('parent_not_found'))
    wrap('/admin/account-operations?parentId=parent-9')
    const { parentSelect, studentSelect } = await pickers()
    await waitFor(() => expect(mockedOperations).toHaveBeenCalled())
    await userEvent.setup().selectOptions(studentSelect, 'student-1')

    expect(parentSelect).toHaveValue('')
    expect(within(parentSelect).queryByRole('option', { name: /parent-9/ })).toBeNull()
    expect(submitButton()).toBeDisabled()
  })
})

describe('#384 keeps #372: a search still in progress decides nothing', () => {
  it('holds the link while the parent picker searches, then links the looked-up parent', async () => {
    const user = userEvent.setup()
    holdParentSearches()
    wrap('/admin/account-operations?parentId=parent-9')
    const { parentSelect, studentSelect } = await pickers()
    await waitFor(() => expect(parentSelect).toHaveValue('parent-9'))
    await user.selectOptions(studentSelect, 'student-1')
    expect(submitButton()).toBeEnabled()

    searchParents('keller')
    await waitFor(() => expect(mockedList.mock.calls.some(([filters]) => filters?.q === 'keller')).toBe(true))

    expect(parentSelect).toBeDisabled()
    expect(submitButton()).toBeDisabled()

    release()
    await waitFor(() => expect(parentSelect).toBeEnabled())
    expect(parentSelect).toHaveValue('parent-9')
    expect(submitButton()).toBeEnabled()
  })

  it('does not link a parent picked from the previous search, even with a parent looked up', async () => {
    const user = userEvent.setup()
    holdParentSearches()
    wrap('/admin/account-operations?parentId=parent-9')
    const { parentSelect, studentSelect } = await pickers()
    await waitFor(() => expect(parentSelect).toHaveValue('parent-9'))
    await user.selectOptions(studentSelect, 'student-1')

    searchParents('keller')
    await waitFor(() => expect(mockedList.mock.calls.some(([filters]) => filters?.q === 'keller')).toBe(true))
    // Rita, from the answer to "", picked while the answer to "keller" is on its way.
    fireEvent.change(parentSelect, { target: { value: 'parent-1' } })
    expect(submitButton()).toBeDisabled()
    fireEvent.submit(submitButton().closest('form')!)
    expect(screen.queryByRole('dialog')).toBeNull()
    release()
    await waitFor(() => expect(parentSelect).toBeEnabled())

    expect(parentSelect).toHaveValue('')
    expect(submitButton()).toBeDisabled()
    await user.click(submitButton())
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(mockedAssign).not.toHaveBeenCalled()
  })
})
