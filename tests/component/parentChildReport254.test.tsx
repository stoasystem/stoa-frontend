/**
 * The parent's weekly report page, in the reader's language (#254).
 *
 * The backend answers every state with an English `message` ("No weekly report
 * is available yet.", "Weekly report generation is still in progress."), and
 * the page used to print it ahead of its own four-language copy, so a German
 * parent read English. The breadcrumb named the child by UUID, and the dates
 * followed the browser's language rather than the app's - with the week's
 * start, a date without a time, shown a day early west of UTC.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import deParent from '@/i18n/locales/de/parent.json'
import enParent from '@/i18n/locales/en/parent.json'
import frParent from '@/i18n/locales/fr/parent.json'
import itParent from '@/i18n/locales/it/parent.json'
import { formatDate, formatDateTime } from '@/lib/formatDateTime'
import { ChildReportPage } from '@/pages/parent/ChildReportPage'
import { useAuthStore, type CurrentUser } from '@/store/authStore'
import type { ParentChildReportDetail, ParentChildReportState } from '@/types/parentReport'

const CHILD_ID = '3f9c2a10-7b1e-4c2d-9a8f-1e2d3c4b5a69'

const state = vi.hoisted(() => ({
  report: undefined as unknown,
  childName: undefined as string | undefined,
}))

vi.mock('@/hooks/notifications/useNotificationsQuery', () => ({
  useNotificationsQuery: () => ({ data: { items: [] }, isLoading: false, isError: false }),
  useUnreadNotificationCountQuery: () => ({ data: 0 }),
  useAdminNotificationsQuery: () => ({ data: { items: [] }, isLoading: false, isError: false }),
  useMarkNotificationReadMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useArchiveNotificationMutation: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/hooks/notifications/useRealtimeNotifications', () => ({
  useRealtimeNotifications: () => ({ status: 'disabled' }),
}))
vi.mock('@/hooks/parent/useChildReportQuery', () => ({
  useChildReportQuery: () => ({ isLoading: false, isError: false, data: state.report }),
}))
vi.mock('@/hooks/parent/useChildLearningSummaryQuery', () => ({
  useChildLearningSummaryQuery: () => ({
    isLoading: false,
    isError: false,
    data: state.childName ? { student: { id: CHILD_ID, name: state.childName } } : undefined,
  }),
}))
vi.mock('@/services/analytics/analyticsClient', () => ({ trackEvent: vi.fn() }))

// What stoa-backend routers/parents.py sends, word for word.
const BACKEND_MISSING = 'No weekly report is available yet.'
const BACKEND_PENDING = 'Weekly report generation is still in progress.'
const BACKEND_FAILED = 'Weekly report generation failed.'

function reportDetail(overrides: Partial<ParentChildReportDetail> = {}): ParentChildReportDetail {
  return {
    reportId: 'report-1',
    parentId: 'parent-1',
    studentId: CHILD_ID,
    weekStart: '2026-10-05',
    weekEnd: '2026-10-11',
    usageCount: 0,
    aiResolved: 0,
    teacherResolved: 0,
    weakKnowledgePoints: [],
    recommendations: '',
    recommendationItems: [],
    stats: { questionsAsked: 0, aiResolved: 0, teacherHelpRequests: 0, practiceLessonsCompleted: 0, mistakesLogged: 0 },
    summary: '',
    strengths: [],
    weakTopics: [],
    generatedAt: null,
    reportStatus: null,
    emailStatus: null,
    ...overrides,
  }
}

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[`/parent/children/${CHILD_ID}/report`]}>
        <Routes>
          <Route path="/parent/children/:childId/report" element={<ChildReportPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

const originalTz = process.env.TZ

beforeEach(async () => {
  await i18n.changeLanguage('de')
  state.report = undefined
  state.childName = undefined
  useAuthStore.setState({
    user: { id: 'parent-1', name: 'Rita Vogt', email: 'rita@example.ch', role: 'parent' } as CurrentUser,
    accessToken: 'token',
    isAuthenticated: true,
  })
})

afterEach(() => {
  process.env.TZ = originalTz
  useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false })
})

describe('the report states speak the reader’s language, not the backend’s', () => {
  it.each([
    ['de', deParent],
    ['en', enParent],
    ['fr', frParent],
    ['it', itParent],
  ] as const)('missing report, %s', async (language, copy) => {
    await i18n.changeLanguage(language)
    state.report = { status: 'missing', report: null, message: BACKEND_MISSING } satisfies ParentChildReportState
    renderPage()

    expect(screen.getByText(copy.report.noReportBody)).toBeInTheDocument()
    if (language !== 'en') expect(screen.queryByText(BACKEND_MISSING)).not.toBeInTheDocument()
  })

  it('a pending report says so once, in German, with no backend English', () => {
    state.report = {
      status: 'pending',
      report: reportDetail({ reportStatus: 'pending' }),
      message: BACKEND_PENDING,
    } satisfies ParentChildReportState
    renderPage()

    expect(screen.queryByText(BACKEND_PENDING)).not.toBeInTheDocument()
    expect(screen.getByText(deParent.report.summaryFallback)).toBeInTheDocument()
    expect(screen.getAllByText(deParent.report.pendingNote)).toHaveLength(1)
  })

  it('a failed report says so in German and does not claim the details are on the way', () => {
    state.report = {
      status: 'failed',
      report: reportDetail({ reportStatus: 'failed' }),
      message: BACKEND_FAILED,
    } satisfies ParentChildReportState
    renderPage()

    expect(screen.queryByText(BACKEND_FAILED)).not.toBeInTheDocument()
    expect(screen.getByText(deParent.report.summaryUnavailable)).toBeInTheDocument()
    expect(screen.queryByText(deParent.report.summaryFallback)).not.toBeInTheDocument()
    expect(screen.getByText(deParent.report.failedNote)).toBeInTheDocument()
  })

  it('every language has the failed-report headline', () => {
    for (const copy of [deParent, enParent, frParent, itParent]) {
      expect(copy.report.summaryUnavailable).toBeTruthy()
    }
  })
})

describe('the breadcrumb names the child', () => {
  it('shows the child’s name, not the id', () => {
    state.childName = 'Nina Vogt'
    state.report = { status: 'missing', report: null, message: BACKEND_MISSING } satisfies ParentChildReportState
    renderPage()

    const crumb = screen.getByRole('link', { name: 'Nina Vogt' })
    expect(crumb).toHaveAttribute('href', `/parent/children/${CHILD_ID}`)
    expect(screen.queryByText(CHILD_ID)).not.toBeInTheDocument()
  })

  it('falls back to “Kind” while the name is not known', () => {
    state.report = { status: 'missing', report: null, message: BACKEND_MISSING } satisfies ParentChildReportState
    renderPage()

    expect(screen.getByRole('link', { name: deParent.child })).toBeInTheDocument()
    expect(screen.queryByText(CHILD_ID)).not.toBeInTheDocument()
  })
})

describe('report dates', () => {
  it('follow the app’s language, not the browser’s', async () => {
    await i18n.changeLanguage('fr')
    state.report = {
      status: 'available',
      report: reportDetail({ summary: 'Bonne semaine.', generatedAt: '2026-10-12T06:30:00Z' }),
    } satisfies ParentChildReportState
    renderPage()

    const week = `${new Intl.DateTimeFormat('fr', { dateStyle: 'medium' }).format(new Date(2026, 9, 5))} - ${new Intl.DateTimeFormat('fr', { dateStyle: 'medium' }).format(new Date(2026, 9, 11))}`
    expect(screen.getByText(week)).toBeInTheDocument()
    expect(screen.getByText(formatDateTime('2026-10-12T06:30:00Z'))).toBeInTheDocument()
    expect(formatDateTime('2026-10-12T06:30:00Z')).toMatch(/oct\. 2026/)
  })

  it('show the week’s first day as that day west of UTC', () => {
    process.env.TZ = 'America/New_York'
    expect(formatDate('2026-10-05')).toBe(
      new Intl.DateTimeFormat('de', { dateStyle: 'medium' }).format(new Date(Date.UTC(2026, 9, 5, 12))),
    )
    expect(formatDate('2026-10-05')).toContain('5.')
    expect(formatDate('2026-10-05')).not.toContain('4.')
  })

  it('keep an instant as an instant', () => {
    process.env.TZ = 'America/New_York'
    // 02:00 UTC on the 5th is still the evening of the 4th in New York.
    expect(formatDate('2026-10-05T02:00:00Z')).toContain('4.')
  })

  it('show an impossible date as a dash rather than rolling into the next month', () => {
    expect(formatDate('2026-02-31')).toBe('—')
  })
})

/**
 * #338: a report still being written, or one that failed, carries placeholder
 * zeros and empty lists and an email status of `not_started`. The page showed
 * them as results ("0 questions", "No weak topics were flagged.") under an
 * English badge "E-Mail not started".
 */
