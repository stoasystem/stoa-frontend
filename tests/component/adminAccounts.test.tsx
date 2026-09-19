import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AdminAccountsPage } from '@/pages/admin/AdminAccountsPage'
import { ActivateAccountPage } from '@/pages/auth/ActivateAccountPage'
import {
  claimInvitation,
  listAccounts,
  reissueInvitation,
  resetAccountPassword,
} from '@/services/admin/accountsApi'

import { ApiError } from '@/services/api/httpClient'
import deAdmin from '@/i18n/locales/de/admin.json'
import enAdmin from '@/i18n/locales/en/admin.json'
import frAdmin from '@/i18n/locales/fr/admin.json'
import itAdmin from '@/i18n/locales/it/admin.json'

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
  return {
    ...actual,
    listAccounts: vi.fn(),
    inviteAccount: vi.fn(),
    assignAccount: vi.fn(),
    reissueInvitation: vi.fn(),
    resetAccountPassword: vi.fn(),
    changeAccountStatus: vi.fn(),
    claimInvitation: vi.fn(),
  }
})

const mockedList = vi.mocked(listAccounts)
const mockedReset = vi.mocked(resetAccountPassword)
const mockedReissue = vi.mocked(reissueInvitation)
const mockedClaim = vi.mocked(claimInvitation)

function wrapper(initial: string) {
  return function Wrapper({ children }: { children: ReactNode }) {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
    })
    return (
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[initial]}>{children}</MemoryRouter>
      </QueryClientProvider>
    )
  }
}

const ACCOUNTS = {
  count: 3,
  groups: { parent: 1, student: 1, teacher: 1 },
  nextCursor: null,
  items: [
    {
      userId: 'parent-a',
      accountNumber: 'P26-0001',
      name: 'Parent A',
      email: 'parent-a@stoa.test',
      role: 'parent' as const,
      accountStatus: 'active' as const,
      createdAt: '2026-03-01T09:00:00+00:00',
      lastLoginAt: '',
      linkedAccounts: [{ userId: 'student-b', accountNumber: 'S26-0001', status: 'active' }],
    },
    {
      userId: 'student-b',
      accountNumber: 'S26-0001',
      name: 'Student B',
      email: 'student-b@stoa.test',
      role: 'student' as const,
      accountStatus: 'suspended' as const,
      createdAt: '2026-03-02T09:00:00+00:00',
      lastLoginAt: '2026-03-05T09:00:00+00:00',
      linkedAccounts: [{ userId: 'parent-a', accountNumber: 'P26-0001', status: 'active' }],
    },
    {
      userId: 'teacher-c',
      accountNumber: 'T26-0001',
      name: 'Teacher C',
      email: 'teacher-c@stoa.test',
      role: 'teacher' as const,
      accountStatus: 'archived' as const,
      createdAt: '2026-03-03T09:00:00+00:00',
      lastLoginAt: '',
      linkedAccounts: [],
    },
  ],
}

