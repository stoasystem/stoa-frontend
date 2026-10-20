import { QueryClient, QueryClientProvider, type InfiniteData } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { afterParentLink, afterStatusChange } from '@/hooks/admin/accountListCache'
import { AdminAccountsPage } from '@/pages/admin/AdminAccountsPage'
import {
  changeAccountStatus,
  inviteAccount,
  listAccounts,
  reissueInvitation,
  resetAccountPassword,
  type AccountListResponse,
  type AccountRow,
} from '@/services/admin/accountsApi'
import { adminQueryKeys } from '@/services/admin/adminQueryKeys'

// #372 point 1: an account command used to invalidate every account read, and
// the accounts page's list then read every page it had loaded again, in
// sequence. The command's own answer now rewrites the rows; only a new
// account costs a read, of the first page. Point 2 (the pickers) is in
// accountOperations372.test.tsx.

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      const values = Object.entries(options ?? {})
        .filter(([name, value]) => name !== 'defaultValue' && typeof value === 'string')
        .map(([, value]) => value)
      return values.length > 0 ? `${key}(${values.join('|')})` : key
    },
    i18n: { resolvedLanguage: 'en', language: 'en' },
  }),
}))

vi.mock('@/services/admin/accountsApi', async () => {
  const actual =
    await vi.importActual<typeof import('@/services/admin/accountsApi')>('@/services/admin/accountsApi')
  return {
    ...actual,
    listAccounts: vi.fn(),
    inviteAccount: vi.fn(),
    reissueInvitation: vi.fn(),
    resetAccountPassword: vi.fn(),
    changeAccountStatus: vi.fn(),
  }
})

const mockedList = vi.mocked(listAccounts)
const mockedInvite = vi.mocked(inviteAccount)
const mockedReissue = vi.mocked(reissueInvitation)
const mockedReset = vi.mocked(resetAccountPassword)
const mockedStatus = vi.mocked(changeAccountStatus)

function Wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  return (
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/admin/users']}>{children}</MemoryRouter>
    </QueryClientProvider>
  )
}

function account(name: string, extra: Partial<AccountRow> = {}): AccountRow {
  return {
    userId: name,
    accountNumber: '',
    name,
    email: `${name}@stoa.test`,
    role: 'parent',
    accountStatus: 'active',
    isMinor: false,
    createdAt: '2026-03-01T09:00:00+00:00',
    lastLoginAt: '',
    linkedAccounts: [],
    ...extra,
  }
}

function answer(rows: AccountRow[], nextCursor: string | null = null): AccountListResponse {
  const groups: Record<string, number> = {}
  for (const row of rows) groups[row.role] = (groups[row.role] ?? 0) + 1
  return { items: rows, count: rows.length, groups, nextCursor }
}

/** Three pages: "Anna" first, then "Bea" and "Cleo" behind two "load more". */
const PAGES: Record<string, AccountRow[]> = {
  first: [account('Anna')],
  'cursor-1': [account('Bea')],
  'cursor-2': [account('Cleo', { accountStatus: 'invited', invitationId: 'invite-1' })],
}
const NEXT: Record<string, string | null> = { first: 'cursor-1', 'cursor-1': 'cursor-2', 'cursor-2': null }

function serveThreePages() {
  mockedList.mockImplementation(async (filters, options) => {
    const page = options?.after ?? 'first'
    const rows = PAGES[page].filter((row) => !filters?.status || row.accountStatus === filters.status)
    return answer(rows, NEXT[page])
  })
}

function rowOf(name: string) {
  return screen.getByText(name).closest('tr') as HTMLElement
}

function rowButton(action: string, name: string) {
  return screen.getByRole('button', { name: `accounts.actionFor(${action}|${name})` })
}

async function openWithEveryPage() {
  render(<AdminAccountsPage />, { wrapper: Wrapper })
  await screen.findByText('Anna')
  await userEvent.click(screen.getByRole('button', { name: 'accounts.loadMore' }))
  await screen.findByText('Bea')
  await userEvent.click(screen.getByRole('button', { name: 'accounts.loadMore' }))
  await screen.findByText('Cleo')
  expect(mockedList).toHaveBeenCalledTimes(3)
}

