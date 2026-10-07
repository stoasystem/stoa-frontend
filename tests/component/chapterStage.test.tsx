/**
 * The chapter and the practice stage (#50), page by page. The whole chain --
 * from a star on the map through the chapter to a question asked beside an
 * exercise, on real data -- waits for the star map's read model (#48); here
 * the practice API is mocked at `src/services`.
 *
 * - `/chapter/:unitId` lists the unit's lessons in their order, with progress;
 * - `/chapter/:unitId/:lessonId` checks an answer with the backend, shows the
 *   feedback, and finishing the lesson moves the chapter's progress on;
 * - Ask beside the stage is told which exercise is on screen in its first
 *   message (the text fallback until #56);
 * - 「问这段」 shows by a selection, disabled and marked coming soon;
 * - the keyboard can do all of it, and a star's jump is a crossfade under
 *   reduced motion.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { describePracticeContext, withPracticeContext, type AskPractice } from '@/features/ask/practiceContext'
import { jumpFrameAt, JUMP, JUMP_MS } from '@/features/chapter/jump'
import { chipTop } from '@/features/chapter/QuoteSelection'
import { StarCard } from '@/features/starmap/components/StarCard'
import { skyMap } from './starmapHarness'
import i18n from '@/i18n'
import { ChapterPage, LessonStagePage } from '@/pages/chapter/ChapterPages'
import { ApiError } from '@/services/api/httpClient'
import { createConversation, getConversation, getConversations } from '@/services/chat/chatApi'
import { getGenerationProgress, streamConversationMessage } from '@/services/chat/chatStreamApi'
import {
  completePracticeLesson,
  getCurriculumCatalog,
  getPracticeLesson,
  getPracticeRoadmap,
  submitChallengeAnswer,
} from '@/services/practice/practiceApi'
import { resetAsk, useAskStore } from '@/store/askStore'
import { type CurrentUser, useAuthStore } from '@/store/authStore'
import type { PracticeLesson, PracticeRoadmap, RoadmapLessonStatus } from '@/types/practice'

vi.mock('@/services/analytics/analyticsClient', () => ({ trackEvent: vi.fn() }))
vi.mock('@/hooks/notifications/useNotificationsQuery', () => ({
  useNotificationsQuery: () => ({ data: { items: [] }, isLoading: false, isError: false }),
  useMarkNotificationReadMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useArchiveNotificationMutation: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/hooks/notifications/useRealtimeNotifications', () => ({
  useRealtimeNotifications: () => ({ status: 'disabled' }),
}))
vi.mock('@/services/chat/chatApi', () => ({
  getConversations: vi.fn(async () => ({ items: [] })),
  getConversation: vi.fn(),
  createConversation: vi.fn(),
}))
vi.mock('@/services/chat/chatStreamApi', () => ({
  streamConversationMessage: vi.fn(),
  getGenerationProgress: vi.fn(),
}))
vi.mock('@/services/teacherHelp/teacherHelpApi', () => ({
  getTeacherAvailability: vi.fn(async () => ({ online: true, availableTeachers: 2 })),
  getTeacherHelpRequest: vi.fn(async () => {
    throw new ApiError('never escalated', { status: 404 })
  }),
  createTeacherHelpRequest: vi.fn(),
}))
vi.mock('@/services/student/studentApi', () => ({
  getStudentProfile: vi.fn(async () => ({ grade: '8', primarySubjects: ['math'] })),
}))
vi.mock('@/services/learning/memoryApi', () => ({
  getMyMemorySummary: vi.fn(async () => ({ recommendations: [], weakTopics: [] })),
}))
vi.mock('@/services/practice/practiceApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/practice/practiceApi')>()),
  getCurriculumCatalog: vi.fn(),
  getPracticeRoadmap: vi.fn(),
  getPracticeLesson: vi.fn(),
  submitChallengeAnswer: vi.fn(),
  completePracticeLesson: vi.fn(),
  getPracticeHint: vi.fn(async () => ({ title: 'Undo the + 5 first', hint: 'Take 5 from both sides.', nextStep: '' })),
}))

// ---------------------------------------------------------------------------
// The backend, as far as these pages ask it
// ---------------------------------------------------------------------------

const LESSONS = [
  { id: 'l-1', title: 'What an equation says', order: 1, exercises: 2 },
  { id: 'l-2', title: 'Balancing both sides', order: 2, exercises: 2 },
  { id: 'l-3', title: 'Equations with brackets', order: 3, exercises: 4 },
]
let completed: Set<string>

function statusOf(id: string): RoadmapLessonStatus {
  if (completed.has(id)) return 'completed'
  const current = LESSONS.find((lesson) => !completed.has(lesson.id))
  return current?.id === id ? 'current' : 'available'
}

function roadmap(): PracticeRoadmap {
  // Served out of order: the chapter puts them in theirs.
  const served = [LESSONS[1], LESSONS[2], LESSONS[0]]
  return {
    subjectId: 'math',
    topicId: 'algebra',
    gradeLevel: '8',
    topic: { id: 'algebra', subjectId: 'math', gradeLevel: '8', title: 'Algebra', description: '', progress: 0 },
    progress: 0,
    units: [
      {
        id: 'u-5',
        title: 'Linear equations',
        description: '',
        order: 2,
        lessons: served.map((lesson) => ({
          id: lesson.id,
          title: lesson.title,
          order: lesson.order,
          status: statusOf(lesson.id),
          estimatedMinutes: 10,
          subjectId: 'math',
          gradeLevel: '8',
          topicId: 'algebra',
          unitId: 'u-5',
          challengeCount: 3,
        })),
      },
    ],
  }
}

const catalog = {
  subjects: [],
  topics: [],
  units: [
    { id: 'u-5', subjectId: 'math', gradeLevel: '8', topicId: 'algebra', title: 'Linear equations', description: '', rolloutState: 'active' as const, order: 2 },
  ],
  lessons: LESSONS.map((lesson) => ({
    id: lesson.id,
    subjectId: 'math',
    gradeLevel: '8',
    unitId: 'u-5',
    topicId: 'algebra',
    title: lesson.title,
    objective: '',
    difficulty: 'practice',
    estimatedMinutes: 10,
    rolloutState: 'active' as const,
    exerciseCount: lesson.exercises,
    source: 'test',
  })),
  rolloutSubjects: ['math'],
  includePreview: false,
  source: 'test',
}

const challenge = (id: string, rest: Partial<PracticeLesson['challenges'][number]>) => ({
  // `challengeId`, because that is what the backend sends. These fixtures said
  // `id`, the type agreed with them, and every answer in production went to
  // `/practice/challenges/undefined/answer`.
  challengeId: id,
  lessonId: 'l-2',
  unitId: 'u-5',
  subjectId: 'math',
  gradeLevel: '8',
  topicId: 'algebra',
  topic: 'Solve for x.',
  type: 'multiple_choice' as const,
  prompt: '3x + 5 = 20',
  // What only the backend's check should know: none of it goes to Ask.
  correctAnswer: 'x = 5',
  hint: 'Subtract 5 from both sides first.',
  explanation: 'Take 5 away, then divide by 3.',
  ...rest,
})

const lesson: PracticeLesson = {
  id: 'l-2',
  unitId: 'u-5',
  subjectId: 'math',
  gradeLevel: '8',
  topicId: 'algebra',
  title: 'Balancing both sides',
  topic: 'Linear equations',
  difficulty: 'practice',
  status: 'available',
  estimatedMinutes: 10,
  challenges: [
    challenge('ch-1', { options: ['x = 3', 'x = 5', 'x = 15', 'x = 25'] }),
    challenge('ch-2', {
      type: 'text_input',
      topic: 'Divide.',
      prompt: 'What is 12 ÷ 4?',
      correctAnswer: '3',
      hint: 'How many 4s make 12?',
      explanation: 'Four threes are twelve.',
    }),
  ],
}

const RIGHT: Record<string, string> = { 'ch-1': 'x = 5', 'ch-2': '3' }

/** None of what the exercise keeps from the student may leave in a message. */
function expectNoAnswerKey(sent: string) {
  const first = lesson.challenges[0]
  expect(sent).not.toContain(`${first.correctAnswer}`)
  expect(sent).not.toContain(first.hint)
  expect(sent).not.toContain(first.explanation)
}

