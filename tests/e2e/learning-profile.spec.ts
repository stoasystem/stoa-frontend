import { expect, test, type Page } from '@playwright/test'
import { loginAs } from './helpers'

const childId = 'user-student'

test('student can view learning expansion signals and choose a subject for a question', async ({ page }) => {
  await loginAs(page, 'student')
  await page.goto('/profile')

  await expect(page.getByRole('heading', { name: /learning expansion/i })).toBeVisible()
  await expect(page.getByText(/physics/i).first()).toBeVisible()
  await expect(page.getByText(/foundation profile support/i).first()).toBeVisible()
  await expect(page.getByText(/newton's laws/i)).toBeVisible()

  await page.goto('/chat')
  await expect(page.getByText(/subject for this question/i)).toBeVisible()
  await page.getByRole('button', { name: /physics foundation/i }).click()
  await expect(page.getByRole('button', { name: /physics foundation/i })).toHaveAttribute('aria-pressed', 'true')

  await page.goto('/practice')
  await expect(page.getByRole('heading', { name: /curriculum rollout/i })).toBeVisible()
  await expect(page.getByText(/math, physics, german, and english rollout/i)).toBeVisible()
  await expect(page.getByText(/lesson bank sample/i)).toBeVisible()
})

test('parent can view child subject profile signals', async ({ page }) => {
  await routeParentChildren(page)
  await routeParentChildDetails(page)

  await loginAs(page, 'parent')
  await page.goto(`/parent/children/${childId}`)

  await expect(page.getByRole('heading', { name: /subject profile/i })).toBeVisible()
  await expect(page.getByText(/parent-visible subject signals/i)).toBeVisible()
  await expect(page.getByText('German', { exact: true }).first()).toBeVisible()
  await expect(page.getByText(/cases and articles/i).first()).toBeVisible()
  await expect(page.getByRole('heading', { name: /curriculum rollout/i })).toBeVisible()
  await expect(page.getByText(/parent-visible curriculum coverage/i)).toBeVisible()
})

async function routeParentChildren(page: Page) {
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
            subjects: ['Mathematics', 'German'],
            relationship: 'child',
          },
        ],
      },
    })
  })
}

async function routeParentChildDetails(page: Page) {
  await page.route(`**/parents/me/children/${childId}/summary`, async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      json: {
        student: { id: childId, name: 'Anna Keller', grade: 'Grade 8' },
        questionsAskedThisWeek: 3,
        aiResolvedThisWeek: 2,
        teacherHelpRequestsThisWeek: 1,
        practiceLessonsCompletedThisWeek: 1,
        weakTopics: ['German cases'],
        recentActivity: [
          {
            id: 'activity-1',
            type: 'question',
            title: 'Question answered',
            summary: 'Reviewed article endings.',
            subject: 'German',
            createdAt: '2026-06-02T10:00:00Z',
          },
        ],
      },
    })
  })
  await page.route(`**/parents/me/children/${childId}/learning-profile`, async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      json: {
        studentId: childId,
        subjects: [
          { id: 'math', label: 'Mathematics', rolloutState: 'active' },
          { id: 'physics', label: 'Physics', rolloutState: 'foundation' },
          { id: 'german', label: 'German', rolloutState: 'foundation' },
          { id: 'english', label: 'English', rolloutState: 'foundation' },
        ],
        subjectActivity: [
          {
            subject: 'german',
            label: 'German',
            rolloutState: 'foundation',
            questionCount: 4,
            aiResolvedCount: 3,
            teacherEscalationCount: 1,
            feedbackAverage: 3.8,
          },
        ],
        weakTopics: [
          {
            subject: 'german',
            topicId: 'cases-and-articles',
            label: 'Cases and articles',
            count: 3,
            latestEvidenceAt: '2026-06-05T12:00:00Z',
            evidenceQuestionIds: ['question-german-1'],
          },
        ],
        strengthTopics: [],
        updatedAt: '2026-06-05T12:00:00Z',
      },
    })
  })
}
