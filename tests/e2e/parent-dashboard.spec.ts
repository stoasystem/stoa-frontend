import { expect, test } from '@playwright/test'
import { loginAs } from './helpers'

const childId = 'user-student'

test('parent can view child summary and report', async ({ page }) => {
  await page.route('**/parents/me/children', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      json: {
        items: [
          {
            id: childId,
            userId: childId,
            name: 'Anna Keller',
            email: 'student@test.com',
            grade: 'Grade 8',
            subjects: ['Mathematics', 'Physics'],
            relationship: 'child',
          },
        ],
      },
    })
  })
  await page.route(`**/parents/me/children/${childId}/summary`, async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      json: {
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
      },
    })
  })
  await page.route(`**/parents/me/children/${childId}/history`, async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      json: {
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
      },
    })
  })
  await page.route(`**/parents/me/children/${childId}/report`, async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      json: {
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
      },
    })
  })

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
