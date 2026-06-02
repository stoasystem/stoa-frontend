import { expect, test, type Page } from '@playwright/test'
import { loginAs } from './helpers'

const childId = 'user-student'

type ReportState =
  | {
      status: 'available'
      report: {
        reportId: string
        parentId: string
        studentId: string
        weekStart: string
        usageCount: number
        aiResolved: number
        teacherResolved: number
        weakKnowledgePoints: string[]
        recommendations: string
      }
      message: null
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
  await expect(page.getByText(/week start|no weekly report yet/i)).toBeVisible()
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

function availableReportState(): ReportState {
  return {
    status: 'available',
    report: {
      reportId: 'report-1',
      parentId: 'user-parent',
      studentId: childId,
      weekStart: '2026-06-01',
      usageCount: 3,
      aiResolved: 2,
      teacherResolved: 1,
      weakKnowledgePoints: ['fractions'],
      recommendations: 'Practice fractions for 15 minutes.',
    },
    message: null,
  }
}