describe('admin accounts console', () => {
  beforeEach(() => {
    mockedList.mockReset()
    mockedReset.mockReset()
    mockedReissue.mockReset()
    mockedList.mockResolvedValue(ACCOUNTS)
  })

  it('groups accounts by role and shows the number each one is bound to', async () => {
    render(<AdminAccountsPage />, { wrapper: wrapper('/admin/users') })

    await waitFor(() => expect(screen.getByText('Parent A')).toBeTruthy())
    expect(screen.getAllByText('S26-0001').length).toBeGreaterThan(1)
    expect(screen.getAllByText('P26-0001').length).toBeGreaterThan(1)
    expect(screen.getByText('accounts.role.parent · 1')).toBeTruthy()
    expect(screen.getByText('accounts.role.student · 1')).toBeTruthy()
    expect(screen.getByText('accounts.role.teacher · 1')).toBeTruthy()
  })

  it('offers no delete, and leaves an archived account with no status action at all', async () => {
    render(<AdminAccountsPage />, { wrapper: wrapper('/admin/users') })

    await waitFor(() => expect(screen.getByText('Parent A')).toBeTruthy())
    expect(screen.queryByText('accounts.delete')).toBeNull()
    // Active and suspended may be archived; the archived teacher row may not move.
    expect(screen.getAllByText('accounts.moveTo.archived').length).toBe(2)
    expect(screen.getAllByText('accounts.moveTo.active').length).toBe(1)
    expect(screen.getAllByText('accounts.moveTo.suspended').length).toBe(1)
    const archivedRow = screen.getByText('Teacher C').closest('tr')
    expect(archivedRow).toBeTruthy()
    expect(archivedRow?.textContent).not.toContain('accounts.moveTo.')
  })

  it('sends the reason with a password reset and shows the one-time secret', async () => {
    mockedReset.mockResolvedValue({
      userId: 'student-b',
      temporaryPassword: 'Tmp12345Abcdefg',
      mustChangePasswordAtNextSignIn: true,
    })
    render(<AdminAccountsPage />, { wrapper: wrapper('/admin/users') })
    await waitFor(() => expect(screen.getByText('Parent A')).toBeTruthy())

    await userEvent.type(screen.getByLabelText('accounts.reasonPrompt'), 'support call 4711')
    await userEvent.click(screen.getAllByText('accounts.resetPassword')[0])

    await waitFor(() => expect(mockedReset).toHaveBeenCalled())
    // Groups render in role order, so the first reset button belongs to the student row.
    expect(mockedReset.mock.calls[0][0]).toEqual({
      userId: 'student-b',
      reason: 'support call 4711',
    })
    await waitFor(() => expect(screen.getByText(/Tmp12345Abcdefg/)).toBeTruthy())
  })

  it('resends against the invitation id the list returned, not the account id', async () => {
    const invited = {
      userId: 'student_842f7a',
      accountNumber: 'S26-0009',
      name: 'Invited S',
      email: 'invited@stoa.test',
      role: 'student' as const,
      accountStatus: 'invited' as const,
      createdAt: '2026-03-04T09:00:00+00:00',
      lastLoginAt: '',
      linkedAccounts: [],
      invitationId: 'accountinvite_3f19',
    }
    mockedList.mockResolvedValue({ ...ACCOUNTS, items: [...ACCOUNTS.items, invited] })
    mockedReissue.mockResolvedValue({
      userId: invited.userId,
      role: 'student',
      accountNumber: invited.accountNumber,
      email: invited.email,
      accountStatus: 'invited',
      invitationId: 'accountinvite_new',
      activationToken: 'tok',
      expiresAt: '2026-03-07T09:00:00+00:00',
      invitationDelivered: true,
    })
    render(<AdminAccountsPage />, { wrapper: wrapper('/admin/users') })
    await waitFor(() => expect(screen.getByText('Invited S')).toBeTruthy())

    await userEvent.click(screen.getByText('accounts.resendInvite'))

    await waitFor(() => expect(mockedReissue).toHaveBeenCalled())
    expect(mockedReissue.mock.calls[0][0]).toEqual({ invitationId: 'accountinvite_3f19' })
    expect(mockedReissue.mock.calls[0][0].invitationId).not.toBe(invited.userId)
  })

  it('leaves the resend button unusable when the list carried no invitation id', async () => {
    const orphan = {
      userId: 'student_9c01',
      accountNumber: 'S26-0010',
      name: 'Orphan S',
      email: 'orphan@stoa.test',
      role: 'student' as const,
      accountStatus: 'invited' as const,
      createdAt: '2026-03-04T09:00:00+00:00',
      lastLoginAt: '',
      linkedAccounts: [],
    }
    mockedList.mockResolvedValue({ ...ACCOUNTS, items: [...ACCOUNTS.items, orphan] })
    render(<AdminAccountsPage />, { wrapper: wrapper('/admin/users') })
    await waitFor(() => expect(screen.getByText('Orphan S')).toBeTruthy())

    const button = screen.getByText('accounts.resendInvite').closest('button')
    expect(button?.hasAttribute('disabled')).toBe(true)
    await userEvent.click(screen.getByText('accounts.resendInvite'))
    expect(mockedReissue).not.toHaveBeenCalled()
  })
})

