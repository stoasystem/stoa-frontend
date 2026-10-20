import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AdminAccountsPage } from '@/pages/admin/AdminAccountsPage'
import {
  assignAccount,
  createdRangeParams,
  inviteAccount,
  listAccounts,
  type AccountListResponse,
} from '@/services/admin/accountsApi'
import deAdmin from '@/i18n/locales/de/admin.json'
import enAdmin from '@/i18n/locales/en/admin.json'
import frAdmin from '@/i18n/locales/fr/admin.json'
import itAdmin from '@/i18n/locales/it/admin.json'

// #335: the accounts page's list and invite form. A5 (created-to excludes
// that day), A6 (every key re-reads the whole list), A7 (silent truncation),
// A9 (the form stays filled after an invite). A4 is in
// teacherSupportAllowance.test.tsx; the request-level halves of A5-A7 are in
// accountsApiPaging.test.ts.

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { resolvedLanguage: 'en', language: 'en' },
  }),
}))

vi.mock('@/services/admin/accountsApi', async () => {
  const actual =
    await vi.importActual<typeof import('@/services/admin/accountsApi')>(
      '@/services/admin/accountsApi',
    )
  return { ...actual, listAccounts: vi.fn(), inviteAccount: vi.fn(), assignAccount: vi.fn() }
})

const mockedList = vi.mocked(listAccounts)
const mockedInvite = vi.mocked(inviteAccount)
const mockedAssign = vi.mocked(assignAccount)

function Wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  return (
    <QueryClientProvider client={client}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  )
}

function account(name: string) {
  return {
    userId: name,
    accountNumber: '',
    name,
    email: `${name}@stoa.test`,
    role: 'parent' as const,
    accountStatus: 'active' as const,
    isMinor: false,
    createdAt: '2026-03-01T09:00:00+00:00',
    lastLoginAt: '',
    linkedAccounts: [],
  }
}

function list(names: string[], nextCursor: string | null = null): AccountListResponse {
  return { items: names.map(account), count: names.length, groups: { parent: names.length }, nextCursor }
}

/** One change per key, all inside one tick: faster than any debounce, whatever the machine's load. */
function typeQuickly(field: HTMLElement, word: string) {
  for (let end = 1; end <= word.length; end += 1) {
    fireEvent.change(field, { target: { value: word.slice(0, end) } })
  }
}

beforeEach(() => {
  mockedList.mockReset()
  mockedInvite.mockReset()
  mockedAssign.mockReset()
})

describe('A5: "created to" a day includes that day, in Zurich', () => {
  // The server compares these as strings with stored timestamps.
  const within_ = (stamp: string, from?: string, to?: string) => {
    const range = createdRangeParams(from, to)
    return (!range.created_from || stamp >= range.created_from) && (!range.created_to || stamp <= range.created_to)
  }

  it('keeps an account created on the "to" day', () => {
    expect(within_('2026-10-20T09:15:00.123456+00:00', undefined, '2026-10-20')).toBe(true)
    expect(within_('2026-10-20T21:59:59+00:00', undefined, '2026-10-20')).toBe(true)
  })

  it('reads the day as Zurich time, summer and winter', () => {
    expect(createdRangeParams('2026-10-20', '2026-10-20')).toEqual({
      created_from: '2026-10-19T22:00:00',
      created_to: '2026-10-20T21:59:59.999999+00:00',
    })
    expect(createdRangeParams('2026-01-15', '2026-01-15')).toEqual({
      created_from: '2026-01-14T23:00:00',
      created_to: '2026-01-15T22:59:59.999999+00:00',
    })
    // The clocks go forward on 29 March 2026: the day starts at +1, ends at +2.
    expect(createdRangeParams('2026-03-29', '2026-03-29')).toEqual({
      created_from: '2026-03-28T23:00:00',
      created_to: '2026-03-29T21:59:59.999999+00:00',
    })
  })

  it('leaves out the next Zurich day, and what came before the first', () => {
    // 22:00 UTC on the 20th is midnight on the 21st in Zurich.
    expect(within_('2026-10-20T22:00:00.000000+00:00', undefined, '2026-10-20')).toBe(false)
    expect(within_('2026-10-19T21:59:59.999999+00:00', '2026-10-20')).toBe(false)
    expect(within_('2026-10-19T22:00:00+00:00', '2026-10-20')).toBe(true)
  })

  it('sends nothing for an empty field', () => {
    expect(createdRangeParams('', '')).toEqual({ created_from: undefined, created_to: undefined })
  })
})

