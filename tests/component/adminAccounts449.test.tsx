/**
 * The accounts page's one-time secrets, an undelivered resend, and focus after
 * a reactivation (#449).
 *
 * An invitation's activation code, an assigned account's first password and a
 * reset's temporary password are readable once. They stayed in the query
 * client's mutation cache for five minutes after the page had gone, and on
 * screen until the next action. A resend the mail server did not take said
 * "pass the link on yourself" and showed nothing to pass on. Reactivating a
 * student or parent closed its dialog onto a "Reactivate" button the re-read
 * then took away, and focus fell to the page.
 *
 * The clients here keep the library's default for mutations, as the app's
 * does, so it is the page's and the hooks' own settings that are under test.
 */
import { QueryClient, QueryClientProvider, type UseMutationResult } from '@tanstack/react-query'
import { render, renderHook, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import deAdmin from '@/i18n/locales/de/admin.json'
import enAdmin from '@/i18n/locales/en/admin.json'
import frAdmin from '@/i18n/locales/fr/admin.json'
import itAdmin from '@/i18n/locales/it/admin.json'
import {
  useAssignAccountMutation,
  useInviteAccountMutation,
  useReissueInvitationMutation,
  useResetAccountPasswordMutation,
} from '@/hooks/admin/useAdminAccounts'
import { AdminAccountsPage } from '@/pages/admin/AdminAccountsPage'
import {
  assignAccount,
  changeAccountStatus,
  inviteAccount,
  listAccounts,
  reissueInvitation,
  resetAccountPassword,
  type AccountInvitationResponse,
  type AccountListFilters,
  type AccountListResponse,
  type AccountRow,
} from '@/services/admin/accountsApi'

vi.mock('@/layouts/DashboardLayout', () => ({
  DashboardLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}))
vi.mock('@/services/admin/accountsApi', async () => {
  const actual = await vi.importActual<typeof import('@/services/admin/accountsApi')>('@/services/admin/accountsApi')
  return {
    ...actual,
    listAccounts: vi.fn(),
    inviteAccount: vi.fn(),
    assignAccount: vi.fn(),
    reissueInvitation: vi.fn(),
    resetAccountPassword: vi.fn(),
    changeAccountStatus: vi.fn(),
  }
})

const mockedList = vi.mocked(listAccounts)
const mockedInvite = vi.mocked(inviteAccount)
const mockedAssign = vi.mocked(assignAccount)
const mockedReissue = vi.mocked(reissueInvitation)
const mockedReset = vi.mocked(resetAccountPassword)
const mockedStatus = vi.mocked(changeAccountStatus)

const copy = enAdmin.accounts

function account(userId: string, name: string, extra: Partial<AccountRow> = {}): AccountRow {
  return {
    userId,
    accountNumber: '',
    name,
    email: `${userId}@example.ch`,
    role: 'student',
    accountStatus: 'active',
    isMinor: false,
    createdAt: '2026-03-01T09:00:00+00:00',
    lastLoginAt: '',
    linkedAccounts: [],
    ...extra,
  }
}

function answer(rows: AccountRow[], filters?: AccountListFilters): AccountListResponse {
  const items = rows.filter(
    (row) => (!filters?.status || row.accountStatus === filters.status) && (!filters?.role || row.role === filters.role),
  )
  const groups: Record<string, number> = {}
  for (const row of items) groups[row.role] = (groups[row.role] ?? 0) + 1
  return { items, count: items.length, groups, nextCursor: null }
}

function invitation(activationToken: string, invitationDelivered: boolean): AccountInvitationResponse {
  return {
    userId: 'stud-new',
    role: 'student',
    accountNumber: 'S26-0011',
    email: 'new@example.ch',
    accountStatus: 'invited',
    invitationId: 'invite-2',
    activationToken,
    expiresAt: '2026-03-07T09:00:00+00:00',
    invitationDelivered,
  }
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((done) => {
    resolve = done
  })
  return { promise, resolve }
}

function newClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } })
}

function openPage(client = newClient()) {
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/admin/users']}>
        <AdminAccountsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
  return client
}

/** Everything the client's mutation cache still holds, as one string. */
function mutationCache(client: QueryClient) {
  return JSON.stringify(client.getMutationCache().getAll().map((mutation) => mutation.state))
}

