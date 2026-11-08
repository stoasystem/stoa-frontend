/**
 * Revoking a parent-student link on the account operations page (#588).
 *
 * The parent loses sight of the child's data the moment it goes through, so
 * nothing is sent until a dialog naming both accounts, and the reason the
 * audit log keeps, is confirmed. A success re-reads the looked-up parent's
 * children; a refusal is said by its code (stoa-backend #288).
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
import { AdminAccountOperationsPage } from '@/pages/admin/AdminAccountOperationsPage'
import { listAccounts, revokeParentLink, type AccountListResponse } from '@/services/admin/accountsApi'
import { getAdminParentAccountOperations } from '@/services/admin/adminApi'
import { ApiError, httpClient } from '@/services/api/httpClient'
import type { AdminAccountOperations } from '@/types/adminAccountOperations'
import type { AccountOperationsChild } from '@/types/parentAccountOperations'

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
  return { ...actual, listAccounts: vi.fn(), revokeParentLink: vi.fn() }
})
vi.mock('@/services/admin/adminApi', async () => {
  const actual = await vi.importActual<typeof import('@/services/admin/adminApi')>('@/services/admin/adminApi')
  return { ...actual, getAdminParentAccountOperations: vi.fn() }
})

const mockedList = vi.mocked(listAccounts)
const mockedRevoke = vi.mocked(revokeParentLink)
const mockedOperations = vi.mocked(getAdminParentAccountOperations)

const ROWS = [
  { userId: 'parent-1', accountNumber: 'E26-0001', name: 'Rita Vogt', role: 'parent' as const },
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

const NINA: AccountOperationsChild = {
  studentId: 'student-1',
  profile: { userId: 'student-1', role: 'student', name: 'Nina Vogt', email: 'student-1@example.ch' },
  binding: { parentId: 'parent-1', studentId: 'student-1', status: 'active', relationship: 'child' },
}

function lookup(children: AccountOperationsChild[]): AdminAccountOperations {
  return {
    parentId: 'parent-1',
    supportState: { state: 'ready', blockers: [], warnings: [] },
    parent: { userId: 'parent-1', role: 'parent', name: 'Rita Vogt', email: 'parent-1@example.ch' },
    billing: { status: 'none', events: [] },
    children,
    usage: [],
  } as AdminAccountOperations
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

const revoke = enAdmin.parentLinks.revoke

beforeEach(async () => {
  await i18n.changeLanguage('en')
  mockedList.mockReset()
  mockedRevoke.mockReset()
  mockedOperations.mockReset()
  mockedList.mockImplementation(async (filters) => answer(filters))
  mockedOperations.mockResolvedValue(lookup([NINA]))
})

/** Opens the dialog from Nina's row of the looked-up parent's children, gives a reason, confirms. */
async function revokeFromChildRow(user: ReturnType<typeof userEvent.setup>, reason = 'Custody changed') {
  wrap('/admin/account-operations?parentId=parent-1')
  await user.click(await screen.findByRole('button', { name: 'Revoke the link to Nina Vogt' }))
  const dialog = await screen.findByRole('dialog')
  if (reason) await user.type(within(dialog).getByLabelText(revoke.confirm.reasonLabel), reason)
  return dialog
}

