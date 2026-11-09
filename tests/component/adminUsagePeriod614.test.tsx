/**
 * #614: the administrator sets students' and parents' usage periods.
 *
 * Payment is offline, so the console is where a period is extended or its end
 * date changed, and every change leaves a record. The rules the user approved:
 * a paid extension is whole months and names its offline payment; a gift does
 * not; every write carries the version it read, and a 409 means somebody else
 * changed the period - read it again and let the administrator retry.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import enAdmin from '@/i18n/locales/en/admin.json'
import { formatDate } from '@/lib/formatDateTime'
import { AdminAccountsPage } from '@/pages/admin/AdminAccountsPage'
import { AdminEndingUsagePeriodsPage } from '@/pages/admin/AdminEndingUsagePeriodsPage'
import { UsagePeriodPanel } from '@/pages/admin/UsagePeriodPanel'
import {
  addMonths,
  endChangeEffect,
  extendedEnd,
  extensionIssues,
  stateOn,
  zurichToday,
} from '@/pages/admin/usagePeriodRules'
import { assignAccount, listAccounts, type AccountRow } from '@/services/admin/accountsApi'
import {
  extendUsagePeriod,
  listEndingUsagePeriods,
  readUsagePeriod,
  setUsagePeriodEnd,
  type UsagePeriodRead,
  type UsagePeriodRecord,
} from '@/services/admin/usagePeriodApi'
import { ApiError } from '@/services/api/httpClient'

vi.mock('@/layouts/DashboardLayout', () => ({
  DashboardLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}))
vi.mock('@/services/admin/accountsApi', async () => {
  const actual = await vi.importActual<typeof import('@/services/admin/accountsApi')>('@/services/admin/accountsApi')
  return { ...actual, listAccounts: vi.fn(), assignAccount: vi.fn() }
})
vi.mock('@/services/admin/usagePeriodApi', async () => {
  const actual = await vi.importActual<typeof import('@/services/admin/usagePeriodApi')>('@/services/admin/usagePeriodApi')
  return {
    ...actual,
    readUsagePeriod: vi.fn(),
    extendUsagePeriod: vi.fn(),
    setUsagePeriodEnd: vi.fn(),
    listEndingUsagePeriods: vi.fn(),
  }
})

const mockedRead = vi.mocked(readUsagePeriod)
const mockedExtend = vi.mocked(extendUsagePeriod)
const mockedSet = vi.mocked(setUsagePeriodEnd)
const mockedEnding = vi.mocked(listEndingUsagePeriods)
const mockedList = vi.mocked(listAccounts)
const mockedAssign = vi.mocked(assignAccount)

const copy = enAdmin.usagePeriod

// 10:00 in Zurich on 9 November 2026.
const NOW = new Date('2026-11-09T09:00:00Z')

function record(extra: Partial<UsagePeriodRecord> = {}): UsagePeriodRecord {
  return {
    recordId: 'rec-1',
    recordedAt: '2026-11-01T08:30:00.000000+00:00',
    actorId: 'admin-1',
    kind: 'extend',
    unit: 'months',
    amount: 3,
    previousEndsOn: null,
    newEndsOn: '2027-02-01',
    source: 'paid',
    paymentReference: 'RF18 5390 0754 7034',
    note: 'autumn term',
    reason: null,
    subscriptionTier: 'standard',
    ...extra,
  }
}

function period(extra: Partial<UsagePeriodRead> = {}): UsagePeriodRead {
  return {
    userId: 'stud-1',
    role: 'student',
    endsOn: '2026-12-15',
    state: 'active',
    version: 4,
    effective: { endsOn: '2027-01-31', state: 'active', paidBy: 'parent', parentId: 'par-1' },
    records: [],
    nextPageToken: null,
    ...extra,
  }
}

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

const ACCOUNTS = [
  account('admin-1', 'Ada Admin', { role: 'admin', accountNumber: 'A26-0001' }),
  account('par-1', 'Pia Parent', { role: 'parent', accountNumber: 'P26-0001' }),
  account('stud-1', 'Lea Muster', { accountNumber: 'S26-0001' }),
]

function client() {
  return new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } })
}

function wrap(node: ReactNode, path = '/') {
  return render(
    <QueryClientProvider client={client()}>
      <MemoryRouter initialEntries={[path]}>{node}</MemoryRouter>
    </QueryClientProvider>,
  )
}

/** The panel's own copy, as i18next fills it in English. */
function fill(text: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce((out, [key, value]) => out.replace(`{{${key}}}`, String(value)), text)
}

