import type { Page } from '@playwright/test'
import { expect, test } from './support/fixtures'
import { signInAt, StaffWorld, TEACHER } from './support/staff'

/**
 * A teacher recommends practice to a student they helped, through the built
 * app and against the backend's contract (#703, stoa-backend#495). The student
 * comes from the teacher's own help requests and the topic from the catalog,
 * by name; the preview and execute bodies are checked against the OpenAPI
 * document; the page fits a phone.
 *
 * `STOA_E2E_SHOTS=<dir>` also saves the page at desktop and phone width.
 */
const STUDENT_ID = 'e2e-student-703'
const PHONE = { width: 375, height: 812 }
const DESKTOP = { width: 1280, height: 900 }

const REQUESTS = [
  {
    requestId: 'e2e-request-703',
    conversationId: 'e2e-conversation-703',
    studentId: STUDENT_ID,
    studentName: 'Mia Keller',
    subject: 'math',
    grade: 'grade_8_secondary',
    status: 'in_progress',
    createdAt: '2026-11-19T08:00:00Z',
  },
]

const CATALOG = {
  subjects: [{ id: 'math', name: 'Mathematics', description: '', gradeLevels: [], language: 'en', rolloutState: 'active', order: 1 }],
  topics: [
    { id: 'fractions', subjectId: 'math', gradeLevel: '8', title: 'Fractions', description: '', rolloutState: 'active', order: 1 },
    { id: 'linear-equations', subjectId: 'math', gradeLevel: '8', title: 'Linear equations', description: '', rolloutState: 'active', order: 2 },
  ],
  units: [],
  lessons: [],
  rolloutSubjects: ['math'],
  includePreview: false,
  source: 'e2e',
}

const candidate = (id: string, title: string, rationaleCode: string, sourceType: string) => ({
  candidateId: id,
  type: rationaleCode,
  sourceType,
  sourceId: `src-${id}`,
  title,
  subject: 'math',
  topicId: 'fractions',
  topicIds: ['fractions'],
  confidence: 'high',
  freshness: { status: 'fresh', lastEvidenceAt: '2026-11-18T08:00:00Z' },
  rationaleCode,
  rationale: 'English fallback the page must not show.',
  expectedImpact: 'English impact the page must not show.',
  reviewStatus: 'reviewed_source',
  proposedStatus: 'assigned',
  dueAt: '2026-11-27T08:00:00Z',
  sourceSignals: {},
  reviewRequired: true,
  autonomousDecision: false,
})

const SELECTED = [
  candidate('c-1', 'Simplify fractions', 'curriculum_exercise', 'curriculum_exercise'),
  candidate('c-2', 'Add fractions with unlike denominators', 'reviewed_ai_draft', 'ai_draft'),
]

const ASSIGNED = {
  assignmentId: 'e2e-assignment-1',
  studentId: STUDENT_ID,
  status: 'assigned',
  sourceType: 'curriculum_exercise',
  sourceId: 'src-c-1',
  title: 'Simplify fractions',
  subject: 'math',
  topicIds: ['fractions'],
  reviewed: true,
  dueAt: '2026-11-27T08:00:00Z',
  automation: { explanation: 'Teacher-approved practice was assigned for fractions based on recent learning signals.' },
}

async function shoot(page: Page, name: string) {
  const dir = process.env.STOA_E2E_SHOTS
  if (dir) await page.screenshot({ path: `${dir}/${name}.png`, fullPage: true })
}

