/**
 * #616: students and parents are told before and after their usage period ends.
 *
 * Billing is offline: an administrator sets each paying account's period, a
 * parent's covers their children. From seven days before the last day, and
 * once it is over, a banner at the top of every page says which account, which
 * day and whom to ask for more time; it can be closed for the visit. The
 * parent's Overview lists their own period and each child's, with who pays --
 * another parent is never named (stoa-backend#343).
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ParentUsagePeriodGroup } from '@/components/parent/ParentUsagePeriodGroup'
import { UsagePeriodBanner } from '@/components/shell/UsagePeriodBanner'
import {
  childDaysLeft,
  noticeSignature,
  parentNotices,
  periodNotice,
} from '@/features/usage-period/usagePeriodNotice'
import i18n from '@/i18n'
import { formatDate, formatDayAndMonth } from '@/lib/formatDateTime'
import { getParentUsagePeriod } from '@/services/parent/parentApi'
import { getStudentEntitlement } from '@/services/student/studentApi'
import { type CurrentUser, useAuthStore } from '@/store/authStore'
import { useUsagePeriodBannerStore } from '@/store/usagePeriodBannerStore'
import type { StudentEntitlement, StudentUsagePeriod } from '@/types/student'
import type { ParentUsagePeriods } from '@/types/usagePeriod'
import type { UserRole } from '@/types/user'

vi.mock('@/services/student/studentApi', async () => {
  const actual = await vi.importActual<typeof import('@/services/student/studentApi')>('@/services/student/studentApi')
  return { ...actual, getStudentEntitlement: vi.fn() }
})
vi.mock('@/services/parent/parentApi', async () => {
  const actual = await vi.importActual<typeof import('@/services/parent/parentApi')>('@/services/parent/parentApi')
  return { ...actual, getParentUsagePeriod: vi.fn() }
})

const mockedEntitlement = vi.mocked(getStudentEntitlement)
const mockedParent = vi.mocked(getParentUsagePeriod)

// 10:00 in Zurich on Monday 9 November 2026.
const NOW = new Date('2026-11-09T09:00:00Z')
const TODAY = '2026-11-09'

type StudentPeriod = StudentUsagePeriod

function entitlement(usagePeriod: StudentPeriod): StudentEntitlement {
  return {
    effectivePlan: 'basic',
    newUsageAllowed: true,
    teacherSupportIncluded: true,
    usagePeriod,
    renewalContactEmail: 'info@stoaedu.ch',
  }
}

function parentPeriods(extra: Partial<ParentUsagePeriods> = {}): ParentUsagePeriods {
  return {
    own: { endsAt: '2027-03-31', state: 'active', daysLeft: 142 },
    children: [],
    renewalContactEmail: 'info@stoaedu.ch',
    ...extra,
  }
}

function signIn(role: UserRole, id = `${role}-1`) {
  useAuthStore.setState({
    user: { id, name: 'Lina Meier', email: 'lina@example.com', role } as CurrentUser,
    accessToken: 'token',
    isAuthenticated: true,
  })
}

function renderWithQuery(node: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>{node}</MemoryRouter>
    </QueryClientProvider>,
  )
}

const banner = () => screen.queryByRole('complementary', { name: 'Usage period' })

beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(NOW)
  await i18n.changeLanguage('en')
  useUsagePeriodBannerStore.setState({ dismissed: {} })
})

afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
  useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })
})

describe('when a period is worth a banner', () => {
  it('starts seven days before the last day and keeps on through it and after it', () => {
    const on = (daysLeft: number | null, state: StudentPeriod['state'] = 'active') =>
      periodNotice({ endsAt: daysLeft === null ? null : '2026-11-16', state, daysLeft })
    expect(on(8)).toBeNull()
    expect(on(7)).toEqual({ kind: 'endsSoon', endsAt: '2026-11-16', daysLeft: 7 })
    expect(on(0)).toEqual({ kind: 'endsSoon', endsAt: '2026-11-16', daysLeft: 0 })
    expect(on(0, 'expired')).toEqual({ kind: 'expired', endsAt: '2026-11-16' })
    expect(on(null, 'none')).toBeNull()
  })

  it('counts a child’s days left from its Zurich end day, the read carrying none', () => {
    // 00:30 in Zurich is still the day before in UTC: the Zurich day is what counts.
    vi.setSystemTime(new Date('2026-11-08T23:30:00Z'))
    expect(childDaysLeft({ endsAt: '2026-11-16', state: 'active' }, '2026-11-09')).toBe(7)
    expect(childDaysLeft({ endsAt: '2026-11-09', state: 'active' }, '2026-11-09')).toBe(0)
    expect(childDaysLeft({ endsAt: '2026-11-01', state: 'expired' }, '2026-11-09')).toBe(0)
    expect(childDaysLeft({ endsAt: null, state: 'none' }, '2026-11-09')).toBeNull()
  })

  it('lists the parent’s own first, then the children whose periods end within a week or ended', () => {
    const notices = parentNotices(
      parentPeriods({
        own: { endsAt: '2026-11-12', state: 'active', daysLeft: 3 },
        children: [
          { studentId: 's1', name: 'Ana', endsAt: '2026-11-17', state: 'active', paidBy: 'you' },
          { studentId: 's2', name: 'Ben', endsAt: '2026-11-16', state: 'active', paidBy: 'self' },
          { studentId: 's3', name: 'Cleo', endsAt: '2026-11-02', state: 'expired', paidBy: 'other_parent' },
          { studentId: 's4', name: 'Dan', endsAt: null, state: 'none', paidBy: null },
        ],
      }),
      TODAY,
    )
    expect(notices.map((entry) => (entry.account === 'own' ? 'own' : entry.name))).toEqual(['own', 'Ben', 'Cleo'])
    expect(noticeSignature(notices)).toBe('own:endsSoon:2026-11-12|child:s2:endsSoon:2026-11-16|child:s3:expired:2026-11-02')
  })
})

describe('the student’s banner', () => {
  it('says nothing with eight days left', async () => {
    signIn('student')
    mockedEntitlement.mockResolvedValue(entitlement({ endsAt: '2026-11-17', state: 'active', daysLeft: 8, paidBy: 'parent' }))
    renderWithQuery(<UsagePeriodBanner />)
    await waitFor(() => expect(mockedEntitlement).toHaveBeenCalled())
    await act(async () => {})
    expect(banner()).toBeNull()
  })

  it('with seven days left of a parent’s period, says how many, until when, and to ask a parent', async () => {
    signIn('student')
    mockedEntitlement.mockResolvedValue(entitlement({ endsAt: '2026-11-16', state: 'active', daysLeft: 7, paidBy: 'parent' }))
    renderWithQuery(<UsagePeriodBanner />)
    const shown = await screen.findByRole('complementary', { name: 'Usage period' })
    expect(shown).toHaveTextContent(`Your usage period ends in 7 days (on ${formatDayAndMonth('2026-11-16')}).`)
    expect(shown).toHaveTextContent('Ask a parent to renew it.')
    expect(shown).toHaveAttribute('data-usage-period-banner', 'endsSoon')
  })

  it('on the last day itself, says it is today, and a student paying for themselves contacts STOA', async () => {
    signIn('student')
    mockedEntitlement.mockResolvedValue(entitlement({ endsAt: TODAY, state: 'active', daysLeft: 0, paidBy: 'self' }))
    renderWithQuery(<UsagePeriodBanner />)
    const shown = await screen.findByRole('complementary', { name: 'Usage period' })
    expect(shown).toHaveTextContent(`Today (${formatDayAndMonth(TODAY)}) is the last day of your usage period.`)
    expect(shown).toHaveTextContent('To renew it, contact STOA: info@stoaedu.ch')
    expect(within(shown).getByRole('link', { name: 'info@stoaedu.ch' })).toHaveAttribute('href', 'mailto:info@stoaedu.ch')
  })

  it('once expired, says the period ended and when', async () => {
    signIn('student')
    mockedEntitlement.mockResolvedValue(entitlement({ endsAt: '2026-11-05', state: 'expired', daysLeft: 0, paidBy: 'parent' }))
    renderWithQuery(<UsagePeriodBanner />)
    const shown = await screen.findByRole('complementary', { name: 'Usage period' })
    expect(shown).toHaveTextContent(`Your usage period ended on ${formatDate('2026-11-05')}.`)
    expect(shown).toHaveAttribute('data-usage-period-banner', 'expired')
  })

  it('says nothing without a period', async () => {
    signIn('student')
    mockedEntitlement.mockResolvedValue(entitlement({ endsAt: null, state: 'none', daysLeft: null, paidBy: null }))
    renderWithQuery(<UsagePeriodBanner />)
    await waitFor(() => expect(mockedEntitlement).toHaveBeenCalled())
    await act(async () => {})
    expect(banner()).toBeNull()
  })

  it('closes for this visit, and shows again when it has something new to say', async () => {
    signIn('student')
    mockedEntitlement.mockResolvedValue(entitlement({ endsAt: '2026-11-12', state: 'active', daysLeft: 3, paidBy: 'parent' }))
    const first = renderWithQuery(<UsagePeriodBanner />)
    await userEvent.click(within(await screen.findByRole('complementary', { name: 'Usage period' })).getByRole('button', { name: 'Hide until next time' }))
    expect(banner()).toBeNull()
    first.unmount()

    // Another page in the same visit: still closed.
    const second = renderWithQuery(<UsagePeriodBanner />)
    await waitFor(() => expect(mockedEntitlement).toHaveBeenCalledTimes(2))
    await act(async () => {})
    expect(banner()).toBeNull()
    second.unmount()

    // The period is over now: that is a new message.
    mockedEntitlement.mockResolvedValue(entitlement({ endsAt: '2026-11-12', state: 'expired', daysLeft: 0, paidBy: 'parent' }))
    renderWithQuery(<UsagePeriodBanner />)
    expect(await screen.findByRole('complementary', { name: 'Usage period' })).toHaveTextContent('Your usage period ended on')
  })

  it('is not shown to a teacher, who has no period to read', async () => {
    signIn('teacher')
    renderWithQuery(<UsagePeriodBanner />)
    await act(async () => {})
    expect(mockedEntitlement).not.toHaveBeenCalled()
    expect(mockedParent).not.toHaveBeenCalled()
    expect(banner()).toBeNull()
  })
})

describe('the parent’s banner', () => {
  it('names the parent’s own account and the day', async () => {
    signIn('parent')
    mockedParent.mockResolvedValue(parentPeriods({ own: { endsAt: '2026-11-14', state: 'active', daysLeft: 5 } }))
    renderWithQuery(<UsagePeriodBanner />)
    const shown = await screen.findByRole('complementary', { name: 'Usage period' })
    expect(shown).toHaveTextContent(`Your usage period ends in 5 days (on ${formatDayAndMonth('2026-11-14')}).`)
    expect(shown).toHaveTextContent('To renew, contact STOA: info@stoaedu.ch')
    expect(within(shown).getByRole('link', { name: 'info@stoaedu.ch' })).toHaveAttribute('href', 'mailto:info@stoaedu.ch')
    expect(mockedEntitlement).not.toHaveBeenCalled()
  })

  it('names the child whose period ends, and says only that another parent pays', async () => {
    signIn('parent')
    mockedParent.mockResolvedValue(
      parentPeriods({
        children: [
          { studentId: 's1', name: 'Ana', endsAt: '2026-11-13', state: 'active', paidBy: 'you' },
          { studentId: 's2', name: 'Ben', endsAt: '2026-11-03', state: 'expired', paidBy: 'other_parent' },
          { studentId: 's3', name: 'Cleo', endsAt: '2027-01-31', state: 'active', paidBy: 'self' },
        ],
      }),
    )
    renderWithQuery(<UsagePeriodBanner />)
    const shown = await screen.findByRole('complementary', { name: 'Usage period' })
    expect(shown).toHaveTextContent(`Ana's usage period ends in 4 days (on ${formatDayAndMonth('2026-11-13')}).`)
    expect(shown).toHaveTextContent(`Ben's usage period ended on ${formatDate('2026-11-03')}. Another parent pays for it.`)
    expect(shown).not.toHaveTextContent('Cleo')
    expect(shown).not.toHaveTextContent('Your usage period')
    // One expired is enough for the banner to read as expired.
    expect(shown).toHaveAttribute('data-usage-period-banner', 'expired')
  })

  it('says nothing when every period is more than a week away', async () => {
    signIn('parent')
    mockedParent.mockResolvedValue(
      parentPeriods({ children: [{ studentId: 's1', name: 'Ana', endsAt: '2026-11-17', state: 'active', paidBy: 'you' }] }),
    )
    renderWithQuery(<UsagePeriodBanner />)
    await waitFor(() => expect(mockedParent).toHaveBeenCalled())
    await act(async () => {})
    expect(banner()).toBeNull()
  })
})

describe('the parent’s Overview lists every period', () => {
  it('the parent’s own and each child’s, with who pays and how near the end is', async () => {
    signIn('parent')
    mockedParent.mockResolvedValue(
      parentPeriods({
        own: { endsAt: '2027-03-31', state: 'active', daysLeft: 142 },
        children: [
          { studentId: 's1', name: 'Ana', endsAt: '2026-11-13', state: 'active', paidBy: 'you' },
          { studentId: 's2', name: 'Ben', endsAt: '2026-11-03', state: 'expired', paidBy: 'other_parent' },
          { studentId: 's3', name: 'Cleo', endsAt: TODAY, state: 'active', paidBy: 'self' },
          { studentId: 's4', name: 'Dan', endsAt: null, state: 'none', paidBy: null },
        ],
      }),
    )
    renderWithQuery(<ParentUsagePeriodGroup />)
    const list = (await screen.findByText('Ana')).closest('[data-usage-periods]') as HTMLElement
    expect(within(list).getByRole('heading', { name: 'Usage periods' })).toBeInTheDocument()
    expect(list).toHaveTextContent(`Until ${formatDate('2027-03-31')}`)
    expect(list).toHaveTextContent(`Until ${formatDate('2026-11-13')} · Paid by you`)
    expect(list).toHaveTextContent('4 days left')
    expect(list).toHaveTextContent(`Ended on ${formatDate('2026-11-03')} · Paid by another parent`)
    expect(list).toHaveTextContent('Expired')
    expect(list).toHaveTextContent("On the child's own account")
    expect(list).toHaveTextContent('Last day today')
    expect(list).toHaveTextContent('No usage period set')
    expect(list).toHaveTextContent('To renew a usage period, contact STOA: info@stoaedu.ch')
  })

  it('says so when the periods cannot be read', async () => {
    signIn('parent')
    mockedParent.mockRejectedValue(new Error('down'))
    renderWithQuery(<ParentUsagePeriodGroup />)
    expect(await screen.findByRole('alert')).toHaveTextContent('The usage periods could not be loaded just now.')
  })
})
