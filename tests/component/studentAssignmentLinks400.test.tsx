/**
 * #400: a student's assignments led nowhere. Each card now opens where its
 * work lives: a curriculum exercise names its lesson, whose chapter the
 * catalog knows; a reviewed AI draft names only a subject and topics, so it
 * opens the topic's nebula on the star map. What the catalog cannot place has
 * no link rather than a guessed one.
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import { StudentAssignmentsPage } from '@/pages/learning/StudentAssignmentsPage'
import type { LearningAssignment } from '@/types/learningOperations'
import type { CurriculumCatalog, CurriculumLessonSummary, CurriculumTopic } from '@/types/practice'

vi.mock('@/layouts/DashboardLayout', () => ({
  DashboardLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

const state: { items: LearningAssignment[]; catalog: CurriculumCatalog | undefined } = { items: [], catalog: undefined }

vi.mock('@/hooks/learning/useLearningOperationsQueries', () => ({
  useMyAssignmentsQuery: () => ({
    isLoading: false,
    isSuccess: true,
    error: null,
    data: { items: state.items, count: state.items.length },
  }),
}))
vi.mock('@/hooks/practice/useCurriculumCatalogQuery', () => ({
  useCurriculumCatalogQuery: () => ({ data: state.catalog }),
}))
vi.mock('@/services/analytics/analyticsClient', () => ({ trackEvent: vi.fn() }))

function lesson(id: string, unitId: string, topicId: string, subjectId = 'math'): CurriculumLessonSummary {
  return { id, unitId, topicId, subjectId } as CurriculumLessonSummary
}
function topic(id: string, subjectId: string): CurriculumTopic {
  return { id, subjectId } as CurriculumTopic
}

const CATALOG = {
  subjects: [],
  units: [],
  topics: [topic('fractions', 'math'), topic('forces', 'physics')],
  lessons: [lesson('lesson-fractions-2', 'math-fractions-1', 'fractions'), lesson('lesson-forces-1', 'physics-forces-1', 'forces', 'physics')],
  rolloutSubjects: [],
  includePreview: false,
  source: 'test',
} as CurriculumCatalog

function exercise(overrides: Partial<LearningAssignment> = {}): LearningAssignment {
  return {
    assignmentId: 'asg-exercise',
    studentId: 's-1',
    status: 'assigned',
    sourceType: 'curriculum_exercise',
    sourceId: 'ex-7',
    title: 'Fractions, exercise 7',
    subject: 'math',
    topicIds: ['fractions'],
    lessonId: 'lesson-fractions-2',
    exerciseId: 'ex-7',
    reviewed: true,
    ...overrides,
  }
}

function draft(overrides: Partial<LearningAssignment> = {}): LearningAssignment {
  return exercise({
    assignmentId: 'asg-draft',
    sourceType: 'ai_draft',
    sourceId: 'draft-3',
    title: 'Reviewed practice exercise',
    lessonId: null,
    exerciseId: null,
    ...overrides,
  })
}

function ChapterStub() {
  return <p>chapter {useParams().unitId}</p>
}
function NebulaStub() {
  const { subjectId, topicId } = useParams()
  return <p>nebula {subjectId}/{topicId}</p>
}

function renderPage() {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={['/assignments']}>
        <Routes>
          <Route path="/assignments" element={<StudentAssignmentsPage />} />
          <Route path="/chapter/:unitId" element={<ChapterStub />} />
          <Route path="/map/:subjectId/:topicId" element={<NebulaStub />} />
        </Routes>
      </MemoryRouter>
    </I18nextProvider>,
  )
}

const initialLanguage = i18n.language
afterAll(async () => {
  await i18n.changeLanguage(initialLanguage)
})

beforeEach(async () => {
  await i18n.changeLanguage('en')
  state.items = []
  state.catalog = CATALOG
})

describe('a student assignment links to where its work lives (#400)', () => {
  it("opens the chapter of a curriculum exercise's lesson", async () => {
    state.items = [exercise()]
    renderPage()

    const link = screen.getByRole('link', { name: 'Open chapter' })
    expect(link).toHaveAttribute('href', '/chapter/math-fractions-1')

    await userEvent.click(link)
    expect(screen.getByText('chapter math-fractions-1')).toBeInTheDocument()
  })

  it('gives each card its own link, described by its title', () => {
    state.items = [
      exercise(),
      exercise({ assignmentId: 'asg-forces', title: 'Forces, exercise 1', subject: 'physics', topicIds: ['forces'], lessonId: 'lesson-forces-1' }),
    ]
    renderPage()

    const links = screen.getAllByRole('link', { name: 'Open chapter' })
    expect(links.map((link) => link.getAttribute('href'))).toEqual(['/chapter/math-fractions-1', '/chapter/physics-forces-1'])
    expect(links[0]).toHaveAccessibleDescription('Fractions, exercise 7')
    expect(links[1]).toHaveAccessibleDescription('Forces, exercise 1')
  })

  it("opens a reviewed AI draft's topic on the star map, its subject read through the aliases", async () => {
    state.items = [draft({ subject: 'Mathematics', topicIds: ['not-in-catalog', 'fractions'] })]
    renderPage()

    expect(screen.queryByRole('link', { name: 'Open chapter' })).toBeNull()
    const link = screen.getByRole('link', { name: 'Show on the star map' })
    expect(link).toHaveAttribute('href', '/map/math/fractions')

    await userEvent.click(link)
    expect(screen.getByText('nebula math/fractions')).toBeInTheDocument()
  })

  it("falls back to the topic when the catalog does not list the exercise's lesson", () => {
    state.items = [exercise({ lessonId: 'lesson-in-preview' })]
    renderPage()

    expect(screen.getByRole('link', { name: 'Show on the star map' })).toHaveAttribute('href', '/map/math/fractions')
  })

  it("does not take a topic of another subject for the assignment's", () => {
    state.items = [draft({ subject: 'physics', topicIds: ['fractions'] })]
    renderPage()

    expect(screen.getByText('Reviewed practice exercise')).toBeInTheDocument()
    expect(screen.queryByRole('link')).toBeNull()
  })

  it('has no link while the catalog is not there, and the cards still show', () => {
    state.catalog = undefined
    state.items = [exercise(), draft()]
    renderPage()

    expect(screen.getByText('Fractions, exercise 7')).toBeInTheDocument()
    expect(screen.getByText('Reviewed practice exercise')).toBeInTheDocument()
    expect(screen.queryByRole('link')).toBeNull()
  })

  it.each([
    ['de', 'Kapitel öffnen', 'Auf der Sternkarte zeigen'],
    ['fr', 'Ouvrir le chapitre', 'Voir sur la carte du ciel'],
    ['it', 'Apri il capitolo', 'Mostra sulla mappa stellare'],
  ])('names the links in %s', async (language, chapter, nebula) => {
    await i18n.changeLanguage(language)
    state.items = [exercise(), draft()]
    renderPage()

    expect(screen.getAllByRole('link').map((link) => link.textContent)).toEqual([chapter, nebula])
  })
})