const emptyThread = (id: string) =>
  ({
    id,
    title: 'Balancing',
    subject: 'math',
    grade: '8',
    updatedAt: '2026-09-28T10:00:00.000Z',
    messages: [],
  }) as Awaited<ReturnType<typeof getConversation>>

// ---------------------------------------------------------------------------
// Harness
// ---------------------------------------------------------------------------

function emulate(width: number, { reducedMotion = false } = {}) {
  window.matchMedia = ((query: string) => {
    const min = query.match(/min-width:\s*(\d+)px/)
    return {
      matches: query.includes('prefers-reduced-motion') ? reducedMotion : !min || width >= Number(min[1]),
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }
  }) as typeof window.matchMedia
}

function Where() {
  const location = useLocation()
  return (
    <p data-testid="where" data-state={JSON.stringify(location.state ?? null)}>
      {location.pathname}
    </p>
  )
}

function open(at: string | { pathname: string; state: unknown }, { width = 1280, reducedMotion = false } = {}) {
  emulate(width, { reducedMotion })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[at]}>
          <Routes>
            <Route path="/chapter/:unitId" element={<ChapterPage />} />
            <Route path="/chapter/:unitId/:lessonId" element={<LessonStagePage />} />
            <Route path="*" element={<p>elsewhere</p>} />
          </Routes>
          <Where />
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  )
  return client
}

