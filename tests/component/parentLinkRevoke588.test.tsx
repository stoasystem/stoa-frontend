/**
 * #588: an administrator closes a parent-student link from the looked-up
 * parent's list of children. Backend #208 replaced the old
 * `/admin/parent-bindings` routes with `POST /admin/parent-links/revoke`
 * (stoa-backend#288): a snake_case body with a reason for the audit log,
 * and two refusals of its own, `link_not_open` and `link_revoke_conflict`.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import deAdmin from '@/i18n/locales/de/admin.json'
import enAdmin from '@/i18n/locales/en/admin.json'
import { afterParentLinkRevoke } from '@/hooks/admin/accountListCache'
import { AdminAccountOperationsPage } from '@/pages/admin/AdminAccountOperationsPage'
import { listAccounts, type AccountListResponse, type AccountRow } from '@/services/admin/accountsApi'
import { adminQueryKeys } from '@/services/admin/adminQueryKeys'
import { getAdminParentAccountOperations } from '@/services/admin/adminApi'
import { ApiError, httpClient } from '@/services/api/httpClient'
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
vi.mock('@/services/api/httpClient', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/api/httpClient')>()),
  httpClient: { get: vi.fn(), post: vi.fn() },
}))
vi.mock('@/services/admin/accountsApi', async () => {
  const actual = await vi.importActual<typeof import('@/services/admin/accountsApi')>('@/services/admin/accountsApi')
  return { ...actual, listAccounts: vi.fn() }
})
vi.mock('@/services/admin/adminApi', async () => {
  const actual = await vi.importActual<typeof import('@/services/admin/adminApi')>('@/services/admin/adminApi')
  return { ...actual, getAdminParentAccountOperations: vi.fn() }
})

const mockedPost = vi.mocked(httpClient.post)
const mockedList = vi.mocked(listAccounts)
const mockedOperations = vi.mocked(getAdminParentAccountOperations)

const REVOKE_LABEL = enAdmin.parentLinks.revoke.open.replace('{{student}}', 'Nina Vogt')

function lookup(status = 'active'): AdminAccountOperations {
  return {
    parentId: 'parent-9',
    supportState: { state: 'ready', blockers: [], warnings: [] },
    parent: { userId: 'parent-9', role: 'parent', name: 'Lea Brunner', email: 'lea@example.ch' },
    billing: { status: 'none', events: [] },
    children: [
      {
        studentId: 'student-1',
        profile: { userId: 'student-1', role: 'student', name: 'Nina Vogt', email: 'nina@example.ch' },
        binding: { parentId: 'parent-9', studentId: 'student-1', status, relationship: 'child' },
      },
    ],
    usage: [],
  } as AdminAccountOperations
}

/** A refusal as the response interceptor hands it on (`apiErrorFromBody`). */
function refusal(status: number, code: string) {
  return new ApiError('Refused', {
    status,
    code,
    detail: { code, message: 'Refused', correlationId: 'corr-1' },
  })
}

function wrap() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/admin/account-operations?parentId=parent-9']}>
        <AdminAccountOperationsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

/** Opens the dialog for Nina Vogt and confirms with a reason. */
async function revokeWithReason(reason = 'Custody changed') {
  const user = userEvent.setup()
  await user.click(await screen.findByRole('button', { name: REVOKE_LABEL }))
  const dialog = await screen.findByRole('dialog')
  expect(dialog).toHaveTextContent('Lea Brunner')
  expect(dialog).toHaveTextContent('Nina Vogt')
  const submit = within(dialog).getByRole('button', { name: enAdmin.parentLinks.revoke.confirm.submit })
  expect(submit).toBeDisabled()
  await user.type(within(dialog).getByLabelText(enAdmin.parentLinks.revoke.reasonLabel), reason)
  expect(submit).toBeEnabled()
  await user.click(submit)
}

beforeEach(async () => {
  await i18n.changeLanguage('en')
  mockedPost.mockReset()
  mockedList.mockReset()
  mockedOperations.mockReset()
  mockedList.mockResolvedValue({ items: [], count: 0, groups: {}, nextCursor: null })
  mockedOperations.mockResolvedValue(lookup())
})

