/**
 * #691: answers after asking AI (stoa-backend#449).
 *
 * - A lesson answer names the Ask conversation open beside the exercise, so
 *   the backend can tell a right answer after asking about it from one the
 *   student found alone. With no conversation open it sends nothing for it.
 * - The parent's child page shows, per star, the exercises answered right on
 *   the child's own and those answered right after asking AI, in all four
 *   languages, and still draws when the backend sends no `starAnswers`.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, renderHook, screen, waitFor, within } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import deParent from '@/i18n/locales/de/parent.json'
import enParent from '@/i18n/locales/en/parent.json'
import frParent from '@/i18n/locales/fr/parent.json'
import itParent from '@/i18n/locales/it/parent.json'
import { useLessonRun } from '@/features/chapter/useLessonRun'
import { ChildSummaryPage } from '@/pages/parent/ChildSummaryPage'
import { submitChallengeAnswer } from '@/services/practice/practiceApi'
import { useAskStore } from '@/store/askStore'
import { useAuthStore } from '@/store/authStore'
import type { ChildLearningSummary } from '@/types/parent'

vi.mock('@/services/practice/practiceApi', () => ({
  submitChallengeAnswer: vi.fn(),
  getPracticeHint: vi.fn(),
  completePracticeLesson: vi.fn(),
  startLessonQuiz: vi.fn(),
  answerLessonQuiz: vi.fn(),
}))

const state = vi.hoisted(() => ({
  summary: { isLoading: false, isError: false, data: undefined as unknown },
}))

vi.mock('@/layouts/DashboardLayout', () => ({
  DashboardLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}))
vi.mock('@/hooks/parent/useChildLearningSummaryQuery', () => ({
  useChildLearningSummaryQuery: () => state.summary,
}))
vi.mock('@/hooks/parent/useChildLearningProfileQuery', () => ({
  useChildLearningProfileQuery: () => ({ isLoading: false, isError: false, data: undefined }),
}))

const lesson = {
  id: 'l1',
  unitId: 'u1',
  subjectId: 'math',
  topicId: 't',
  gradeLevel: '8',
  title: 'L',
  topic: 'T',
  challenges: [{ challengeId: 'c1', type: 'text_input', prompt: '1+1', options: [], hintAvailable: true }],
} as never

function signIn(id: string) {
  useAuthStore.setState({ user: { id, role: 'student' }, isAuthenticated: true } as never)
}

async function answer() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  const { result } = renderHook(() => useLessonRun(lesson), { wrapper })
  act(() => result.current.setAnswer('2'))
  act(() => result.current.check())
  await waitFor(() => expect(result.current.feedback?.correct).toBe(true))
  return vi.mocked(submitChallengeAnswer).mock.lastCall
}

describe('a lesson answer names the Ask conversation beside it', () => {
  beforeEach(() => {
    vi.mocked(submitChallengeAnswer).mockReset()
    vi.mocked(submitChallengeAnswer).mockResolvedValue({ challengeId: 'c1', correct: true } as never)
    useAskStore.setState({ ownerId: null, open: false, conversationId: null })
  })
  afterEach(() => {
    useAuthStore.setState({ user: null, isAuthenticated: false } as never)
    useAskStore.setState({ ownerId: null, open: false, conversationId: null })
  })

  it('sends the open conversation with the answer', async () => {
    signIn('student-1')
    useAskStore.getState().select('student-1', 'conv-9')
    expect(await answer()).toEqual(['c1', { answer: '2', conversationId: 'conv-9' }])
  })

  it('sends the conversation even with the panel closed: it is still the one beside the exercise', async () => {
    signIn('student-1')
    useAskStore.getState().select('student-1', 'conv-9')
    useAskStore.getState().close()
    expect(await answer()).toEqual(['c1', { answer: '2', conversationId: 'conv-9' }])
  })

  it('sends nothing for it with no conversation open', async () => {
    signIn('student-1')
    useAskStore.getState().select('student-1', null)
    const call = await answer()
    expect(call).toEqual(['c1', { answer: '2' }])
    expect(call?.[1]).not.toHaveProperty('conversationId')
  })

  it('never sends a conversation another account left in the store', async () => {
    useAskStore.getState().select('student-2', 'conv-other')
    signIn('student-1')
    const call = await answer()
    expect(call?.[1]).not.toHaveProperty('conversationId')
  })
})

const SUMMARY: ChildLearningSummary = {
  student: { id: 'child-1', name: 'Nina Vogt', grade: '7' },
  questionsAskedThisWeek: 3,
  aiResolvedThisWeek: 2,
  teacherHelpRequestsThisWeek: 1,
  practiceLessonsCompletedThisWeek: 4,
  weakTopics: [],
  recentActivity: [],
}

const LANGUAGES = { en: enParent, de: deParent, fr: frParent, it: itParent } as const
const initialLanguage = i18n.language

function renderChild() {
  return render(
    <MemoryRouter initialEntries={['/parent/children/child-1']}>
      <Routes>
        <Route path="/parent/children/:childId" element={<ChildSummaryPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

function fill(template: string, count: number) {
  return template.replace('{{count}}', String(count))
}

describe('the child page splits right answers by whether AI was asked', () => {
  afterAll(async () => {
    await i18n.changeLanguage(initialLanguage)
  })

  for (const [language, parent] of Object.entries(LANGUAGES)) {
    it(`shows both counts per star in ${language}`, async () => {
      await i18n.changeLanguage(language)
      state.summary = {
        isLoading: false,
        isError: false,
        data: {
          ...SUMMARY,
          starAnswers: [
            { unitId: 'u-fractions', title: 'Fractions', independent: 3, askedAi: 1 },
            { unitId: 'u-angles', title: 'Angles', independent: 0, askedAi: 2 },
          ],
        },
      }
      renderChild()
      const card = within(screen.getByRole('heading', { name: parent.summary.starAnswers }).closest('[data-child-star-answers]') as HTMLElement)
      const fractions = card.getByText('Fractions').closest('li') as HTMLElement
      expect(fractions).toHaveTextContent(fill(parent.summary.starAnswersIndependent, 3))
      expect(fractions).toHaveTextContent(fill(parent.summary.starAnswersAskedAi, 1))
      const angles = card.getByText('Angles').closest('li') as HTMLElement
      expect(angles).toHaveTextContent(fill(parent.summary.starAnswersIndependent, 0))
      expect(angles).toHaveTextContent(fill(parent.summary.starAnswersAskedAi, 2))
      expect(document.body.textContent).not.toContain('{{count}}')
    })
  }

  it('says so when no star has anything answered right', async () => {
    await i18n.changeLanguage('de')
    state.summary = { isLoading: false, isError: false, data: { ...SUMMARY, starAnswers: [] } }
    renderChild()
    expect(screen.getByText(deParent.summary.starAnswersNone)).toBeInTheDocument()
  })

  it('draws the page without the card when the backend sends no starAnswers', async () => {
    await i18n.changeLanguage('en')
    state.summary = { isLoading: false, isError: false, data: SUMMARY }
    renderChild()
    expect(screen.getByRole('heading', { name: 'Nina Vogt' })).toBeInTheDocument()
    expect(screen.queryByText(enParent.summary.starAnswers)).not.toBeInTheDocument()
    expect(document.querySelector('[data-child-star-answers]')).toBeNull()
  })
})