describe('a pending or failed report shows only its status (#338)', () => {
  it.each(['pending', 'failed'] as const)('%s: no metrics, lists or email badge', (status) => {
    state.report = {
      status,
      report: reportDetail({ reportStatus: status, emailStatus: 'not_started' }),
    } satisfies ParentChildReportState
    renderPage()

    expect(screen.getByText(deParent.report.week)).toBeInTheDocument()
    expect(screen.getByText(deParent.report.status[status])).toBeInTheDocument()
    expect(screen.getByText(status === 'pending' ? deParent.report.pendingNote : deParent.report.failedNote)).toBeInTheDocument()

    for (const absent of [
      deParent.report.questions,
      deParent.report.practice,
      deParent.report.teacherHelp,
      deParent.report.weakTopics,
      deParent.report.noWeakTopics,
      deParent.report.recommendations,
      deParent.report.noRecommendations,
    ]) {
      expect(screen.queryByText(absent)).not.toBeInTheDocument()
    }
    expect(screen.queryByText(/E-Mail/)).not.toBeInTheDocument()
    expect(screen.queryByText(/not started/)).not.toBeInTheDocument()
  })

  it('an available report still shows its metrics and lists', () => {
    state.report = {
      status: 'available',
      report: reportDetail({ summary: 'Gute Woche.', emailStatus: 'sent' }),
    } satisfies ParentChildReportState
    renderPage()

    expect(screen.getByText(deParent.report.questions)).toBeInTheDocument()
    expect(screen.getByText(deParent.report.noWeakTopics)).toBeInTheDocument()
    expect(screen.getByText(deParent.report.noRecommendations)).toBeInTheDocument()
    expect(screen.getByText('E-Mail gesendet')).toBeInTheDocument()
  })
})

describe('the email badge never shows a raw backend status (#338)', () => {
  it.each([
    ['de', deParent],
    ['en', enParent],
    ['fr', frParent],
    ['it', itParent],
  ] as const)('not_started reads as translated copy, %s', async (language, copy) => {
    await i18n.changeLanguage(language)
    state.report = {
      status: 'available',
      report: reportDetail({ summary: 'x', emailStatus: 'not_started' }),
    } satisfies ParentChildReportState
    renderPage()

    expect(
      screen.getByText(copy.report.emailBadge.replace('{{status}}', copy.report.emailStatus.notStarted)),
    ).toBeInTheDocument()
    expect(screen.queryByText(/not.started/)).not.toBeInTheDocument()
  })

  it('an unknown status gets a neutral label', () => {
    state.report = {
      status: 'available',
      report: reportDetail({ summary: 'x', emailStatus: 'queued_for_retry' }),
    } satisfies ParentChildReportState
    renderPage()

    expect(screen.getByText(deParent.report.emailBadgeUnknown)).toBeInTheDocument()
    expect(screen.queryByText(/queued/)).not.toBeInTheDocument()
  })
})
