/**
 * The learning automation console a teacher opens from
 * /teacher/learning-automation was English from top to bottom on the German
 * product (#162 walkthrough, 10 Oct 2026). Cover its initial German state
 * and populated preview and assignment status labels in all four languages.
 */
import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import { LearningAutomationConsolePage } from '@/pages/learning/LearningAutomationConsolePage'
import { ApiError } from '@/services/api/httpClient'
import {
  executeAssignmentAutomationBatch,
  getStudentAssignments,
  previewAssignmentAutomationBatch,
} from '@/services/learning/learningOperationsApi'
import type { AutomationPreviewResponse, LearningAssignment } from '@/types/learningOperations'

vi.mock('@/layouts/DashboardLayout', () => ({
  DashboardLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

vi.mock('@/services/learning/learningOperationsApi', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/services/learning/learningOperationsApi')>(),
  executeAssignmentAutomationBatch: vi.fn(),
  getStudentAssignments: vi.fn(),
  previewAssignmentAutomationBatch: vi.fn(),
}))

const reviewStatuses = ['reviewed_source', 'recommendation_review_required']
const assignmentStatuses = ['draft', 'recommended', 'started', 'completed', 'archived']

const assignments: LearningAssignment[] = [...assignmentStatuses, 'future_status'].map((status, index) => ({
  assignmentId: `assignment-${index}`,
  studentId: 'student-123',
  status,
  sourceType: 'curriculum_exercise',
  sourceId: `exercise-${index}`,
  title: `Practice ${index}`,
  topicIds: [],
  createdBy: 'teacher-123',
  createdByRole: 'teacher',
  reviewed: true,
}))

const preview: AutomationPreviewResponse = {
  batchId: 'batch-123',
  policyId: 'policy-123',
  studentId: 'student-123',
  createdBy: 'teacher-123',
  createdAt: '2026-10-11T12:00:00Z',
  status: 'preview',
  policy: {
    status: 'active',
    autonomyLevel: 'teacher_approved_batch',
    sourceTypes: ['curriculum_exercise', 'recommendation'],
    maxAssignmentsPerStudent: 3,
    confidenceThreshold: 'medium',
    freshnessDays: 14,
    dueInDays: 7,
    deliveryMode: 'assigned',
  },
  selected: reviewStatuses.map((reviewStatus, index) => ({
    candidateId: `candidate-${index}`,
    sourceType: index === 0 ? 'curriculum_exercise' : 'recommendation',
    sourceId: `source-${index}`,
    title: `Candidate ${index}`,
    topicIds: [],
    reviewStatus,
    reviewRequired: true,
    autonomousDecision: false,
  })),
  refused: [],
  summary: { selectedCount: 2, refusedCount: 0, topTopics: [], duplicateCount: 0, lowConfidenceCount: 0, staleCount: 0, reviewRequiredCount: 2, refusalCounts: {} },
  reviewRequired: true,
  autonomousDecision: false,
}

function renderConsole({ retry = false }: { retry?: boolean | number } = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry } } })
  return render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <LearningAutomationConsolePage />
      </QueryClientProvider>
    </I18nextProvider>,
  )
}

beforeEach(async () => {
  vi.clearAllMocks()
  vi.mocked(getStudentAssignments).mockResolvedValue({ items: [], count: 0 })
  await i18n.changeLanguage('de')
})

afterEach(async () => {
  await i18n.changeLanguage('en')
})