const secretLine = (secret: string) => screen.findByText(`${copy.readOnceHint} ${secret}`)

async function confirmIn(user: ReturnType<typeof userEvent.setup>, submit: string) {
  const dialog = screen.getByRole('dialog')
  await user.type(within(dialog).getByLabelText(copy.reasonPrompt), 'ticket 9')
  await user.click(within(dialog).getByRole('button', { name: submit }))
}

async function closed() {
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
}

beforeEach(async () => {
  await i18n.changeLanguage('en')
  vi.clearAllMocks()
})

describe('#449 the account commands keep no secret in the cache once their page is gone', () => {
  const CASES: { name: string; use: () => unknown; run: () => void; variables: unknown; secret: string }[] = [
    {
      name: 'the invitation',
      use: () => useInviteAccountMutation(),
      run: () => mockedInvite.mockResolvedValue(invitation('invite-code-1', false)),
      variables: { role: 'student', email: 'new@example.ch' },
      secret: 'invite-code-1',
    },
    {
      name: 'the direct assignment',
      use: () => useAssignAccountMutation(),
      run: () =>
        mockedAssign.mockResolvedValue({
          userId: 'teach-new',
          role: 'teacher',
          accountNumber: 'T26-0022',
          email: 'direct@example.ch',
          accountStatus: 'active',
          initialPassword: 'Initial12345678',
        }),
      variables: { role: 'teacher', email: 'direct@example.ch' },
      secret: 'Initial12345678',
    },
    {
      name: 'the resend',
      use: () => useReissueInvitationMutation(),
      run: () => mockedReissue.mockResolvedValue(invitation('resent-code-2', true)),
      variables: { invitationId: 'invite-1' },
      secret: 'resent-code-2',
    },
    {
      name: 'the password reset',
      use: () => useResetAccountPasswordMutation(),
      run: () =>
        mockedReset.mockResolvedValue({
          userId: 'stud-b',
          temporaryPassword: 'Tmp12345Abcdefg',
          mustChangePasswordAtNextSignIn: true,
        }),
      variables: { userId: 'stud-b', reason: 'ticket 9' },
      secret: 'Tmp12345Abcdefg',
    },
  ]

  it.each(CASES)('$name', async ({ use, run, variables, secret }) => {
    run()
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    )
    const { result, unmount } = renderHook(() => use() as UseMutationResult<unknown, Error, unknown>, { wrapper })

    result.current.mutate(variables)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    // Control: while something shows it, the mutation does hold the secret.
    expect(mutationCache(client)).toContain(secret)

    unmount()

    await waitFor(() => expect(client.getMutationCache().getAll()).toHaveLength(0))
  })
})

