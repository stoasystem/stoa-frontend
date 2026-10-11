/**
 * The learning automation console a teacher opens from
 * /teacher/learning-automation was English from top to bottom on the German
 * product (#162 walkthrough, 10 Oct 2026). Cover its initial German state
 * and populated preview and assignment status labels in all four languages.
 */
import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import { LearningAutomationConsolePage } from '@/pages/learning/LearningAutomationConsolePage'
import { getStudentAssignments, previewAssignmentAutomationBatch } from '@/services/learning/learningOperationsApi'
import type { AutomationPreviewResponse, LearningAssignment } from '@/types/learningOperations'

vi.mock('@/layouts/DashboardLayout', () => ({
  DashboardLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

vi.mock('@/services/learning/learningOperationsApi', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/services/learning/learningOperationsApi')>(),
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

function renderConsole() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
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