describe('invitation activation page', () => {
  beforeEach(() => {
    mockedClaim.mockReset()
  })

  it('claims the token from the link and does not name the role', async () => {
    mockedClaim.mockResolvedValue({
      status: 'active',
      userId: 'student-b',
      role: 'student',
      accountNumber: 'S26-0001',
    })
    render(<ActivateAccountPage />, { wrapper: wrapper('/activate?token=abcdef1234567890') })

    await userEvent.type(screen.getByLabelText('auth:register.password'), 'Startpass1!')
    await userEvent.type(screen.getByLabelText('admin:activation.confirmPassword'), 'Startpass1!')
    await userEvent.click(screen.getByText('admin:activation.submit'))

    await waitFor(() => expect(mockedClaim).toHaveBeenCalled())
    expect(mockedClaim.mock.calls[0][0]).toEqual({
      token: 'abcdef1234567890',
      password: 'Startpass1!',
    })
    await waitFor(() => expect(screen.getByText('admin:activation.success')).toBeTruthy())
  })

  it('refuses to submit without a token in the link', async () => {
    render(<ActivateAccountPage />, { wrapper: wrapper('/activate') })

    expect(screen.getByText('admin:activation.missingToken')).toBeTruthy()
    expect(screen.queryByText('admin:activation.submit')).toBeNull()
    expect(mockedClaim).not.toHaveBeenCalled()
  })
})


describe('what the console says when a guard refuses', () => {
  it('names the rule that refused instead of falling back to a generic failure', async () => {
    // The guards on this page refuse with a code, not prose. Without a phrase
    // for the code every refusal reads the same and the operator learns
    // nothing about what to do next.
    mockedReset.mockRejectedValue(
      new ApiError('Conflict', {
        status: 409,
        code: 'account_peer_admin_password_reset_forbidden',
      }),
    )
    render(<AdminAccountsPage />, { wrapper: wrapper('/admin/users') })
    await waitFor(() => expect(screen.getByText('Parent A')).toBeTruthy())

    await userEvent.type(screen.getByLabelText('accounts.reasonPrompt'), 'support call 4711')
    await userEvent.click(screen.getAllByText('accounts.resetPassword')[0])

    await waitFor(() =>
      expect(
        screen.getByText('accounts.errors.account_peer_admin_password_reset_forbidden'),
      ).toBeTruthy(),
    )
    expect(screen.queryByText('accounts.passwordResetFailed')).toBeNull()
  })

  it('still falls back when the refusal carries no code', async () => {
    mockedReset.mockRejectedValue(new ApiError('Bad Gateway', { status: 502 }))
    render(<AdminAccountsPage />, { wrapper: wrapper('/admin/users') })
    await waitFor(() => expect(screen.getByText('Parent A')).toBeTruthy())

    await userEvent.type(screen.getByLabelText('accounts.reasonPrompt'), 'support call 4711')
    await userEvent.click(screen.getAllByText('accounts.resetPassword')[0])

    // What matters is that nothing invents a phrase key out of an absent code;
    // which wording the generic path settles on is toUserFacingError's business.
    await waitFor(() => expect(mockedReset).toHaveBeenCalled())
    expect(screen.queryByText(/^accounts\.errors\./)).toBeNull()
  })

  it('carries a phrase for every refusal code in all four languages', () => {
    // The console is outside what check-untranslated scans, so nothing else
    // would notice a code that only ever reads in English.
    const english: Record<string, string> = enAdmin.accounts.errors
    const codes = Object.keys(english)
    expect(codes.length).toBeGreaterThan(0)
    for (const bundle of [deAdmin, frAdmin, itAdmin]) {
      const translated: Record<string, string> = bundle.accounts.errors
      expect(Object.keys(translated)).toEqual(codes)
      for (const code of codes) {
        expect(translated[code]).not.toBe(english[code])
      }
    }
  })
})