describe('#449 the page lets go of a secret once it shows it', () => {
  beforeEach(() => {
    mockedList.mockImplementation(async (filters) =>
      answer(
        [
          account('stud-b', 'Student B', { accountNumber: 'S26-0002' }),
          account('stud-i', 'Student I', { accountNumber: 'S26-0003', accountStatus: 'invited', invitationId: 'invite-1' }),
        ],
        filters,
      ),
    )
  })

  it('an invitation that was not delivered', async () => {
    mockedInvite.mockResolvedValue(invitation('invite-code-1', false))
    const user = userEvent.setup()
    const client = openPage()
    await screen.findByText('Student B')

    await user.type(screen.getByLabelText(copy.emailLabel), 'new@example.ch')
    await user.click(screen.getByRole('button', { name: copy.invite }))

    await secretLine('invite-code-1')
    await waitFor(() => expect(mutationCache(client)).not.toContain('invite-code-1'))
  })

  it('an invitation that was delivered, whose code the page never showed', async () => {
    mockedInvite.mockResolvedValue(invitation('invite-code-1', true))
    const user = userEvent.setup()
    const client = openPage()
    await screen.findByText('Student B')

    await user.type(screen.getByLabelText(copy.emailLabel), 'new@example.ch')
    await user.click(screen.getByRole('button', { name: copy.invite }))

    await screen.findByText(copy.inviteSent.replace('{{accountNumber}}', 'S26-0011'))
    expect(screen.queryByText(/invite-code-1/)).not.toBeInTheDocument()
    await waitFor(() => expect(mutationCache(client)).not.toContain('invite-code-1'))
  })

  it('a direct assignment', async () => {
    mockedAssign.mockResolvedValue({
      userId: 'teach-new',
      role: 'teacher',
      accountNumber: 'T26-0022',
      email: 'direct@example.ch',
      accountStatus: 'active',
      initialPassword: 'Initial12345678',
    })
    const user = userEvent.setup()
    const client = openPage()
    await screen.findByText('Student B')

    await user.type(screen.getByLabelText(copy.emailLabel), 'direct@example.ch')
    await user.click(screen.getByRole('button', { name: copy.assign }))
    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: copy.assignDialogSubmit }))

    await secretLine('Initial12345678')
    await waitFor(() => expect(mutationCache(client)).not.toContain('Initial12345678'))
  })

  it('a resend', async () => {
    mockedReissue.mockResolvedValue(invitation('resent-code-2', false))
    const user = userEvent.setup()
    const client = openPage()
    await screen.findByText('Student I')

    await user.click(screen.getByRole('button', { name: 'Resend invitation: Student I (S26-0003)' }))

    await secretLine('resent-code-2')
    await waitFor(() => expect(mutationCache(client)).not.toContain('resent-code-2'))
  })

  it('a password reset', async () => {
    mockedReset.mockResolvedValue({
      userId: 'stud-b',
      temporaryPassword: 'Tmp12345Abcdefg',
      mustChangePasswordAtNextSignIn: true,
    })
    const user = userEvent.setup()
    const client = openPage()
    await screen.findByText('Student B')

    await user.click(screen.getByRole('button', { name: 'Reset password: Student B (S26-0002)' }))
    await screen.findByRole('dialog')
    await confirmIn(user, copy.resetPassword)

    await secretLine('Tmp12345Abcdefg')
    await waitFor(() => expect(mutationCache(client)).not.toContain('Tmp12345Abcdefg'))
  })
})

describe('#449 a secret on screen can be hidden', () => {
  beforeEach(() => {
    mockedList.mockImplementation(async (filters) =>
      answer([account('stud-b', 'Student B', { accountNumber: 'S26-0002' })], filters),
    )
    mockedReset.mockResolvedValue({
      userId: 'stud-b',
      temporaryPassword: 'Tmp12345Abcdefg',
      mustChangePasswordAtNextSignIn: true,
    })
  })

  async function resetStudentB(user: ReturnType<typeof userEvent.setup>) {
    openPage()
    await screen.findByText('Student B')
    await user.click(screen.getByRole('button', { name: 'Reset password: Student B (S26-0002)' }))
    await screen.findByRole('dialog')
    await confirmIn(user, copy.resetPassword)
    await closed()
    await secretLine('Tmp12345Abcdefg')
  }

  it('takes it off the page, and the line that said what happened keeps focus', async () => {
    const user = userEvent.setup()
    await resetStudentB(user)

    await user.click(screen.getByRole('button', { name: copy.hideSecret }))

    expect(screen.queryByText(/Tmp12345Abcdefg/)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: copy.hideSecret })).not.toBeInTheDocument()
    expect(screen.getByText(copy.passwordReset)).toHaveFocus()
  })
})

describe('#449 a resend that was not delivered shows the new code to pass on', () => {
  beforeEach(() => {
    mockedList.mockImplementation(async (filters) =>
      answer(
        [account('stud-i', 'Student I', { accountNumber: 'S26-0003', accountStatus: 'invited', invitationId: 'invite-1' })],
        filters,
      ),
    )
  })

  it('says it was not delivered, and shows the code as an invitation does', async () => {
    mockedReissue.mockResolvedValue(invitation('resent-code-2', false))
    const user = userEvent.setup()
    openPage()
    await screen.findByText('Student I')

    await user.click(screen.getByRole('button', { name: 'Resend invitation: Student I (S26-0003)' }))

    expect(await screen.findByText(copy.inviteNotDelivered.replace('{{accountNumber}}', 'S26-0011'))).toBeInTheDocument()
    expect(await secretLine('resent-code-2')).toBeInTheDocument()
  })

  it('shows no code when the mail went out', async () => {
    // Control.
    mockedReissue.mockResolvedValue(invitation('resent-code-2', true))
    const user = userEvent.setup()
    openPage()
    await screen.findByText('Student I')

    await user.click(screen.getByRole('button', { name: 'Resend invitation: Student I (S26-0003)' }))

    expect(await screen.findByText(copy.inviteResent)).toBeInTheDocument()
    expect(screen.queryByText(/resent-code-2/)).not.toBeInTheDocument()
  })
})