for (const [label, viewport] of [['desktop', DESKTOP], ['phone', PHONE]] as const) {
  test(`a teacher previews and assigns practice to a student they helped (${label})`, async ({ page, backend }) => {
    await page.setViewportSize(viewport)
    new StaffWorld(backend, TEACHER).install()
    let assigned = false
    backend.on('GET', '/teachers/me/help-requests', () => ({ status: 200, body: { items: REQUESTS } }))
    backend.on('GET', '/practice/curriculum/catalog', () => ({ status: 200, body: CATALOG }))
    backend.on('GET', '/adaptive/students/{student_id}/assignments', () => ({
      status: 200,
      body: { items: assigned ? [ASSIGNED] : [], count: assigned ? 1 : 0 },
    }))
    backend.on('POST', '/adaptive/students/{student_id}/assignment-automation/batches/preview', () => ({
      status: 200,
      body: {
        batchId: 'batch-703',
        policyId: `policy-${STUDENT_ID}`,
        policy: {},
        studentId: STUDENT_ID,
        createdBy: TEACHER.id,
        createdAt: '2026-11-20T08:00:00Z',
        status: 'preview',
        selected: SELECTED,
        refused: [
          {
            ...candidate('c-3', 'Fraction word problems', 'curriculum_exercise', 'curriculum_exercise'),
            refusalCode: 'duplicate_or_active',
            refusalReason: 'Candidate duplicates active, completed, or archived assignment work.',
          },
        ],
        summary: { selectedCount: 2, refusedCount: 1, topTopics: ['fractions'], duplicateCount: 1, lowConfidenceCount: 0, staleCount: 0, reviewRequiredCount: 2, refusalCounts: { duplicate_or_active: 1 } },
        reviewRequired: true,
        autonomousDecision: false,
      },
    }))
    backend.on('POST', '/adaptive/students/{student_id}/assignment-automation/batches/execute', () => {
      assigned = true
      return {
        status: 200,
        body: {
          batchId: 'batch-703',
          policyId: `policy-${STUDENT_ID}`,
          studentId: STUDENT_ID,
          status: 'completed',
          results: [
            { candidateId: 'c-1', automationKey: 'k-1', status: 'assigned', reasonCode: 'created', reason: 'Reviewed assignment created from approved automation batch.', assignmentId: ASSIGNED.assignmentId, assignment: ASSIGNED },
            { candidateId: 'c-2', automationKey: 'k-2', status: 'skipped', reasonCode: 'not_approved', reason: 'Candidate was not approved for execution.' },
          ],
          summary: {},
          reviewRequired: true,
          autonomousDecision: false,
        },
      }
    })

    await signInAt(page, TEACHER, '/teacher/learning-automation')

    // Who and what, by name: nothing to type.
    await page.getByLabel('Student', { exact: true }).selectOption({ label: 'Mia Keller' })
    await expect(page.getByLabel('Subject', { exact: true })).toHaveValue('math')
    await page.getByLabel('Topic', { exact: true }).selectOption({ label: 'Fractions' })
    await expect(page.locator('input[type="text"], input:not([type]), textarea')).toHaveCount(0)
    await page.getByRole('button', { name: 'Find exercises' }).click()

    const list = page.getByRole('list', { name: 'Suggested exercises' })
    await expect(list.getByText('Simplify fractions')).toBeVisible()
    await expect(list.getByText('There is a checked curriculum exercise for this weak topic.')).toBeVisible()
    await expect(page.getByText(/English (fallback|impact)/)).toHaveCount(0)
    await shoot(page, `703-${label}-preview`)

    const [preview] = backend.callsTo('POST', '/adaptive/students/{student_id}/assignment-automation/batches/preview')
    expect(preview.body).toEqual({
      policy: { autonomyLevel: 'teacher_approved_batch', deliveryMode: 'assigned', topicIds: ['fractions'] },
      subject: 'math',
    })

    await list.getByRole('listitem').nth(1).getByRole('checkbox').uncheck()
    await page.getByRole('button', { name: 'Assign 1 exercise to Mia Keller' }).click()

    const seen = page.getByRole('region', { name: 'What Mia Keller sees under Assignments' })
    await expect(seen.getByText('New')).toBeVisible()
    await expect(seen.getByText('Simplify fractions')).toBeVisible()
    const [execute] = backend.callsTo('POST', '/adaptive/students/{student_id}/assignment-automation/batches/execute')
    expect((execute.body as { candidates: { candidateId: string; approved: boolean }[] }).candidates.map((item) => [item.candidateId, item.approved])).toEqual([
      ['c-1', true],
      ['c-2', false],
    ])

    // Nothing runs off the side of a phone.
    const overflow = (await page.evaluate('document.documentElement.scrollWidth - document.documentElement.clientWidth')) as number
    expect(overflow).toBeLessThanOrEqual(0)
    await shoot(page, `703-${label}-assigned`)
  })
}
