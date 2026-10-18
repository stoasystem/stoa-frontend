/**
 * The child page, the child's history and the usage cards on the parent
 * account page speak the parent's language (#255).
 *
 * The 2026-10-18 audit found, on a German screen:
 * - "Weekly report" and "Learning history" as the two buttons on the child
 *   page, the main page per child;
 * - activity types as their codes with spaces ("PRACTICE MISTAKE") and
 *   subjects as their ids ("math"), on the child page and in the history;
 * - usage cards titled "Question submission" (a title-cased code), the quota
 *   period as a bare "2026-10-18", and "Support: Review stale counter".
 *
 * A code the frontend has never seen reads as a generic phrase in the
 * parent's language, never as the code.
 */
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import { ChildLearningHistoryList } from '@/components/parent/ChildLearningHistoryList'
import { getQuotaPeriodLabel } from '@/components/parent/accountOperationsView'
import deParent from '@/i18n/locales/de/parent.json'
import enParent from '@/i18n/locales/en/parent.json'
import frParent from '@/i18n/locales/fr/parent.json'
import itParent from '@/i18n/locales/it/parent.json'
import { ChildSummaryPage } from '@/pages/parent/ChildSummaryPage'
import { ParentAccountOperationsPage } from '@/pages/parent/ParentAccountOperationsPage'
import type { ChildLearningSummary } from '@/types/parent'
import type { ParentAccountOperations } from '@/types/parentAccountOperations'

const fixtures = vi.hoisted(() => ({
  summary: undefined as unknown,
  accountOps: undefined as unknown,
}))

vi.mock('@/layouts/DashboardLayout', () => ({
  DashboardLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}))
vi.mock('@/hooks/parent/useChildLearningSummaryQuery', () => ({
  useChildLearningSummaryQuery: () => ({ data: fixtures.summary, isLoading: false, isError: false }),
}))
vi.mock('@/hooks/parent/useChildLearningProfileQuery', () => ({
  useChildLearningProfileQuery: () => ({ data: undefined, isLoading: false, isError: false }),
}))
vi.mock('@/hooks/practice/useCurriculumCatalogQuery', () => ({
  useCurriculumCatalogQuery: () => ({ data: undefined, isLoading: false, isError: false }),
}))
vi.mock('@/hooks/parent/useParentAccountOperationsQuery', () => ({
  useParentAccountOperationsQuery: () => ({ data: fixtures.accountOps, isLoading: false, isError: false }),
}))

const PARENT = { de: deParent, en: enParent, fr: frParent, it: itParent }

// Every activity type report_service.py and routers/parents.py put on a child's activity.
const BACKEND_ACTIVITY_TYPES = ['question', 'conversation', 'teacher_help', 'practice', 'practice_mistake', 'report']

// Every action usage_ledger_service.py defines, and every support action its
// reconciliation can attach to a usage summary.
const BACKEND_USAGE_ACTIONS = [
  'question_submission', 'chat_message', 'hint_request',
  'question_teacher_help_request', 'conversation_teacher_help_request', 'practice_teacher_help_request',
  'practice_answer', 'practice_lesson_completion', 'practice_quiz_answer',
  'assignment_started', 'assignment_completed', 'assignment_skipped', 'assignment_archived',
  'reviewed_assignment_generation',
]
const BACKEND_USAGE_SUPPORT_ACTIONS = [
  'none', 'review_if_disputed', 'review_counter_and_entitlement', 'review_stale_counter',
  'review_counter_without_ledger', 'review_ledger_without_counter', 'review_count_mismatch',
]

function activity(id: string, type: string, subject: string | null) {
  return { id, type, title: `Title ${id}`, summary: `Summary ${id}`, subject, createdAt: '2026-10-17T09:00:00Z' }
}