describe('#588: revoking a parent link', () => {
  it('states the consequence and sends nothing until confirmed with a reason', async () => {
    const user = userEvent.setup()
    wrap('/admin/account-operations?parentId=parent-1')
    await user.click(await screen.findByRole('button', { name: 'Revoke the link to Nina Vogt' }))
    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveTextContent('Rita Vogt immediately loses access to the data of Nina Vogt')

    const submit = within(dialog).getByRole('button', { name: revoke.confirm.submit })
    expect(submit).toBeDisabled()
    await user.type(within(dialog).getByLabelText(revoke.confirm.reasonLabel), '   ')
    expect(submit).toBeDisabled()

    await user.click(within(dialog).getByRole('button', { name: revoke.confirm.cancel }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(mockedRevoke).not.toHaveBeenCalled()
  })

  it('revokes, says so, and reads the children again', async () => {
    const user = userEvent.setup()
    mockedRevoke.mockResolvedValue({
      parent_id: 'parent-1',
      student_id: 'student-1',
      relationship: 'child',
      status: 'revoked',
      link_updated_at: 'v2',
    })
    const dialog = await revokeFromChildRow(user, '  Custody changed  ')
    mockedOperations.mockResolvedValue(lookup([]))
    await user.click(within(dialog).getByRole('button', { name: revoke.confirm.submit }))

    await waitFor(() => expect(mockedRevoke).toHaveBeenCalledTimes(1))
    expect(mockedRevoke.mock.calls[0][0]).toEqual({ parentId: 'parent-1', studentId: 'student-1', reason: 'Custody changed' })
    await waitFor(() =>
      expect(screen.getByTestId('child-link-revoke-notice')).toHaveTextContent('Nina Vogt is no longer linked to Rita Vogt.'),
    )
    await waitFor(() => expect(screen.getByText(enAdmin.accountOperations.children.empty)).toBeInTheDocument())
    expect(mockedOperations.mock.calls.length).toBeGreaterThanOrEqual(2)
    expect(screen.queryByRole('button', { name: 'Revoke the link to Nina Vogt' })).toBeNull()
  })

  it('says the link changed meanwhile, and reads the children again', async () => {
    const user = userEvent.setup()
    mockedRevoke.mockRejectedValue(
      new ApiError('The link changed in the meantime.', { status: 409, code: 'link_revoke_conflict' }),
    )
    const dialog = await revokeFromChildRow(user)
    const readsBefore = mockedOperations.mock.calls.length
    await user.click(within(dialog).getByRole('button', { name: revoke.confirm.submit }))

    expect(await screen.findByTestId('child-link-revoke-error')).toHaveTextContent(
      enAdmin.accounts.errors.link_revoke_conflict,
    )
    await waitFor(() => expect(mockedOperations.mock.calls.length).toBeGreaterThan(readsBefore))
    expect(screen.getByTestId('child-link-revoke-notice')).toBeEmptyDOMElement()
  })

  it('says there is no open link to revoke', async () => {
    const user = userEvent.setup()
    mockedRevoke.mockRejectedValue(new ApiError('No open link.', { status: 409, code: 'link_not_open' }))
    const dialog = await revokeFromChildRow(user)
    await user.click(within(dialog).getByRole('button', { name: revoke.confirm.submit }))

    expect(await screen.findByTestId('child-link-revoke-error')).toHaveTextContent(enAdmin.accounts.errors.link_not_open)
  })

  it('says the administrator may not revoke links', async () => {
    const user = userEvent.setup()
    mockedRevoke.mockRejectedValue(new ApiError('Forbidden', { status: 403, code: 'action_not_allowed' }))
    const dialog = await revokeFromChildRow(user)
    await user.click(within(dialog).getByRole('button', { name: revoke.confirm.submit }))

    expect(await screen.findByTestId('child-link-revoke-error')).toHaveTextContent(revoke.forbidden)
  })

  it('revokes the pair picked in the link card', async () => {
    const user = userEvent.setup()
    mockedOperations.mockRejectedValue(new Error('not under test'))
    mockedRevoke.mockResolvedValue({
      parent_id: 'parent-1',
      student_id: 'student-1',
      relationship: 'child',
      status: 'revoked',
      link_updated_at: 'v2',
    })
    wrap('/admin/account-operations')
    const parentSelect = await screen.findByLabelText(enAdmin.parentLinks.parentLabel)
    const studentSelect = await screen.findByLabelText(enAdmin.parentLinks.studentLabel)
    await waitFor(() => expect(parentSelect).toHaveTextContent('Rita Vogt'))
    await waitFor(() => expect(studentSelect).toHaveTextContent('Nina Vogt'))

    const button = screen.getByRole('button', { name: revoke.submit })
    expect(button).toBeDisabled()
    await user.selectOptions(parentSelect, 'parent-1')
    await user.selectOptions(studentSelect, 'student-1')
    await user.click(button)

    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveTextContent('Rita Vogt · E26-0001 immediately loses access to the data of Nina Vogt · S26-0044')
    await user.type(within(dialog).getByLabelText(revoke.confirm.reasonLabel), 'Entered by mistake')
    await user.click(within(dialog).getByRole('button', { name: revoke.confirm.submit }))

    await waitFor(() =>
      expect(mockedRevoke.mock.calls[0]?.[0]).toEqual({ parentId: 'parent-1', studentId: 'student-1', reason: 'Entered by mistake' }),
    )
    expect(await screen.findByTestId('parent-link-revoke-notice')).toHaveTextContent('is no longer linked to')
  })
})

describe('#588: the request', () => {
  afterEach(() => vi.restoreAllMocks())

  it('posts exactly the three snake_case fields the route accepts', async () => {
    const post = vi.spyOn(httpClient, 'post').mockResolvedValue({ data: {} })
    const actual = await vi.importActual<typeof import('@/services/admin/accountsApi')>('@/services/admin/accountsApi')
    await actual.revokeParentLink({ parentId: 'parent-1', studentId: 'student-1', reason: 'Custody changed' })
    expect(post).toHaveBeenCalledWith('/admin/parent-links/revoke', {
      parent_id: 'parent-1',
      student_id: 'student-1',
      reason: 'Custody changed',
    })
  })
})

describe('#588: the copy is translated', () => {
  it.each([
    ['de', deAdmin],
    ['fr', frAdmin],
    ['it', itAdmin],
  ])('%s says the revocation in its own words', (_, bundle) => {
    expect(bundle.parentLinks.revoke.confirm.body).not.toBe(revoke.confirm.body)
    expect(bundle.parentLinks.revoke.forbidden).not.toBe(revoke.forbidden)
    expect(bundle.accounts.errors.link_not_open).not.toBe(enAdmin.accounts.errors.link_not_open)
    expect(bundle.accounts.errors.link_revoke_conflict).not.toBe(enAdmin.accounts.errors.link_revoke_conflict)
    expect(bundle.parentLinks.revoke.confirm.body).toContain('{{parent}}')
    expect(bundle.parentLinks.revoke.confirm.body).toContain('{{student}}')
  })
})