async function archive(name: string) {
  mockedStatus.mockResolvedValue({ userId: name, accountStatus: 'archived', previousStatus: 'active' })
  await userEvent.click(rowButton('accounts.moveTo.archived', name))
  const dialog = await screen.findByRole('dialog')
  await userEvent.type(within(dialog).getByLabelText('accounts.reasonPrompt'), 'ticket 372')
  await userEvent.click(within(dialog).getByRole('button', { name: 'accounts.moveTo.archived' }))
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
}

/** Whatever a command set off has started by the time this resolves. */
function settle() {
  return new Promise((resolve) => setTimeout(resolve, 30))
}

beforeEach(() => {
  mockedList.mockReset()
  mockedInvite.mockReset()
  mockedReissue.mockReset()
  mockedReset.mockReset()
  mockedStatus.mockReset()
  serveThreePages()
})

describe('#372: one account change does not read the list again', () => {
  it('archives a row in place, keeping every page "load more" brought in', async () => {
    await openWithEveryPage()

    await archive('Bea')

    await waitFor(() => expect(within(rowOf('Bea')).getByText('accounts.status.archived')).toBeInTheDocument())
    expect(screen.getByText('Anna')).toBeInTheDocument()
    expect(screen.getByText('Cleo')).toBeInTheDocument()
    await settle()
    expect(mockedList).toHaveBeenCalledTimes(3)
  })

  it('drops an archived row from a list filtered to active accounts, and its group count with it', async () => {
    render(<AdminAccountsPage />, { wrapper: Wrapper })
    await screen.findByText('Anna')
    await userEvent.selectOptions(screen.getByLabelText('accounts.statusLabel'), 'active')
    await waitFor(() => expect(mockedList.mock.calls.some(([filters]) => filters?.status === 'active')).toBe(true))
    await userEvent.click(await screen.findByRole('button', { name: 'accounts.loadMore' }))
    await screen.findByText('Bea')
    expect(screen.getByText('accounts.role.parent · 2')).toBeInTheDocument()
    const reads = mockedList.mock.calls.length

    await archive('Bea')

    await waitFor(() => expect(screen.queryByText('Bea')).toBeNull())
    expect(screen.getByText('accounts.role.parent · 1')).toBeInTheDocument()
    await settle()
    expect(mockedList).toHaveBeenCalledTimes(reads)
  })

  it('reads nothing for a password reset, which changes nothing the list shows', async () => {
    mockedReset.mockResolvedValue({
      userId: 'Anna',
      temporaryPassword: 'Tmp12345Abcdefg',
      mustChangePasswordAtNextSignIn: true,
    })
    await openWithEveryPage()

    await userEvent.click(rowButton('accounts.resetPassword', 'Anna'))
    const dialog = await screen.findByRole('dialog')
    await userEvent.type(within(dialog).getByLabelText('accounts.reasonPrompt'), 'support call')
    await userEvent.click(within(dialog).getByRole('button', { name: 'accounts.resetPassword' }))

    expect(await screen.findByText(/Tmp12345Abcdefg/)).toBeInTheDocument()
    await settle()
    expect(mockedList).toHaveBeenCalledTimes(3)
  })

  it('resends the invitation a reissue left on the row, without reading the list', async () => {
    mockedReissue
      .mockResolvedValueOnce(reissued('invite-2'))
      .mockResolvedValueOnce(reissued('invite-3'))
    await openWithEveryPage()

    await userEvent.click(rowButton('accounts.resendInvite', 'Cleo'))
    await waitFor(() => expect(screen.getByText('accounts.inviteResent')).toBeInTheDocument())
    await waitFor(() => expect(rowButton('accounts.resendInvite', 'Cleo')).toBeEnabled())
    await userEvent.click(rowButton('accounts.resendInvite', 'Cleo'))

    await waitFor(() => expect(mockedReissue).toHaveBeenCalledTimes(2))
    // The first invitation was replaced by the first resend; sending its id
    // again could only be refused.
    expect(mockedReissue.mock.calls.map(([input]) => input.invitationId)).toEqual(['invite-1', 'invite-2'])
    await settle()
    expect(mockedList).toHaveBeenCalledTimes(3)
  })

  it('reads the list again from its first page, once, for a new account', async () => {
    mockedInvite.mockResolvedValue({
      userId: 'Dora',
      role: 'student',
      accountNumber: 'S26-0011',
      email: 'dora@stoa.test',
      accountStatus: 'invited',
      invitationId: 'invite-9',
      activationToken: 'one-time-code',
      expiresAt: '2026-03-07T09:00:00+00:00',
      invitationDelivered: true,
    })
    await openWithEveryPage()

    await userEvent.type(screen.getByLabelText('accounts.emailLabel'), 'dora@stoa.test')
    await userEvent.click(screen.getByText('accounts.invite'))

    await waitFor(() => expect(mockedList).toHaveBeenCalledTimes(4))
    expect(mockedList.mock.calls[3][1]?.after).toBeUndefined()
    // "Load more" starts over rather than reading every page again.
    await waitFor(() => expect(screen.queryByText('Cleo')).toBeNull())
    expect(screen.queryByText('Bea')).toBeNull()
    expect(screen.getByRole('button', { name: 'accounts.loadMore' })).toBeInTheDocument()
    await settle()
    expect(mockedList).toHaveBeenCalledTimes(4)
  })

  describe('a list still being read when the change lands may answer from before it', () => {
    async function readingBe() {
      mockedList.mockImplementation(async (filters) =>
        filters?.q ? new Promise<AccountListResponse>(() => {}) : answer([account('Anna'), account('Bea')]),
      )
      render(<AdminAccountsPage />, { wrapper: Wrapper })
      await screen.findByText('Bea')
      const keyword = screen.getByLabelText('accounts.keywordLabel')
      for (const value of ['b', 'be']) fireEvent.change(keyword, { target: { value } })
      const reads = () => mockedList.mock.calls.filter(([filters]) => filters?.q === 'be').length
      await waitFor(() => expect(reads()).toBe(1))
      return reads
    }

    it('so it is read again after an archive', async () => {
      const reads = await readingBe()

      // Bea is still on screen from the earlier answer, and acted on from there.
      await archive('Bea')

      await waitFor(() => expect(reads()).toBe(2))
    })

    it('and after an invitation', async () => {
      mockedInvite.mockResolvedValue({
        userId: 'Bert',
        role: 'student',
        accountNumber: 'S26-0012',
        email: 'bert@stoa.test',
        accountStatus: 'invited',
        invitationId: 'invite-8',
        activationToken: 'one-time-code',
        expiresAt: '2026-03-07T09:00:00+00:00',
        invitationDelivered: true,
      })
      const reads = await readingBe()

      await userEvent.type(screen.getByLabelText('accounts.emailLabel'), 'bert@stoa.test')
      await userEvent.click(screen.getByText('accounts.invite'))

      await waitFor(() => expect(reads()).toBe(2))
    })
  })
})