const day = (value: string) => formatDate(value)

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(NOW)
  await i18n.changeLanguage('en')
  vi.clearAllMocks()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('the period rules the console previews with', () => {
  it('counts an extension from today or the current end, whichever is later', () => {
    expect(extendedEnd('2026-12-15', '2026-11-09', 'months', 1)).toBe('2027-01-15')
    expect(extendedEnd('2026-10-01', '2026-11-09', 'months', 1)).toBe('2026-12-09')
    expect(extendedEnd(null, '2026-11-09', 'days', 30)).toBe('2026-12-09')
  })

  it('lands on the last day of a shorter month, as the backend does', () => {
    expect(addMonths('2027-01-31', 1)).toBe('2027-02-28')
    expect(addMonths('2028-01-31', 1)).toBe('2028-02-29')
    expect(addMonths('2026-11-30', 3)).toBe('2027-02-28')
    expect(addMonths('2026-12-31', 12)).toBe('2027-12-31')
  })

  it('reads the day in Zurich, not in UTC', () => {
    // 23:30 UTC on 9 November is already the 10th in Zurich.
    expect(zurichToday(new Date('2026-11-09T23:30:00Z'))).toBe('2026-11-10')
  })

  it('keeps a period active through its end day', () => {
    expect(stateOn('2026-11-09', '2026-11-09')).toBe('active')
    expect(stateOn('2026-11-08', '2026-11-09')).toBe('expired')
    expect(stateOn(null, '2026-11-09')).toBe('none')
  })

  it('asks a paid extension for months and a payment reference, and a gift for neither', () => {
    const paid = { unit: 'days' as const, amount: '10', source: 'paid' as const, paymentReference: ' ', note: '' }
    expect(extensionIssues(paid)).toEqual(['paidInMonths', 'paymentReference'])
    expect(extensionIssues({ ...paid, source: 'gifted' })).toEqual([])
    expect(extensionIssues({ ...paid, unit: 'months', paymentReference: 'R-1' })).toEqual([])
    expect(extensionIssues({ ...paid, source: 'gifted', amount: '0' })).toEqual(['amount'])
    expect(extensionIssues({ ...paid, source: 'gifted', amount: '1.5' })).toEqual(['amount'])
  })

  it('tells an early end from a shortened one', () => {
    expect(endChangeEffect('2026-12-15', '2026-11-01', '2026-11-09')).toBe('endsNow')
    expect(endChangeEffect('2026-12-15', '2026-11-30', '2026-11-09')).toBe('shortens')
    expect(endChangeEffect('2026-12-15', '2027-01-15', '2026-11-09')).toBe('none')
    expect(endChangeEffect(null, '2026-11-30', '2026-11-09')).toBe('none')
  })
})