describe('revoking a parent link (#588)', () => {
  it('posts both ids and the reason, says so, and reads the children again', async () => {
    mockedPost.mockResolvedValue({
      data: {
        parent_id: 'parent-9',
        student_id: 'student-1',
        relationship: 'child',
        status: 'rejected',
        link_updated_at: '2026-11-08T10:00:00Z',
      },
    })
    wrap()
    await revokeWithReason('  Custody changed  ')

    await waitFor(() =>
      expect(mockedPost).toHaveBeenCalledWith('/admin/parent-links/revoke', {
        parent_id: 'parent-9',
        student_id: 'student-1',
        reason: 'Custody changed',
      }),
    )
    expect(await screen.findByTestId('parent-link-revoke-notice')).toHaveTextContent(
      'Nina Vogt is no longer linked to Lea Brunner.',
    )
    await waitFor(() => expect(mockedOperations).toHaveBeenCalledTimes(2))
    expect(screen.queryByTestId('parent-link-revoke-error')).not.toBeInTheDocument()
  })

  it('names a conflict and reads the list again, since it is what was out of date', async () => {
    mockedPost.mockRejectedValue(refusal(409, 'link_revoke_conflict'))
    wrap()
    await revokeWithReason()

    expect(await screen.findByTestId('parent-link-revoke-error')).toHaveTextContent(
      enAdmin.parentLinks.revoke.errors.link_revoke_conflict,
    )
    await waitFor(() => expect(mockedOperations).toHaveBeenCalledTimes(2))
    expect(screen.getByTestId('parent-link-revoke-notice')).toBeEmptyDOMElement()
  })

  it('says a link already closed is not open', async () => {
    mockedPost.mockRejectedValue(refusal(409, 'link_not_open'))
    wrap()
    await revokeWithReason()

    expect(await screen.findByTestId('parent-link-revoke-error')).toHaveTextContent(
      enAdmin.parentLinks.revoke.errors.link_not_open,
    )
  })

  it('says the administrator may not revoke links when the route refuses them', async () => {
    mockedPost.mockRejectedValue(refusal(403, 'action_not_allowed'))
    wrap()
    await revokeWithReason()

    expect(await screen.findByTestId('parent-link-revoke-error')).toHaveTextContent(
      enAdmin.parentLinks.revoke.errors.action_not_allowed,
    )
    // Nothing changed, so nothing is read again.
    expect(mockedOperations).toHaveBeenCalledTimes(1)
  })

  it('words the refusal in the reader’s language', async () => {
    await i18n.changeLanguage('de')
    mockedPost.mockRejectedValue(refusal(409, 'link_revoke_conflict'))
    wrap()
    const user = userEvent.setup()
    await user.click(
      await screen.findByRole('button', { name: deAdmin.parentLinks.revoke.open.replace('{{student}}', 'Nina Vogt') }),
    )
    const dialog = await screen.findByRole('dialog')
    await user.type(within(dialog).getByLabelText(deAdmin.parentLinks.revoke.reasonLabel), 'Sorgerecht geändert')
    await user.click(within(dialog).getByRole('button', { name: deAdmin.parentLinks.revoke.confirm.submit }))

    expect(await screen.findByTestId('parent-link-revoke-error')).toHaveTextContent(
      deAdmin.parentLinks.revoke.errors.link_revoke_conflict,
    )
  })

  it('offers no revocation for a link that is already closed', async () => {
    mockedOperations.mockResolvedValue(lookup('rejected'))
    wrap()
    expect(await screen.findByText('Nina Vogt')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: REVOKE_LABEL })).not.toBeInTheDocument()
  })

  it('cancelling sends nothing', async () => {
    wrap()
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: REVOKE_LABEL }))
    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: enAdmin.parentLinks.revoke.confirm.cancel }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(mockedPost).not.toHaveBeenCalled()
  })
})

describe('the account lists after a revocation (#588)', () => {
  function row(userId: string, role: AccountRow['role'], linked: string[]): AccountRow {
    return {
      userId,
      accountNumber: `N-${userId}`,
      name: userId,
      role,
      accountStatus: 'active',
      isMinor: false,
      createdAt: '2026-01-05T08:00:00Z',
      lastLoginAt: '',
      linkedAccounts: linked.map((id) => ({ userId: id, accountNumber: `N-${id}`, status: 'active' })),
    }
  }

  it('drops the link from both rows and leaves the others, without a read', () => {
    const client = new QueryClient()
    const key = [...adminQueryKeys.accountsAll(), 'picker', {}] as const
    const answer: AccountListResponse = {
      items: [row('lea', 'parent', ['nina', 'tim']), row('nina', 'student', ['lea']), row('tim', 'student', ['lea'])],
      count: 3,
      groups: {},
      nextCursor: null,
    }
    client.setQueryData(key, answer)

    afterParentLinkRevoke(client, { parentId: 'lea', studentId: 'nina' })

    const [lea, nina, tim] = client.getQueryData<AccountListResponse>(key)!.items
    expect(lea.linkedAccounts.map((link) => link.userId)).toEqual(['tim'])
    expect(nina.linkedAccounts).toEqual([])
    expect(tim.linkedAccounts.map((link) => link.userId)).toEqual(['lea'])
    expect(client.getQueryState(key)?.isInvalidated).toBe(false)
  })
})