describe('#449 reactivating a student or parent gives focus to the line that says so', () => {
  const statusLine = () => screen.getByText(copy.statusChanged.replace('{{status}}', copy.status.active))

  /**
   * The account is suspended until the change is confirmed. Every read after
   * that waits until `land` is called, so what the page shows meanwhile is
   * the cache's own doing, not the server's.
   */
  function serve(row: AccountRow) {
    const reread = deferred<void>()
    let changed = false
    let rereads = 0
    mockedList.mockImplementation(async (filters) => {
      if (!changed) return answer([{ ...row, accountStatus: 'suspended' }], filters)
      rereads += 1
      await reread.promise
      return answer([row], filters)
    })
    mockedStatus.mockImplementation(async () => {
      changed = true
      return { userId: row.userId, accountStatus: 'active', previousStatus: 'suspended' }
    })
    return { land: () => reread.resolve(), rereads: () => rereads }
  }

  it.each([
    ['a student', 'Student B', account('stud-b', 'Student B', { accountNumber: 'S26-0002' })],
    ['a parent', 'Rita Vogt', account('parent-1', 'Rita Vogt', { accountNumber: 'E26-0001', role: 'parent' })],
  ])('%s', async (_, name, row) => {
    const server = serve(row)
    const user = userEvent.setup()
    const client = openPage()
    await screen.findByText(name)
    const reactivate = `${copy.moveTo.active}: ${name} (${row.accountNumber})`

    await user.click(screen.getByRole('button', { name: reactivate }))
    await screen.findByRole('dialog')
    await confirmIn(user, copy.moveTo.active)

    await closed()
    // The row says "active" before the server is asked again, so the button
    // is gone by the time the dialog hands focus back.
    expect(screen.queryByRole('button', { name: reactivate })).not.toBeInTheDocument()
    await waitFor(() => expect(statusLine()).toHaveFocus())
    await waitFor(() => expect(server.rereads()).toBeGreaterThan(0))

    server.land()

    await waitFor(() => expect(client.isFetching()).toBe(0))
    expect(screen.getByRole('button', { name: `${copy.moveTo.suspended}: ${name} (${row.accountNumber})` })).toBeInTheDocument()
    expect(statusLine()).toHaveFocus()
  })

  it('from a list filtered to suspended accounts, which the row leaves at once', async () => {
    const server = serve(account('stud-b', 'Student B', { accountNumber: 'S26-0002' }))
    const user = userEvent.setup()
    const client = openPage()
    await screen.findByText('Student B')
    await user.selectOptions(screen.getByLabelText(copy.statusLabel), 'suspended')
    await waitFor(() =>
      expect(mockedList).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'suspended' }), expect.anything()),
    )
    await waitFor(() => expect(client.isFetching()).toBe(0))

    await user.click(screen.getByRole('button', { name: `${copy.moveTo.active}: Student B (S26-0002)` }))
    await screen.findByRole('dialog')
    await confirmIn(user, copy.moveTo.active)

    await closed()
    expect(screen.queryByText('Student B')).not.toBeInTheDocument()
    await waitFor(() => expect(statusLine()).toHaveFocus())

    server.land()

    await waitFor(() => expect(client.isFetching()).toBe(0))
    expect(statusLine()).toHaveFocus()
  })
})

describe('#449 copy', () => {
  it('names the hide button in all four languages, in each its own words', () => {
    for (const bundle of [deAdmin, enAdmin, frAdmin, itAdmin]) {
      expect(typeof bundle.accounts.hideSecret).toBe('string')
      expect(bundle.accounts.hideSecret.length).toBeGreaterThan(0)
    }
    for (const bundle of [deAdmin, frAdmin, itAdmin]) {
      expect(bundle.accounts.hideSecret).not.toBe(enAdmin.accounts.hideSecret)
    }
  })
})
