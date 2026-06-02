import { expect, test, type Page } from '@playwright/test'
import { loginAs } from './helpers'

const childId = 'user-student'

type ReportState =
  | {
      status: 'available' | 'pending' | 'failed'
      report: {
        reportId: string
        parentId: string
        studentId: string
        weekStart: string
        weekEnd?: string | null
        usageCount: number
        aiResolved: number
        teacherResolved: number
        weakKnowledgePoints: string[]
        recommendations: string
        recommendationItems: string[]
        stats: {
          questionsAsked: number
          aiResolved: number
          teacherHelpRequests: number
          practiceLessonsCompleted: number
          mistakesLogged: number
        }
        summary: string
        strengths: string[]
        weakTopics: Array<{ topic: string; note: string }>
        teacherNote?: string | null
        generatedAt?: string | null
        emailStatus?: string | null
        reportStatus?: string | null
        emailErrorClass?: string | null
        emailErrorMessage?: string | null
        generationErrorClass?: string | null
        generationErrorMessage?: string | null
      }
      message: string | null
    }
  | {
      status: 'missing'
      report: null
      message: string
    }

async function routeParentChildren(page: Page, items = [parentChild()]) {
  await page.route('**/parents/me/children', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      json: { items },
    })
  })
}

async function routeParentChildDetails(page: Page, reportState: ReportState = availableReportState()) {
  await page.route(`**/parents/me/children/${childId}/summary`, async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      json: parentSummary(),
    })
  })
  await page.route(`**/parents/me/children/${childId}/history`, async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      json: parentHistory(),
    })
  })
  await page.route(`**/parents/me/children/${childId}/report`, async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      json: reportState,
    })
  })
}

test('parent can view child summary and report', async ({ page }) => {
  await routeParentChildren(page)
  await routeParentChildDetails(page)

  await loginAs(page, 'parent')
  await expect(page).toHaveURL(/\/parent/)
  await expect(page.getByText(/anna keller/i)).toBeVisible()

  await page.getByRole('link', { name: /^summary$/i }).click()
  await expect(page).toHaveURL(/\/parent\/children\/[^/]+$/)
  await expect(page.getByText(/weak topics/i)).toBeVisible()
  await expect(page.getByText(/recent activity/i)).toBeVisible()

  await page.getByRole('link', { name: /learning history/i }).click()
  await expect(page).toHaveURL(/\/parent\/children\/[^/]+\/history/)
  await expect(page.getByRole('heading', { name: /child learning history/i })).toBeVisible()

  await page.goto(`/parent/children/${childId}/report`)

  await expect(page).toHaveURL(/\/parent\/children\/user-student\/report/)
  await expect(page.getByRole('heading', { name: /weekly report/i })).toBeVisible()
  await expect(page.getByText(/anna made steady progress/i)).toBeVisible()
  await expect(page.getByText(/email sent/i)).toBeVisible()
  await expect(page.getByText(/practice fractions for ten minutes/i)).toBeVisible()
  await expect(page.getByText(/review one mistake together/i)).toBeVisible()
  await expect(page.getByText(/review equivalent fractions/i)).toBeVisible()
  await expect(page.getByText('Completed practice.', { exact: true })).toBeVisible()
  await expect(page.getByText(/teacher help was requested/i)).toBeVisible()
  await expect(page.locator('p:text-is("Questions")')).toBeVisible()
  await expect(page.locator('p:text-is("Practice")')).toBeVisible()
  await expect(page.locator('p:text-is("Teacher help")')).toBeVisible()
  await expect(page.locator('p:text-is("Report ID")')).toBeVisible()
  await expect(page.getByText('report-1')).toBeVisible()
})

test('parent dashboard renders no-child empty state', async ({ page }) => {
  await routeParentChildren(page, [])

  await loginAs(page, 'parent')

  await expect(page).toHaveURL(/\/parent/)
  await expect(page.getByText(/no children are linked/i)).toBeVisible()
})

test('parent report renders missing-report state', async ({ page }) => {
  await routeParentChildren(page)
  await routeParentChildDetails(page, {
    status: 'missing',
    report: null,
    message: 'No weekly report is available yet.',
  })

  await loginAs(page, 'parent')
  await page.goto(`/parent/children/${childId}/report`)

  await expect(page.getByRole('heading', { name: /weekly report/i })).toBeVisible()
  await expect(page.getByText(/no weekly report yet/i)).toBeVisible()
  await expect(page.getByText(/no weekly report is available yet/i)).toBeVisible()
})

test('parent report renders email-failed generated state', async ({ page }) => {
  await routeParentChildren(page)
  await routeParentChildDetails(page, availableReportState('email_failed'))

  await loginAs(page, 'parent')
  await page.goto(`/parent/children/${childId}/report`)

  await expect(page.getByRole('heading', { name: /weekly report/i })).toBeVisible()
  await expect(page.getByText(/anna made steady progress/i)).toBeVisible()
  await expect(page.getByText(/email failed/i)).toBeVisible()
  await expect(page.getByText(/email delivery did not complete/i)).toBeVisible()
})

