/**
 * #411: a parent who opened a child's weekly report or progress page from
 * Reports found the bar lighting Overview, the breadcrumb starting at the
 * dashboard, and Back leading to the child's summary, a page they had not
 * been on. Reports' rows now say where they were opened from
 * (`?from=reports`), and the child's pages use it for the lit segment, the
 * breadcrumb and Back. Opened from Overview, nothing changes.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { shellNavigationFor, activeNavIndex } from '@/components/shell/shellNavigation'
import { FROM_REPORTS } from '@/hooks/parent/useReportsTrail'
import i18n from '@/i18n'
import enCommon from '@/i18n/locales/en/common.json'
import deParent from '@/i18n/locales/de/parent.json'
import enParent from '@/i18n/locales/en/parent.json'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { ChildLearningHistoryPage } from '@/pages/parent/ChildLearningHistoryPage'
import { ChildReportPage } from '@/pages/parent/ChildReportPage'
import { ChildSummaryPage } from '@/pages/parent/ChildSummaryPage'
import { ParentChildProgressPage } from '@/pages/parent/ParentChildProgressPage'
import { ParentReportsPage } from '@/pages/parent/ParentReportsPage'
import { type CurrentUser, useAuthStore } from '@/store/authStore'
import type { ChildLearningSummary, ParentChild } from '@/types/parent'

vi.mock('@/hooks/notifications/useNotificationsQuery', () => ({
  useNotificationsQuery: () => ({ data: { items: [] }, isLoading: false, isError: false }),
  useUnreadNotificationCountQuery: () => ({ data: 0 }),
  useMarkNotificationReadMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useArchiveNotificationMutation: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/hooks/notifications/useRealtimeNotifications', () => ({
  useRealtimeNotifications: () => ({ status: 'disabled' }),
}))

const CHILD: ParentChild = {
  id: 'child-1',
  userId: 'u-child-1',
  name: 'Nina Vogt',
  email: 'nina@example.com',
  grade: '7',
  subjects: ['math'],
  relationship: 'parent',
}
const SUMMARY: ChildLearningSummary = {
  student: { id: 'child-1', name: 'Nina Vogt', grade: '7' },
  questionsAskedThisWeek: 3,
  aiResolvedThisWeek: 2,
  teacherHelpRequestsThisWeek: 1,
  practiceLessonsCompletedThisWeek: 4,
  weakTopics: [],
  recentActivity: [],
}

vi.mock('@/hooks/parent/useParentChildrenQuery', () => ({
  useParentChildrenQuery: () => ({ isLoading: false, isError: false, data: { items: [CHILD] } }),
}))
vi.mock('@/hooks/parent/useChildLearningSummaryQuery', () => ({
  useChildLearningSummaryQuery: () => ({ isLoading: false, isError: false, data: SUMMARY }),
}))
vi.mock('@/hooks/parent/useChildLearningProfileQuery', () => ({
  useChildLearningProfileQuery: () => ({ isLoading: false, isError: false, data: undefined }),
}))
vi.mock('@/hooks/parent/useChildLearningHistoryQuery', () => ({
  useChildLearningHistoryQuery: () => ({ isLoading: false, isError: false, data: { items: [] } }),
}))
vi.mock('@/hooks/parent/useChildReportQuery', () => ({
  useChildReportQuery: () => ({ isLoading: false, isError: false, data: { status: 'missing', report: null, message: '' } }),
}))
vi.mock('@/hooks/learning/useLearningOperationsQueries', () => ({
  useParentChildProgressQuery: () => ({ isLoading: false, error: null, data: undefined }),
}))

function Where() {
  const { pathname, search } = useLocation()
  return <output data-where>{pathname + search}</output>
}
const where = () => document.querySelector('[data-where]')!.textContent

function renderAt(path: string) {
  return render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/parent" element={<DashboardLayout><h1>Overview page</h1></DashboardLayout>} />
            <Route path="/parent/reports" element={<ParentReportsPage />} />
            <Route path="/parent/children/:childId" element={<ChildSummaryPage />} />
            <Route path="/parent/children/:childId/report" element={<ChildReportPage />} />
            <Route path="/parent/children/:childId/progress" element={<ParentChildProgressPage />} />
            <Route path="/parent/children/:childId/history" element={<ChildLearningHistoryPage />} />
          </Routes>
          <Where />
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  )
}

const segments = () => within(screen.getByRole('navigation', { name: enCommon.navigation.primary }))
const lit = () => segments().getAllByRole('link').filter((link) => link.getAttribute('aria-current') === 'page').map((link) => link.textContent)
const crumbs = () => within(screen.getByRole('navigation', { name: enCommon.a11y.breadcrumb }))
/** The page's own Back, not the bar's segment or a breadcrumb of the same name. */
const back = (name: string) => {
  const links = screen.getAllByRole('link', { name }).filter((link) => !link.closest('nav'))
  expect(links).toHaveLength(1)
  return links[0]
}
const row = (title: string) => screen.getByRole('link', { name: new RegExp(`^${title}`) })

