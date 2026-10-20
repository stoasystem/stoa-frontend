/**
 * Linking a child on the account operations page (#336).
 *
 * A8: the link went through on the first click, and a parent picked by hand
 * stayed picked after a different parent was looked up, so the second link
 * went to the first parent. A6 (this page's half): both pickers re-read the
 * account list on every key typed into their filters and blanked meanwhile.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { MemoryRouter, useNavigate } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import deAdmin from '@/i18n/locales/de/admin.json'
import enAdmin from '@/i18n/locales/en/admin.json'
import frAdmin from '@/i18n/locales/fr/admin.json'
import itAdmin from '@/i18n/locales/it/admin.json'
import { AdminAccountOperationsPage } from '@/pages/admin/AdminAccountOperationsPage'
import { assignParentLink, listAccounts, type AccountListResponse } from '@/services/admin/accountsApi'
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
  { userId: 'parent-3', accountNumber: 'E26-0003', name: 'Sara Frei', role: 'parent' as const },
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

function answer(filters?: { role?: string }): AccountListResponse {
  const items = ROWS.filter((row) => !filters?.role || row.role === filters.role)
  return { items, count: items.length, groups: {}, nextCursor: null }
}

/** Navigates in place, the way a submitted lookup changes `?parentId=`. */
let navigate: (path: string) => void = () => {}
function NavigateHandle() {
  navigate = useNavigate()
  return null
}

function wrap(path: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <NavigateHandle />
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

describe('A8: a parent link is confirmed, naming both accounts', () => {
  it('sends nothing until the dialog is confirmed', async () => {
    const user = userEvent.setup()
    wrap('/admin/account-operations')
    const { parentSelect, studentSelect } = await pickers()
    await user.selectOptions(parentSelect, 'parent-1')
    await user.selectOptions(studentSelect, 'student-1')
    await user.click(screen.getByRole('button', { name: enAdmin.parentLinks.submit }))

    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveTextContent('Nina Vogt · S26-0044')
    expect(dialog).toHaveTextContent('Rita Vogt · E26-0001')
    expect(dialog).toHaveTextContent('child')
    expect(mockedAssign).not.toHaveBeenCalled()

    await user.click(within(dialog).getByRole('button', { name: enAdmin.parentLinks.confirm.submit }))
    await waitFor(() => expect(mockedAssign).toHaveBeenCalledTimes(1))
    expect(mockedAssign.mock.calls[0][0]).toEqual({ parentId: 'parent-1', studentId: 'student-1', relationship: 'child' })
  })

  it('sends nothing when the dialog is cancelled', async () => {
    const user = userEvent.setup()
    wrap('/admin/account-operations')
    const { parentSelect, studentSelect } = await pickers()
    await user.selectOptions(parentSelect, 'parent-1')
    await user.selectOptions(studentSelect, 'student-1')
    await user.click(screen.getByRole('button', { name: enAdmin.parentLinks.submit }))

    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: enAdmin.parentLinks.confirm.cancel }))

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(mockedAssign).not.toHaveBeenCalled()
  })
})

describe('A8: a new lookup takes back a hand-picked parent', () => {
  it('follows the looked-up parent again after a different one is looked up', async () => {
    const user = userEvent.setup()
    wrap('/admin/account-operations?parentId=parent-1')
    const { parentSelect } = await pickers()
    expect(parentSelect).toHaveValue('parent-1')

    await user.selectOptions(parentSelect, 'parent-2')
    expect(parentSelect).toHaveValue('parent-2')

    navigate('/admin/account-operations?parentId=parent-3')

    await waitFor(() => expect(screen.getByLabelText(enAdmin.parentLinks.parentLabel)).toHaveValue('parent-3'))
  })

  it('keeps the hand-picked parent while the lookup stays the same', async () => {
    // Negative control: the choice is only taken back by a new lookup.
    const user = userEvent.setup()
    wrap('/admin/account-operations?parentId=parent-1')
    const { parentSelect, studentSelect } = await pickers()
    await user.selectOptions(parentSelect, 'parent-2')
    await user.selectOptions(studentSelect, 'student-1')

    expect(screen.getByLabelText(enAdmin.parentLinks.parentLabel)).toHaveValue('parent-2')
  })
})

describe('A6: the pickers wait for a pause in typing', () => {
  it('asks once for the whole word, and keeps the list up while it does', async () => {
    let release: (value: AccountListResponse) => void = () => {}
    wrap('/admin/account-operations')
    const { parentSelect } = await pickers()
    mockedList.mockImplementation(
      (filters) =>
        filters?.role === 'parent' && filters.q
          ? new Promise((resolve) => (release = resolve))
          : Promise.resolve(answer(filters)),
    )

    const filter = screen.getAllByLabelText(enAdmin.parentLinks.filterLabel)[0]
    for (const value of ['k', 'ke', 'kel']) fireEvent.change(filter, { target: { value } })

    await waitFor(() =>
      expect(mockedList.mock.calls.some(([filters]) => filters?.q === 'kel')).toBe(true),
    )
    const keywords = mockedList.mock.calls.map(([filters]) => filters?.q)
    expect(keywords).not.toContain('k')
    expect(keywords).not.toContain('ke')
    // Still the earlier list, not a blank picker with "loading" under it.
    expect(parentSelect).toHaveTextContent('Rita Vogt')
    expect(screen.queryByText(enAdmin.parentLinks.loading)).toBeNull()

    release({ items: [ROWS[1]], count: 1, groups: {}, nextCursor: null })
    await waitFor(() => expect(parentSelect).not.toHaveTextContent('Rita Vogt'))
    expect(parentSelect).toHaveTextContent('Marco Keller')
  })

  it('hands each read its abort signal', async () => {
    wrap('/admin/account-operations')
    await pickers()
    expect(mockedList.mock.calls[0][1]?.signal).toBeInstanceOf(AbortSignal)
  })
})

describe('#336 copy', () => {
  it('is in all four languages and names both accounts', () => {
    for (const bundle of [deAdmin, enAdmin, frAdmin, itAdmin]) {
      const confirm = bundle.parentLinks.confirm
      expect(confirm.body).toContain('{{student}}')
      expect(confirm.body).toContain('{{parent}}')
      expect(confirm.body).toContain('{{relationship}}')
      expect(confirm.title && confirm.cancel && confirm.submit).toBeTruthy()
    }
    for (const bundle of [deAdmin, frAdmin, itAdmin]) {
      expect(bundle.parentLinks.confirm.body).not.toBe(enAdmin.parentLinks.confirm.body)
      expect(bundle.parentLinks.confirm.submit).not.toBe(enAdmin.parentLinks.confirm.submit)
    }
  })
})
