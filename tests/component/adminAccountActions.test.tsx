import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AdminAccountsPage } from '@/pages/admin/AdminAccountsPage'
import {
  changeAccountStatus,
  listAccounts,
  reissueInvitation,
  resetAccountPassword,
} from '@/services/admin/accountsApi'
import deAdmin from '@/i18n/locales/de/admin.json'
import enAdmin from '@/i18n/locales/en/admin.json'
import frAdmin from '@/i18n/locales/fr/admin.json'
import itAdmin from '@/i18n/locales/it/admin.json'

// #259. The key comes back with its interpolated values, so a test can tell
// which account a dialog or a button name is about.
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
    await vi.importActual<typeof import('@/services/admin/accountsApi')>(
      '@/services/admin/accountsApi',
    )
  return {
    ...actual,
    listAccounts: vi.fn(),
    reissueInvitation: vi.fn(),
    resetAccountPassword: vi.fn(),
    changeAccountStatus: vi.fn(),
  }
})

const mockedList = vi.mocked(listAccounts)
const mockedReset = vi.mocked(resetAccountPassword)
const mockedStatus = vi.mocked(changeAccountStatus)
const mockedReissue = vi.mocked(reissueInvitation)

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

function row(userId: string, name: string, accountNumber: string, extra: object = {}) {
  return {
    userId,
    accountNumber,
    name,
    email: `${userId}@stoa.test`,
    role: 'student' as const,
    accountStatus: 'active' as const,
    isMinor: false,
    createdAt: '2026-03-01T09:00:00+00:00',
    lastLoginAt: '',
    linkedAccounts: [],
    ...extra,
  }
}

const A = 'Student A (S26-0001)'
const B = 'Student B (S26-0002)'
const ACCOUNTS = {
  count: 3,
  groups: { student: 3 },
  nextCursor: null,
  items: [
    row('stud-a', 'Student A', 'S26-0001'),
    row('stud-b', 'Student B', 'S26-0002'),
    row('stud-c', 'Student C', 'S26-0003', { accountStatus: 'invited', invitationId: 'inv-c' }),
  ],
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((done) => {
    resolve = done
  })
  return { promise, resolve }
}

function rowButton(action: string, account: string) {
  return screen.getByRole('button', { name: `accounts.actionFor(${action}|${account})` })
}

async function openPage() {
  render(<AdminAccountsPage />, { wrapper: Wrapper })
  await screen.findByText('Student A')
}

beforeEach(() => {
  mockedList.mockReset()
  mockedReset.mockReset()
  mockedStatus.mockReset()
  mockedReissue.mockReset()
  mockedList.mockResolvedValue(ACCOUNTS)
})

