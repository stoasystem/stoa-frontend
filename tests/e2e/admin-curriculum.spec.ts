import { expect, test, type Page } from '@playwright/test'
import { loginAs } from './helpers'
import type {
  CurriculumAuditResponse,
  CurriculumDiffResponse,
  CurriculumMigrationDryRunResponse,
  CurriculumMigrationEvidenceResponse,
  CurriculumValidationPreview,
  CurriculumVersion,
  CurriculumWorklistResponse,
} from '../../src/types/curriculumOperations'

test('admin can open curriculum editor and validate a draft', async ({ page }) => {
  await routeCurriculumBase(page)

  await loginAs(page, 'admin')
  await page.goto('/admin/curriculum')

  await expect(page.getByRole('heading', { name: /curriculum editor/i })).toBeVisible()
  await page.getByRole('button', { name: /^open$/i }).click()
  await page.getByRole('tab', { name: /review/i }).click()
  await page.getByRole('button', { name: /run validation/i }).click()

  await expect(page.getByText(/exercises\[0\]\.explanation/i)).toBeVisible()
})

test('admin can dry-run and apply a curriculum migration', async ({ page }) => {
  await routeCurriculumBase(page)

  await loginAs(page, 'admin')
  await page.goto('/admin/curriculum')
  await page.getByRole('tab', { name: /migration/i }).click()
  await page.getByRole('button', { name: /dry-run/i }).click()

  await expect(page.getByText('Ready')).toBeVisible()
  await page.getByRole('button', { name: /apply migration/i }).click()

  await expect(page.getByText(/applied migration_1/i)).toBeVisible()
})

test('admin curriculum console shows missing-permission state', async ({ page }) => {
  await page.route('**/admin/curriculum/worklist**', async (route) => {
    await route.fulfill({
      status: 403,
      contentType: 'application/json',
      json: { detail: { code: 'curriculum_capability_required' } },
    })
  })

  await loginAs(page, 'admin')
  await page.goto('/admin/curriculum')

  await expect(page.getByRole('alert')).toContainText(/did not grant access/i)
})

test('admin curriculum console exposes API errors without demo fallback', async ({ page }) => {
  await page.route('**/admin/curriculum/worklist**', async (route) => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      json: { detail: 'curriculum unavailable' },
    })
  })

  await loginAs(page, 'admin')
  await page.goto('/admin/curriculum')

  await expect(page.getByRole('alert')).toContainText(/curriculum unavailable/i)
})

async function routeCurriculumBase(page: Page) {
  await page.route('**/admin/curriculum/worklist**', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      json: worklist(),
    })
  })
  await page.route('**/admin/curriculum/lessons/lesson-linear-ops/preview**', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      json: curriculumVersion(),
    })
  })
  await page.route('**/admin/curriculum/lessons/lesson-linear-ops/drafts/lessonv_1/validation-preview', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      json: validationPreview(),
    })
  })
  await page.route('**/admin/curriculum/lessons/lesson-linear-ops/diff**', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      json: diffResponse(),
    })
  })
  await page.route('**/admin/curriculum/lessons/lesson-linear-ops/audit**', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      json: auditResponse(),
    })
  })
  await page.route('**/admin/curriculum/migrations/dry-run', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      json: dryRunResponse(),
    })
  })
  await page.route('**/admin/curriculum/migrations/migration_1/apply', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      json: evidenceResponse(),
    })
  })
}

function worklist(): CurriculumWorklistResponse {
  return {
    count: 1,
    items: [
      {
        publicLessonId: 'lesson-linear-ops',
        versionId: 'lessonv_1',
        state: 'draft',
        reviewState: null,
        updatedAt: '2026-07-05T00:00:00Z',
        updatedBy: 'author-1',
      },
    ],
  }
}

function curriculumVersion(): CurriculumVersion {
  return {
    publicLessonId: 'lesson-linear-ops',
    versionId: 'lessonv_1',
    state: 'draft',
    reviewState: null,
    updatedAt: '2026-07-05T00:00:00Z',
    updatedBy: 'author-1',
    lesson: {
      lesson_id: 'lesson-linear-ops',
      title: 'Linear equations operations',
      objective: 'Solve one-step equations safely.',
    },
    exercises: [
      {
        exercise_id: 'exercise-linear-ops-1',
        prompt: 'Solve x + 4 = 9.',
        answer_key: 'x = 5',
      },
    ],
  }
}

function validationPreview(): CurriculumValidationPreview {
  return {
    publicLessonId: 'lesson-linear-ops',
    versionId: 'lessonv_1',
    status: 'invalid',
    publishReady: false,
    issueCount: 1,
    issues: [
      {
        severity: 'blocking',
        field: 'exercises[0].explanation',
        message: 'Required exercise field is missing.',
        hint: 'Provide this field before publishing.',
      },
    ],
  }
}

function diffResponse(): CurriculumDiffResponse {
  return {
    publicLessonId: 'lesson-linear-ops',
    fromVersionId: 'lessonv_0',
    toVersionId: 'lessonv_1',
    changeCount: 1,
    changes: [{ path: 'lesson.title', type: 'modified', before: 'Old', after: 'New' }],
  }
}

function auditResponse(): CurriculumAuditResponse {
  return {
    publicLessonId: 'lesson-linear-ops',
    count: 1,
    items: [
      {
        eventId: 'event_1',
        publicLessonId: 'lesson-linear-ops',
        versionId: 'lessonv_1',
        operation: 'create_draft',
        actorId: 'author-1',
        actorCapabilities: ['curriculum_author'],
      },
    ],
  }
}

function dryRunResponse(): CurriculumMigrationDryRunResponse {
  return {
    migrationId: 'migration_1',
    confirmationToken: 'confirm_1',
    source: { sourceId: 'approved-curriculum-pack' },
    summary: { total: 1, creates: 1, updates: 0, skips: 0, conflicts: 0, errors: 0 },
    rows: [
      {
        rowIndex: 1,
        publicLessonId: 'lesson-linear-ops',
        action: 'create',
        publishIntent: true,
        validationIssues: [],
        conflicts: [],
      },
    ],
    publishReady: true,
  }
}

function evidenceResponse(): CurriculumMigrationEvidenceResponse {
  return {
    migrationId: 'migration_1',
    status: 'applied',
    source: { sourceId: 'approved-curriculum-pack' },
    summary: { total: 1, creates: 1, updates: 0, skips: 0, conflicts: 0, errors: 0 },
    rows: [],
    appliedBy: 'operator-1',
    appliedAt: '2026-07-05T00:00:00Z',
    idempotent: false,
  }
}