describe('A6: the keyword waits for a pause and the list stays up', () => {
  it('asks once for the whole word, not once per key', async () => {
    mockedList.mockResolvedValue(list(['Anna']))
    render(<AdminAccountsPage />, { wrapper: Wrapper })
    await screen.findByText('Anna')

    typeQuickly(screen.getByLabelText('accounts.keywordLabel'), 'lea')

    await waitFor(() =>
      expect(mockedList.mock.calls.some(([filters]) => filters?.q === 'lea')).toBe(true),
    )
    const keywords = mockedList.mock.calls.map(([filters]) => filters?.q)
    expect(keywords).not.toContain('l')
    expect(keywords).not.toContain('le')
  })

  it('keeps the previous list on screen instead of flashing "loading"', async () => {
    mockedList.mockResolvedValueOnce(list(['Anna']))
    let answer: (value: AccountListResponse) => void = () => {}
    mockedList.mockImplementationOnce(() => new Promise((resolve) => (answer = resolve)))
    render(<AdminAccountsPage />, { wrapper: Wrapper })
    await screen.findByText('Anna')

    typeQuickly(screen.getByLabelText('accounts.keywordLabel'), 'lea')
    await waitFor(() => expect(mockedList).toHaveBeenCalledTimes(2))

    expect(screen.getByText('Anna')).toBeInTheDocument()
    expect(screen.queryByText('accounts.loading')).toBeNull()

    answer(list(['Lea']))
    expect(await screen.findByText('Lea')).toBeInTheDocument()
  })

  it('hands the query its abort signal', async () => {
    mockedList.mockResolvedValue(list(['Anna']))
    render(<AdminAccountsPage />, { wrapper: Wrapper })
    await screen.findByText('Anna')
    expect(mockedList.mock.calls[0][1]?.signal).toBeInstanceOf(AbortSignal)
  })
})

describe('A7: a list cut at the request budget says so', () => {
  it('says it is incomplete and reads on from where it stopped', async () => {
    mockedList.mockResolvedValueOnce(list(['Anna'], 'cursor-21'))
    mockedList.mockResolvedValueOnce(list(['Bea']))
    render(<AdminAccountsPage />, { wrapper: Wrapper })
    await screen.findByText('Anna')

    expect(screen.getByText('accounts.incomplete')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'accounts.loadMore' }))

    expect(await screen.findByText('Bea')).toBeInTheDocument()
    expect(screen.getByText('Anna')).toBeInTheDocument()
    expect(mockedList.mock.calls[1][1]?.after).toBe('cursor-21')
    expect(screen.getByText('accounts.role.parent · 2')).toBeInTheDocument()
    expect(screen.queryByText('accounts.incomplete')).toBeNull()
  })

  it('says nothing of the kind when the list was read to the end', async () => {
    // Negative control.
    mockedList.mockResolvedValue(list(['Anna']))
    render(<AdminAccountsPage />, { wrapper: Wrapper })
    await screen.findByText('Anna')
    expect(screen.queryByText('accounts.incomplete')).toBeNull()
    expect(screen.queryByRole('button', { name: 'accounts.loadMore' })).toBeNull()
  })
})

describe('A9: the form is emptied once an account is opened', () => {
  it('after an invite, so a second press cannot replace the one-time code', async () => {
    mockedList.mockResolvedValue(list(['Anna']))
    mockedInvite.mockResolvedValue({
      userId: 'student_new',
      role: 'student',
      accountNumber: 'S26-0011',
      email: 'new@stoa.test',
      accountStatus: 'invited',
      invitationId: 'accountinvite_1',
      activationToken: 'one-time-code',
      expiresAt: '2026-03-07T09:00:00+00:00',
      invitationDelivered: false,
    })
    render(<AdminAccountsPage />, { wrapper: Wrapper })
    await screen.findByText('Anna')

    await userEvent.type(screen.getByLabelText('accounts.emailLabel'), 'new@stoa.test')
    await userEvent.click(screen.getByText('accounts.invite'))

    expect(await screen.findByText(/one-time-code/)).toBeInTheDocument()
    expect(screen.getByLabelText('accounts.emailLabel')).toHaveValue('')
    expect(screen.getByText('accounts.invite').closest('button')).toBeDisabled()
    expect(mockedInvite).toHaveBeenCalledTimes(1)
  })

  it('after a direct assignment, so the next dialog opens empty', async () => {
    mockedList.mockResolvedValue(list(['Anna']))
    mockedAssign.mockResolvedValue({
      userId: 'teacher_new',
      role: 'teacher',
      accountNumber: 'T26-0022',
      email: 'direct@stoa.test',
      accountStatus: 'active',
      initialPassword: 'Initial12345678',
    })
    render(<AdminAccountsPage />, { wrapper: Wrapper })
    await screen.findByText('Anna')

    await userEvent.type(screen.getByLabelText('accounts.emailLabel'), 'direct@stoa.test')
    await userEvent.click(screen.getByText('accounts.assign'))
    const dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByText('accounts.assignDialogSubmit'))

    expect(await screen.findByText(/Initial12345678/)).toBeInTheDocument()
    expect(screen.getByLabelText('accounts.emailLabel')).toHaveValue('')
    await userEvent.click(screen.getByText('accounts.assign'))
    const again = await screen.findByRole('dialog')
    expect(within(again).getByLabelText('accounts.emailLabel')).toHaveValue('')
  })
})

describe('#335 copy', () => {
  it('is in all four languages, and the incomplete line names how many', () => {
    for (const bundle of [deAdmin, enAdmin, frAdmin, itAdmin]) {
      const accounts: Record<string, unknown> = bundle.accounts
      for (const key of ['incomplete', 'loadMore', 'loadingMore']) {
        expect(typeof accounts[key]).toBe('string')
      }
      expect(accounts.incomplete).toContain('{{shown}}')
    }
    for (const bundle of [deAdmin, frAdmin, itAdmin]) {
      expect(bundle.accounts.loadMore).not.toBe(enAdmin.accounts.loadMore)
      expect(bundle.accounts.incomplete).not.toBe(enAdmin.accounts.incomplete)
    }
  })
})