describe('#614 one account’s period', () => {
  it('shows the end date, the period in force and whose it is, and the records', async () => {
    mockedRead.mockResolvedValue(period({ records: [record()] }))
    wrap(<UsagePeriodPanel userId="stud-1" accounts={ACCOUNTS} />)

    expect(await screen.findByText(fill(copy.endsOn, { date: day('2026-12-15') }))).toBeInTheDocument()
    const effective = screen.getByTestId('usage-period-effective')
    expect(effective).toHaveTextContent(fill(copy.effective, { date: day('2027-01-31') }))
    expect(effective).toHaveTextContent(fill(copy.fromParent, { parent: 'Pia Parent (P26-0001)' }))

    const row = screen.getAllByRole('row')[1]
    expect(row).toHaveTextContent('Ada Admin (A26-0001)')
    expect(row).toHaveTextContent(copy.kind.extend)
    expect(row).toHaveTextContent('3 months')
    expect(row).toHaveTextContent(`— → ${day('2027-02-01')}`)
    expect(row).toHaveTextContent(copy.source.paid)
    expect(row).toHaveTextContent('RF18 5390 0754 7034')
    expect(row).toHaveTextContent('autumn term')
  })

  it('previews the new end date and sends a paid extension with its reference and the version read', async () => {
    const user = userEvent.setup()
    mockedRead.mockResolvedValue(period())
    mockedExtend.mockResolvedValue({ ...period({ endsOn: '2027-03-15', version: 5 }), record: record() })
    wrap(<UsagePeriodPanel userId="stud-1" accounts={ACCOUNTS} />)

    await user.type(await screen.findByLabelText(copy.amountLabel), '3')
    expect(screen.getByTestId('usage-period-preview')).toHaveTextContent(
      fill(copy.preview, { date: day('2027-03-15'), from: day('2026-12-15') }),
    )
    // Days cannot be chosen for a paid extension.
    expect(within(screen.getByLabelText(copy.unitLabel)).getByRole('option', { name: copy.unit.days })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: copy.extendSubmit }))
    expect(mockedExtend).not.toHaveBeenCalled()
    expect(screen.getByText(new RegExp(copy.extensionIssues.paymentReference))).toBeInTheDocument()

    await user.type(screen.getByLabelText(copy.paymentReferenceLabel), 'RF18 1')
    await user.click(screen.getByRole('button', { name: copy.extendSubmit }))

    await waitFor(() =>
      expect(mockedExtend.mock.calls[0]?.[0]).toEqual({
        userId: 'stud-1',
        unit: 'months',
        amount: 3,
        source: 'paid',
        paymentReference: 'RF18 1',
        note: '',
        expectedVersion: 4,
      }),
    )
    expect(await screen.findByText(fill(copy.extended, { date: day('2027-03-15') }))).toBeInTheDocument()
  })

  it('lets a gift be counted in days, from today when the period has run out', async () => {
    const user = userEvent.setup()
    mockedRead.mockResolvedValue(period({ endsOn: '2026-10-01', state: 'expired', version: 0 }))
    mockedExtend.mockResolvedValue({ ...period({ endsOn: '2026-11-23', version: 1 }), record: record() })
    wrap(<UsagePeriodPanel userId="stud-1" />)

    await user.selectOptions(await screen.findByLabelText(copy.sourceLabel), 'gifted')
    expect(screen.queryByLabelText(copy.paymentReferenceLabel)).not.toBeInTheDocument()
    await user.selectOptions(screen.getByLabelText(copy.unitLabel), 'days')
    await user.type(screen.getByLabelText(copy.amountLabel), '14')
    expect(screen.getByTestId('usage-period-preview')).toHaveTextContent(
      fill(copy.preview, { date: day('2026-11-23'), from: day('2026-11-09') }),
    )
    await user.click(screen.getByRole('button', { name: copy.extendSubmit }))

    await waitFor(() =>
      expect(mockedExtend.mock.calls[0]?.[0]).toMatchObject({
        unit: 'days',
        amount: 14,
        source: 'gifted',
        expectedVersion: 0,
      }),
    )
  })

  it('confirms a changed end date, says it ends the period at once, and sends the reason', async () => {
    const user = userEvent.setup()
    mockedRead.mockResolvedValue(period({ role: 'parent', effective: null }))
    mockedSet.mockResolvedValue({
      ...period({ endsOn: '2026-11-01', state: 'expired', version: 5 }),
      record: record({ kind: 'set' }),
    })
    wrap(<UsagePeriodPanel userId="par-1" />)

    await user.type(await screen.findByLabelText(copy.newEndLabel), '2026-11-01')
    await user.type(screen.getByLabelText(copy.reasonLabel), 'refund agreed')
    await user.click(screen.getByRole('button', { name: copy.setSubmit }))

    expect(mockedSet).not.toHaveBeenCalled()
    expect(screen.getByText(fill(copy.confirmChange, { from: day('2026-12-15'), to: day('2026-11-01') }))).toBeInTheDocument()
    expect(screen.getByText(copy.endsNowWarning)).toBeInTheDocument()
    // A parent's period reaches the children.
    expect(screen.getByText(copy.parentWarning)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: copy.confirmSubmit }))
    await waitFor(() =>
      expect(mockedSet.mock.calls[0]?.[0]).toEqual({
        userId: 'par-1',
        endsOn: '2026-11-01',
        reason: 'refund agreed',
        expectedVersion: 4,
      }),
    )
    expect(await screen.findByText(fill(copy.endChanged, { date: day('2026-11-01') }))).toBeInTheDocument()
  })

  it('does not change the end date without a reason', async () => {
    const user = userEvent.setup()
    mockedRead.mockResolvedValue(period())
    wrap(<UsagePeriodPanel userId="stud-1" />)

    await user.type(await screen.findByLabelText(copy.newEndLabel), '2027-01-10')
    await user.click(screen.getByRole('button', { name: copy.setSubmit }))

    expect(screen.queryByRole('button', { name: copy.confirmSubmit })).not.toBeInTheDocument()
    expect(screen.getByText(new RegExp(copy.endIssues.reason))).toBeInTheDocument()
  })

  it('on a version conflict says somebody else changed it, reads it again and keeps what was typed', async () => {
    const user = userEvent.setup()
    mockedRead
      .mockResolvedValueOnce(period())
      .mockResolvedValue(period({ endsOn: '2027-01-15', version: 5 }))
    mockedExtend.mockRejectedValueOnce(
      new ApiError('conflict', { status: 409, code: 'usage_period_version_conflict' }),
    )
    mockedExtend.mockResolvedValueOnce({ ...period({ endsOn: '2027-02-15', version: 6 }), record: record() })
    wrap(<UsagePeriodPanel userId="stud-1" />)

    await user.selectOptions(await screen.findByLabelText(copy.sourceLabel), 'gifted')
    await user.type(screen.getByLabelText(copy.amountLabel), '1')
    await user.click(screen.getByRole('button', { name: copy.extendSubmit }))

    expect(await screen.findByRole('alert')).toHaveTextContent(copy.versionConflict)
    expect(await screen.findByText(fill(copy.endsOn, { date: day('2027-01-15') }))).toBeInTheDocument()
    expect(mockedRead).toHaveBeenCalledTimes(2)
    expect(screen.getByLabelText(copy.amountLabel)).toHaveValue('1')

    // The retry carries the version just read.
    await user.click(screen.getByRole('button', { name: copy.extendSubmit }))
    await waitFor(() => expect(mockedExtend.mock.calls[1]?.[0]).toMatchObject({ expectedVersion: 5 }))
  })

  it('pages through older records', async () => {
    const user = userEvent.setup()
    mockedRead
      .mockResolvedValueOnce(period({ records: [record({ recordId: 'new' })], nextPageToken: 'tok-2' }))
      .mockResolvedValueOnce(period({ records: [record({ recordId: 'old', note: 'first term' })], nextPageToken: null }))
    wrap(<UsagePeriodPanel userId="stud-1" />)

    await user.click(await screen.findByRole('button', { name: copy.loadMore }))
    expect(await screen.findByText('first term')).toBeInTheDocument()
    expect(mockedRead.mock.calls[1]?.[1]).toMatchObject({ pageToken: 'tok-2' })
    expect(screen.queryByRole('button', { name: copy.loadMore })).not.toBeInTheDocument()
  })
})

