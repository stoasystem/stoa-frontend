/**
 * #457: the accounts an administrator has on screen stay when a read behind
 * them fails.
 *
 * - The list is read with `retry: false`, so a "Load more" that failed put the
 *   whole infinite query in error, and the groups and the Load more button
 *   gave way to one line saying the list could not be loaded. The same
 *   happened when the list was read again after a change or a language switch.
 * - The teacher-support editor reads its figure again after a save. When that
 *   read failed, the editor, and what the save had said, gave way to an error.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AdminAccountsPage } from '@/pages/admin/AdminAccountsPage'
import { TeacherSupportAllowanceEditor } from '@/pages/admin/TeacherSupportAllowanceEditor'
import {
  listAccounts,
  readTeacherSupportAllowance,
  setTeacherSupportAllowance,
  type AccountListResponse,
} from '@/services/admin/accountsApi'
import { ApiError } from '@/services/api/httpClient'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options && 'count' in options ? `${key}:${options.count}` : key,
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
    readTeacherSupportAllowance: vi.fn(),
    setTeacherSupportAllowance: vi.fn(),
  }
})

const mockedList = vi.mocked(listAccounts)
const mockedRead = vi.mocked(readTeacherSupportAllowance)
const mockedSet = vi.mocked(setTeacherSupportAllowance)

const upstream = () => new ApiError('upstream', { status: 503 })

function render_(ui: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  )
  return client
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

const loadMore = () => screen.getByRole('button', { name: 'accounts.loadMore' })

beforeEach(() => {
  mockedList.mockReset()
  mockedRead.mockReset()
  mockedSet.mockReset()
})

describe('the account list read again (#457)', () => {
  it('keeps the accounts and Load more when the next page fails, and says so beside it', async () => {
    mockedList
      .mockResolvedValueOnce(list(['Anna'], 'cursor-21'))
      .mockRejectedValueOnce(upstream())
      .mockResolvedValueOnce(list(['Bea']))
    const user = userEvent.setup()
    render_(<AdminAccountsPage />)
    expect(await screen.findByText('Anna')).toBeInTheDocument()

    await user.click(loadMore())

    // Beside Load more, and the only failure on the page.
    const box = loadMore().parentElement as HTMLElement
    expect(await within(box).findByRole('alert')).toHaveTextContent('accounts.loadMoreFailed')
    expect(screen.getAllByRole('alert')).toHaveLength(1)
    expect(loadMore()).toBeEnabled()
    expect(screen.getByText('Anna')).toBeInTheDocument()
    expect(screen.getByText('accounts.role.parent · 1')).toBeInTheDocument()
    expect(screen.queryByText('accounts.loadFailed')).toBeNull()

    // The same button tries again, from where the list stopped.
    await user.click(loadMore())
    expect(await screen.findByText('Bea')).toBeInTheDocument()
    expect(screen.getByText('Anna')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).toBeNull()
    expect(mockedList.mock.calls[2][1]).toMatchObject({ after: 'cursor-21' })
  })

  it('keeps the accounts when the list cannot be read again, and says so above them', async () => {
    mockedList.mockResolvedValueOnce(list(['Anna'], 'cursor-21')).mockRejectedValue(upstream())
    const client = render_(<AdminAccountsPage />)
    expect(await screen.findByText('Anna')).toBeInTheDocument()

    // What AppProviders does when the reader changes language.
    await act(async () => {
      await client.invalidateQueries()
    })
    await waitFor(() => expect(mockedList).toHaveBeenCalledTimes(2))

    expect(await screen.findByRole('alert')).toHaveTextContent('accounts.refreshFailed')
    expect(screen.getByText('Anna')).toBeInTheDocument()
    expect(screen.queryByText('accounts.loadFailed')).toBeNull()
    expect(screen.queryByText('accounts.loadMoreFailed')).toBeNull()
    expect(loadMore()).toBeEnabled()
  })

  it('still puts the refusal in place of a list that was never read', async () => {
    mockedList.mockRejectedValue(upstream())
    render_(<AdminAccountsPage />)

    // The refusal itself, as before; nothing says "showing what was loaded".
    expect(await screen.findByRole('alert')).toHaveTextContent('upstream')
    expect(screen.getAllByRole('alert')).toHaveLength(1)
    expect(screen.queryByText(/^accounts\.role\.parent ·/)).toBeNull()
    expect(screen.queryByRole('button', { name: 'accounts.loadMore' })).toBeNull()
  })
})

describe('the teacher-support figure read again after a save (#457)', () => {
  const allowance = (overrides = {}) => ({
    studentId: 'student-b',
    weeklyCases: 7,
    source: 'default' as const,
    default: 7,
    maximum: 200,
    ...overrides,
  })

  it('keeps the editor and what the save said, and says the figure could not be read again', async () => {
    mockedRead.mockResolvedValueOnce(allowance()).mockRejectedValue(upstream())
    mockedSet.mockResolvedValue({ ...allowance({ weeklyCases: 12, source: 'administrator' }), stateVersion: 2 })
    const user = userEvent.setup()
    render_(<TeacherSupportAllowanceEditor studentId="student-b" onClose={() => {}} />)
    const field = await screen.findByLabelText('accounts.teacherSupport.weeklyCases')
    await waitFor(() => expect(field).toHaveValue('7'))

    await user.clear(field)
    await user.type(field, '12')
    await user.type(screen.getByLabelText('accounts.reasonPrompt'), 'exam period')
    await user.click(screen.getByRole('button', { name: 'accounts.teacherSupport.save' }))
    await waitFor(() => expect(mockedRead).toHaveBeenCalledTimes(2))

    expect(await screen.findByRole('alert')).toHaveTextContent('accounts.teacherSupport.refreshFailed')
    expect(screen.getByRole('status')).toHaveTextContent('accounts.teacherSupport.saved:12')
    expect(screen.getByLabelText('accounts.teacherSupport.weeklyCases')).toHaveValue('12')
    expect(screen.getByRole('button', { name: 'accounts.teacherSupport.save' })).toBeEnabled()
    expect(screen.queryByText('accounts.teacherSupport.loadFailed')).toBeNull()
  })

  it('still shows only the failure for a figure that was never read', async () => {
    mockedRead.mockRejectedValue(upstream())
    render_(<TeacherSupportAllowanceEditor studentId="student-b" onClose={() => {}} />)

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'accounts.teacherSupport.save' })).toBeNull()
    expect(screen.queryByText('accounts.teacherSupport.refreshFailed')).toBeNull()
  })
})
