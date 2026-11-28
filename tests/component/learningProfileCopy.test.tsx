/**
 * The learning profile names subjects in the reader's language, not as the
 * backend labels them ("Mathematics", "Physics"), and counts of one read as
 * one ("1 Frage", not "1 Fragen"). Found in review of #176: the page showed
 * the backend's English subject labels on every language, and its header and
 * topic cards were never translated at all. Since #763 the header says the
 * three totals are over the last 90 days, as the backend counts them (#695).
 */
import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import { StudentLearningProfilePage } from '@/pages/learning/StudentLearningProfilePage'
import type { LearningProfile } from '@/types/learningProfile'

vi.mock('@/layouts/DashboardLayout', () => ({
  DashboardLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}))
vi.mock('@/services/analytics/analyticsClient', () => ({ trackEvent: vi.fn() }))

const profile: LearningProfile = {
  studentId: 'student-123',
  subjects: [
    { id: 'math', labelKey: 'subjects.math', rolloutState: 'active' },
    { id: 'physics', labelKey: 'subjects.physics', rolloutState: 'foundation' },
  ],
  subjectActivity: [
    {
      subject: 'math',
      label: 'Mathematics',
      rolloutState: 'active',
      questionCount: 1,
      aiResolvedCount: 1,
      teacherEscalationCount: 0,
      feedbackAverage: null,
    },
    {
      subject: 'physics',
      label: 'Physics',
      rolloutState: 'foundation',
      questionCount: 3,
      aiResolvedCount: 2,
      teacherEscalationCount: 1,
      feedbackAverage: null,
    },
  ],
  weakTopics: [
    { subject: 'math', topicId: 'fractions', label: 'fractions', count: 1, evidenceQuestionIds: ['q-1'] },
  ],
  strengthTopics: [],
  updatedAt: '2026-10-11T10:00:00Z',
}

vi.mock('@/hooks/learning/useLearningProfileQuery', () => ({
  useLearningProfileQuery: () => ({ data: profile, isLoading: false, isError: false, error: null }),
}))

function renderProfile() {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={['/organization/students/student-123/learning-profile']}>
        <Routes>
          <Route path="/organization/students/:studentId/learning-profile" element={<StudentLearningProfilePage />} />
        </Routes>
      </MemoryRouter>
    </I18nextProvider>,
  )
}

afterEach(async () => {
  await i18n.changeLanguage('en')
})

describe('the learning profile speaks the reader’s language', () => {
  it.each([
    { language: 'de', math: 'Mathematik', physics: 'Physik', one: '1 Frage', many: '3 Fragen', weak: 'Schwache Themen', period: 'Letzte 90 Tage' },
    { language: 'en', math: 'Mathematics', physics: 'Physics', one: '1 question', many: '3 questions', weak: 'Weak topics', period: 'Last 90 days' },
    { language: 'fr', math: 'Mathématiques', physics: 'Physique', one: '1 question', many: '3 questions', weak: 'Thèmes fragiles', period: '90 derniers jours' },
    { language: 'it', math: 'Matematica', physics: 'Fisica', one: '1 domanda', many: '3 domande', weak: 'Argomenti deboli', period: 'Ultimi 90 giorni' },
  ])('in $language: subject names, counts of one, the topic cards, and the 90 days the totals count', async ({ language, math, physics, one, many, weak, period }) => {
    await i18n.changeLanguage(language)
    const { container } = renderProfile()

    expect(screen.getAllByText(math, { exact: false }).length).toBeGreaterThan(0)
    expect(screen.getAllByText(physics, { exact: false }).length).toBeGreaterThan(0)
    expect(screen.getByText(new RegExp(`^${one} ·`))).toBeInTheDocument()
    expect(screen.getByText(new RegExp(`^${many} ·`))).toBeInTheDocument()
    expect(screen.getByText(weak)).toBeInTheDocument()
    // The header's three totals count the last 90 days since backend #695 (#763).
    expect(screen.getByText(period)).toBeInTheDocument()

    const text = container.textContent ?? ''
    if (language !== 'en') {
      for (const english of ['Mathematics', 'Physics', 'Weak topics', 'Strength topics', 'Student learning profile', 'signals']) {
        expect(text, english).not.toContain(english)
      }
    }
    expect(text).not.toMatch(/\b1 (questions|Fragen|domande)\b/)
  })
})