const stage = () => document.querySelector<HTMLElement>('[data-stage-page]')!
const askPanel = () => screen.getByRole('complementary', { name: 'Ask' })
const findAskPanel = () => screen.findByRole('complementary', { name: 'Ask' })
const dockedField = () => within(document.querySelector<HTMLElement>('[data-ask-docked]')!).getByRole('textbox')

function select(node: Node) {
  const range = document.createRange()
  range.selectNodeContents(node)
  const selection = window.getSelection()!
  selection.removeAllRanges()
  selection.addRange(range)
  act(() => {
    document.dispatchEvent(new Event('selectionchange'))
  })
}

const originalMatchMedia = window.matchMedia

beforeEach(async () => {
  await i18n.changeLanguage('en')
  completed = new Set(['l-1'])
  useAuthStore.setState({
    user: { id: 'u-1', name: 'Lina Meier', email: 'lina@example.com', role: 'student' } as CurrentUser,
    accessToken: 'token',
    isAuthenticated: true,
  })
  resetAsk()
  vi.mocked(getCurriculumCatalog).mockResolvedValue(catalog)
  vi.mocked(getPracticeRoadmap).mockImplementation(async () => roadmap())
  vi.mocked(getPracticeLesson).mockResolvedValue(lesson)
  vi.mocked(submitChallengeAnswer).mockImplementation(async (challengeId, payload) => {
    const correct = payload.answer === RIGHT[challengeId]
    return {
      challengeId,
      correct,
      feedback: correct ? 'You kept the equation balanced.' : 'Put your answer back into the equation.',
      explanation: correct ? 'Undo the addition before the multiplication.' : undefined,
      attemptsRemaining: correct ? 2 : 1,
    }
  })
  vi.mocked(completePracticeLesson).mockImplementation(async (lessonId) => {
    completed.add(lessonId)
    return { lessonId } as Awaited<ReturnType<typeof completePracticeLesson>>
  })
  vi.mocked(getConversations).mockResolvedValue({ items: [] })
  vi.mocked(getGenerationProgress).mockResolvedValue({
    conversationId: 'c-new',
    steps: [],
    updatedAt: new Date().toISOString(),
    status: 'ai_running',
  } as Awaited<ReturnType<typeof getGenerationProgress>>)
  // jsdom has no 2D canvas.
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
})

afterEach(() => {
  window.matchMedia = originalMatchMedia
  window.getSelection()?.removeAllRanges()
  sessionStorage.clear()
  vi.restoreAllMocks()
  vi.clearAllMocks()
})

// ---------------------------------------------------------------------------

describe('the chapter', () => {
  it('lists the lessons in their order, with how far the student is', async () => {
    open('/chapter/u-5')

    expect(await screen.findByRole('heading', { level: 1, name: 'Linear equations' })).toBeInTheDocument()
    expect(getPracticeRoadmap).toHaveBeenCalledWith('math', 'algebra')
    const rows = within(document.querySelector<HTMLElement>('[data-chapter-lessons]')!).getAllByRole('listitem')
    expect(rows.map((row) => row.textContent)).toEqual([
      expect.stringContaining('What an equation says'),
      expect.stringContaining('Balancing both sides'),
      expect.stringContaining('Equations with brackets'),
    ])
    expect(rows.map((row) => row.getAttribute('data-lesson-status'))).toEqual(['completed', 'current', 'available'])
    expect(within(rows[0]).getByText('Done')).toBeInTheDocument()
    expect(within(rows[1]).getByText('Up next')).toBeInTheDocument()
    // Exercise counts from the catalog, not the roadmap's estimate.
    expect(within(rows[2]).getByText('10 min · 4 exercises')).toBeInTheDocument()

    expect(screen.getByText('1 of 3 lessons done')).toBeInTheDocument()
    const progress = screen.getByRole('progressbar', { name: 'Chapter progress' })
    expect(progress).toHaveAttribute('aria-valuenow', '33')
    // One lit button: on with the lesson in progress.
    expect(screen.getByRole('link', { name: 'Continue: Balancing both sides' })).toHaveAttribute('href', '/chapter/u-5/l-2')
    expect(within(rows[2]).getByRole('link', { name: /^Lesson 3:/ })).toHaveAttribute('href', '/chapter/u-5/l-3')
    expect(within(rows[1]).getByRole('link', { name: /^Lesson 2:/ })).toHaveAttribute('aria-current', 'step')
    // A lesson open to the student can be tested out of; a done one cannot (a locked one neither, #96).
    expect(within(rows[0]).queryByRole('link', { name: /^Skip this lesson/ })).not.toBeInTheDocument()
    expect(within(rows[2]).getByRole('link', { name: 'Skip this lesson: Equations with brackets' })).toHaveAttribute('href', '/chapter/u-5/l-3?mode=quiz')
  })

  it('says so when the unit is not in the catalog', async () => {
    open('/chapter/u-404')

    expect(await screen.findByRole('alert')).toHaveTextContent('This chapter could not be found.')
    expect(getPracticeRoadmap).not.toHaveBeenCalled()
  })
})

