/**
 * Skipping and the short quiz on the practice stage (product decision
 * 2026-09-29, after Duolingo), through the real API layer against a mocked
 * backend (MSW) and the real `practiceLessonReducer`.
 *
 * - Skip gives no credit: the exercise goes to the back, and skipping every
 *   exercise never finishes the lesson;
 * - once only skipped exercises are left, the short quiz is offered instead:
 *   what is skipped plus up to 2 answered right, at least 3;
 * - in a quiz: no hints, Ask off, no skip; one mistake forgiven (two hearts);
 *   passing finishes the lesson, losing it changes nothing and can be retried;
 * - from the chapter, 「跳过这一课」 tests out of a lesson with the same quiz.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  composeSkipQuiz,
  composeTestOutQuiz,
  QUIZ_HEARTS,
  QUIZ_MAX_MISTAKES,
  QUIZ_TEST_OUT_SIZE,
} from '@/features/chapter/quiz'
import i18n from '@/i18n'
import { ChapterPage, LessonStagePage } from '@/pages/chapter/ChapterPages'
import { ApiError } from '@/services/api/httpClient'
import { resetAsk } from '@/store/askStore'
import { type CurrentUser, useAuthStore } from '@/store/authStore'
import { mswServer } from '../mswServer'

vi.mock('@/services/analytics/analyticsClient', () => ({ trackEvent: vi.fn() }))
vi.mock('@/hooks/notifications/useNotificationsQuery', () => ({
  useNotificationsQuery: () => ({ data: { items: [] }, isLoading: false, isError: false }),
  useMarkNotificationReadMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useArchiveNotificationMutation: () => ({ mutate: vi.fn(), isPending: false }),
}))
vi.mock('@/hooks/notifications/useRealtimeNotifications', () => ({
  useRealtimeNotifications: () => ({ status: 'disabled' }),
}))
// Ask's own services: not what these tests are about.
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

// ---------------------------------------------------------------------------
// The backend
// ---------------------------------------------------------------------------

const API = 'https://api.test'
const LESSONS = [
  { id: 'l-1', title: 'What an equation says', order: 1, exercises: 2 },
  { id: 'l-2', title: 'Balancing both sides', order: 2, exercises: 6 },
  { id: 'l-3', title: 'Equations with brackets', order: 3, exercises: 3 },
  { id: 'l-4', title: 'Word problems', order: 4, exercises: 2 },
]

type Seen = { answers: { id: string; answer: unknown }[]; completes: string[]; hints: number }
let completed: Set<string>
let seen: Seen

/** A lesson opens when the one before it is done; the first open one is up next. */
function statusOf(id: string) {
  if (completed.has(id)) return 'completed'
  const index = LESSONS.findIndex((lesson) => lesson.id === id)
  const open = (i: number) => i === 0 || completed.has(LESSONS[i - 1].id)
  if (!open(index)) return 'locked'
  const first = LESSONS.findIndex((lesson, i) => !completed.has(lesson.id) && open(i))
  return first === index ? 'current' : 'available'
}

// Exercise n of a lesson: "Exercise n: what is n × 2?", answered 2n.
const exerciseId = (lessonId: string, n: number) => `${lessonId}-e${n}`
const right = (id: string) => String(Number(id.split('-e')[1]) * 2)

function lessonBody(lessonId: string) {
  const meta = LESSONS.find((lesson) => lesson.id === lessonId)!
  return {
    id: lessonId,
    unitId: 'u-5',
    subjectId: 'math',
    gradeLevel: '8',
    topicId: 'algebra',
    title: meta.title,
    topic: 'Linear equations',
    difficulty: 'practice',
    status: statusOf(lessonId),
    estimatedMinutes: 10,
    challenges: Array.from({ length: meta.exercises }, (_, i) => ({
      id: exerciseId(lessonId, i + 1),
      lessonId,
      unitId: 'u-5',
      subjectId: 'math',
      gradeLevel: '8',
      topicId: 'algebra',
      topic: 'Multiply.',
      type: 'text_input',
      prompt: `Exercise ${i + 1}: what is ${i + 1} × 2?`,
    })),
  }
}