describe('#259: an account change is confirmed for the account it names', () => {
  it('asks before archiving, names the account and says it cannot be undone', async () => {
    await openPage()

    await userEvent.click(rowButton('accounts.moveTo.archived', B))

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText(`accounts.confirm.title.archived(${B})`)).toBeInTheDocument()
    expect(within(dialog).getByText('accounts.confirm.irreversible')).toBeInTheDocument()
    // Nothing has gone to the server on the first click.
    expect(mockedStatus).not.toHaveBeenCalled()

    await userEvent.type(within(dialog).getByLabelText('accounts.reasonPrompt'), 'ticket 9')
    await userEvent.click(within(dialog).getByRole('button', { name: 'accounts.moveTo.archived' }))

    await waitFor(() => expect(mockedStatus).toHaveBeenCalledTimes(1))
    expect(mockedStatus.mock.calls[0][0]).toEqual({
      userId: 'stud-b',
      status: 'archived',
      reason: 'ticket 9',
    })
  })

  it('asks before resetting a password and names the account', async () => {
    await openPage()

    await userEvent.click(rowButton('accounts.resetPassword', A))

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText(`accounts.confirm.title.reset(${A})`)).toBeInTheDocument()
    expect(within(dialog).queryByText('accounts.confirm.irreversible')).toBeNull()
    expect(mockedReset).not.toHaveBeenCalled()
  })

  it('does not carry the last reason into the next row', async () => {
    // The audit reproduction: "ticket 1" suspends A, then one mis-click on B's
    // Archive archived B for good under A's ticket.
    mockedStatus.mockResolvedValue(undefined as never)
    await openPage()

    await userEvent.click(rowButton('accounts.moveTo.suspended', A))
    let dialog = await screen.findByRole('dialog')
    await userEvent.type(within(dialog).getByLabelText('accounts.reasonPrompt'), 'ticket 1')
    await userEvent.click(within(dialog).getByRole('button', { name: 'accounts.moveTo.suspended' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())

    await userEvent.click(rowButton('accounts.moveTo.archived', B))
    dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByLabelText('accounts.reasonPrompt')).toHaveValue('')
    const confirm = within(dialog).getByRole('button', { name: 'accounts.moveTo.archived' })
    expect(confirm).toBeDisabled()
    await userEvent.click(confirm)

    expect(mockedStatus).toHaveBeenCalledTimes(1)
    expect(mockedStatus.mock.calls[0][0]).toMatchObject({ userId: 'stud-a', reason: 'ticket 1' })
  })

  it('issues one temporary password for a double-clicked confirm', async () => {
    const pending = deferred<Awaited<ReturnType<typeof resetAccountPassword>>>()
    mockedReset.mockReturnValue(pending.promise)
    await openPage()

    await userEvent.click(rowButton('accounts.resetPassword', A))
    const dialog = await screen.findByRole('dialog')
    await userEvent.type(within(dialog).getByLabelText('accounts.reasonPrompt'), 'support call')
    await userEvent.dblClick(within(dialog).getByRole('button', { name: 'accounts.resetPassword' }))

    expect(mockedReset).toHaveBeenCalledTimes(1)
    pending.resolve({
      userId: 'stud-a',
      temporaryPassword: 'Tmp12345Abcdefg',
      mustChangePasswordAtNextSignIn: true,
    })
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(mockedReset).toHaveBeenCalledTimes(1)
  })

  it('holds every row action while one is still running', async () => {
    const pending = deferred<Awaited<ReturnType<typeof reissueInvitation>>>()
    mockedReissue.mockReturnValue(pending.promise)
    await openPage()

    await userEvent.click(rowButton('accounts.resendInvite', 'Student C (S26-0003)'))

    await waitFor(() => expect(rowButton('accounts.resetPassword', A)).toBeDisabled())
    expect(rowButton('accounts.resetPassword', B)).toBeDisabled()
    expect(rowButton('accounts.moveTo.archived', B)).toBeDisabled()
    expect(rowButton('accounts.resendInvite', 'Student C (S26-0003)')).toBeDisabled()

    pending.resolve({
      invitationId: 'inv-c2',
      accountNumber: 'S26-0003',
      invitationDelivered: true,
    } as Awaited<ReturnType<typeof reissueInvitation>>)
    await waitFor(() => expect(rowButton('accounts.resetPassword', A)).toBeEnabled())
  })

  it('announces what happened', async () => {
    mockedReset.mockResolvedValue({
      userId: 'stud-a',
      temporaryPassword: 'Tmp12345Abcdefg',
      mustChangePasswordAtNextSignIn: true,
    })
    await openPage()
    // The live region is in place before there is anything to say.
    const status = screen.getByRole('status')
    expect(status).toBeEmptyDOMElement()

    await userEvent.click(rowButton('accounts.resetPassword', A))
    const dialog = await screen.findByRole('dialog')
    await userEvent.type(within(dialog).getByLabelText('accounts.reasonPrompt'), 'support call')
    await userEvent.click(within(dialog).getByRole('button', { name: 'accounts.resetPassword' }))

    await waitFor(() => expect(status).toHaveTextContent('accounts.passwordReset'))
  })

  it('keeps the dialog open with the refusal and the reason when the change fails', async () => {
    mockedStatus.mockRejectedValue(new Error('boom'))
    await openPage()

    await userEvent.click(rowButton('accounts.moveTo.suspended', A))
    const dialog = await screen.findByRole('dialog')
    await userEvent.type(within(dialog).getByLabelText('accounts.reasonPrompt'), 'ticket 1')
    await userEvent.click(within(dialog).getByRole('button', { name: 'accounts.moveTo.suspended' }))

    expect(await within(dialog).findByRole('alert')).toBeInTheDocument()
    expect(within(dialog).getByLabelText('accounts.reasonPrompt')).toHaveValue('ticket 1')
  })
})

describe('#259: a list being read is not an empty list', () => {
  it('says it is loading instead of "no accounts" in every group', async () => {
    mockedList.mockReturnValue(new Promise(() => {}))
    render(<AdminAccountsPage />, { wrapper: Wrapper })

    expect(await screen.findByText('accounts.loading')).toBeInTheDocument()
    expect(screen.queryByText('accounts.empty')).toBeNull()
    expect(screen.queryByText(/^accounts\.total/)).toBeNull()
  })
})

describe('#259 phrases exist in all four languages', () => {
  it('carries the confirmation, loading and button-name phrases everywhere', () => {
    for (const locale of [enAdmin, deAdmin, frAdmin, itAdmin]) {
      const accounts = locale.accounts as Record<string, unknown> & {
        confirm: { title: Record<string, string>; body: Record<string, string>; irreversible: string }
      }
      expect(accounts.loading).toBeTruthy()
      expect(accounts.actionFor).toContain('{{account}}')
      for (const step of ['reset', 'suspended', 'active', 'archived']) {
        expect(accounts.confirm.title[step]).toContain('{{account}}')
        expect(accounts.confirm.body[step]).toBeTruthy()
      }
      expect(accounts.confirm.irreversible).toBeTruthy()
    }
  })
})
