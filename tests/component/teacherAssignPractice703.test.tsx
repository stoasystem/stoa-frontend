/**
 * #703: a teacher recommends practice to a student they helped.
 *
 * The backend lets a teacher assign to a student whose help request they hold,
 * or resolved in the last 14 days, and answers 404 otherwise (stoa-backend
 * #495). The page offers those students by name, subject and topic by name
 * from the curriculum catalog, sends only what the teacher chose (everything
 * else is the backend's default), shows each candidate with one translated
 * reason, assigns what is ticked, and shows the student's Assignments as the
 * student will see them. Nobody types an id or an internal value.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import type { ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { candidateReason, refusalReason, resultReason } from '@/features/assignPractice/automationReasons'
import { teacherPracticePathFor } from '@/features/assignPractice/practicePath'
import i18n from '@/i18n'
import { TeacherAssignPracticePage } from '@/pages/teacher/TeacherAssignPracticePage'
import { ApiError } from '@/services/api/httpClient'
import {
  executeAssignmentAutomationBatch,
  getStudentAssignments,
  previewAssignmentAutomationBatch,
} from '@/services/learning/learningOperationsApi'
import { getTeacherHelpRequests } from '@/services/teacher/teacherApi'
import type {
  AutomationCandidate,
  AutomationExecuteResponse,
  AutomationPreviewResponse,
  LearningAssignment,
} from '@/types/learningOperations'
import type { CurriculumCatalog } from '@/types/practice'
import type { TeacherHelpRequestSummary } from '@/types/teacher'
import type { TeacherHelpStatus } from '@/types/teacherHelp'

vi.mock('@/layouts/DashboardLayout', () => ({
  DashboardLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}))
vi.mock('@/services/teacher/teacherApi', async (orig) => ({
  ...(await orig<typeof import('@/services/teacher/teacherApi')>()),
  getTeacherHelpRequests: vi.fn(),
}))
vi.mock('@/services/learning/learningOperationsApi', async (orig) => ({
  ...(await orig<typeof import('@/services/learning/learningOperationsApi')>()),
  getStudentAssignments: vi.fn(),
  previewAssignmentAutomationBatch: vi.fn(),
  executeAssignmentAutomationBatch: vi.fn(),
}))

const catalog = {
  subjects: [
    { id: 'math', name: 'Mathematik', description: '', gradeLevels: [], language: 'de', rolloutState: 'active', order: 1 },
    { id: 'physics', name: 'Physik', description: '', gradeLevels: [], language: 'de', rolloutState: 'active', order: 2 },
  ],
  topics: [
    { id: 'brueche', subjectId: 'math', gradeLevel: '7', title: 'Brüche', description: '', rolloutState: 'active', order: 2 },
    { id: 'gleichungen', subjectId: 'math', gradeLevel: '7', title: 'Gleichungen', description: '', rolloutState: 'active', order: 1 },
    { id: 'kraefte', subjectId: 'physics', gradeLevel: '8', title: 'Kräfte', description: '', rolloutState: 'active', order: 1 },
  ],
  units: [],
  lessons: [],
  rolloutSubjects: ['math', 'physics'],
  includePreview: false,
  source: 'test',
} as unknown as CurriculumCatalog

vi.mock('@/hooks/practice/useCurriculumCatalogQuery', () => ({
  useCurriculumCatalogQuery: () => ({ data: catalog, isLoading: false, isError: false }),
}))

function request(requestId: string, studentId: string, studentName: string, status: TeacherHelpStatus, subject = 'math'): TeacherHelpRequestSummary {
  return { requestId, conversationId: `c-${requestId}`, studentId, studentName, subject, grade: '7', status, createdAt: '2026-11-18T08:00:00Z' }
}

const REQUESTS = [
  request('r-1', 'stu-lea', 'Lea Keller', 'in_progress'),
  request('r-2', 'stu-max', 'Max Frei', 'resolved', 'physics'),
  // Offered and not taken: no relation, so not offered here.
  request('r-3', 'stu-nora', 'Nora Weiss', 'pending'),
]

function candidate(id: string, title: string, rationaleCode: string, extra: Partial<AutomationCandidate> = {}): AutomationCandidate {
  return {
    candidateId: id,
    type: rationaleCode,
    sourceType: 'curriculum_exercise',
    sourceId: `src-${id}`,
    title,
    subject: 'math',
    topicId: 'brueche',
    topicIds: ['brueche'],
    confidence: 'high',
    rationaleCode,
    rationale: 'A reviewed curriculum exercise is available for this weak topic.',
    proposedStatus: 'assigned',
    reviewRequired: true,
    autonomousDecision: false,
    ...extra,
  }
}

const PREVIEW: AutomationPreviewResponse = {
  batchId: 'batch-1',
  policyId: 'policy-stu-lea',
  policy: { status: 'active', autonomyLevel: 'teacher_approved_batch', sourceTypes: ['ai_draft', 'curriculum_exercise'], maxAssignmentsPerStudent: 3, confidenceThreshold: 'medium', freshnessDays: 14, dueInDays: 7, deliveryMode: 'assigned' },
  studentId: 'stu-lea',
  createdBy: 'teacher-1',
  createdAt: '2026-11-20T08:00:00Z',
  status: 'preview',
  selected: [
    candidate('c-1', 'Brüche kürzen', 'curriculum_exercise'),
    candidate('c-2', 'Brüche erweitern', 'reviewed_ai_draft', { sourceType: 'ai_draft' }),
  ],
  refused: [
    candidate('c-3', 'Brüche addieren', 'curriculum_exercise', {
      refusalCode: 'duplicate_or_active',
      refusalReason: 'Candidate duplicates active, completed, or archived assignment work.',
    }),
  ],
  summary: { selectedCount: 2, refusedCount: 1, topTopics: ['brueche'], duplicateCount: 1, lowConfidenceCount: 0, staleCount: 0, reviewRequiredCount: 2, refusalCounts: { duplicate_or_active: 1 } },
  reviewRequired: true,
  autonomousDecision: false,
}

const NEW_ASSIGNMENT: LearningAssignment = {
  assignmentId: 'as-1',
  studentId: 'stu-lea',
  status: 'assigned',
  sourceType: 'curriculum_exercise',
  sourceId: 'src-c-1',
  title: 'Brüche kürzen',
  subject: 'math',
  topicIds: ['brueche'],
  reviewed: true,
  dueAt: '2026-11-27T08:00:00Z',
  automation: { explanation: 'Teacher-approved practice was assigned for brueche based on recent learning signals.' },
}

const EXECUTED: AutomationExecuteResponse = {
  batchId: 'batch-1',
  policyId: 'policy-stu-lea',
  studentId: 'stu-lea',
  status: 'completed',
  results: [
    { candidateId: 'c-1', automationKey: 'k-1', status: 'assigned', reasonCode: 'created', reason: 'Reviewed assignment created from approved automation batch.', assignmentId: 'as-1', assignment: NEW_ASSIGNMENT },
    { candidateId: 'c-2', automationKey: 'k-2', status: 'skipped', reasonCode: 'not_approved', reason: 'Candidate was not approved for execution.' },
  ],
  summary: {},
  reviewRequired: true,
  autonomousDecision: false,
}

function renderAt(path: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/teacher/learning-automation" element={<TeacherAssignPracticePage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  )
}

const select = (name: RegExp) => screen.getByRole('combobox', { name }) as HTMLSelectElement

beforeEach(async () => {
  vi.clearAllMocks()
  vi.mocked(getTeacherHelpRequests).mockResolvedValue({ items: REQUESTS })
  vi.mocked(getStudentAssignments).mockResolvedValue({ items: [], count: 0 })
  vi.mocked(previewAssignmentAutomationBatch).mockResolvedValue(PREVIEW)
  vi.mocked(executeAssignmentAutomationBatch).mockResolvedValue(EXECUTED)
  await i18n.changeLanguage('en')
})

afterAll(async () => {
  await i18n.changeLanguage('en')
})

describe('choosing who and what, by name (#703)', () => {
  it('offers the students of the teacher’s own taken requests, by name, and nowhere to type an id', async () => {
    const { container } = renderAt('/teacher/learning-automation')

    await waitFor(() => expect(select(/^Student/)).toBeInTheDocument())
    const offered = [...select(/^Student/).options].map((option) => option.textContent)
    expect(offered).toEqual(['Choose a student', 'Lea Keller', 'Max Frei'])
    // Every field is a list or a number: no text box for an id, a topic id or a source type.
    expect(container.querySelectorAll('input[type="text"], input:not([type]), textarea')).toHaveLength(0)
    expect(screen.getByRole('button', { name: 'Find exercises' })).toBeDisabled()
  })

  it('previews for the student, subject and topic picked by name, leaving every other setting to the backend', async () => {
    renderAt('/teacher/learning-automation')
    await waitFor(() => expect(select(/^Student/)).toBeInTheDocument())

    fireEvent.change(select(/^Student/), { target: { value: 'stu-lea' } })
    // The subject of the student's request is chosen for the teacher.
    expect(select(/^Subject/).value).toBe('math')
    const topics = [...select(/^Topic/).options].map((option) => option.textContent)
    expect(topics).toEqual(['Any topic', 'Gleichungen', 'Brüche'])
    fireEvent.change(select(/^Topic/), { target: { value: 'brueche' } })
    fireEvent.click(screen.getByRole('button', { name: 'Find exercises' }))

    await waitFor(() => expect(previewAssignmentAutomationBatch).toHaveBeenCalledTimes(1))
    expect(previewAssignmentAutomationBatch).toHaveBeenCalledWith('stu-lea', {
      policy: { autonomyLevel: 'teacher_approved_batch', deliveryMode: 'assigned', topicIds: ['brueche'] },
      subject: 'math',
    })
  })

  it('opens on the student and subject of the help request it is linked from', async () => {
    renderAt(teacherPracticePathFor('stu-max', 'r-2'))

    await waitFor(() => expect(select(/^Student/).value).toBe('stu-max'))
    expect(select(/^Subject/).value).toBe('physics')
    expect(screen.getByRole('button', { name: 'Find exercises' })).toBeEnabled()
  })

  it('sends a folded-away setting only once the teacher moves it', async () => {
    renderAt(teacherPracticePathFor('stu-lea'))
    await waitFor(() => expect(select(/^Student/).value).toBe('stu-lea'))

    fireEvent.change(select(/How sure/), { target: { value: 'high' } })
    fireEvent.change(screen.getByRole('spinbutton', { name: /Due in/ }), { target: { value: '3' } })
    fireEvent.click(screen.getByRole('checkbox', { name: 'AI exercises checked by a teacher' }))
    fireEvent.click(screen.getByRole('button', { name: 'Find exercises' }))

    await waitFor(() => expect(previewAssignmentAutomationBatch).toHaveBeenCalledTimes(1))
    expect(vi.mocked(previewAssignmentAutomationBatch).mock.calls[0][1].policy).toEqual({
      autonomyLevel: 'teacher_approved_batch',
      deliveryMode: 'assigned',
      confidenceThreshold: 'high',
      dueInDays: 3,
      sourceTypes: ['curriculum_exercise'],
    })
  })
})

describe('ticking and assigning (#703)', () => {
  it('assigns what is ticked and shows the student’s Assignments as the student sees them', async () => {
    vi.mocked(getStudentAssignments)
      .mockResolvedValueOnce({ items: [], count: 0 })
      .mockResolvedValue({ items: [NEW_ASSIGNMENT], count: 1 })
    renderAt(teacherPracticePathFor('stu-lea', 'r-1'))
    await waitFor(() => expect(select(/^Student/).value).toBe('stu-lea'))
    fireEvent.click(screen.getByRole('button', { name: 'Find exercises' }))

    const list = await screen.findByRole('list', { name: 'Suggested exercises' })
    const items = within(list).getAllByRole('listitem')
    expect(items).toHaveLength(2)
    // Exercise, topic and one reason in words.
    expect(within(items[0]).getByText('Brüche kürzen')).toBeInTheDocument()
    expect(within(items[0]).getByText('Topic: Brüche')).toBeInTheDocument()
    expect(within(items[0]).getByText('There is a checked curriculum exercise for this weak topic.')).toBeInTheDocument()
    expect(within(items[1]).getByText('An AI exercise a teacher checked fits what the student needs.')).toBeInTheDocument()

    fireEvent.click(within(items[1]).getByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: 'Assign 1 exercise to Lea Keller' }))

    await waitFor(() => expect(executeAssignmentAutomationBatch).toHaveBeenCalledTimes(1))
    const [studentId, body] = vi.mocked(executeAssignmentAutomationBatch).mock.calls[0]
    expect(studentId).toBe('stu-lea')
    expect(body.batchId).toBe('batch-1')
    expect(body.approved).toBe(true)
    // The same policy and subject the preview was asked with.
    expect(body.policy).toEqual(vi.mocked(previewAssignmentAutomationBatch).mock.calls[0][1].policy)
    expect(body.subject).toBe('math')
    expect(body.candidates.map((item) => [item.candidateId, item.approved])).toEqual([
      ['c-1', true],
      ['c-2', false],
    ])
    // Only the fields the execute schema names go back (its OpenAPI allows no others).
    expect(Object.keys(body.candidates[0])).not.toContain('rationaleCode')
    expect(Object.keys(body.candidates[0])).not.toContain('freshness')

    const results = await screen.findByRole('list', { name: 'What was assigned' })
    expect(within(results).getByText('The assignment was created.')).toBeInTheDocument()
    expect(within(results).getByText('Not ticked, so not assigned.')).toBeInTheDocument()

    const seen = screen.getByRole('region', { name: 'What Lea Keller sees under Assignments' })
    await waitFor(() => expect(within(seen).getByText('New')).toBeInTheDocument())
    expect(within(seen).getByText('Brüche kürzen')).toBeInTheDocument()
    expect(within(seen).getByText(/^Teacher-approved practice was assigned for /)).toBeInTheDocument()
    // The list the student reads leaves archived work out.
    expect(getStudentAssignments).toHaveBeenLastCalledWith('stu-lea', false)
  })

  it('says the teacher has no relation with the student when the backend answers 404', async () => {
    vi.mocked(previewAssignmentAutomationBatch).mockRejectedValue(new ApiError('Not found', { status: 404 }))
    renderAt(teacherPracticePathFor('stu-lea'))
    await waitFor(() => expect(select(/^Student/).value).toBe('stu-lea'))
    fireEvent.click(screen.getByRole('button', { name: 'Find exercises' }))

    expect(
      await screen.findAllByText(/only while you hold their help request, or for 14 days after you resolved it/),
    ).not.toHaveLength(0)
    expect(screen.queryByRole('list', { name: 'Suggested exercises' })).not.toBeInTheDocument()
  })

  it('asks for a fresh look when the batch went stale', async () => {
    vi.mocked(executeAssignmentAutomationBatch).mockRejectedValue(
      new ApiError('stale', { status: 409, code: 'batch_preview_stale' }),
    )
    renderAt(teacherPracticePathFor('stu-lea'))
    await waitFor(() => expect(select(/^Student/).value).toBe('stu-lea'))
    fireEvent.click(screen.getByRole('button', { name: 'Find exercises' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Assign 2 exercises to Lea Keller' }))

    expect(await screen.findByText('The suggestions have changed since you looked. Find the exercises again.')).toBeInTheDocument()
  })
})

describe('reasons in the teacher’s language, never the backend’s English (#703)', () => {
  it('shows a German teacher the candidates, refusals and results in German', async () => {
    await i18n.changeLanguage('de')
    renderAt(teacherPracticePathFor('stu-lea'))
    await waitFor(() => expect(screen.getByRole('combobox', { name: /^Schülerin oder Schüler/ })).toHaveValue('stu-lea'))
    fireEvent.click(screen.getByRole('button', { name: 'Übungen finden' }))

    expect(await screen.findByText('Zu diesem schwachen Thema gibt es eine geprüfte Übung aus dem Lehrplan.')).toBeInTheDocument()
    expect(screen.getByText('Dazu gibt es schon eine offene, erledigte oder archivierte Aufgabe.')).toBeInTheDocument()
    expect(screen.queryByText(/curriculum exercise is available|duplicates active/)).not.toBeInTheDocument()
  })

  it.each(['de', 'fr', 'it'])('turns a code it does not know into a sentence in %s, not the English beside it', async (language) => {
    await i18n.changeLanguage(language)
    const t = i18n.getFixedT(language)
    const reason = candidateReason({ rationaleCode: 'brand_new', type: 'brand_new', rationale: 'Some new English reason.' }, t)
    const refusal = refusalReason({ refusalCode: 'brand_new', refusalReason: 'Some new English refusal.' }, t)
    const result = resultReason({ reasonCode: 'brand_new', reason: 'Some new English result.' }, t)
    for (const text of [reason, refusal, result]) expect(text).not.toMatch(/English/)
  })

  it('keeps the English beside an unknown code for a reader of English', () => {
    const t = i18n.getFixedT('en')
    expect(candidateReason({ rationaleCode: 'brand_new', rationale: 'Some new English reason.' }, t)).toBe('Some new English reason.')
  })

  it('says why a refused or failed result was refused', () => {
    const t = i18n.getFixedT('en')
    expect(resultReason({ reasonCode: 'refused', refusalCode: 'source_not_assignable', reason: 'x' }, t)).toBe(
      'This exercise can no longer be assigned.',
    )
  })

  it('has every code in all four languages', () => {
    const codes = {
      rationale: ['remediation_topic', 'curriculum_exercise', 'reviewed_ai_draft', 'continuation_lesson'],
      refusal: [
        'automation_off', 'policy_paused', 'student_out_of_scope', 'source_type_not_allowed', 'subject_out_of_scope',
        'topic_out_of_scope', 'low_confidence', 'stale_candidate', 'duplicate_or_active', 'review_boundary_missing',
        'max_assignments_reached', 'unsupported_assignment_source', 'source_not_assignable',
      ],
      result: ['created', 'not_approved', 'already_created', 'source_has_history', 'refused', 'failed'],
    }
    for (const language of ['de', 'en', 'fr', 'it']) {
      for (const [kind, list] of Object.entries(codes)) {
        for (const code of list) {
          expect(i18n.exists(`teacher:assignPractice.reasons.${kind}.${code}`, { lng: language }), `${language} ${kind}.${code}`).toBe(true)
        }
      }
    }
  })
})

describe('the link a help request uses (#703)', () => {
  it('carries the student and the request, and drops what is not an id', () => {
    expect(teacherPracticePathFor('stu-1', 'r-1')).toBe('/teacher/learning-automation?studentId=stu-1&request=r-1')
    expect(teacherPracticePathFor('stu-1')).toBe('/teacher/learning-automation?studentId=stu-1')
    expect(teacherPracticePathFor('../x', '//evil.example')).toBe('/teacher/learning-automation')
    expect(teacherPracticePathFor(undefined)).toBe('/teacher/learning-automation')
  })
})