const SUMMARY: ChildLearningSummary = {
  student: { id: 'child-1', name: 'Nina Vogt', grade: '7' },
  questionsAskedThisWeek: 3,
  aiResolvedThisWeek: 2,
  teacherHelpRequestsThisWeek: 1,
  practiceLessonsCompletedThisWeek: 4,
  weakTopics: [],
  recentActivity: [
    activity('a1', 'practice_mistake', 'math'),
    activity('a2', 'teacher_help', 'physics'),
    activity('a3', 'brand_new_kind', null),
  ],
}

function usage(action: string, quotaPeriod: string, supportAction: string | null) {
  return {
    studentId: 'child-1',
    quotaPeriod,
    action,
    consumed: 2,
    limit: 10,
    remaining: 8,
    supportAction,
    unreconciled: supportAction !== 'none',
  }
}

const ACCOUNT_OPS = {
  parentId: 'parent-1',
  parent: { userId: 'parent-1', name: 'Rita Vogt', email: 'rita@example.ch' },
  billing: {},
  children: [],
  usage: [
    usage('question_submission', '2026-10-18', 'review_stale_counter'),
    usage('something_new', 'week-42', 'escalate_somewhere'),
  ],
  supportState: { state: 'ready', blockers: [], warnings: [] },
} as unknown as ParentAccountOperations