describe('#614 periods ending soon', () => {
  it('lists the accounts, marks the expired ones, and names the children a parent covers', async () => {
    mockedEnding.mockResolvedValue({
      endingWithinDays: 14,
      count: 2,
      items: [
        {
          userId: 'par-1',
          accountNumber: 'P26-0001',
          name: 'Pia Parent',
          role: 'parent',
          endsOn: '2026-11-15',
          state: 'active',
          children: [{ userId: 'stud-1', accountNumber: 'S26-0001', name: 'Lea Muster' }],
        },
        {
          userId: 'stud-2',
          accountNumber: 'S26-0002',
          name: 'Max Muster',
          role: 'student',
          endsOn: '2026-11-01',
          state: 'expired',
          children: [],
        },
      ],
    })
    wrap(
      <Routes>
        <Route path="/admin/usage-periods" element={<AdminEndingUsagePeriodsPage />} />
      </Routes>,
      '/admin/usage-periods',
    )

    expect(mockedEnding).toHaveBeenCalledWith(14, expect.anything())
    const parent = await screen.findByRole('link', { name: 'P26-0001' })
    expect(parent).toHaveAttribute('href', '/admin/users/par-1/usage-period')
    expect(screen.getByRole('link', { name: 'Lea Muster (S26-0001)' })).toHaveAttribute(
      'href',
      '/admin/users/stud-1/usage-period',
    )
    expect(screen.getByText('6 days left')).toBeInTheDocument()
    const expired = screen.getByRole('link', { name: 'S26-0002' }).closest('tr') as HTMLElement
    expect(within(expired).getByText(copy.state.expired)).toBeInTheDocument()
    expect(within(expired).getByText('ended 8 days ago')).toBeInTheDocument()
  })
})

