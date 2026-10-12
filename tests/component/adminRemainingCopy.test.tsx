/**
 * The administrator's moderation queue, teacher applications and learning
 * operations dashboard, and the teacher's moderation report dialog, read in
 * German without an English sentence left over.
 *
 * Each was written in English only: a German administrator opened "Content
 * moderation", "Teacher applications" and "Operations dashboard" with English
 * cards, buttons and empty states, and a teacher reporting content got "Report
 * content", "Reason" and "Submit report".
 */
import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import { ModerationReportDialog } from '@/components/moderation/ModerationReportDialog'
import { AdminModerationPage } from '@/pages/admin/AdminModerationPage'
import { AdminTeacherApplicationsPage } from '@/pages/admin/AdminTeacherApplicationsPage'
import { LearningOperationsDashboardPage } from '@/pages/learning/LearningOperationsDashboardPage'
import type { ModerationCase } from '@/services/admin/adminApi'

vi.mock('@/layouts/DashboardLayout', () => ({
  DashboardLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

const idleMutation = { mutate: vi.fn(), isPending: false, isError: false }

const moderationCase: ModerationCase = {
  case_id: 'case-1',
  status: 'open',
  reason: 'incorrect_answer',
  severity: 'high',
  surface: 'ai_answer',
  question_id: 'q-1',
  reporter_id: 't-1',
  reporter_role: 'teacher',
  created_at: '2026-10-01T09:00:00Z',
  updated_at: '2026-10-01T09:00:00Z',
  question_context: null,
  history: [
    { event_id: 'e-1', event_type: 'reported', created_at: '2026-10-01T09:00:00Z' },
    { event_id: 'e-2', event_type: 'note_added', created_at: null },
  ],
}

vi.mock('@/hooks/admin/useAdminModerationCases', () => ({
  useAdminModerationCasesQuery: () => ({
    data: { items: [moderationCase], count: 1 },
    isLoading: false,
    isError: false,
  }),
  useAdminModerationCaseQuery: () => ({ data: moderationCase }),
  useUpdateModerationCaseMutation: () => idleMutation,
  useAddModerationCaseNoteMutation: () => idleMutation,
}))

vi.mock('@/hooks/teacher/useTeacherApplication', () => ({
  useTeacherApplicationsQuery: () => ({
    data: { items: [], count: 0 },
    isLoading: false,
    isError: false,
    isSuccess: true,
  }),
  useTeacherApplicationDetailQuery: () => ({ data: undefined }),
  useReviewTeacherApplicationMutation: () => idleMutation,
  useReissueTeacherInvitationMutation: () => idleMutation,
}))

vi.mock('@/hooks/learning/useLearningOperationsQueries', () => ({
  useCurriculumAnalyticsDashboardQuery: () => ({
    data: {
      summary: { totalSignals: 12, assignmentStarts: 3 },
      sampleSize: 40,
      sequencingCoverage: { coveredTopics: 5, uncoveredTopics: 2 },
      qualityHotspots: [
        {
          publicId: 'item-7',
          versionId: 'v1',
          subjectId: '',
          topicId: '',
          contentType: 'exercise',
          priorityScore: 9,
          wrongAnswers: 4,
          assignmentStarts: 6,
          assignmentCompletions: 2,
        },
      ],
      interventions: [{}],
    },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
  useWarehouseReadinessQuery: () => ({
    data: {
      state: 'ready',
      exportAllowed: true,
      liveWarehouseConfigured: false,
      blockers: [],
      warnings: [],
    },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
  useWarehouseExportSummaryQuery: () => ({
    data: { permissionDenied: true },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
}))

vi.mock('@/hooks/moderation/useReportModerationCaseMutation', () => ({
  useReportModerationCaseMutation: () => ({ ...idleMutation, isError: true }),
}))

function renderInGerman(node: ReactNode) {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>{node}</MemoryRouter>
    </I18nextProvider>,
  )
}

function expectNone(text: string, english: string[]) {
  for (const phrase of english) expect(text).not.toContain(phrase)
}

beforeAll(async () => {
  await i18n.changeLanguage('de')
})

afterAll(async () => {
  await i18n.changeLanguage('en')
})

describe('the moderation queue in German', () => {
  it('names the page, the case and its codes in German', () => {
    const { container } = renderInGerman(<AdminModerationPage />)

    expect(screen.getByText('Inhaltsmoderation')).toBeInTheDocument()
    expect(screen.getByText('1 Fall')).toBeInTheDocument()
    expect(screen.getByText('Fall case-1')).toBeInTheDocument()
    expect(screen.getByText('Fall zuweisen')).toBeInTheDocument()
    expect(screen.getByText('Keine gespeicherte KI-Antwort')).toBeInTheDocument()
    expect(screen.getByText('Unbekannter Zeitpunkt')).toBeInTheDocument()
    expect(screen.getAllByText('KI-Antwort - Falsche Antwort').length).toBeGreaterThan(0)
    expect(screen.getByRole('option', { name: 'Alle Schweregrade' })).toBeInTheDocument()

    expectNone(container.textContent ?? '', [
      'Content moderation',
      'Admin operations',
      '1 cases',
      'Queue',
      'Assign case',
      'Status action',
      'Internal note',
      'Add note',
      'No AI answer snapshot',
      'No teacher reply snapshot',
      'Unknown time',
      'AI answer',
      'Incorrect answer',
      'Note added',
      'All severities',
      'History',
    ])
  })
})

describe('the teacher applications queue in German', () => {
  it('reads an empty queue in German', () => {
    const { container } = renderInGerman(<AdminTeacherApplicationsPage />)

    expect(screen.getByText('Bewerbungen von Lehrpersonen')).toBeInTheDocument()
    expect(screen.getByText('0 in dieser Warteschlange')).toBeInTheDocument()
    expect(screen.getByText('Keine Bewerbungen in diesem Status.')).toBeInTheDocument()
    expect(screen.getByText('Wählen Sie eine Bewerbung zur Prüfung aus.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'zu prüfen' })).toBeInTheDocument()

    expectNone(container.textContent ?? '', [
      'Teacher applications',
      'Teacher onboarding',
      'in this queue',
      'No applications in this state.',
      'Select an application to review.',
      'pending review',
      'Queue',
    ])
  })
})

describe('the learning operations dashboard in German', () => {
  it('labels figures, fallbacks and the export refusal in German', () => {
    const { container } = renderInGerman(<LearningOperationsDashboardPage />)

    expect(screen.getByText('Betriebsübersicht')).toBeInTheDocument()
    expect(screen.getByText('40 Stichprobenzeilen')).toBeInTheDocument()
    expect(screen.getByText('2 Themen ohne Abdeckung')).toBeInTheDocument()
    expect(screen.getByText('Priorität 9')).toBeInTheDocument()
    expect(screen.getByText('Kandidat für Intervention')).toBeInTheDocument()
    expect(screen.getByText('Nicht eingerichtet')).toBeInTheDocument()
    expect(screen.getByText(/Der Export ist eine eigene Berechtigung, curriculum_analytics_exporter/)).toBeInTheDocument()

    expectNone(container.textContent ?? '', [
      'Operations dashboard',
      'sampled rows',
      'uncovered topics',
      'subject pending',
      'topic pending',
      'Intervention candidate',
      'Review current learning signals.',
      'Warehouse readiness',
      'Not configured',
      'This account may read',
      'Apply filter',
      'Refresh',
    ])
  })
})

describe('the moderation report dialog in German', () => {
  it('asks a teacher for the report in German', () => {
    renderInGerman(
      <ModerationReportDialog
        questionId="q-1"
        surface="ai_answer"
        triggerLabel="Inhalt melden"
        contextLabel="Kontext"
        defaultReason="incorrect_answer"
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Inhalt melden' }))

    const dialog = screen.getByRole('dialog')
    expect(screen.getByRole('heading', { name: 'Inhalt melden' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Missbrauch oder Belästigung' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Mittel' })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Was soll die Administration prüfen?')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('Die Meldung konnte nicht gesendet werden.')
    expect(screen.getByRole('button', { name: 'Meldung senden' })).toBeInTheDocument()

    expectNone(dialog.textContent ?? '', [
      'Report content',
      'Reason',
      'Severity',
      'Abuse or harassment',
      'Medium',
      'Could not submit moderation report.',
      'Cancel',
      'Submit report',
    ])
  })
})
