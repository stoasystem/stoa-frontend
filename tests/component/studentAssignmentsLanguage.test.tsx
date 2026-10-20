/**
 * #278: a student who followed an assignment notification to "Meine Aufgaben"
 * read the raw status ("assigned"), the subject id and topic slugs
 * ("math / linear-equations") and the server's English reason, and a failed
 * load printed the error's English message. The operations dashboard printed
 * the same raw messages to administrators.
 */
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import { LearningOperationsDashboardPage } from '@/pages/learning/LearningOperationsDashboardPage'
import { StudentAssignmentsPage } from '@/pages/learning/StudentAssignmentsPage'
import { ApiError } from '@/services/api/httpClient'
import type { LearningAssignment } from '@/types/learningOperations'

vi.mock('@/layouts/DashboardLayout', () => ({
  DashboardLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

const SERVER_PROSE = 'Assignments service is unavailable'

const state: {
  assignments: { data?: { items: LearningAssignment[], count: number }, error: Error | null, isSuccess: boolean }
  opsError: Error | null
} = { assignments: { error: null, isSuccess: true }, opsError: null }

vi.mock('@/hooks/learning/useLearningOperationsQueries', () => ({
  useMyAssignmentsQuery: () => ({ isLoading: false, ...state.assignments }),
  useCurriculumAnalyticsDashboardQuery: () => ({ isLoading: false, error: state.opsError }),
  useWarehouseReadinessQuery: () => ({ isLoading: false, error: state.opsError }),
  useWarehouseExportSummaryQuery: () => ({ isLoading: false, error: state.opsError }),
}))

// Where each row leads is studentAssignmentLinks400's; here no catalog, so no link.
vi.mock('@/hooks/practice/useCurriculumCatalogQuery', () => ({
  useCurriculumCatalogQuery: () => ({ data: undefined }),
}))

vi.mock('@/services/analytics/analyticsClient', () => ({ trackEvent: vi.fn() }))

function assignment(overrides: Partial<LearningAssignment>): LearningAssignment {
  return {
    assignmentId: 'asg-1',
    studentId: 's-1',
    status: 'assigned',
    sourceType: 'curriculum_exercise',
    sourceId: 'ex-1',
    title: 'Übung 1',
    subject: 'math',
    topicIds: ['linear-equations', 'brueche'],
    rationale: 'Assigned from reviewed curriculum exercise.',
    reviewed: true,
    ...overrides,
  }
}

const initialLanguage = i18n.language
afterAll(async () => {
  await i18n.changeLanguage(initialLanguage)
})

beforeEach(() => {
  state.assignments = { error: null, isSuccess: true }
  state.opsError = null
})

function renderPage(page: ReactNode) {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>{page}</MemoryRouter>
    </I18nextProvider>,
  )
}

const cases = [
  {
    language: 'de',
    status: 'Zugewiesen',
    target: 'Mathematik / Linear equations, Brüche',
    rationale: 'Aus einer geprüften Lehrplanaufgabe zugewiesen.',
    automation: 'Deine Lehrperson hat eine Übung zu Gleichungen freigegeben, passend zu deinen letzten Lernsignalen.',
    defaultRationale: 'Diese Übung wurde aus geprüften Lernsignalen ausgewählt, damit deine nächste Arbeit fokussiert bleibt.',
    failedBody: 'Versuch es gleich noch einmal.',
    opsFailedBody: 'Bitte versuchen Sie es gleich noch einmal.',
  },
  {
    language: 'fr',
    status: 'Attribué',
    target: 'Mathématiques / Linear equations, Fractions',
    rationale: "Attribué à partir d'un exercice du programme validé.",
    automation: 'Ton enseignant a validé un exercice sur Équations, d’après tes signaux d’apprentissage récents.',
    defaultRationale:
      'Cette pratique a été choisie à partir de signaux d’apprentissage vérifiés pour que ton prochain travail reste ciblé.',
    failedBody: 'Réessaie dans un instant.',
    opsFailedBody: 'Veuillez réessayer dans un instant.',
  },
] as const

describe.each(cases)('student assignments in $language', (c) => {
  beforeEach(async () => {
    await i18n.changeLanguage(c.language)
  })

  it('labels the status, subject and topics instead of showing the ids', () => {
    state.assignments.data = { items: [assignment({})], count: 1 }
    renderPage(<StudentAssignmentsPage />)

    expect(screen.getByText(c.status)).toBeInTheDocument()
    expect(screen.getByText(c.target)).toBeInTheDocument()
    expect(screen.queryByText('assigned')).not.toBeInTheDocument()
    expect(screen.queryByText(/linear-equations/)).not.toBeInTheDocument()
  })

  it('translates the server reason, and never shows an untranslated English one', () => {
    state.assignments.data = {
      items: [
        assignment({ assignmentId: 'a', title: 'A' }),
        assignment({
          assignmentId: 'b',
          title: 'B',
          automation: {
            explanation: 'Teacher-approved practice was assigned for gleichungen based on recent learning signals.',
          },
        }),
        assignment({ assignmentId: 'c', title: 'C', rationale: 'Some new English reason the server started sending.' }),
      ],
      count: 3,
    }
    renderPage(<StudentAssignmentsPage />)

    expect(screen.getByText(c.rationale)).toBeInTheDocument()
    expect(screen.getByText(c.automation)).toBeInTheDocument()
    expect(screen.getByText(c.defaultRationale)).toBeInTheDocument()
    expect(screen.queryByText(/Assigned from|Teacher-approved|Some new English/)).not.toBeInTheDocument()
  })

  it('shows translated copy when the assignments fail to load', () => {
    state.assignments = { error: new ApiError(SERVER_PROSE, { status: 503 }), isSuccess: false }
    renderPage(<StudentAssignmentsPage />)

    expect(screen.getByText(c.failedBody)).toBeInTheDocument()
    expect(screen.queryByText(SERVER_PROSE)).not.toBeInTheDocument()
  })

  it('shows translated copy on the operations dashboard errors', () => {
    state.opsError = new Error(SERVER_PROSE)
    renderPage(<LearningOperationsDashboardPage />)

    expect(screen.getAllByText(c.opsFailedBody)).toHaveLength(3)
    expect(screen.queryByText(SERVER_PROSE)).not.toBeInTheDocument()
  })
})

describe('student assignments in English', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
  })

  it('still shows a reason the frontend has no translation for', () => {
    state.assignments.data = {
      items: [assignment({ rationale: 'Some new English reason the server started sending.' })],
      count: 1,
    }
    renderPage(<StudentAssignmentsPage />)

    expect(screen.getByText('Some new English reason the server started sending.')).toBeInTheDocument()
    expect(screen.getByText('Assigned')).toBeInTheDocument()
  })
})