describe('the practice stage', () => {
  it('checks an answer with the backend and shows the feedback', async () => {
    open('/chapter/u-5/l-2')

    expect(await screen.findByRole('heading', { level: 2, name: '3x + 5 = 20' })).toBeInTheDocument()
    expect(await screen.findByText('Linear equations · Lesson 2 of 3 · Question 1 of 2')).toBeInTheDocument()
    const check = screen.getByRole('button', { name: 'Check answer' })
    expect(check).toBeDisabled()

    await userEvent.click(screen.getByRole('radio', { name: /x = 3/ }))
    await userEvent.click(check)
    expect(submitChallengeAnswer).toHaveBeenCalledWith('ch-1', { answer: 'x = 3' })
    expect(await screen.findByText('Not quite')).toBeInTheDocument()
    expect(screen.getByText('Put your answer back into the equation.')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    await userEvent.click(screen.getByRole('radio', { name: /x = 5/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Check answer' }))

    expect(await screen.findByText('Correct')).toBeInTheDocument()
    expect(screen.getByText('Undo the addition before the multiplication.')).toBeInTheDocument()
    expect(document.querySelector('[data-stage-feedback]')).toHaveAttribute('data-stage-feedback', 'correct')
    // Right answered: the answers hold still, and the one lit button goes on.
    expect(screen.getByRole('radio', { name: /x = 5/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Next question' })).toBeEnabled()
  })

  it('finishes the lesson, and the chapter reads its progress again', async () => {
    open('/chapter/u-5/l-2')

    await userEvent.click(await screen.findByRole('radio', { name: /x = 5/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Check answer' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Next question' }))
    await userEvent.type(await screen.findByRole('textbox', { name: 'Your answer' }), '3{Enter}')
    await userEvent.click(await screen.findByRole('button', { name: 'Finish lesson' }))

    expect(vi.mocked(completePracticeLesson).mock.calls[0][0]).toBe('l-2')
    expect(await screen.findByRole('heading', { name: 'Lesson complete' })).toHaveFocus()
    expect(screen.getByText('2 of 3 lessons in Linear equations done')).toBeInTheDocument()
    const next = screen.getByRole('link', { name: 'Next lesson: Equations with brackets' })
    expect(next).toHaveAttribute('href', '/chapter/u-5/l-3')

    await userEvent.click(screen.getByRole('link', { name: 'Back to the chapter' }))
    expect(await screen.findByText('2 of 3 lessons done')).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: 'Chapter progress' })).toHaveAttribute('aria-valuenow', '67')
  })

  it('moves the keyboard to the next question, and does it all without a pointer', async () => {
    open('/chapter/u-5/l-2')
    await screen.findByRole('heading', { level: 2, name: '3x + 5 = 20' })

    const first = screen.getByRole('radio', { name: /x = 3/ })
    for (let step = 0; step < 20 && document.activeElement !== first; step += 1) await userEvent.tab()
    expect(first).toHaveFocus()
    // Arrow keys walk the answers, as in any radio group.
    await userEvent.keyboard('{ArrowDown}')
    const second = screen.getByRole('radio', { name: /x = 5/ })
    expect(second).toBeChecked()
    expect(second).toHaveFocus()

    const check = screen.getByRole('button', { name: 'Check answer' })
    for (let step = 0; step < 20 && document.activeElement !== check; step += 1) await userEvent.tab()
    expect(check).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    const next = await screen.findByRole('button', { name: 'Next question' })
    next.focus()
    await userEvent.keyboard('{Enter}')

    expect(await screen.findByRole('heading', { level: 2, name: 'What is 12 ÷ 4?' })).toHaveFocus()
  })
})

describe('a lesson the chapter does not open', () => {
  const lockedRoadmap = () => {
    const served = roadmap()
    served.units[0].lessons = served.units[0].lessons.map((item) =>
      item.id === 'l-2' ? { ...item, status: 'locked' as const } : item,
    )
    return served
  }

  it('says a locked lesson is locked, with the way back to its chapter, instead of the exercise', async () => {
    vi.mocked(getPracticeRoadmap).mockImplementation(async () => lockedRoadmap())
    open('/chapter/u-5/l-2')

    expect(await screen.findByRole('heading', { level: 1, name: 'This lesson is locked' })).toBeInTheDocument()
    expect(screen.getByText('Finish the lessons before it in this chapter first.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to the chapter' })).toHaveAttribute('href', '/chapter/u-5')
    expect(screen.queryByRole('heading', { level: 2, name: '3x + 5 = 20' })).not.toBeInTheDocument()
    expect(screen.queryByRole('complementary', { name: 'Ask' })).not.toBeInTheDocument()
    // No test-out from a locked lesson (#96).
    expect(screen.queryByRole('link', { name: /^Skip this lesson/ })).not.toBeInTheDocument()
  })

  it('shows no exercise while the chapter is still saying whether the lesson is open', async () => {
    let answer: (value: PracticeRoadmap) => void = () => {}
    vi.mocked(getPracticeRoadmap).mockImplementation(() => new Promise((resolve) => (answer = resolve)))
    open('/chapter/u-5/l-2')

    await waitFor(() => expect(getPracticeRoadmap).toHaveBeenCalled())
    await waitFor(() => expect(getPracticeLesson).toHaveBeenCalled())
    // The lesson is in; the chapter is not.
    await act(async () => {
      await Promise.resolve()
    })
    expect(screen.getByText('Loading the lesson…')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 2, name: '3x + 5 = 20' })).not.toBeInTheDocument()

    await act(async () => answer(lockedRoadmap()))
    expect(await screen.findByRole('heading', { level: 1, name: 'This lesson is locked' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { level: 2, name: '3x + 5 = 20' })).not.toBeInTheDocument()
  })

  it('finds nothing for a lesson of another unit under this chapter', async () => {
    vi.mocked(getPracticeLesson).mockResolvedValue({ ...lesson, id: 'l-9', unitId: 'u-6' })
    open('/chapter/u-5/l-9')

    expect(await screen.findByRole('alert')).toHaveTextContent('This lesson could not be found.')
    expect(screen.getByRole('link', { name: 'Back to the chapter' })).toHaveAttribute('href', '/chapter/u-5')
    expect(screen.queryByRole('heading', { level: 2, name: '3x + 5 = 20' })).not.toBeInTheDocument()
  })
})

describe('Ask beside the stage', () => {
  it('sits beside the exercise on a wide screen and tells a new conversation which exercise is on screen', async () => {
    vi.mocked(createConversation).mockResolvedValue({
      id: 'c-new',
      title: 'Balancing',
      subject: 'math',
      grade: '8',
      updatedAt: '2026-09-28T10:00:00.000Z',
      messages: [],
    } as Awaited<ReturnType<typeof createConversation>>)
    vi.mocked(getConversation).mockResolvedValue({
      id: 'c-new',
      title: 'Balancing',
      subject: 'math',
      grade: '8',
      updatedAt: '2026-09-28T10:00:00.000Z',
      messages: [],
    } as Awaited<ReturnType<typeof getConversation>>)
    open('/chapter/u-5/l-2')
    await userEvent.click(await screen.findByRole('radio', { name: /x = 3/ }))

    const panel = askPanel()
    expect(panel).toHaveAttribute('data-ask-entry', 'stage')
    expect(panel.style.width).toBe('420px')
    expect(within(panel).getByText('Knows the question you are on')).toBeInTheDocument()
    // Beside, not over: the exercise stays usable.
    expect(stage()).not.toHaveAttribute('inert')

    await userEvent.type(within(panel).getByRole('textbox', { name: 'Your question' }), 'Why is it not 3?{Enter}')

    expect(createConversation).toHaveBeenCalledTimes(1)
    const sent = vi.mocked(createConversation).mock.calls[0][0].initialMessage ?? ''
    expectNoAnswerKey(sent)
    // TEXT FALLBACK (#56): the question first, then the exercise in words.
    expect(sent.split('\n')).toEqual([
      'Why is it not 3?',
      '',
      'Practice topic: Solve for x.',
      'Practice question: 3x + 5 = 20',
      'My answer: x = 3',
    ])
    // Asking there did not leave Ask open over the map.
    expect(useAskStore.getState().open).toBe(false)
  })

  it('docks under the stage on a phone and opens a modal sheet that knows the exercise too', async () => {
    vi.mocked(createConversation).mockImplementation(() => new Promise(() => {}))
    open('/chapter/u-5/l-2', { width: 375 })
    await screen.findByRole('heading', { level: 2, name: '3x + 5 = 20' })
    expect(screen.queryByRole('complementary', { name: 'Ask' })).not.toBeInTheDocument()

    await userEvent.type(dockedField(), 'H')
    const sheet = screen.getByRole('dialog', { name: 'Ask' })
    expect(sheet).toHaveAttribute('aria-modal', 'true')
    expect(sheet.style.height).toBe('72%')
    expect(stage()).toHaveAttribute('inert')
    const field = within(sheet).getByRole('textbox', { name: 'Your question' })
    expect(field).toHaveFocus()
    expect(field).toHaveValue('H')

    // The keyboard stays in the sheet.
    for (let step = 0; step < 8; step += 1) {
      await userEvent.tab()
      expect(sheet.contains(document.activeElement)).toBe(true)
    }

    field.focus()
    await userEvent.type(field, 'elp{Enter}')
    const sent = vi.mocked(createConversation).mock.calls[0][0].initialMessage ?? ''
    expect(sent).toContain('Practice question: 3x + 5 = 20')
    expectNoAnswerKey(sent)

    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', { name: 'Ask' })).not.toBeInTheDocument()
    expect(stage()).not.toHaveAttribute('inert')
    expect(dockedField()).toHaveFocus()
  })

  it('tells a conversation again only when what is on screen has changed', () => {
    const t = i18n.getFixedT('en', 'chat')
    const practice: AskPractice = {
      context: { unitId: 'u-5', lessonId: 'l-2', challengeId: 'ch-1', topic: 'Solve for x.', prompt: '3x + 5 = 20', attempts: 0, hintViewed: false },
    }
    const first = withPracticeContext(t, practice, 'c1', 'Why?')
    expect(first.content).toBe(describePracticeContext(t, practice.context, 'Why?'))
    // Not told until the message went out.
    expect(withPracticeContext(t, practice, 'c1', 'Why?').content).toContain('Practice question')
    first.told('c1')
    expect(withPracticeContext(t, practice, 'c1', 'And now?').content).toBe('And now?')
    // Another conversation has not been told.
    expect(withPracticeContext(t, practice, 'c2', 'Why?').content).toContain('Practice question: 3x + 5 = 20')
    // Another answer on the same exercise is news.
    practice.context = { ...practice.context, answer: 'x = 5', attempts: 1 }
    expect(withPracticeContext(t, practice, 'c1', 'Better?').content).toContain('My answer: x = 5')
    // Without a stage there is nothing to tell.
    expect(withPracticeContext(t, undefined, null, 'Hi').content).toBe('Hi')
  })

  describe('in a conversation already open', () => {
    const streamMock = () => vi.mocked(streamConversationMessage)
    const sentAt = (index: number) => streamMock().mock.calls[index][0].payload
    const ask = async (panel: HTMLElement, question: string) => {
      await userEvent.type(within(panel).getByRole('textbox', { name: 'Your question' }), `${question}{Enter}`)
    }
    // The answer is in (or the send has failed) once Stop has gone.
    const settled = (panel: HTMLElement, calls: number) =>
      waitFor(
        () => {
          expect(streamMock()).toHaveBeenCalledTimes(calls)
          expect(within(panel).queryByRole('button', { name: 'Stop' })).not.toBeInTheDocument()
        },
        { timeout: 5000 },
      )

    beforeEach(() => {
      useAskStore.setState({ ownerId: 'u-1', open: false, conversationId: 'c1', draft: '' })
      vi.mocked(getConversation).mockResolvedValue(emptyThread('c1'))
    })

    it('tells it once, and again only after the exercise on screen changed', async () => {
      streamMock().mockResolvedValue('streamed')
      open('/chapter/u-5/l-2')
      await screen.findByRole('heading', { level: 2, name: '3x + 5 = 20' })
      const panel = await findAskPanel()

      await ask(panel, 'Why subtract?')
      await settled(panel, 1)
      expect(sentAt(0).content).toContain('Practice question: 3x + 5 = 20')
      expectNoAnswerKey(sentAt(0).content)

      // Nothing on screen changed: the question alone.
      await ask(panel, 'And then?')
      await settled(panel, 2)
      expect(sentAt(1).content).toBe('And then?')

      // Another answer down: told again, with it.
      await userEvent.click(screen.getByRole('radio', { name: /x = 3/ }))
      await ask(panel, 'Is this right?')
      await settled(panel, 3)
      expect(sentAt(2).content).toContain('My answer: x = 3')
      expectNoAnswerKey(sentAt(2).content)

      // Another exercise: told again.
      await userEvent.click(screen.getByRole('radio', { name: /x = 5/ }))
      await userEvent.click(screen.getByRole('button', { name: 'Check answer' }))
      await userEvent.click(await screen.findByRole('button', { name: 'Next question' }))
      await screen.findByRole('heading', { level: 2, name: 'What is 12 ÷ 4?' })
      await ask(panel, 'How do I divide?')
      await settled(panel, 4)
      expect(sentAt(3).content).toContain('Practice question: What is 12 ÷ 4?')
    })

    it('counts a message that failed as not told, and sends it again as it was', async () => {
      // The first send and the retry fail before the server has them.
      streamMock()
        .mockRejectedValueOnce(new TypeError('Failed to fetch'))
        .mockRejectedValueOnce(new TypeError('Failed to fetch'))
        .mockResolvedValue('streamed')
      vi.mocked(getGenerationProgress).mockRejectedValue(
        new ApiError('not found', { status: 404, code: 'message_command_not_found' }),
      )
      open('/chapter/u-5/l-2')
      await screen.findByRole('heading', { level: 2, name: '3x + 5 = 20' })
      const panel = await findAskPanel()

      await ask(panel, 'Why subtract?')
      await settled(panel, 1)
      expect(sentAt(0).content).toContain('Practice question: 3x + 5 = 20')
      await userEvent.click(await within(panel).findByRole('button', { name: 'Send again' }, { timeout: 5000 }))

      // Sent again, it is the same message: same words, same key.
      await settled(panel, 2)
      expect(sentAt(1).content).toBe(sentAt(0).content)
      expect(sentAt(1).idempotencyKey).toBe(sentAt(0).idempotencyKey)
      expect(await within(panel).findByRole('button', { name: 'Send again' }, { timeout: 5000 })).toBeInTheDocument()

      // Neither got through, so a new question instead carries the context.
      await ask(panel, 'Where do I start?')
      await settled(panel, 3)
      expect(sentAt(2).content).toContain('Where do I start?')
      expect(sentAt(2).content).toContain('Practice question: 3x + 5 = 20')
    })

    it('does not tell the same conversation the same thing again after the stage remounts', async () => {
      streamMock().mockResolvedValue('streamed')
      const first = open('/chapter/u-5/l-2')
      await screen.findByRole('heading', { level: 2, name: '3x + 5 = 20' })
      await ask(await findAskPanel(), 'Why subtract?')
      await settled(askPanel(), 1)
      expect(sentAt(0).content).toContain('Practice question: 3x + 5 = 20')
      first.clear()
      cleanup()

      open('/chapter/u-5/l-2')
      await screen.findByRole('heading', { level: 2, name: '3x + 5 = 20' })
      await ask(await findAskPanel(), 'And then?')
      await settled(askPanel(), 2)
      expect(sentAt(1).content).toBe('And then?')
    })
  })
})

describe('「问这段」, ask about this', () => {
  it('appears by text chosen in the exercise, disabled and marked coming soon', async () => {
    open('/chapter/u-5/l-2')
    const prompt = await screen.findByRole('heading', { level: 2, name: '3x + 5 = 20' })
    expect(screen.queryByRole('group', { name: 'Ask about the selected text' })).not.toBeInTheDocument()

    select(prompt)

    const chip = screen.getByRole('group', { name: 'Ask about the selected text' })
    expect(chip).toHaveAttribute('data-quote-chip', 'exercise')
    const ask = within(chip).getByRole('button', { name: 'Ask about this' })
    expect(ask).toBeDisabled()
    expect(ask).toHaveAccessibleDescription('Coming soon')

    window.getSelection()?.removeAllRanges()
    act(() => {
      document.dispatchEvent(new Event('selectionchange'))
    })
    expect(screen.queryByRole('group', { name: 'Ask about the selected text' })).not.toBeInTheDocument()
  })

  it('appears by text chosen in an answer in Ask, and not elsewhere', async () => {
    useAskStore.setState({ ownerId: 'u-1', open: false, conversationId: 'c1', draft: '' })
    vi.mocked(getConversation).mockResolvedValue({
      id: 'c1',
      title: 'Balancing',
      subject: 'math',
      grade: '8',
      updatedAt: '2026-09-28T10:00:00.000Z',
      messages: [
        { id: 's1', conversationId: 'c1', role: 'student', content: 'Why subtract 5?', createdAt: '2026-09-28T10:00:00.000Z', status: 'completed', attachments: [] },
        { id: 'a1', conversationId: 'c1', role: 'assistant', content: 'It keeps the equation balanced.', createdAt: '2026-09-28T10:00:01.000Z', status: 'completed', attachments: [] },
      ],
    } as Awaited<ReturnType<typeof getConversation>>)
    open('/chapter/u-5/l-2')

    const answer = await within(await findAskPanel()).findByText('It keeps the equation balanced.')
    select(answer)
    expect(screen.getByRole('group', { name: 'Ask about the selected text' })).toHaveAttribute('data-quote-chip', 'answer')

    // The student's own message is not a source.
    select(within(askPanel()).getByText('Why subtract 5?'))
    expect(screen.queryByRole('group', { name: 'Ask about the selected text' })).not.toBeInTheDocument()
  })
})

describe('where 「问这段」 sits', () => {
  // A three-line answer, 100 px to 180 px, with other messages 12 px above and below.
  const block = { top: 100, bottom: 180 }

  it('stays inside the passage it is about, off the messages beside it', () => {
    // First line chosen: no room above inside the answer, so below it.
    expect(chipTop({ top: 110, bottom: 132 }, block)).toBe(136)
    // Last line chosen: above it.
    expect(chipTop({ top: 150, bottom: 172 }, block)).toBe(110)
    // First two lines chosen: no clear room, so over the selection's lower edge, inside the answer.
    expect(chipTop({ top: 110, bottom: 150 }, block)).toBe(144)
    // All of it chosen: outside, above, where there is room.
    expect(chipTop({ top: 100, bottom: 180 }, block)).toBe(60)
    // ...and below at the top of the window.
    expect(chipTop({ top: 20, bottom: 60 }, { top: 20, bottom: 60 })).toBe(64)
  })
})

describe('the jump from a star', () => {
  it('keeps its timing: bloom 120, streaks 300, settle 140, once', () => {
    expect(JUMP).toEqual({ bloomMs: 120, streaksMs: 300, settleMs: 140 })
    expect(JUMP_MS).toBe(560)
    const start = jumpFrameAt(0)
    expect(start.veil).toBe(1)
    expect(start.streakAlpha).toBe(0)
    expect(jumpFrameAt(JUMP.bloomMs).bloom).toBeGreaterThan(start.bloom)
    expect(jumpFrameAt(JUMP.bloomMs + JUMP.streaksMs).streak).toBeCloseTo(1)
    const end = jumpFrameAt(JUMP_MS)
    expect(end.veil).toBe(0)
    expect(end.bloomAlpha).toBe(0)
    expect(end.streakAlpha).toBe(0)
  })

  it('leaves the star with where it was', async () => {
    emulate(1280)
    const map = skyMap(10)
    const star = map.stars.find((candidate) => candidate.unitId === 'demo-sine-cosine')!
    const nebula = map.nebulae.find((candidate) => candidate.topicId === star.nebulaId)!
    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={['/map/math/trigonometry/demo-sine-cosine']}>
          <Routes>
            <Route path="/map/*" element={<StarCard map={map} star={star} nebula={nebula} reducedMotion={false} />} />
            <Route path="*" element={null} />
          </Routes>
          <Where />
        </MemoryRouter>
      </I18nextProvider>,
    )

    await userEvent.click(screen.getByRole('link', { name: 'Continue' }))

    expect(screen.getByTestId('where')).toHaveTextContent('/chapter/demo-sine-cosine')
    expect(JSON.parse(screen.getByTestId('where').dataset.state ?? 'null')).toEqual({ jump: { x: 0, y: 0 } })
  })

  it('plays once on a canvas over the chapter, then forgets it was asked to', async () => {
    const context = new Proxy(
      {},
      {
        get: (_target, name) =>
          name === 'createRadialGradient' ? () => ({ addColorStop: () => {} }) : typeof name === 'string' ? vi.fn() : undefined,
      },
    )
    vi.mocked(HTMLCanvasElement.prototype.getContext).mockReturnValue(context as unknown as CanvasRenderingContext2D)
    open({ pathname: '/chapter/u-5', state: { jump: { x: 200, y: 300 } } })

    expect(document.querySelector('[data-jump-canvas]')).not.toBeNull()
    expect(document.querySelector('[data-jump-canvas]')).toHaveAttribute('aria-hidden', 'true')
    // The state is dropped, so going back or reloading does not jump again.
    await vi.waitFor(() => expect(screen.getByTestId('where').dataset.state).toBe('null'))
    await vi.waitFor(() => expect(document.querySelector('[data-jump-canvas]')).toBeNull(), { timeout: 2000 })
    expect(await screen.findByRole('heading', { level: 1, name: 'Linear equations' })).toBeInTheDocument()
  })

  it('covers the chapter from the first paint, before any animation frame', async () => {
    const fillRect = vi.fn()
    const context = new Proxy(
      {},
      {
        get: (_target, name) =>
          name === 'fillRect'
            ? fillRect
            : name === 'createRadialGradient'
              ? () => ({ addColorStop: () => {} })
              : typeof name === 'string'
                ? vi.fn()
                : undefined,
      },
    )
    vi.mocked(HTMLCanvasElement.prototype.getContext).mockReturnValue(context as unknown as CanvasRenderingContext2D)
    // No animation frame ever runs.
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 1)
    open({ pathname: '/chapter/u-5', state: { jump: { x: 200, y: 300 } } })

    expect(document.querySelector('[data-jump-canvas]')).not.toBeNull()
    // The sky veil of frame 0 is already drawn over the whole window.
    expect(fillRect).toHaveBeenCalledWith(0, 0, window.innerWidth, window.innerHeight)
    await screen.findByRole('heading', { level: 1, name: 'Linear equations' })
  })

  it('becomes a crossfade under reduced motion, with nothing drawn', async () => {
    open({ pathname: '/chapter/u-5', state: { jump: { x: 200, y: 300 } } }, { reducedMotion: true })

    expect(await screen.findByRole('heading', { level: 1, name: 'Linear equations' })).toBeInTheDocument()
    expect(document.querySelector('[data-jump="crossfade"]')).toHaveAttribute('data-chapter-motion', 'crossfade')
    expect(document.querySelector('[data-jump-canvas]')).toBeNull()
    expect(HTMLCanvasElement.prototype.getContext).not.toHaveBeenCalled()
  })

  it('does not play for a chapter opened from a link', async () => {
    open('/chapter/u-5')

    expect(await screen.findByRole('heading', { level: 1, name: 'Linear equations' })).toBeInTheDocument()
    expect(document.querySelector('[data-jump]')).toBeNull()
    expect(document.querySelector('[data-jump-canvas]')).toBeNull()
  })
})
