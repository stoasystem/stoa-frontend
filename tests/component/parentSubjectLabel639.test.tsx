/**
 * #639: on a parent's child page the subject cards and the weak-topic rows had
 * no subject name. The components translated `subject.labelKey`, but
 * `GET /parents/me/children/{id}/learning-profile` sends
 * `{ id: 'math', label: 'Mathematics', rolloutState }` with no `labelKey`
 * (the 6d9ddc38 rename was front-end only), so every name came out empty.
 * The profile here is that response as the API sends it.
 */
import { render, screen, within } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import { LearningProfileHeader } from '@/components/learning/LearningProfileHeader'
import { ChildSummaryPage } from '@/pages/parent/ChildSummaryPage'
import type { LearningProfile } from '@/types/learningProfile'
import type { ChildLearningSummary } from '@/types/parent'

const state = vi.hoisted(() => ({
  summary: { isLoading: false, isError: false, data: undefined as unknown },
  profile: { isLoading: false, isError: false, data: undefined as unknown },
}))

vi.mock('@/layouts/DashboardLayout', () => ({
  DashboardLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}))
vi.mock('@/hooks/parent/useChildLearningSummaryQuery', () => ({
  useChildLearningSummaryQuery: () => state.summary,
}))
vi.mock('@/hooks/parent/useChildLearningProfileQuery', () => ({
  useChildLearningProfileQuery: () => state.profile,
}))
vi.mock('@/hooks/practice/useCurriculumCatalogQuery', () => ({
  useCurriculumCatalogQuery: () => ({ data: undefined, isLoading: true, isError: false }),
}))

const SUMMARY: ChildLearningSummary = {
  student: { id: 'child-1', name: 'Nina Vogt', grade: '7' },
  questionsAskedThisWeek: 0,
  aiResolvedThisWeek: 0,
  teacherHelpRequestsThisWeek: 0,
  practiceLessonsCompletedThisWeek: 0,
  weakTopics: [],
  recentActivity: [],
}

const activity = (subject: string, label: string, rolloutState: 'active' | 'foundation') => ({
  subject,
  label,
  rolloutState,
  questionCount: 0,
  aiResolvedCount: 0,
  teacherEscalationCount: 0,
  feedbackAverage: null,
})

// The production response, field for field: subjects carry `label`, not `labelKey`.
const WIRE_PROFILE = {
  studentId: 'child-1',
  subjects: [
    { id: 'math', label: 'Mathematics', rolloutState: 'active' },
    { id: 'physics', label: 'Physics', rolloutState: 'foundation' },
    { id: 'german', label: 'German', rolloutState: 'foundation' },
    { id: 'english', label: 'English', rolloutState: 'foundation' },
  ],
  subjectActivity: [
    activity('math', 'Mathematics', 'active'),
    activity('physics', 'Physics', 'foundation'),
    activity('german', 'German', 'foundation'),
    activity('english', 'English', 'foundation'),
  ],
  weakTopics: [
    {
      subject: 'math',
      topicId: 'fractions',
      label: 'fractions',
      count: 2,
      latestEvidenceAt: '2026-10-10T08:00:00Z',
      evidenceQuestionIds: ['q-1', 'q-2'],
    },
  ],
  strengthTopics: [],
  updatedAt: '2026-11-10T09:00:00Z',
} satisfies LearningProfile

const initialLanguage = i18n.language

function renderChildPage() {
  return render(
    <MemoryRouter initialEntries={['/parent/children/child-1']}>
      <Routes>
        <Route path="/parent/children/:childId" element={<ChildSummaryPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  state.summary = { isLoading: false, isError: false, data: SUMMARY }
  state.profile = { isLoading: false, isError: false, data: WIRE_PROFILE }
})

afterAll(async () => {
  await i18n.changeLanguage(initialLanguage)
})

describe('subject names on the parent child page come from the subject id (#639)', () => {
  it.each([
    { language: 'de', names: ['Mathematik', 'Physik', 'Deutsch', 'Englisch'] },
    { language: 'en', names: ['Mathematics', 'Physics', 'German', 'English'] },
    { language: 'fr', names: ['Mathématiques', 'Physique', 'Allemand', 'Anglais'] },
    { language: 'it', names: ['Matematica', 'Fisica', 'Tedesco', 'Inglese'] },
  ])('names every subject card and the weak topic’s subject in $language', async ({ language, names }) => {
    await i18n.changeLanguage(language)
    renderChildPage()

    for (const name of names) {
      expect(screen.getByText(name, { selector: 'p' })).toBeInTheDocument()
    }
    // The weak-topic row reads "<subject> · <date>", not " · <date>".
    const row = screen.getByText('fractions').closest('div')!.parentElement!
    expect(within(row).getByText(new RegExp(`^${names[0]} · `))).toBeInTheDocument()
  })

  it('shows the backend’s label for a subject the app has no name for', async () => {
    await i18n.changeLanguage('de')
    state.profile = {
      isLoading: false,
      isError: false,
      data: {
        ...WIRE_PROFILE,
        subjects: [{ id: 'chemistry', label: 'Chemistry', rolloutState: 'foundation' }],
        subjectActivity: [activity('chemistry', 'Chemistry', 'foundation')],
        weakTopics: [],
      },
    }
    renderChildPage()
    expect(screen.getByText('Chemistry', { selector: 'p' })).toBeInTheDocument()
  })

  it('still honours a labelKey when the API does send one', async () => {
    await i18n.changeLanguage('de')
    render(
      <LearningProfileHeader
        profile={{ ...WIRE_PROFILE, subjects: [{ id: 'math', labelKey: 'subjects.physics', rolloutState: 'active' }] }}
      />,
    )
    expect(screen.getByText('Physik')).toBeInTheDocument()
  })

  it('lists the subjects by name in the learning profile header', async () => {
    await i18n.changeLanguage('de')
    render(<LearningProfileHeader profile={WIRE_PROFILE} />)
    expect(screen.getByText('Mathematik, Physik, Deutsch, Englisch')).toBeInTheDocument()
  })
})