test('parent report renders generation pending state', async ({ page }) => {
  await routeParentChildren(page)
  await routeParentChildDetails(page, pendingReportState())

  await loginAs(page, 'parent')
  await page.goto(`/parent/children/${childId}/report`)

  await expect(page.getByRole('heading', { name: /weekly report/i })).toBeVisible()
  await expect(page.getByText('Generation pending', { exact: true })).toBeVisible()
  await expect(page.getByText('Weekly report generation is still in progress.', { exact: true })).toHaveCount(2)
})

test('parent report renders generation failed state', async ({ page }) => {
  await routeParentChildren(page)
  await routeParentChildDetails(page, failedReportState())

  await loginAs(page, 'parent')
  await page.goto(`/parent/children/${childId}/report`)

  await expect(page.getByRole('heading', { name: /weekly report/i })).toBeVisible()
  await expect(page.getByText('Generation failed', { exact: true })).toBeVisible()
  await expect(page.getByText('Weekly report generation failed.', { exact: true })).toHaveCount(2)
  await expect(page.getByText(/runtimeerror|generation failed raw/i)).toHaveCount(0)
})

function parentChild() {
  return {
    id: childId,
    userId: childId,
    name: 'Anna Keller',
    email: 'student@test.com',
    grade: 'Grade 8',
    subjects: ['Mathematics', 'Physics'],
    relationship: 'child',
  }
}

function parentSummary() {
  return {
    student: { id: childId, name: 'Anna Keller', grade: 'Grade 8' },
    questionsAskedThisWeek: 2,
    aiResolvedThisWeek: 1,
    teacherHelpRequestsThisWeek: 1,
    practiceLessonsCompletedThisWeek: 1,
    weakTopics: ['fractions'],
    recentActivity: [
      {
        id: 'activity-1',
        type: 'question',
        title: 'Question answered',
        summary: 'Reviewed fraction simplification.',
        subject: 'Mathematics',
        createdAt: '2026-06-02T10:00:00Z',
      },
    ],
  }
}

function parentHistory() {
  return {
    items: [
      {
        id: 'history-1',
        type: 'practice',
        title: 'Practice lesson completed',
        summary: 'Completed a fractions lesson.',
        subject: 'Mathematics',
        createdAt: '2026-06-02T09:00:00Z',
      },
    ],
  }
}

function availableReportState(status: 'email_sent' | 'email_failed' = 'email_sent'): ReportState {
  return {
    status: 'available',
    report: {
      reportId: 'report-1',
      parentId: 'user-parent',
      studentId: childId,
      weekStart: '2026-06-01',
      weekEnd: '2026-06-07',
      usageCount: 4,
      aiResolved: 3,
      teacherResolved: 1,
      weakKnowledgePoints: ['fractions'],
      recommendations: 'Practice fractions for ten minutes.',
      recommendationItems: ['Practice fractions for ten minutes.', 'Review one mistake together.'],
      stats: {
        questionsAsked: 4,
        aiResolved: 3,
        teacherHelpRequests: 1,
        practiceLessonsCompleted: 2,
        mistakesLogged: 1,
      },
      summary: 'Anna made steady progress this week.',
      strengths: ['Completed practice.'],
      weakTopics: [{ topic: 'fractions', note: 'Review equivalent fractions.' }],
      teacherNote: 'Teacher help was requested.',
      generatedAt: '2026-06-08T06:00:00+00:00',
      emailStatus: status === 'email_failed' ? 'failed' : 'sent',
      reportStatus: status,
      emailErrorClass: status === 'email_failed' ? 'MessageRejected' : null,
      emailErrorMessage: status === 'email_failed' ? 'SES rejected recipient' : null,
    },
    message: null,
  }
}

function pendingReportState(): ReportState {
  const state = availableReportState('email_sent')
  return {
    status: 'pending',
    report: {
      ...state.report!,
      summary: '',
      strengths: [],
      weakTopics: [],
      recommendationItems: [],
      recommendations: '',
      generatedAt: null,
      emailStatus: 'not_started',
      reportStatus: 'generation_claimed',
    },
    message: 'Weekly report generation is still in progress.',
  }
}

function failedReportState(): ReportState {
  const state = availableReportState('email_sent')
  return {
    status: 'failed',
    report: {
      ...state.report!,
      summary: '',
      strengths: [],
      weakTopics: [],
      recommendationItems: [],
      recommendations: '',
      generatedAt: null,
      emailStatus: 'not_started',
      reportStatus: 'generation_failed',
      generationErrorClass: 'RuntimeError',
      generationErrorMessage: null,
    },
    message: 'Weekly report generation failed.',
  }
}