beforeEach(async () => {
  await i18n.changeLanguage('en')
  useAuthStore.setState({
    user: { id: 'p-1', name: 'Paula Vogt', email: 'paula@example.com', role: 'parent' } as CurrentUser,
    accessToken: 'token',
    isAuthenticated: true,
  })
})
afterEach(() => useAuthStore.setState({ user: null, accessToken: null, isAuthenticated: false }))

describe('a child’s page opened from Reports (#411)', () => {
  it.each([
    { title: enParent.weeklyReport, path: '/parent/children/child-1/report' },
    { title: enParent.reports.progressLink, path: '/parent/children/child-1/progress' },
  ])('$title keeps Reports lit, starts the breadcrumb there and leads back there', ({ title, path }) => {
    renderAt('/parent/reports')
    expect(lit()).toEqual([enCommon.navigation.reports])

    fireEvent.click(row(title))
    expect(where()).toBe(`${path}?from=reports`)

    expect(lit()).toEqual([enCommon.navigation.reports])
    expect(crumbs().getByRole('link', { name: enParent.reports.title })).toHaveAttribute('href', '/parent/reports')
    expect(crumbs().queryByRole('link', { name: enParent.dashboardTitle })).toBeNull()
    expect(crumbs().getByRole('link', { name: SUMMARY.student.name })).toHaveAttribute(
      'href',
      '/parent/children/child-1?from=reports',
    )
    expect(screen.queryByRole('link', { name: enParent.childSummary })).toBeNull()

    fireEvent.click(back(enParent.reports.title))
    expect(where()).toBe('/parent/reports')
    expect(lit()).toEqual([enCommon.navigation.reports])
  })

  it('the child’s summary too, and its links keep the trail', () => {
    renderAt('/parent/reports')

    fireEvent.click(row(enParent.reports.summary))
    expect(where()).toBe('/parent/children/child-1?from=reports')
    expect(lit()).toEqual([enCommon.navigation.reports])
    expect(crumbs().getByRole('link', { name: enParent.reports.title })).toHaveAttribute('href', '/parent/reports')
    expect(back(enParent.reports.title)).toHaveAttribute('href', '/parent/reports')

    for (const page of ['report', 'history', 'progress']) {
      const link = screen.getAllByRole('link').find((candidate) => candidate.getAttribute('href')?.startsWith(`/parent/children/child-1/${page}`))
      expect(link, page).toHaveAttribute('href', `/parent/children/child-1/${page}?from=reports`)
    }

    fireEvent.click(screen.getByRole('link', { name: enParent.summary.learningHistoryLink }))
    expect(lit()).toEqual([enCommon.navigation.reports])
    expect(crumbs().getByRole('link', { name: enParent.reports.title })).toHaveAttribute('href', '/parent/reports')
    // The history is reached from the summary only: Back stays the summary, on the trail.
    expect(back(enParent.childSummary)).toHaveAttribute('href', '/parent/children/child-1?from=reports')
  })

  it('says Back in the reader’s language', async () => {
    await i18n.changeLanguage('de')
    renderAt('/parent/children/child-1/report?from=reports')

    expect(back(deParent.reports.title)).toHaveAttribute('href', '/parent/reports')
  })
})

describe('a child’s page opened from Overview stays Overview’s', () => {
  it.each(['report', 'progress'])('the %s page', (page) => {
    renderAt(`/parent/children/child-1/${page}`)

    expect(lit()).toEqual([enCommon.navigation.overview])
    expect(crumbs().getByRole('link', { name: enParent.dashboardTitle })).toHaveAttribute('href', '/parent')
    expect(back(enParent.childSummary)).toHaveAttribute('href', '/parent/children/child-1')
  })

  it('the summary', () => {
    renderAt('/parent/children/child-1')

    expect(lit()).toEqual([enCommon.navigation.overview])
    expect(back(enParent.summary.backLabel)).toHaveAttribute('href', '/parent')
    expect(screen.getByRole('link', { name: enParent.summary.weeklyReportLink })).toHaveAttribute(
      'href',
      '/parent/children/child-1/report',
    )
  })
})

describe('the lit segment reads `?from=` off the manifest', () => {
  const navigation = shellNavigationFor('parent')
  const items = navigation.kind === 'segmented' ? navigation.items : []
  const reports = items.findIndex((item) => item.path === '/parent/reports')
  const overview = items.findIndex((item) => item.path === '/parent')

  it('names Reports’ marker on its manifest entry', () => {
    expect(items[reports]?.from).toBe(FROM_REPORTS)
  })

  it('lights the entry a page was opened from', () => {
    expect(activeNavIndex(items, '/parent/children/child-1/report', 'parent', '?from=reports')).toBe(reports)
    expect(activeNavIndex(items, '/parent/children/child-1/report', 'parent', '')).toBe(overview)
  })

  it('leaves an entry’s own page its own, and an unknown marker unread', () => {
    expect(activeNavIndex(items, '/parent', 'parent', '?from=reports')).toBe(overview)
    expect(activeNavIndex(items, '/parent/children/child-1', 'parent', '?from=somewhere')).toBe(overview)
  })
})