function backend() {
  mswServer.use(
    http.get(`${API}/practice/curriculum/catalog`, () =>
      HttpResponse.json({
        subjects: [],
        topics: [],
        units: [{ id: 'u-5', subjectId: 'math', gradeLevel: '8', topicId: 'algebra', title: 'Linear equations', description: '', rolloutState: 'active', order: 2 }],
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
          rolloutState: 'active',
          exerciseCount: lesson.exercises,
          source: 'test',
        })),
        rolloutSubjects: ['math'],
        includePreview: false,
        source: 'test',
      }),
    ),
    http.get(`${API}/practice/math/algebra/roadmap`, () =>
      HttpResponse.json({
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
            lessons: LESSONS.map((lesson) => ({
              id: lesson.id,
              title: lesson.title,
              order: lesson.order,
              status: statusOf(lesson.id),
              estimatedMinutes: 10,
              subjectId: 'math',
              gradeLevel: '8',
              topicId: 'algebra',
              unitId: 'u-5',
              challengeCount: lesson.exercises,
            })),
          },
        ],
      }),
    ),
    http.get(`${API}/practice/lessons/:lessonId`, ({ params }) => HttpResponse.json(lessonBody(String(params.lessonId)))),
    http.post(`${API}/practice/challenges/:challengeId/answer`, async ({ params, request }) => {
      const id = String(params.challengeId)
      const { answer } = (await request.json()) as { answer: unknown }
      seen.answers.push({ id, answer })
      const correct = answer === right(id)
      return HttpResponse.json({
        challengeId: id,
        correct,
        feedback: correct ? 'Well done.' : 'Count again.',
        attemptsRemaining: correct ? 2 : 1,
      })
    }),
    http.post(`${API}/practice/lessons/:lessonId/complete`, ({ params }) => {
      const id = String(params.lessonId)
      seen.completes.push(id)
      completed.add(id)
      return HttpResponse.json({ lessonId: id, completed: true, nextLessonId: null, progressPoints: 10, studyStreak: 1, dailyGoalCompleted: false })
    }),
    http.post(`${API}/practice/hints`, () => {
      seen.hints += 1
      return HttpResponse.json({ title: 'Double it', hint: 'Add it to itself.', nextStep: '' })
    }),
  )
}

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
  return <p data-testid="where">{`${location.pathname}${location.search}`}</p>
}

function open(at: string, { width = 1280, reducedMotion = false } = {}) {
  emulate(width, { reducedMotion })
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[at]}>
          <Routes>
            <Route path="/chapter/:unitId" element={<ChapterPage />} />
            <Route path="/chapter/:unitId/:lessonId" element={<LessonStagePage />} />
          </Routes>
          <Where />
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  )
}

/** The exercise on screen, by its id. */
async function onScreen(lessonId = 'l-2') {
  const prompt = await screen.findByRole('heading', { level: 2, name: /^Exercise \d+:/ })
  const n = Number(prompt.textContent!.match(/^Exercise (\d+):/)![1])
  return exerciseId(lessonId, n)
}

const where = () => screen.getByTestId('where').textContent
const TEST_OUT_NOTE = 'The lesson counts as done. The star lights up once every exercise in it has been answered right.'
const strip = () => document.querySelector('[data-stage-actions]')!
const hearts = () => document.querySelector('[data-quiz-hearts]')

async function answer(value: string) {
  const field = await screen.findByRole('textbox', { name: 'Your answer' })
  await userEvent.type(field, `${value}{Enter}`)
  await screen.findByText(/^(Correct|Not quite)$/)
}

/** Answers the exercise on screen right and goes on. */
async function answerRight(lessonId = 'l-2') {
  const id = await onScreen(lessonId)
  await answer(right(id))
  await userEvent.click(screen.getByRole('button', { name: /^(Next question|Finish lesson|Finish the quiz)$/ }))
  return id
}

/** Answers the exercise on screen wrong; in a quiz, goes on. */
async function answerWrong(lessonId = 'l-2') {
  const id = await onScreen(lessonId)
  await answer('0')
  const go = screen.queryByRole('button', { name: 'Continue' })
  if (go) await userEvent.click(go)
  return id
}

async function skip() {
  const id = await onScreen()
  await userEvent.click(within(strip() as HTMLElement).getByRole('button', { name: 'Skip' }))
  return id
}

/** Every exercise of a quiz answered right, the ids in the order they came. */
async function passQuiz(lessonId = 'l-2') {
  const ids: string[] = []
  for (let step = 0; step < 20 && !screen.queryByRole('heading', { name: 'Lesson complete' }); step += 1) {
    ids.push(await answerRight(lessonId))
    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: 'Lesson complete' }) ?? screen.queryByRole('textbox', { name: 'Your answer' })).toBeTruthy(),
    )
  }
  return ids
}

