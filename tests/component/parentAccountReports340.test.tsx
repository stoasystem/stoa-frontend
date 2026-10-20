/**
 * #340: the parent's account and reports pages.
 *
 * The 2026-10-20 audit found:
 * - P3: the usage cards on the account page never said which child they
 *   counted; with two children, two "Questions submitted" cards looked alike;
 * - P9: the reports page promised "monthly trends", but the monthly report is
 *   withdrawn (#25);
 * - P11: the dashboard, reports and weekly-report pages said a failed load
 *   only visually, so a screen reader heard nothing.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import deParent from '@/i18n/locales/de/parent.json'
import enParent from '@/i18n/locales/en/parent.json'
import frParent from '@/i18n/locales/fr/parent.json'
import itParent from '@/i18n/locales/it/parent.json'
import { ChildReportPage } from '@/pages/parent/ChildReportPage'
import { ParentAccountOperationsPage } from '@/pages/parent/ParentAccountOperationsPage'
import { ParentDashboardPage } from '@/pages/parent/ParentDashboardPage'
import { ParentReportsPage } from '@/pages/parent/ParentReportsPage'
import type { ParentAccountOperations } from '@/types/parentAccountOperations'

const state = vi.hoisted(() => ({
  children: { isLoading: false, isError: false, data: undefined as unknown },
  accountOps: { isLoading: false, isError: false, data: undefined as unknown },
  report: { isLoading: false, isError: false, data: undefined as unknown },
}))

vi.mock('@/layouts/DashboardLayout', () => ({
  DashboardLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}))
vi.mock('@/services/analytics/analyticsClient', () => ({ trackEvent: vi.fn() }))
vi.mock('@/hooks/parent/useParentChildrenQuery', () => ({
  useParentChildrenQuery: () => state.children,
}))
vi.mock('@/hooks/parent/useParentAccountOperationsQuery', () => ({
  useParentAccountOperationsQuery: () => state.accountOps,
}))
vi.mock('@/hooks/parent/useChildReportQuery', () => ({
  useChildReportQuery: () => state.report,
}))
vi.mock('@/hooks/parent/useChildLearningSummaryQuery', () => ({
  useChildLearningSummaryQuery: () => ({ data: undefined, isLoading: false, isError: false }),
}))

const PARENT = { en: enParent, de: deParent, fr: frParent, it: itParent }
const initialLanguage = i18n.language

function profile(userId: string, name: string) {
  return { userId, name, email: `${userId}@example.ch`, role: 'student' }
}

function usage(studentId: string) {
  return {
    studentId,
    quotaPeriod: '2026-10-18',
    action: 'question_submission',
    consumed: 2,
    limit: 10,
    remaining: 8,
    supportAction: null,
    unreconciled: false,
  }
}

const ACCOUNT_OPS = {
  parentId: 'parent-1',
  parent: { userId: 'parent-1', name: 'Rita Vogt', email: 'rita@example.ch' },
  billing: {},
  children: [
    { studentId: 'child-1', profile: profile('child-1', 'Nina Vogt'), binding: { status: 'active' } },
    { studentId: 'child-2', profile: profile('child-2', 'Luca Vogt'), binding: { status: 'active' } },
  ],
  usage: [usage('child-1'), usage('child-2'), usage('child-gone')],
  supportState: { state: 'ready', blockers: [], warnings: [] },
} as unknown as ParentAccountOperations

function at(path: string, pattern: string, page: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path={pattern} element={page} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(async () => {
  await i18n.changeLanguage('en')
  state.children = { isLoading: false, isError: false, data: { items: [] } }
  state.accountOps = { isLoading: false, isError: false, data: ACCOUNT_OPS }
  state.report = { isLoading: false, isError: false, data: undefined }
})

afterAll(async () => {
  await i18n.changeLanguage(initialLanguage)
})

describe('P3: each usage card names its child', () => {
  for (const [language, parent] of Object.entries(PARENT)) {
    it(`in ${language}`, async () => {
      await i18n.changeLanguage(language)
      at('/parent/account', '/parent/account', <ParentAccountOperationsPage />)

      const section = screen.getByText(parent.accountOps.usageSummary).closest('section') as HTMLElement
      const cards = Array.from(section.querySelectorAll('.stoa-card'))
      expect(cards).toHaveLength(3)
      expect(cards[0]).toHaveTextContent('Nina Vogt')
      expect(cards[1]).toHaveTextContent('Luca Vogt')
      // A child no longer linked reads as "a child", never as the id.
      expect(cards[2]).toHaveTextContent(parent.child)
      expect(section).not.toHaveTextContent('child-gone')
    })
  }
})

describe('P9: the reports page promises no monthly trends', () => {
  const monthly = { en: /monthly/i, de: /Monat/i, fr: /mensuel/i, it: /mensil/i }

  for (const [language, parent] of Object.entries(PARENT)) {
    it(`in ${language}`, async () => {
      await i18n.changeLanguage(language)
      at('/parent/reports', '/parent/reports', <ParentReportsPage />)
      expect(screen.getByText(parent.reports.description)).toBeInTheDocument()
      expect(parent.reports.description).not.toMatch(monthly[language as keyof typeof monthly])
    })
  }
})

describe('P11: a failed load is announced', () => {
  beforeEach(() => i18n.changeLanguage('de'))

  it('on the dashboard', () => {
    state.children = { isLoading: false, isError: true, data: undefined }
    at('/parent', '/parent', <ParentDashboardPage />)
    expect(screen.getByRole('alert')).toHaveTextContent(deParent.loadChildrenFailed)
  })

  it('on the reports page', () => {
    state.children = { isLoading: false, isError: true, data: undefined }
    at('/parent/reports', '/parent/reports', <ParentReportsPage />)
    expect(screen.getByRole('alert')).toHaveTextContent(deParent.loadChildrenFailed)
  })

  it('on the weekly report, under its heading', () => {
    state.report = { isLoading: false, isError: true, data: undefined }
    at('/parent/children/child-1/report', '/parent/children/:childId/report', <ChildReportPage />)
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent(deParent.loadReportFailed)
  })

  it('and loading is announced as a status on all three', () => {
    state.children = { isLoading: true, isError: false, data: undefined }
    state.report = { isLoading: true, isError: false, data: undefined }
    const pages: Array<[string, string, ReactNode]> = [
      ['/parent', '/parent', <ParentDashboardPage key="d" />],
      ['/parent/reports', '/parent/reports', <ParentReportsPage key="r" />],
      ['/parent/children/child-1/report', '/parent/children/:childId/report', <ChildReportPage key="c" />],
    ]
    for (const [path, pattern, page] of pages) {
      const { unmount } = at(path, pattern, page)
      expect(screen.getAllByRole('status').length).toBeGreaterThan(0)
      unmount()
    }
  })
})