describe('#614 the users list', () => {
  it('shows a student’s end date and links to the period; a teacher has none', async () => {
    mockedList.mockResolvedValue({
      items: [
        account('stud-1', 'Lea Muster', { accountNumber: 'S26-0001', usagePeriodEndsAt: '2026-11-01' }),
        account('teach-1', 'Tom Teacher', { role: 'teacher', accountNumber: 'T26-0001', usagePeriodEndsAt: null }),
      ],
      count: 2,
      groups: { student: 1, teacher: 1 },
      nextCursor: null,
    })
    wrap(<AdminAccountsPage />, '/admin/users')

    const student = (await screen.findByText('Lea Muster')).closest('tr') as HTMLElement
    expect(within(student).getByText(day('2026-11-01'))).toBeInTheDocument()
    expect(within(student).getByText(copy.state.expired)).toBeInTheDocument()
    expect(within(student).getByRole('link', { name: /Usage period/ })).toHaveAttribute(
      'href',
      '/admin/users/stud-1/usage-period',
    )
    const teacher = screen.getByText('Tom Teacher').closest('tr') as HTMLElement
    expect(within(teacher).queryByRole('link', { name: /Usage period/ })).not.toBeInTheDocument()
    expect(teacher.closest('table')).not.toHaveTextContent(copy.columnEndsOn)
  })

  it('goes straight to the new account’s period after opening it, with the first password still shown', async () => {
    const user = userEvent.setup()
    mockedList.mockResolvedValue({ items: [], count: 0, groups: {}, nextCursor: null })
    mockedAssign.mockResolvedValue({
      userId: 'stud-new',
      role: 'student',
      accountNumber: 'S26-0011',
      email: 'new@example.ch',
      accountStatus: 'active',
      initialPassword: 'Initial12345678',
    })
    mockedRead.mockResolvedValue(period({ userId: 'stud-new', endsOn: null, state: 'none', version: 0, effective: null }))
    wrap(<AdminAccountsPage />, '/admin/users')

    await user.click(await screen.findByRole('button', { name: enAdmin.accounts.assign }))
    const dialog = await screen.findByRole('dialog')
    await user.type(within(dialog).getByLabelText(new RegExp(enAdmin.accounts.emailLabel)), 'new@example.ch')
    await user.click(within(dialog).getByRole('button', { name: enAdmin.accounts.assignDialogSubmit }))

    const heading = await screen.findByText(fill(copy.newAccountTitle, { accountNumber: 'S26-0011' }))
    await waitFor(() => expect(heading).toHaveFocus())
    expect(screen.getByText(new RegExp('Initial12345678'))).toBeInTheDocument()
    expect(await screen.findByLabelText(copy.amountLabel)).toBeInTheDocument()
    expect(mockedRead).toHaveBeenCalledWith('stud-new', expect.anything())
  })
})