const originalMatchMedia = window.matchMedia

beforeAll(() => mswServer.listen({ onUnhandledRequest: 'error' }))
beforeEach(async () => {
  await i18n.changeLanguage('en')
  completed = new Set(['l-1'])
  seen = { answers: [], completes: [], hints: 0 }
  useAuthStore.setState({
    user: { id: 'u-1', name: 'Lina Meier', email: 'lina@example.com', role: 'student' } as CurrentUser,
    accessToken: 'token',
    isAuthenticated: true,
  })
  resetAsk()
  backend()
  // jsdom has no 2D canvas.
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
})
afterEach(() => {
  window.matchMedia = originalMatchMedia
  window.getSelection()?.removeAllRanges()
  mswServer.resetHandlers()
  sessionStorage.clear()
  vi.restoreAllMocks()
})
afterAll(() => mswServer.close())

// ---------------------------------------------------------------------------

describe('what the quiz is made of', () => {
  it('keeps its rules in one place: one mistake forgiven, two hearts, five to test out', () => {
    expect(QUIZ_MAX_MISTAKES).toBe(1)
    expect(QUIZ_HEARTS).toBe(2)
    expect(QUIZ_TEST_OUT_SIZE).toBe(5)
  })

  it('takes every skipped exercise and up to two answered right, at least three when there are', () => {
    const quiz = composeSkipQuiz(['a', 'b', 'c'], ['d', 'e', 'f', 'g'])
    expect(quiz).toHaveLength(5)
    expect(quiz).toEqual(expect.arrayContaining(['a', 'b', 'c']))
    expect(quiz.filter((id) => ['d', 'e', 'f', 'g'].includes(id))).toHaveLength(2)
    expect(composeSkipQuiz(['a'], ['b', 'c', 'd'])).toHaveLength(3)
    // A lesson of two: all it has.
    expect(composeSkipQuiz(['a'], ['b']).sort()).toEqual(['a', 'b'])
    expect(composeSkipQuiz(['a', 'b'], [])).toHaveLength(2)
  })

  it('tests out with five of a lesson, or all of a shorter one', () => {
    const six = ['a', 'b', 'c', 'd', 'e', 'f']
    const quiz = composeTestOutQuiz(six)
    expect(quiz).toHaveLength(5)
    expect(new Set(quiz).size).toBe(5)
    expect(composeTestOutQuiz(['a', 'b', 'c']).sort()).toEqual(['a', 'b', 'c'])
  })
})

