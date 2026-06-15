import { expect, test, type Page } from '@playwright/test'
import { loginAs } from './helpers'

const studentId = 'student-ops-1'

test('admin can preview and execute assignment automation from learning console', async ({ page }) => {
  await routeAutomationConsole(page)
  await loginAs(page, 'admin')
  await page.goto('/admin/learning-automation')

  await expect(page.getByRole('heading', { name: /automation review console/i })).toBeVisible()
  await page.getByLabel(/student id/i).fill(studentId)
  await page.getByRole('button', { name: /preview candidates/i }).click()

  await expect(page.getByText(/fractions recovery set/i)).toBeVisible()
  await expect(page.getByText(/policy maximum selected assignments/i)).toBeVisible()

  await page.getByRole('button', { name: /execute approved batch/i }).click()
  await expect(page.getByText(/reviewed assignment created/i)).toBeVisible()
  await expect(page.getByText(/assignment history/i)).toBeVisible()
})

test('admin can inspect learning operations dashboard states', async ({ page }) => {
  await routeLearningOperations(page)
  await loginAs(page, 'admin')
  await page.goto('/admin/learning-operations')

  await expect(page.getByRole('heading', { name: /operations dashboard/i })).toBeVisible()
  await expect(page.getByText(/quality hotspots/i)).toBeVisible()
  await expect(page.getByText(/fractions-practice-v2/i)).toBeVisible()
  await expect(page.getByText(/no live warehouse is configured/i)).toBeVisible()
  await expect(page.getByText(/export summary/i)).toBeVisible()
})

test('student and parent see role-safe assignment explanations', async ({ page }) => {
  await routeStudentAssignments(page)
  await loginAs(page, 'student')
  await page.goto('/assignments')

  await expect(page.getByRole('heading', { name: /my assignments/i })).toBeVisible()
  await expect(page.getByText(/automation-created practice/i)).toBeVisible()
  await expect(page.getByText(/tutor-approved practice was assigned/i)).toBeVisible()
  await expect(page.getByText(/answer key/i)).toHaveCount(0)

  await routeParentProgress(page)
  await loginAs(page, 'parent')
  await page.goto(`/parent/children/${studentId}/progress`)

  await expect(page.getByRole('heading', { name: /assignment explanations/i })).toBeVisible()
  await expect(page.getByText(/assigned practice/i)).toBeVisible()
  await expect(page.getByText(/tutor-approved practice was assigned/i)).toBeVisible()
  await expect(page.getByText(/ranking/i)).toHaveCount(0)
})

async function routeAutomationConsole(page: Page) {
  await page.route(`**/adaptive/students/${studentId}/assignments?includeArchived=true`, async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      json: {
        items: [
          assignmentFixture({
            assignmentId: 'assignment-existing',
            title: 'Existing equation practice',
            status: 'assigned',
          }),
        ],
        count: 1,
      },
    })
  })
  await page.route(`**/adaptive/students/${studentId}/assignment-automation/batches/preview`, async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      json: {
        batchId: 'batch-1',
        policyId: 'policy-1',
        studentId,
        createdBy: 'admin-1',
        createdAt: '2026-06-15T10:00:00Z',
        status: 'preview',
        reviewRequired: true,
        autonomousDecision: false,
        policy: {
          policyId: 'policy-1',
          status: 'active',
          autonomyLevel: 'tutor_approved_batch',
          sourceTypes: ['ai_draft', 'curriculum_exercise'],
          maxAssignmentsPerStudent: 1,
          confidenceThreshold: 'medium',
          freshnessDays: 14,
          dueInDays: 7,
          deliveryMode: 'assigned',
        },
        selected: [
          candidateFixture({
            candidateId: 'candidate-1',
            title: 'Fractions recovery set',
          }),
        ],
        refused: [
          candidateFixture({
            candidateId: 'candidate-2',
            title: 'Linear equations duplicate',
            refusalCode: 'max_assignments_reached',
            refusalReason: 'Policy maximum selected assignments for this student was reached.',
          }),
        ],
        summary: {
          selectedCount: 1,
          refusedCount: 1,
          topTopics: ['fractions'],
          duplicateCount: 0,
          lowConfidenceCount: 0,
          staleCount: 0,
          reviewRequiredCount: 1,
          refusalCounts: { max_assignments_reached: 1 },
        },
      },
    })
  })
  await page.route(`**/adaptive/students/${studentId}/assignment-automation/batches/execute`, async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      json: {
        batchId: 'batch-1',
        policyId: 'policy-1',
        studentId,
        status: 'executed',
        reviewRequired: true,
        autonomousDecision: false,
        summary: { assigned: 1 },
        results: [
          {
            candidateId: 'candidate-1',
            automationKey: 'automation-1',
            status: 'assigned',
            reason: 'Reviewed assignment created from approved automation batch.',
            assignmentId: 'assignment-1',
            assignment: assignmentFixture({ assignmentId: 'assignment-1', title: 'Fractions recovery set' }),
          },
        ],
      },
    })
  })
}