function renderChildPage() {
  return render(
    <MemoryRouter initialEntries={['/parent/children/child-1']}>
      <Routes>
        <Route path="/parent/children/:childId" element={<ChildSummaryPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

function renderAccountPage() {
  return render(
    <MemoryRouter>
      <ParentAccountOperationsPage />
    </MemoryRouter>,
  )
}

/** No raw code, title-cased code or spaced-out code anywhere on the page. */
function expectNoCode(code: string) {
  const spaced = code.replace(/_/g, ' ')
  const body = document.body.textContent ?? ''
  expect(body).not.toContain(code)
  expect(body.toLowerCase()).not.toContain(spaced.toLowerCase())
}

beforeEach(async () => {
  fixtures.summary = SUMMARY
  fixtures.accountOps = ACCOUNT_OPS
  await i18n.changeLanguage('de')
})

afterAll(async () => {
  await i18n.changeLanguage('en')
})

describe('every code the backend sends has a name in every language', () => {
  it.each(Object.entries(PARENT))('%s names every activity type', (language, bundle) => {
    const types = (bundle as unknown as { activityTypes: Record<string, string> }).activityTypes
    const missing = [...BACKEND_ACTIVITY_TYPES, 'unknown'].filter((code) => typeof types?.[code] !== 'string')
    expect(missing, language).toEqual([])
  })

  it.each(Object.entries(PARENT))('%s names every usage action and support action', (language, bundle) => {
    const ops = (bundle as unknown as {
      accountOps: { usageActions: Record<string, string>; usageSupportActions: Record<string, string> }
    }).accountOps
    const missing = [
      ...[...BACKEND_USAGE_ACTIONS, 'unknown'].filter((code) => typeof ops.usageActions?.[code] !== 'string'),
      ...[...BACKEND_USAGE_SUPPORT_ACTIONS, 'unknown'].filter(
        (code) => typeof ops.usageSupportActions?.[code] !== 'string',
      ),
    ]
    expect(missing, language).toEqual([])
  })
})

describe('the child page', () => {
  it('names its two buttons in German', () => {
    renderChildPage()

    expect(screen.getByRole('link', { name: deParent.summary.weeklyReportLink })).toHaveAttribute(
      'href',
      '/parent/children/child-1/report',
    )
    expect(screen.getByRole('link', { name: deParent.summary.learningHistoryLink })).toHaveAttribute(
      'href',
      '/parent/children/child-1/history',
    )
    expect(screen.queryByText('Weekly report')).toBeNull()
    expect(screen.queryByText('Learning history')).toBeNull()
  })

  it('names activity types and subjects in German, and an unknown type generically', () => {
    renderChildPage()

    expect(screen.getByText(deParent.activityTypes.practice_mistake)).toBeInTheDocument()
    expect(screen.getByText(deParent.activityTypes.teacher_help)).toBeInTheDocument()
    expect(screen.getByText(deParent.activityTypes.unknown)).toBeInTheDocument()
    expect(screen.getByText('Mathematik')).toBeInTheDocument()
    expect(screen.getByText('Physik')).toBeInTheDocument()
    expectNoCode('practice_mistake')
    expectNoCode('teacher_help')
    expectNoCode('brand_new_kind')
    expect(screen.queryByText('math')).toBeNull()
  })

  it('names its buttons and activity in French too', async () => {
    await i18n.changeLanguage('fr')
    renderChildPage()

    expect(screen.getByRole('link', { name: frParent.summary.weeklyReportLink })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: frParent.summary.learningHistoryLink })).toBeInTheDocument()
    expect(screen.getByText(frParent.activityTypes.practice_mistake)).toBeInTheDocument()
    expect(screen.getByText('Mathématiques')).toBeInTheDocument()
    expectNoCode('practice_mistake')
  })
})

describe('the child learning history', () => {
  it('names activity types and subjects in German', () => {
    render(
      <ChildLearningHistoryList
        items={[activity('h1', 'practice_mistake', 'math'), activity('h2', 'brand_new_kind', 'physics')]}
      />,
    )

    expect(screen.getByText(deParent.activityTypes.practice_mistake)).toBeInTheDocument()
    expect(screen.getByText(deParent.activityTypes.unknown)).toBeInTheDocument()
    expect(screen.getByText('Mathematik')).toBeInTheDocument()
    expect(screen.getByText('Physik')).toBeInTheDocument()
    expectNoCode('practice_mistake')
    expectNoCode('brand_new_kind')
    expect(screen.queryByText('math')).toBeNull()
  })
})

describe('the usage cards on the parent account page', () => {
  it('name the action, the day and the support action in German', () => {
    renderAccountPage()

    expect(screen.getByText(deParent.accountOps.usageActions.question_submission)).toBeInTheDocument()
    expect(screen.getByText('Tageslimit für den 18.10.2026')).toBeInTheDocument()
    expect(
      screen.getByText(
        deParent.accountOps.support.replace('{{action}}', deParent.accountOps.usageSupportActions.review_stale_counter),
      ),
    ).toBeInTheDocument()
    expectNoCode('question_submission')
    expectNoCode('review_stale_counter')
    expect(screen.queryByText('2026-10-18')).toBeNull()
  })

  it('name an unknown action, period and support action generically', () => {
    renderAccountPage()

    expect(screen.getByText(deParent.accountOps.usageActions.unknown)).toBeInTheDocument()
    expect(screen.getByText(deParent.accountOps.quotaPeriodUnknown)).toBeInTheDocument()
    expect(
      screen.getByText(
        deParent.accountOps.support.replace('{{action}}', deParent.accountOps.usageSupportActions.unknown),
      ),
    ).toBeInTheDocument()
    expectNoCode('something_new')
    expectNoCode('escalate_somewhere')
    expect(screen.queryByText('week-42')).toBeNull()
  })

  it('name the action, the day and the support action in Italian too', async () => {
    await i18n.changeLanguage('it')
    renderAccountPage()

    expect(screen.getByText(itParent.accountOps.usageActions.question_submission)).toBeInTheDocument()
    expect(screen.getByText('Limite giornaliero del 18 ott 2026')).toBeInTheDocument()
    expect(
      screen.getByText(
        itParent.accountOps.support.replace('{{action}}', itParent.accountOps.usageSupportActions.review_stale_counter),
      ),
    ).toBeInTheDocument()
    expectNoCode('question_submission')
  })
})

describe('the quota period', () => {
  it('is the UTC day it names, even west of Greenwich', () => {
    const zone = process.env.TZ
    process.env.TZ = 'America/Los_Angeles'
    try {
      expect(getQuotaPeriodLabel('2026-10-18', i18n.t, 'de')).toBe('Tageslimit für den 18.10.2026')
    } finally {
      if (zone === undefined) delete process.env.TZ
      else process.env.TZ = zone
    }
  })
})