describe('skipping inside a lesson', () => {
  it('sends the exercise to the back of the queue, with no credit', async () => {
    open('/chapter/u-5/l-2')
    expect(await screen.findByText(/Question 1 of 6/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Skip and finish' })).not.toBeInTheDocument()

    expect(await skip()).toBe('l-2-e1')
    expect(await onScreen()).toBe('l-2-e2')
    // Nothing answered right yet: still the first of six.
    expect(screen.getByText(/Question 1 of 6/)).toBeInTheDocument()

    // Answered right, the others go on; the skipped one comes back at the end.
    for (const expected of ['l-2-e2', 'l-2-e3', 'l-2-e4', 'l-2-e5', 'l-2-e6']) expect(await answerRight()).toBe(expected)
    expect(await onScreen()).toBe('l-2-e1')
    expect(screen.getByText(/Question 6 of 6/)).toBeInTheDocument()
    expect(seen.completes).toEqual([])

    // Answered right at last, it finishes the lesson the normal way.
    await answer('2')
    await userEvent.click(screen.getByRole('button', { name: 'Finish lesson' }))
    expect(await screen.findByRole('heading', { name: 'Lesson complete' })).toBeInTheDocument()
    expect(seen.completes).toEqual(['l-2'])
  })

  it('never finishes the lesson by skipping everything: the quiz is offered instead of skipping again', async () => {
    open('/chapter/u-5/l-2')
    for (let n = 1; n <= 6; n += 1) expect(await skip()).toBe(`l-2-e${n}`)

    // Round again: only skipped exercises left.
    expect(await onScreen()).toBe('l-2-e1')
    expect(within(strip() as HTMLElement).queryByRole('button', { name: 'Skip' })).not.toBeInTheDocument()
    const offer = screen.getByRole('button', { name: 'Short quiz' })
    expect(offer).toHaveAccessibleDescription('Finish this lesson by passing a short quiz.')
    expect(seen.completes).toEqual([])
    expect(screen.queryByRole('heading', { name: 'Lesson complete' })).not.toBeInTheDocument()
  })

  it('finishes as before when every exercise is answered right', async () => {
    open('/chapter/u-5/l-2')
    for (let n = 1; n <= 6; n += 1) expect(await answerRight()).toBe(`l-2-e${n}`)

    expect(await screen.findByRole('heading', { name: 'Lesson complete' })).toHaveFocus()
    expect(seen.completes).toEqual(['l-2'])
    expect(screen.getByText('2 of 4 lessons in Linear equations done')).toBeInTheDocument()
  })
})

describe('the quiz that finishes a lesson with skips', () => {
  /** Answers the first `rightOnes` right, skips the rest, and takes the quiz. */
  async function skipIntoQuiz(rightOnes: number) {
    open('/chapter/u-5/l-2')
    const answered: string[] = []
    for (let n = 1; n <= 6; n += 1) {
      if (n <= rightOnes) answered.push(await answerRight())
      else await skip()
    }
    await userEvent.click(await screen.findByRole('button', { name: 'Short quiz' }))
    return answered
  }

  it('is every skipped exercise and two answered right', async () => {
    const answered = await skipIntoQuiz(3)
    expect(await screen.findByText(/Quiz · Question 1 of 5$/)).toBeInTheDocument()
    const quiz = await passQuiz()
    expect(quiz).toHaveLength(5)
    expect(new Set(quiz).size).toBe(5)
    expect(quiz).toEqual(expect.arrayContaining(['l-2-e4', 'l-2-e5', 'l-2-e6']))
    expect(quiz.filter((id) => answered.includes(id))).toHaveLength(2)
  })

  it('is at least three, topping one skipped exercise up with two answered right', async () => {
    await skipIntoQuiz(5)
    expect(await screen.findByText(/Quiz · Question 1 of 3$/)).toBeInTheDocument()
    const quiz = await passQuiz()
    expect(quiz).toContain('l-2-e6')
    expect(quiz).toHaveLength(3)
  })

  it('has no hints, no skip, and Ask off with a reason, on a wide screen', async () => {
    open('/chapter/u-5/l-2')
    expect(await screen.findByRole('complementary', { name: 'Ask' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Hint' })).toBeInTheDocument()
    for (let n = 1; n <= 6; n += 1) await skip()
    await userEvent.click(await screen.findByRole('button', { name: 'Short quiz' }))

    expect(await screen.findByText(/Quiz · Question 1 of 6$/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Hint' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Skip' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Short quiz' })).not.toBeInTheDocument()
    // Ask: closed, and its composer disabled with the reason.
    expect(screen.queryByRole('complementary', { name: 'Ask' })).not.toBeInTheDocument()
    const composer = within(document.querySelector<HTMLElement>('[data-ask-docked]')!).getByRole('textbox')
    expect(composer).toBeDisabled()
    expect(composer).toHaveAccessibleDescription('Ask is off during the quiz.')
    // 「问这段」 does not come up on a selection.
    const range = document.createRange()
    range.selectNodeContents(screen.getByRole('heading', { level: 2, name: /^Exercise/ }))
    window.getSelection()!.removeAllRanges()
    window.getSelection()!.addRange(range)
    act(() => {
      document.dispatchEvent(new Event('selectionchange'))
    })
    expect(screen.queryByRole('button', { name: /Ask about/ })).not.toBeInTheDocument()

    // Two hearts; a wrong answer is not tried again, it goes on.
    expect(hearts()).toHaveAccessibleName('2 of 2 hearts left')
    await answer('0')
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Skip' })).not.toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Your answer' })).toBeDisabled()
    expect(hearts()).toHaveAccessibleName('1 of 2 hearts left')
    expect(screen.getByText('That cost a heart. 1 heart left.')).toBeInTheDocument()
    expect(seen.hints).toBe(0)

    // Passed, Ask is back.
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }))
    await passQuiz()
    expect(await screen.findByRole('complementary', { name: 'Ask' })).toBeInTheDocument()
  })

  it('keeps the phone composer disabled and never raises the sheet during the quiz', async () => {
    open('/chapter/u-5/l-2', { width: 375 })
    for (let n = 1; n <= 6; n += 1) await skip()
    await userEvent.click(await screen.findByRole('button', { name: 'Short quiz' }))
    await screen.findByText(/Quiz · Question 1 of 6$/)

    expect(screen.queryByRole('button', { name: 'Hint' })).not.toBeInTheDocument()
    const composer = within(document.querySelector<HTMLElement>('[data-ask-docked]')!).getByRole('textbox')
    expect(composer).toBeDisabled()
    await userEvent.type(composer, 'Help')
    expect(screen.queryByRole('dialog', { name: 'Ask' })).not.toBeInTheDocument()
    expect(document.querySelector('[data-ask-surface]')).toBeNull()
  })

  it('passes with no mistakes, and finishes the lesson once', async () => {
    await skipIntoQuiz(4)
    await passQuiz()
    expect(await screen.findByRole('heading', { name: 'Lesson complete' })).toHaveFocus()
    expect(seen.completes).toEqual(['l-2'])
  })

  it('passes with one mistake: the exercise comes back at the end, and the lesson finishes once', async () => {
    await skipIntoQuiz(4)
    expect(await screen.findByText(/Quiz · Question 1 of 4$/)).toBeInTheDocument()
    const missed = await answerWrong()
    expect(hearts()).toHaveAttribute('data-quiz-hearts', '1')
    const rest = await passQuiz()
    expect(rest[rest.length - 1]).toBe(missed)
    expect(rest).toHaveLength(4)
    expect(await screen.findByRole('heading', { name: 'Lesson complete' })).toBeInTheDocument()
    expect(seen.completes).toEqual(['l-2'])
  })

  it('is lost at a second mistake: a calm screen, nothing finished, back to the lesson, and it can be taken again', async () => {
    await skipIntoQuiz(4)
    await answerWrong()
    await answerWrong()

    const failed = await screen.findByRole('heading', { name: 'Not yet' })
    expect(failed).toHaveFocus()
    expect(screen.getByText('Keep practising and try again.')).toBeInTheDocument()
    expect(seen.completes).toEqual([])

    // Back to the lesson: the skipped exercises still pending, the quiz offered again.
    await userEvent.click(screen.getByRole('button', { name: 'Back to the lesson' }))
    expect(['l-2-e5', 'l-2-e6']).toContain(await onScreen())
    expect(screen.getByRole('heading', { level: 2, name: /^Exercise/ })).toHaveFocus()
    expect(screen.getByText(/Question 5 of 6/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Short quiz' }))
    expect(hearts()).toHaveAccessibleName('2 of 2 hearts left')
    await passQuiz()
    expect(await screen.findByRole('heading', { name: 'Lesson complete' })).toBeInTheDocument()
    expect(seen.completes).toEqual(['l-2'])
  })

  it('goes through with the keyboard alone, the focus on each question', async () => {
    open('/chapter/u-5/l-2')
    for (let n = 1; n <= 5; n += 1) await answerRight()
    await skip()
    const offer = await screen.findByRole('button', { name: 'Short quiz' })
    for (let step = 0; step < 30 && document.activeElement !== offer; step += 1) await userEvent.tab()
    expect(offer).toHaveFocus()
    await userEvent.keyboard('{Enter}')

    for (let question = 0; question < 3; question += 1) {
      const prompt = await screen.findByRole('heading', { level: 2, name: /^Exercise/ })
      await waitFor(() => expect(prompt).toHaveFocus())
      const id = await onScreen()
      await userEvent.tab()
      expect(screen.getByRole('textbox', { name: 'Your answer' })).toHaveFocus()
      await userEvent.keyboard(`${right(id)}{Enter}`)
      const go = await screen.findByRole('button', { name: /^(Next question|Finish the quiz)$/ })
      for (let step = 0; step < 10 && document.activeElement !== go; step += 1) await userEvent.tab()
      expect(go).toHaveFocus()
      await userEvent.keyboard('{Enter}')
    }
    expect(await screen.findByRole('heading', { name: 'Lesson complete' })).toHaveFocus()
    expect(seen.completes).toEqual(['l-2'])
  })
})

describe('testing out of a lesson from the chapter', () => {
  it('offers 「跳过这一课」 on a lesson open to the student, never on a locked or a done one (#96)', async () => {
    open('/chapter/u-5')
    const rows = within(await screen.findByRole('list')).getAllByRole('listitem')
    expect(rows.map((row) => row.getAttribute('data-lesson-status'))).toEqual(['completed', 'current', 'locked', 'locked'])
    expect(within(rows[0]).queryByRole('link', { name: /^Skip this lesson/ })).not.toBeInTheDocument()
    expect(within(rows[1]).getByRole('link', { name: 'Skip this lesson: Balancing both sides' })).toHaveAttribute('href', '/chapter/u-5/l-2?mode=quiz')
    expect(within(rows[2]).queryByRole('link', { name: /^Skip this lesson/ })).not.toBeInTheDocument()
    expect(within(rows[3]).queryByRole('link', { name: /^Skip this lesson/ })).not.toBeInTheDocument()
  })

  it('draws five of a longer lesson, with the same rules', async () => {
    open('/chapter/u-5/l-2?mode=quiz')
    expect(await screen.findByText(/Quiz · Question 1 of 5$/)).toBeInTheDocument()
    expect(hearts()).toHaveAccessibleName('2 of 2 hearts left')
    expect(screen.queryByRole('button', { name: 'Hint' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Skip' })).not.toBeInTheDocument()
    expect(screen.queryByRole('complementary', { name: 'Ask' })).not.toBeInTheDocument()
    const quiz = await passQuiz()
    expect(new Set(quiz).size).toBe(5)
    expect(seen.completes).toEqual(['l-2'])
  })

  it('a locked lesson offers no test-out, and ?mode=quiz on it shows the locked notice (#96)', async () => {
    open('/chapter/u-5/l-3?mode=quiz')
    expect(await screen.findByRole('heading', { level: 1, name: 'This lesson is locked' })).toBeInTheDocument()
    expect(screen.queryByText(/^Quiz · Question/)).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /^Skip this lesson/ })).not.toBeInTheDocument()
    expect(seen.completes).toEqual([])
  })

  it('says, once passed, that the star still needs every exercise answered right (#96)', async () => {
    open('/chapter/u-5/l-2?mode=quiz')
    await screen.findByText(/Quiz · Question 1 of 5$/)
    await passQuiz()
    expect(await screen.findByRole('heading', { name: 'Lesson complete' })).toBeInTheDocument()
    expect(screen.getByText(TEST_OUT_NOTE)).toBeInTheDocument()
  })

  it('says nothing of the sort when the lesson was worked through', async () => {
    open('/chapter/u-5/l-2')
    for (let n = 1; n <= 6; n += 1) await answerRight()
    expect(await screen.findByRole('heading', { name: 'Lesson complete' })).toBeInTheDocument()
    expect(screen.queryByText(TEST_OUT_NOTE)).not.toBeInTheDocument()
  })

  it('lost: back to the chapter with nothing changed, and it can be tried again', async () => {
    open('/chapter/u-5/l-2?mode=quiz')
    await screen.findByText(/Quiz · Question 1 of 5$/)
    await answerWrong()
    await answerWrong()
    expect(await screen.findByRole('heading', { name: 'Not yet' })).toHaveFocus()
    expect(seen.completes).toEqual([])

    await userEvent.click(screen.getByRole('button', { name: 'Try the quiz again' }))
    expect(await screen.findByText(/Quiz · Question 1 of 5$/)).toBeInTheDocument()
    expect(hearts()).toHaveAccessibleName('2 of 2 hearts left')
    await answerWrong()
    await answerWrong()

    await userEvent.click(await screen.findByRole('link', { name: 'Back to the chapter' }))
    expect(where()).toBe('/chapter/u-5')
    const rows = within(await screen.findByRole('list')).getAllByRole('listitem')
    expect(rows.map((row) => row.getAttribute('data-lesson-status'))).toEqual(['completed', 'current', 'locked', 'locked'])
    expect(screen.getByText('1 of 4 lessons done')).toBeInTheDocument()
    expect(seen.completes).toEqual([])
  })

  it('holds the hearts still under reduced motion', async () => {
    open('/chapter/u-5/l-2?mode=quiz', { reducedMotion: true })
    await screen.findByText(/Quiz · Question 1 of 5$/)
    expect(hearts()).toHaveAttribute('data-motion', 'none')
    await answerWrong()
    expect(hearts()?.querySelector('[data-heart="lost"]')).not.toBeNull()
    expect(hearts()).toHaveAttribute('data-motion', 'none')
  })

  it('lets the lost heart beat once with motion allowed', async () => {
    open('/chapter/u-5/l-2?mode=quiz')
    await screen.findByText(/Quiz · Question 1 of 5$/)
    expect(hearts()).toHaveAttribute('data-motion', 'beat')
  })
})