describe('the automation console speaks the teacher’s language', () => {
  it('opens in German, with nothing left in English', () => {
    const { container } = renderConsole()

    expect(screen.getByRole('heading', { name: 'Automatisierung prüfen' })).toBeInTheDocument()
    expect(screen.getByLabelText('Schüler-ID')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Vorschläge ansehen' })).toBeInTheDocument()
    expect(screen.getByText('Geben Sie oben eine Schüler-ID ein, um die bisherigen Zuweisungen zu sehen.')).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Mittel' })).toBeInTheDocument()

    const text = container.textContent ?? ''
    for (const english of ['Policy controls', 'Student id', 'Preview candidates', 'Selected candidates', 'Refused candidates', 'Assignment history', 'Medium']) {
      expect(text, english).not.toContain(english)
    }
  })

  it.each([
    { language: 'de', studentLabel: 'Schüler-ID', previewLabel: 'Vorschläge ansehen', statuses: ['Geprüfte Quelle', 'Empfehlung zu prüfen', 'Entwurf', 'Empfohlen', 'Begonnen', 'Abgeschlossen', 'Archiviert'] },
    { language: 'en', studentLabel: 'Student id', previewLabel: 'Preview candidates', statuses: ['Reviewed source', 'Recommendation needs review', 'Draft', 'Recommended', 'Started', 'Completed', 'Archived'] },
    { language: 'fr', studentLabel: "Identifiant de l'élève", previewLabel: 'Prévisualiser les propositions', statuses: ['Source vérifiée', 'Recommandation à vérifier', 'Brouillon', 'Recommandé', 'Commencé', 'Terminé', 'Archivé'] },
    { language: 'it', studentLabel: 'ID studente', previewLabel: 'Vedi le proposte', statuses: ['Fonte verificata', 'Raccomandazione da verificare', 'Bozza', 'Consigliato', 'Iniziato', 'Completato', 'Archiviato'] },
  ])('translates existing preview and history statuses in $language and preserves unknown statuses', async ({ language, studentLabel, previewLabel, statuses }) => {
    await i18n.changeLanguage(language)
    vi.mocked(getStudentAssignments).mockResolvedValue({ items: assignments, count: assignments.length })
    vi.mocked(previewAssignmentAutomationBatch).mockResolvedValue(preview)
    const { container } = renderConsole()

    fireEvent.change(screen.getByLabelText(studentLabel), { target: { value: 'student-123' } })
    fireEvent.click(screen.getByRole('button', { name: previewLabel }))

    for (const status of statuses) {
      expect(await screen.findByText(status)).toBeInTheDocument()
    }
    expect(screen.getByText('future_status')).toBeInTheDocument()
    for (const status of [...reviewStatuses, ...assignmentStatuses]) {
      expect(container.textContent, status).not.toContain(status)
    }
  })
})

// The history was read on every key, so half an id fetched an unknown student
// and the panel flashed "could not be loaded" while the operator typed; and an
// id that names no student read as a failure (branch audit, 17 Oct 2026, from
// ef2fd3a3 on redesign/planet).
describe('the automation console reads the history of a settled id', () => {
  it('reads nothing on open or while typing, then the trimmed id once the field is left', async () => {
    renderConsole()
    const field = screen.getByLabelText('Schüler-ID')

    expect(getStudentAssignments).not.toHaveBeenCalled()
    for (const partial of ['s', 'st', 'stu', ' student-123 ']) {
      fireEvent.change(field, { target: { value: partial } })
    }
    expect(getStudentAssignments).not.toHaveBeenCalled()
    // Typed but not read yet: the card says how to read it, not to type an id.
    expect(screen.queryByText('Geben Sie oben eine Schüler-ID ein, um die bisherigen Zuweisungen zu sehen.')).not.toBeInTheDocument()
    expect(screen.getByText('Verlassen Sie das Feld oder wählen Sie „Vorschläge ansehen“, um die Zuweisungen für diese ID zu laden.')).toBeInTheDocument()

    fireEvent.blur(field)

    expect(await screen.findByText('Für diese Person gibt es noch keine Zuweisungen.')).toBeInTheDocument()
    expect(getStudentAssignments).toHaveBeenCalledTimes(1)
    expect(vi.mocked(getStudentAssignments).mock.calls[0][0]).toBe('student-123')
  })

  it.each([
    { language: 'de', studentLabel: 'Schüler-ID', notFound: 'Keine Schülerin und kein Schüler mit dieser ID, oder Sie haben keinen Zugriff darauf.', failed: 'Zuweisungen konnten nicht geladen werden' },
    { language: 'en', studentLabel: 'Student id', notFound: 'No student with this id, or not one you can see.', failed: 'Assignment history could not be loaded' },
    { language: 'fr', studentLabel: "Identifiant de l'élève", notFound: "Aucun élève avec cet identifiant, ou vous n'y avez pas accès.", failed: "Impossible de charger l'historique" },
    { language: 'it', studentLabel: 'ID studente', notFound: 'Nessuno studente con questo ID, oppure non puoi vederlo.', failed: 'Impossibile caricare le assegnazioni' },
  ])('says an unknown id names no student, not that loading failed ($language)', async ({ language, studentLabel, notFound, failed }) => {
    await i18n.changeLanguage(language)
    vi.mocked(getStudentAssignments).mockRejectedValue(new ApiError('Not found', { status: 404 }))
    renderConsole()
    const field = screen.getByLabelText(studentLabel)

    fireEvent.change(field, { target: { value: 'nobody' } })
    fireEvent.blur(field)

    expect(await screen.findByText(notFound)).toBeInTheDocument()
    expect(screen.queryByText(failed)).not.toBeInTheDocument()
  })

  it('still reports a failure that is not a missing student', async () => {
    vi.mocked(getStudentAssignments).mockRejectedValue(new ApiError('Server error', { status: 503 }))
    renderConsole()
    const field = screen.getByLabelText('Schüler-ID')

    fireEvent.change(field, { target: { value: 'student-123' } })
    fireEvent.blur(field)

    // Retried once, as any failure is, before it is reported.
    expect(await screen.findByText('Zuweisungen konnten nicht geladen werden', {}, { timeout: 4000 })).toBeInTheDocument()
    expect(screen.queryByText('Keine Schülerin und kein Schüler mit dieser ID, oder Sie haben keinen Zugriff darauf.')).not.toBeInTheDocument()
  })
})

// The console addressed one typed id three ways: the preview and the policy
// took it as typed, the history trimmed; execute went to whatever the field
// said by then; and the refresh after execute looked under the untrimmed id,
// so the history never updated (review of #244, 18 Oct 2026).
describe('the automation console keeps one student per batch', () => {
  const field = () => screen.getByLabelText('Schüler-ID')
  const previewFor = (id: string) => {
    fireEvent.change(field(), { target: { value: id } })
    fireEvent.click(screen.getByRole('button', { name: 'Vorschläge ansehen' }))
  }
  const execute = async () => fireEvent.click(await screen.findByRole('button', { name: 'Freigegebenen Stapel ausführen' }))

  beforeEach(() => {
    vi.mocked(previewAssignmentAutomationBatch).mockResolvedValue(preview)
    vi.mocked(executeAssignmentAutomationBatch).mockResolvedValue({
      batchId: preview.batchId, policyId: preview.policyId, studentId: 'student-123', status: 'executed', results: [], summary: {}, reviewRequired: true, autonomousDecision: false,
    })
  })

  it('previews the trimmed id, and stores it in the policy', async () => {
    renderConsole()
    previewFor('  student-123 ')

    await waitFor(() => expect(previewAssignmentAutomationBatch).toHaveBeenCalledTimes(1))
    const [studentId, request] = vi.mocked(previewAssignmentAutomationBatch).mock.calls[0]
    expect(studentId).toBe('student-123')
    expect(request.policy.studentIds).toEqual(['student-123'])
    expect(request.policy.policyId).toBe('policy-student-123')
  })

  it('executes the batch for the student it was previewed for, not the one typed since', async () => {
    renderConsole()
    previewFor('student-123')
    await screen.findByText('Candidate 0')

    fireEvent.change(field(), { target: { value: 'student-999' } })
    fireEvent.blur(field())
    await execute()

    await waitFor(() => expect(executeAssignmentAutomationBatch).toHaveBeenCalledTimes(1))
    expect(vi.mocked(executeAssignmentAutomationBatch).mock.calls[0][0]).toBe('student-123')
  })

  it('reads the history again after execute, for a padded id too', async () => {
    renderConsole()
    previewFor(' student-123 ')
    await screen.findByText('Candidate 0')
    await waitFor(() => expect(getStudentAssignments).toHaveBeenCalledTimes(1))

    await execute()

    await waitFor(() => expect(getStudentAssignments).toHaveBeenCalledTimes(2))
    expect(vi.mocked(getStudentAssignments).mock.calls.map(([id]) => id)).toEqual(['student-123', 'student-123'])
  })

  it('does not ask again for a student that is not there, but still retries a failure', async () => {
    vi.mocked(getStudentAssignments).mockRejectedValue(new ApiError('Not found', { status: 404 }))
    const { unmount } = renderConsole({ retry: 1 })
    fireEvent.change(field(), { target: { value: 'nobody' } })
    fireEvent.blur(field())

    expect(await screen.findByText('Keine Schülerin und kein Schüler mit dieser ID, oder Sie haben keinen Zugriff darauf.')).toBeInTheDocument()
    expect(getStudentAssignments).toHaveBeenCalledTimes(1)
    unmount()

    vi.mocked(getStudentAssignments).mockReset().mockRejectedValue(new ApiError('Server error', { status: 503 }))
    renderConsole({ retry: 1 })
    fireEvent.change(field(), { target: { value: 'student-123' } })
    fireEvent.blur(field())

    expect(await screen.findByText('Zuweisungen konnten nicht geladen werden', {}, { timeout: 4000 })).toBeInTheDocument()
    expect(getStudentAssignments).toHaveBeenCalledTimes(2)
  })
})

describe('the history card while an id is typed but not read', () => {
  it.each([
    { language: 'de', studentLabel: 'Schüler-ID', notLoaded: 'Verlassen Sie das Feld oder wählen Sie „Vorschläge ansehen“, um die Zuweisungen für diese ID zu laden.' },
    { language: 'en', studentLabel: 'Student id', notLoaded: 'Leave the field or choose “Preview candidates” to load the assignments for this id.' },
    { language: 'fr', studentLabel: "Identifiant de l'élève", notLoaded: 'Quittez le champ ou choisissez « Prévisualiser les propositions » pour charger les attributions de cet identifiant.' },
    { language: 'it', studentLabel: 'ID studente', notLoaded: 'Esci dal campo o scegli «Vedi le proposte» per caricare le assegnazioni di questo ID.' },
  ])('says how to load it, and goes once it is read ($language)', async ({ language, studentLabel, notLoaded }) => {
    await i18n.changeLanguage(language)
    renderConsole()
    const field = screen.getByLabelText(studentLabel)

    expect(screen.queryByText(notLoaded)).not.toBeInTheDocument()
    fireEvent.change(field, { target: { value: 'student-123' } })
    expect(screen.getByText(notLoaded)).toBeInTheDocument()

    fireEvent.blur(field)
    await waitFor(() => expect(getStudentAssignments).toHaveBeenCalledTimes(1))
    expect(screen.queryByText(notLoaded)).not.toBeInTheDocument()
  })
})

// A batch belongs to the student and subject it was previewed for, runs once,
// and its results and the history card never show under someone else's id
// (review of #246, 18 Oct 2026).
describe('the automation console keeps a batch to its own preview', () => {
  const field = () => screen.getByLabelText('Schüler-ID')
  const subjectField = () => screen.getByLabelText('Fach')
  const previewButton = () => screen.getByRole('button', { name: 'Vorschläge ansehen' })
  const executeButton = () => screen.findByRole('button', { name: 'Freigegebenen Stapel ausführen' })
  const executed = {
    batchId: preview.batchId, policyId: preview.policyId, studentId: 'student-123', status: 'executed',
    results: [{ candidateId: 'candidate-0', automationKey: 'key-0', status: 'created', reason: 'Created for the review.' }],
    summary: {}, reviewRequired: true, autonomousDecision: false,
  }

  beforeEach(() => {
    vi.mocked(previewAssignmentAutomationBatch).mockResolvedValue(preview)
    vi.mocked(executeAssignmentAutomationBatch).mockResolvedValue(executed)
  })

  it('executes with the subject the batch was previewed for', async () => {
    renderConsole()
    fireEvent.change(field(), { target: { value: 'student-123' } })
    fireEvent.change(subjectField(), { target: { value: 'math' } })
    fireEvent.click(previewButton())
    await screen.findByText('Candidate 0')

    fireEvent.change(subjectField(), { target: { value: 'physics' } })
    fireEvent.click(await executeButton())

    await waitFor(() => expect(executeAssignmentAutomationBatch).toHaveBeenCalledTimes(1))
    expect(vi.mocked(executeAssignmentAutomationBatch).mock.calls[0][1].subject).toBe('math')
  })

  it('does not offer a batch that already ran', async () => {
    renderConsole()
    fireEvent.change(field(), { target: { value: 'student-123' } })
    fireEvent.click(previewButton())
    fireEvent.click(await executeButton())
    await screen.findByText('Created for the review.')

    expect(await executeButton()).toBeDisabled()
    fireEvent.click(await executeButton())
    expect(executeAssignmentAutomationBatch).toHaveBeenCalledTimes(1)
  })

  it('clears the results of a batch once another one is previewed', async () => {
    renderConsole()
    fireEvent.change(field(), { target: { value: 'student-123' } })
    fireEvent.click(previewButton())
    fireEvent.click(await executeButton())
    expect(await screen.findByText('Created for the review.')).toBeInTheDocument()

    vi.mocked(previewAssignmentAutomationBatch).mockResolvedValue({ ...preview, batchId: 'batch-456', studentId: 'student-456' })
    fireEvent.change(field(), { target: { value: 'student-456' } })
    fireEvent.click(previewButton())

    await waitFor(() => expect(previewAssignmentAutomationBatch).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(screen.queryByText('Created for the review.')).not.toBeInTheDocument())
    expect(screen.queryByRole('heading', { name: 'Ergebnisse' })).not.toBeInTheDocument()
    expect(await executeButton()).toBeEnabled()
  })

  it('hides one student’s history while the field names another', async () => {
    vi.mocked(getStudentAssignments).mockResolvedValue({ items: assignments, count: assignments.length })
    renderConsole()
    fireEvent.change(field(), { target: { value: 'student-123' } })
    fireEvent.blur(field())
    expect(await screen.findByText('Practice 0')).toBeInTheDocument()

    fireEvent.change(field(), { target: { value: 'student-456' } })
    expect(screen.queryByText('Practice 0')).not.toBeInTheDocument()
    expect(screen.getByText('Verlassen Sie das Feld oder wählen Sie „Vorschläge ansehen“, um die Zuweisungen für diese ID zu laden.')).toBeInTheDocument()

    fireEvent.change(field(), { target: { value: '' } })
    expect(screen.queryByText('Practice 0')).not.toBeInTheDocument()
    expect(screen.getByText('Geben Sie oben eine Schüler-ID ein, um die bisherigen Zuweisungen zu sehen.')).toBeInTheDocument()

    fireEvent.change(field(), { target: { value: 'student-123' } })
    expect(screen.getByText('Practice 0')).toBeInTheDocument()
  })
})