function reissued(invitationId: string) {
  return {
    userId: 'Cleo',
    role: 'parent' as const,
    accountNumber: '',
    email: 'Cleo@stoa.test',
    accountStatus: 'invited' as const,
    invitationId,
    activationToken: 'token',
    expiresAt: '2026-03-07T09:00:00+00:00',
    invitationDelivered: true,
  }
}

describe('#372: the other account views stay right', () => {
  const activeParents = adminQueryKeys.accounts({ role: 'parent', status: 'active', q: '' })
  const listKey = (filters: object) => [...adminQueryKeys.accountsAll(), 'list', filters] as const
  type Pages = InfiniteData<AccountListResponse, string | undefined>

  function client() {
    return new QueryClient({ defaultOptions: { queries: { retry: false } } })
  }

  it('takes an archived parent out of the active-parents picker, without a read', () => {
    const queryClient = client()
    queryClient.setQueryData(activeParents, answer([account('Rita'), account('Marco')]))

    afterStatusChange(
      queryClient,
      { userId: 'Rita', status: 'archived' },
      { userId: 'Rita', accountStatus: 'archived', previousStatus: 'active' },
    )

    const picker = queryClient.getQueryData<AccountListResponse>(activeParents)
    expect(picker?.items.map((row) => row.userId)).toEqual(['Marco'])
    expect(picker?.groups.parent).toBe(1)
    expect(queryClient.getQueryState(activeParents)?.isInvalidated).toBe(false)
  })

  it('drops a suspended student from the parent row, as the list itself does', () => {
    const queryClient = client()
    const key = listKey({})
    const link = (userId: string) => ({ userId, accountNumber: userId.toUpperCase(), status: 'active' })
    queryClient.setQueryData<Pages>(key, {
      pages: [
        answer([account('rita', { linkedAccounts: [link('nina'), link('leo')] })], 'cursor-1'),
        answer([account('nina', { role: 'student', linkedAccounts: [link('rita')] })]),
      ],
      pageParams: [undefined, 'cursor-1'],
    })

    afterStatusChange(queryClient, { userId: 'nina', status: 'suspended' })

    const [rita, nina] = queryClient.getQueryData<Pages>(key)!.pages.flatMap((page) => page.items)
    expect(rita.linkedAccounts.map((held) => held.userId)).toEqual(['leo'])
    // A student's row lists its parents whatever their status.
    expect(nina.linkedAccounts.map((held) => held.userId)).toEqual(['rita'])
    expect(nina.accountStatus).toBe('suspended')
    expect(queryClient.getQueryState(key)?.isInvalidated).toBe(false)
  })

  it('lists no children on the row of a parent who is no longer active', () => {
    const queryClient = client()
    const link = { userId: 'nina', accountNumber: 'S26-0044', status: 'active' }
    queryClient.setQueryData(activeParents, answer([account('Rita', { linkedAccounts: [link] })]))
    const all = listKey({})
    queryClient.setQueryData<Pages>(all, {
      pages: [answer([account('Rita', { linkedAccounts: [link] })])],
      pageParams: [undefined],
    })

    afterStatusChange(queryClient, { userId: 'Rita', status: 'suspended' })

    const [rita] = queryClient.getQueryData<Pages>(all)!.pages[0].items
    expect(rita.accountStatus).toBe('suspended')
    expect(rita.linkedAccounts).toEqual([])
    expect(queryClient.getQueryData<AccountListResponse>(activeParents)?.items).toEqual([])
  })

  it('reads the lists again from their first page when a student comes back, whose links return', () => {
    const queryClient = client()
    const key = listKey({})
    queryClient.setQueryData<Pages>(key, {
      pages: [
        answer([account('rita')], 'cursor-1'),
        answer([account('nina', { role: 'student', accountStatus: 'suspended' })]),
      ],
      pageParams: [undefined, 'cursor-1'],
    })

    afterStatusChange(queryClient, { userId: 'nina', status: 'active' })

    expect(queryClient.getQueryData<Pages>(key)?.pages).toHaveLength(1)
    expect(queryClient.getQueryState(key)?.isInvalidated).toBe(true)
  })

  it('marks a list filtered to the new status for a re-read, and leaves the pickers be', () => {
    const queryClient = client()
    const activeTeachers = listKey({ role: 'teacher', status: 'active' })
    const all = listKey({})
    queryClient.setQueryData<Pages>(activeTeachers, { pages: [answer([])], pageParams: [undefined] })
    queryClient.setQueryData<Pages>(all, {
      pages: [answer([account('tom', { role: 'teacher', accountStatus: 'suspended' })])],
      pageParams: [undefined],
    })
    queryClient.setQueryData(activeParents, answer([account('Rita')]))

    afterStatusChange(queryClient, { userId: 'tom', status: 'active' })

    expect(queryClient.getQueryData<Pages>(all)?.pages[0].items[0].accountStatus).toBe('active')
    expect(queryClient.getQueryState(all)?.isInvalidated).toBe(false)
    expect(queryClient.getQueryState(activeTeachers)?.isInvalidated).toBe(true)
    expect(queryClient.getQueryState(activeParents)?.isInvalidated).toBe(false)
  })

  it('lists a new parent link on both rows, with their numbers, without a read', () => {
    const queryClient = client()
    const key = listKey({})
    queryClient.setQueryData<Pages>(key, {
      pages: [
        answer([
          account('rita', { accountNumber: 'E26-0001' }),
          account('nina', { role: 'student', accountNumber: 'S26-0044' }),
        ]),
      ],
      pageParams: [undefined],
    })

    afterParentLink(queryClient, { parentId: 'rita', studentId: 'nina' })

    const [rita, nina] = queryClient.getQueryData<Pages>(key)!.pages[0].items
    expect(rita.linkedAccounts).toEqual([{ userId: 'nina', accountNumber: 'S26-0044', status: 'active' }])
    expect(nina.linkedAccounts).toEqual([{ userId: 'rita', accountNumber: 'E26-0001', status: 'active' }])
    expect(queryClient.getQueryState(key)?.isInvalidated).toBe(false)
  })
})