async function routeLearningOperations(page: Page) {
  await page.route('**/admin/curriculum/analytics/dashboard**', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      json: {
        generatedAt: '2026-06-15T10:00:00Z',
        filters: {},
        sampleSize: 12,
        sampled: false,
        summary: {
          totalSignals: 12,
          assignmentStarts: 5,
          assignmentCompletions: 3,
          lessonCompletions: 2,
        },
        sequencingCoverage: {
          coveredTopics: 8,
          uncoveredTopics: 2,
        },
        qualityHotspots: [
          {
            publicId: 'fractions-practice-v2',
            contentType: 'exercise',
            versionId: 'v2',
            subjectId: 'math',
            topicId: 'fractions',
            totalSignals: 5,
            wrongAnswers: 3,
            assignmentStarts: 2,
            assignmentSkips: 1,
            assignmentArchives: 0,
            assignmentCompletions: 1,
            lessonCompletions: 1,
            completions: 2,
            publishEvents: 1,
            archiveEvents: 0,
            priorityScore: 87,
          },
        ],
        interventions: [{ studentId: studentId, reason: 'Repeated skips on fractions.' }],
        emptyState: null,
        privacy: { aggregateOnly: true },
      },
    })
  })
  await page.route('**/admin/curriculum/analytics/warehouse-readiness', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      json: {
        state: 'not_configured',
        exportAllowed: false,
        liveWarehouseConfigured: false,
        schemaVersion: '2026-06',
        sources: [],
        sourceSchemas: {},
        blockers: ['Warehouse destination is not configured.'],
        warnings: [],
        privacy: { piiRemoved: true },
      },
    })
  })
  await page.route('**/admin/curriculum/analytics/warehouse-export**', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      json: {
        schemaVersion: '2026-06',
        sourceSchemas: {},
        items: [],
        count: 0,
        filters: {},
        window: {},
        privacy: { piiRemoved: true },
      },
    })
  })
}

async function routeStudentAssignments(page: Page) {
  await page.route('**/adaptive/students/me/assignments**', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      json: {
        items: [assignmentFixture({ assignmentId: 'assignment-student', title: 'Fractions recovery set' })],
        count: 1,
      },
    })
  })
}

async function routeParentProgress(page: Page) {
  await page.route(`**/adaptive/parents/me/children/${studentId}/progress`, async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      json: {
        studentId,
        weakAreas: [{ topicId: 'fractions' }],
        recommendations: [],
        sequencingSummary: { explanation: 'Practice is focused on current weak areas.' },
        assignedPracticeCount: 1,
        completedPracticeCount: 0,
        freshness: {},
        assignments: [assignmentFixture({ assignmentId: 'assignment-parent', title: 'Fractions recovery set' })],
        completedAssignments: [],
      },
    })
  })
}

function candidateFixture(overrides = {}) {
  return {
    candidateId: 'candidate-1',
    sourceType: 'ai_draft',
    sourceId: 'draft-1',
    title: 'Fractions recovery set',
    subject: 'math',
    topicId: 'fractions',
    topicIds: ['fractions'],
    confidence: 'high',
    rationale: 'Recent work shows fraction mistakes.',
    expectedImpact: 'Reinforce equivalent fractions.',
    reviewStatus: 'reviewed_source',
    proposedStatus: 'assigned',
    dueAt: '2026-06-22T10:00:00Z',
    sourceSignals: {},
    reviewRequired: true,
    autonomousDecision: false,
    ...overrides,
  }
}

function assignmentFixture(overrides = {}) {
  return {
    assignmentId: 'assignment-1',
    studentId,
    status: 'assigned',
    sourceType: 'ai_draft',
    sourceId: 'draft-1',
    title: 'Fractions recovery set',
    subject: 'math',
    topicIds: ['fractions'],
    reviewed: true,
    createdAt: '2026-06-15T10:00:00Z',
    dueAt: '2026-06-22T10:00:00Z',
    rationale: 'Recent learning signals show fractions need reinforcement.',
    automation: {
      policyId: 'policy-1',
      batchId: 'batch-1',
      candidateId: 'candidate-1',
      autonomyLevel: 'tutor_approved_batch',
      deliveryState: 'assigned',
      reviewRequired: true,
      autonomousDecision: false,
      explanation: 'Tutor-approved practice was assigned for fractions based on recent learning signals.',
      createdBy: 'admin-1',
      createdAt: '2026-06-15T10:00:00Z',
    },
    ...overrides,
  }
}
