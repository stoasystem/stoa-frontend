/**
 * Skipping and the short quiz on the practice stage, through the real API
 * layer against a mocked backend (MSW) and the real `practiceLessonReducer`.
 *
 * The quiz is the backend's (stoa-backend#92 / #83). The frontend used to draw
 * the paper and judge it itself, pass the student on its own say-so, and then
 * call `POST /practice/lessons/:id/complete`, which answered 409
 * `lesson_exercises_unanswered` -- so nobody could ever finish a lesson that
 * way. These tests pin the other half of the contract:
 *
 * - the paper, the verdict, the hearts and what is left all come off the wire,
 *   and the stage believes them even when they contradict what it could have
 *   worked out itself;
 * - a pass sends the credential it was given to `complete`;
 * - every refusal the three endpoints name gets its own sentence;
 * - in a quiz: no hints, Ask off, no skip;
 * - the ordinary lesson path still completes with no body at all.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
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
const FAR_FUTURE = '2099-01-01T00:00:00+00:00'

type Refusal = { status: number; code: string; extra?: Record<string, unknown> }
type QuizSession = {
  quizId: string
  lessonId: string
  kind: 'skip' | 'testOut'
  queue: string[]
  mistakes: number
  status: 'inProgress' | 'passed' | 'failed'
}
type Seen = {
  starts: { lessonId: string; kind: unknown }[]
  quizAnswers: { quizId: string; answer: unknown }[]
  answers: { id: string; answer: unknown }[]
  completes: { lessonId: string; credential: unknown }[]
  hints: number
}

/** What the mocked backend decides. Each test bends only what it is about. */
type Rules = {
  mistakesAllowed: number
  judge: (challengeId: string, answer: unknown) => boolean
  paper: (all: string[], kind: 'skip' | 'testOut') => string[]
  startRefusal: Refusal | null
  answerRefusal: Refusal | null
  completeRefusal: Refusal | null
}

let completed: Set<string>
let answeredRight: Set<string>
let quizzes: Map<string, QuizSession>
let credentials: Map<string, { lessonId: string }>
let seen: Seen
let rules: Rules
let quizCounter: number

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
const exerciseIds = (lessonId: string) =>
  Array.from({ length: LESSONS.find((lesson) => lesson.id === lessonId)!.exercises }, (_, i) =>
    exerciseId(lessonId, i + 1),
  )

function exerciseBody(challengeId: string) {
  const lessonId = challengeId.split('-e')[0]
  const n = Number(challengeId.split('-e')[1])
  return {
    challengeId,
    lessonId,
    unitId: 'u-5',
    subjectId: 'math',
    gradeLevel: '8',
    topicId: 'algebra',
    topic: 'Multiply.',
    type: 'text_input',
    prompt: `Exercise ${n}: what is ${n} × 2?`,
  }
}

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
    challenges: exerciseIds(lessonId).map(exerciseBody),
  }
}

/** The backend's refusal shape: FastAPI's `detail` with a code inside. */
const refuse = ({ status, code, extra }: Refusal) =>
  HttpResponse.json({ detail: { code, message: `refused: ${code}`, ...extra } }, { status })

function quizView(session: QuizSession) {
  return {
    quizId: session.quizId,
    lessonId: session.lessonId,
    kind: session.kind,
    status: session.status,
    heartsLeft: Math.max(0, rules.mistakesAllowed + 1 - session.mistakes),
    mistakesAllowed: rules.mistakesAllowed,
    remaining: session.queue.length,
    expiresAt: FAR_FUTURE,
    exercise:
      session.status === 'inProgress' && session.queue.length > 0
        ? exerciseBody(session.queue[0])
        : null,
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
      if (correct) answeredRight.add(id)
      return HttpResponse.json({
        challengeId: id,
        correct,
        feedback: correct ? 'Well done.' : 'Count again.',
        attemptsRemaining: correct ? 2 : 1,
      })
    }),
    http.post(`${API}/practice/lessons/:lessonId/quiz`, async ({ params, request }) => {
      const lessonId = String(params.lessonId)
      const body = (await request.json()) as { kind: 'skip' | 'testOut' }
      seen.starts.push({ lessonId, kind: body?.kind })
      if (rules.startRefusal) return refuse(rules.startRefusal)
      quizCounter += 1
      const session: QuizSession = {
        quizId: `q-${quizCounter}`,
        lessonId,
        kind: body.kind,
        queue: rules.paper(exerciseIds(lessonId), body.kind),
        mistakes: 0,
        status: 'inProgress',
      }
      quizzes.set(session.quizId, session)
      return HttpResponse.json(quizView(session))
    }),
    http.post(`${API}/practice/lessons/:lessonId/quiz/:quizId/answer`, async ({ params, request }) => {
      const quizId = String(params.quizId)
      const { answer } = (await request.json()) as { answer: unknown }
      seen.quizAnswers.push({ quizId, answer })
      if (rules.answerRefusal) return refuse(rules.answerRefusal)
      const session = quizzes.get(quizId)
      if (!session) return refuse({ status: 404, code: 'lesson_quiz_not_found' })

      const asked = session.queue[0]
      const correct = rules.judge(asked, answer)
      session.queue = session.queue.slice(1)
      if (!correct) {
        session.mistakes += 1
        session.queue = [...session.queue, asked]
      }
      if (session.mistakes > rules.mistakesAllowed) {
        session.status = 'failed'
        session.queue = []
      } else if (session.queue.length === 0) {
        session.status = 'passed'
      }

      const passed = session.status === 'passed'
      const credential = passed ? `cred-${session.quizId}` : null
      if (credential) credentials.set(credential, { lessonId: session.lessonId })
      return HttpResponse.json({
        ...quizView(session),
        correct,
        credential,
        credentialExpiresAt: credential ? FAR_FUTURE : null,
      })
    }),
    http.post(`${API}/practice/lessons/:lessonId/complete`, async ({ params, request }) => {
      const lessonId = String(params.lessonId)
      const raw = await request.text()
      const body = raw ? (JSON.parse(raw) as { quizCredential?: string }) : null
      const credential = body?.quizCredential ?? null
      seen.completes.push({ lessonId, credential })
      if (rules.completeRefusal) return refuse(rules.completeRefusal)
      if (credential) {
        const stored = credentials.get(credential)
        if (!stored || stored.lessonId !== lessonId) {
          return refuse({ status: 409, code: 'lesson_quiz_credential_invalid' })
        }
        // One completion per credential, as the backend spends it.
        credentials.delete(credential)
      } else {
        const unanswered = exerciseIds(lessonId).filter((id) => !answeredRight.has(id))
        if (unanswered.length > 0) {
          return refuse({
            status: 409,
            code: 'lesson_exercises_unanswered',
            extra: { unansweredCount: unanswered.length },
          })
        }
      }
      completed.add(lessonId)
      return HttpResponse.json({ lessonId, completed: true, nextLessonId: null, progressPoints: 10, studyStreak: 1, dailyGoalCompleted: false })
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
const TEST_OUT_NOTE = 'The lesson counts as done. The star lights up once every exercise in this chapter has been answered right at least once.'
const strip = () => document.querySelector('[data-stage-actions]')!
const hearts = () => document.querySelector('[data-quiz-hearts]')
const trouble = () => document.querySelector('[data-quiz-trouble]')

/** Types into the exercise on screen and submits; the reply may be a refusal. */
async function typeAnswer(value: string) {
  const field = document.querySelector<HTMLInputElement>('[data-stage-exercise] input')!
  await user.type(field, `${value}{Enter}`)
}

async function answer(value: string) {
  await typeAnswer(value)
  await screen.findByText(/^(Correct|Not quite)$/)
}

/** Answers the exercise on screen right and goes on. */
async function answerRight(lessonId = 'l-2') {
  const id = await onScreen(lessonId)
  await answer(right(id))
  await user.click(screen.getByRole('button', { name: /^(Next question|Finish lesson|Finish the quiz)$/ }))
  return id
}

/** Answers the exercise on screen wrong; in a quiz, goes on. */
async function answerWrong(lessonId = 'l-2') {
  const id = await onScreen(lessonId)
  await answer('0')
  const go = screen.queryByRole('button', { name: 'Continue' })
  if (go) await user.click(go)
  return id
}

async function skip() {
  const id = await onScreen()
  await user.click(within(strip() as HTMLElement).getByRole('button', { name: 'Skip' }))
  return id
}

/** Every exercise of a quiz answered right, the ids in the order they came. */
async function passQuiz(lessonId = 'l-2') {
  const ids: string[] = []
  for (let step = 0; step < 20 && !screen.queryByRole('heading', { name: 'Lesson complete' }); step += 1) {
    if (!screen.queryByRole('textbox', { name: 'Your answer' })) break
    ids.push(await answerRight(lessonId))
    await waitFor(() =>
      expect(
        screen.queryByRole('heading', { name: 'Lesson complete' }) ??
          screen.queryByRole('textbox', { name: 'Your answer' }) ??
          trouble(),
      ).toBeTruthy(),
    )
  }
  return ids
}

/** Answers the first `rightOnes` right, skips the rest, and takes the quiz. */
async function skipIntoQuiz(rightOnes: number) {
  open('/chapter/u-5/l-2')
  for (let n = 1; n <= 6; n += 1) {
    if (n <= rightOnes) await answerRight()
    else await skip()
  }
  await user.click(await screen.findByRole('button', { name: 'Short quiz' }))
  await screen.findByText(/Quiz · Question 1 of \d+$/)
}

const originalMatchMedia = window.matchMedia
// user-event's default `delay: 0` waits on a real timer between every key and
// pointer step; `delay: null` keeps every action awaited and act()-wrapped and
// drops only the idle timer (#133).
let user: UserEvent

beforeAll(() => mswServer.listen({ onUnhandledRequest: 'error' }))
beforeEach(async () => {
  user = userEvent.setup({ delay: null })
  await i18n.changeLanguage('en')
  completed = new Set(['l-1'])
  answeredRight = new Set()
  quizzes = new Map()
  credentials = new Map()
  quizCounter = 0
  seen = { starts: [], quizAnswers: [], answers: [], completes: [], hints: 0 }
  rules = {
    mistakesAllowed: 1,
    judge: (challengeId, value) => value === right(challengeId),
    paper: (all, kind) => (kind === 'testOut' ? all.slice(0, 5) : all),
    startRefusal: null,
    answerRefusal: null,
    completeRefusal: null,
  }
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

describe('the quiz is judged by the backend, not here', () => {
  it('asks the backend for the paper, with the kind, and shows what came back', async () => {
    rules.paper = (all) => all.slice(0, 4)
    await skipIntoQuiz(0)

    expect(seen.starts).toEqual([{ lessonId: 'l-2', kind: 'skip' }])
    // Four, because the backend said four -- the lesson has six exercises.
    expect(screen.getByText(/Quiz · Question 1 of 4$/)).toBeInTheDocument()
    expect(await onScreen()).toBe('l-2-e1')
  })

  it('believes a verdict it could have worked out differently itself', async () => {
    // Every answer is right, says the backend, whatever the student typed.
    rules.judge = () => true
    await skipIntoQuiz(0)

    for (let n = 0; n < 6; n += 1) {
      await answer('definitely not the answer')
      expect(screen.getByText('Correct')).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: /^(Next question|Finish the quiz)$/ }))
    }
    expect(await screen.findByRole('heading', { name: 'Lesson complete' })).toBeInTheDocument()
    expect(seen.quizAnswers.map((item) => item.answer)).toEqual(Array(6).fill('definitely not the answer'))
  })

  it('calls a right answer wrong when the backend does, and loses the quiz on it', async () => {
    rules.judge = () => false
    await skipIntoQuiz(0)

    const id = await onScreen()
    await answer(right(id))
    expect(screen.getByText('Not quite')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    // On to the next question: the keyboard is on its prompt, not its answer.
    await waitFor(() => expect(document.querySelector('[data-stage-prompt]')).toHaveFocus())
    await answer(right(await onScreen()))
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(await screen.findByRole('heading', { name: 'Not yet' })).toBeInTheDocument()
    expect(seen.completes).toEqual([])
  })

  it('shows the hearts the backend sends, however many that is', async () => {
    rules.mistakesAllowed = 3
    await skipIntoQuiz(0)

    expect(hearts()).toHaveAccessibleName('4 of 4 hearts left')
    expect(hearts()!.querySelectorAll('[data-heart]')).toHaveLength(4)
    await answerWrong()
    expect(hearts()).toHaveAccessibleName('3 of 4 hearts left')
    await answerWrong()
    expect(hearts()).toHaveAccessibleName('2 of 4 hearts left')
    // Two mistakes would have lost it under the old frontend rule; here the
    // backend is still going.
    expect(screen.queryByRole('heading', { name: 'Not yet' })).not.toBeInTheDocument()
    expect(await screen.findByRole('textbox', { name: 'Your answer' })).toBeInTheDocument()
  })

  it('counts down what is left as the backend does, not by its own arithmetic', async () => {
    await skipIntoQuiz(0)
    expect(screen.getByText(/Quiz · Question 1 of 6$/)).toBeInTheDocument()
    await answerRight()
    expect(await screen.findByText(/Quiz · Question 2 of 6$/)).toBeInTheDocument()
    // A wrong answer goes to the back: still as many to go.
    await answerWrong()
    expect(await screen.findByText(/Quiz · Question 2 of 6$/)).toBeInTheDocument()
  })
})

describe('passing the quiz completes the lesson with its credential', () => {
  it('sends the credential the backend issued, and finishes once', async () => {
    await skipIntoQuiz(0)
    await passQuiz()

    expect(await screen.findByRole('heading', { name: 'Lesson complete' })).toHaveFocus()
    expect(seen.completes).toEqual([{ lessonId: 'l-2', credential: 'cred-q-1' }])
  })

  it('never completes before the backend says the quiz is passed', async () => {
    await skipIntoQuiz(0)
    for (let n = 0; n < 5; n += 1) {
      await answerRight()
      expect(seen.completes).toEqual([])
    }
    await answerRight()
    expect(await screen.findByRole('heading', { name: 'Lesson complete' })).toBeInTheDocument()
    expect(seen.completes).toHaveLength(1)
  })

  it('says the star is not lit by testing out alone', async () => {
    open('/chapter/u-5/l-2?mode=quiz')
    await screen.findByText(/Quiz · Question 1 of 5$/)
    expect(seen.starts).toEqual([{ lessonId: 'l-2', kind: 'testOut' }])
    await passQuiz()
    expect(await screen.findByRole('heading', { name: 'Lesson complete' })).toBeInTheDocument()
    expect(screen.getByText(TEST_OUT_NOTE)).toBeInTheDocument()
  })
})

describe('what the student reads when it goes wrong', () => {
  it('a locked lesson: the reason, and no offer to take it again', async () => {
    rules.startRefusal = { status: 409, code: 'lesson_locked' }
    open('/chapter/u-5/l-2?mode=quiz')

    expect(await screen.findByText('Finish the lessons before this one first: this lesson is still locked.')).toBeInTheDocument()
    expect(trouble()).toHaveAttribute('data-quiz-trouble', 'lesson_locked')
    expect(screen.queryByRole('button', { name: 'Start the quiz again' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to the chapter' })).toBeInTheDocument()
  })

  it('a lesson with nothing to ask: its own sentence', async () => {
    rules.startRefusal = { status: 409, code: 'lesson_quiz_unavailable' }
    open('/chapter/u-5/l-2?mode=quiz')

    expect(await screen.findByText('This lesson has no exercise a quiz could ask yet.')).toBeInTheDocument()
    expect(trouble()).toHaveAttribute('data-quiz-trouble', 'lesson_quiz_unavailable')
  })

  it('an expired quiz: the reason, and a fresh paper from the same screen', async () => {
    open('/chapter/u-5/l-2?mode=quiz')
    await screen.findByText(/Quiz · Question 1 of 5$/)
    rules.answerRefusal = { status: 409, code: 'lesson_quiz_expired' }
    await typeAnswer(right(await onScreen()))

    expect(await screen.findByText('The quiz took too long and has expired. Start a new one.')).toBeInTheDocument()
    expect(trouble()).toHaveAttribute('data-quiz-trouble', 'lesson_quiz_expired')
    expect(seen.completes).toEqual([])

    rules.answerRefusal = null
    await user.click(screen.getByRole('button', { name: 'Start the quiz again' }))
    expect(await screen.findByText(/Quiz · Question 1 of 5$/)).toBeInTheDocument()
    // The second paper is a second ask, with the same kind.
    expect(seen.starts).toEqual([
      { lessonId: 'l-2', kind: 'testOut' },
      { lessonId: 'l-2', kind: 'testOut' },
    ])
  })

  it('a quiz the backend no longer has open: its own sentence', async () => {
    open('/chapter/u-5/l-2?mode=quiz')
    await screen.findByText(/Quiz · Question 1 of 5$/)
    quizzes.clear()
    await typeAnswer(right(await onScreen()))

    expect(await screen.findByText('This quiz is no longer open. Start a new one.')).toBeInTheDocument()
    expect(trouble()).toHaveAttribute('data-quiz-trouble', 'lesson_quiz_not_found')
    expect(screen.getByRole('button', { name: 'Start the quiz again' })).toBeInTheDocument()
  })

  it('a credential the backend will not take: the reason, not a shrug', async () => {
    open('/chapter/u-5/l-2?mode=quiz')
    await screen.findByText(/Quiz · Question 1 of 5$/)
    // Passed here, spent elsewhere: the completion is refused.
    rules.completeRefusal = { status: 409, code: 'lesson_quiz_credential_invalid' }
    await passQuiz()

    expect(await screen.findByText('The pass from that quiz does not work for this lesson. Take the quiz again.')).toBeInTheDocument()
    expect(trouble()).toHaveAttribute('data-quiz-trouble', 'lesson_quiz_credential_invalid')
    expect(screen.queryByRole('heading', { name: 'Lesson complete' })).not.toBeInTheDocument()
    expect(seen.completes).toEqual([{ lessonId: 'l-2', credential: 'cred-q-1' }])
    expect(screen.getByRole('button', { name: 'Start the quiz again' })).toBeInTheDocument()
  })

  it('a credential past its ten minutes: the reason says so', async () => {
    open('/chapter/u-5/l-2?mode=quiz')
    await screen.findByText(/Quiz · Question 1 of 5$/)
    rules.completeRefusal = { status: 409, code: 'lesson_quiz_credential_expired' }
    await passQuiz()

    expect(await screen.findByText('The pass from that quiz expired before the lesson was finished. Take the quiz again.')).toBeInTheDocument()
    expect(trouble()).toHaveAttribute('data-quiz-trouble', 'lesson_quiz_credential_expired')
  })

  it('an ordinary completion the backend refuses: the reason, beside the exercise', async () => {
    rules.completeRefusal = {
      status: 409,
      code: 'lesson_exercises_unanswered',
      extra: { unansweredCount: 3 },
    }
    open('/chapter/u-5/l-2')
    for (let n = 1; n <= 6; n += 1) await answerRight()

    expect(
      await screen.findByText('Answer every exercise of this lesson right, or pass the short quiz, before finishing it.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Lesson complete' })).not.toBeInTheDocument()
    // The exercise stays on screen: this is a line beside it, not a dead end.
    expect(screen.getByRole('heading', { level: 2, name: /^Exercise/ })).toBeInTheDocument()
  })

  it.each([
    ['de', 'Dieses Quiz ist nicht mehr offen. Starte ein neues.'],
    ['fr', 'Ce quiz n’est plus ouvert. Lances-en un nouveau.'],
    ['it', 'Questo quiz non è più aperto. Avviane uno nuovo.'],
  ])('says it in %s too', async (language, sentence) => {
    await i18n.changeLanguage(language)
    open('/chapter/u-5/l-2?mode=quiz')
    await waitFor(() => expect(hearts()).not.toBeNull())
    quizzes.clear()
    await typeAnswer('2')

    expect(await screen.findByText(sentence)).toBeInTheDocument()
  })

  it('has all four languages for every refusal it names', () => {
    const KEYS = [
      'title',
      'restart',
      'locked',
      'unavailable',
      'notFound',
      'expired',
      'finished',
      'credentialInvalid',
      'credentialExpired',
      'unanswered',
      'unknown',
    ]
    const copy = Object.fromEntries(
      ['de', 'en', 'fr', 'it'].map((language) => [
        language,
        JSON.parse(
          readFileSync(path.resolve(__dirname, `../../src/i18n/locales/${language}/chapter.json`), 'utf8'),
        ).stage.trouble as Record<string, string>,
      ]),
    )
    for (const language of ['de', 'en', 'fr', 'it']) {
      expect(Object.keys(copy[language]).sort()).toEqual([...KEYS].sort())
      for (const key of KEYS) expect(copy[language][key].trim().length).toBeGreaterThan(0)
    }
    // Translated, not copied: every sentence differs from the English one.
    for (const language of ['de', 'fr', 'it']) {
      for (const key of KEYS) expect(copy[language][key]).not.toBe(copy.en[key])
    }
  })
})

describe('skipping inside a lesson', () => {
  it('sends the exercise to the back of the queue, with no credit', async () => {
    open('/chapter/u-5/l-2')
    expect(await screen.findByText(/Question 1 of 6/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Short quiz' })).not.toBeInTheDocument()

    expect(await skip()).toBe('l-2-e1')
    expect(await onScreen()).toBe('l-2-e2')
    expect(screen.getByText(/Question 1 of 6/)).toBeInTheDocument()

    for (const expected of ['l-2-e2', 'l-2-e3', 'l-2-e4', 'l-2-e5', 'l-2-e6']) expect(await answerRight()).toBe(expected)
    expect(await onScreen()).toBe('l-2-e1')
    expect(screen.getByText(/Question 6 of 6/)).toBeInTheDocument()
    expect(seen.completes).toEqual([])

    await answer('2')
    await user.click(screen.getByRole('button', { name: 'Finish lesson' }))
    expect(await screen.findByRole('heading', { name: 'Lesson complete' })).toBeInTheDocument()
    // The ordinary road: no credential, no body at all.
    expect(seen.completes).toEqual([{ lessonId: 'l-2', credential: null }])
    expect(seen.starts).toEqual([])
  })

  it('never finishes the lesson by skipping everything: the quiz is offered instead of skipping again', async () => {
    open('/chapter/u-5/l-2')
    for (let n = 1; n <= 6; n += 1) expect(await skip()).toBe(`l-2-e${n}`)

    expect(await onScreen()).toBe('l-2-e1')
    expect(within(strip() as HTMLElement).queryByRole('button', { name: 'Skip' })).not.toBeInTheDocument()
    const offer = screen.getByRole('button', { name: 'Short quiz' })
    expect(offer).toHaveAccessibleDescription('Finish this lesson by passing a short quiz.')
    expect(seen.completes).toEqual([])
    expect(seen.starts).toEqual([])
  })

  it('finishes as before when every exercise is answered right', async () => {
    open('/chapter/u-5/l-2')
    for (let n = 1; n <= 6; n += 1) expect(await answerRight()).toBe(`l-2-e${n}`)

    expect(await screen.findByRole('heading', { name: 'Lesson complete' })).toHaveFocus()
    expect(seen.completes).toEqual([{ lessonId: 'l-2', credential: null }])
    expect(screen.getByText('2 of 4 lessons in Linear equations done')).toBeInTheDocument()
  })
})

describe('what a quiz turns off', () => {
  it('has no hints, no skip, and Ask off with a reason, on a wide screen', async () => {
    open('/chapter/u-5/l-2')
    expect(await screen.findByRole('complementary', { name: 'Ask' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Hint' })).toBeInTheDocument()
    for (let n = 1; n <= 6; n += 1) await skip()
    await user.click(await screen.findByRole('button', { name: 'Short quiz' }))

    expect(await screen.findByText(/Quiz · Question 1 of 6$/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Hint' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Skip' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Short quiz' })).not.toBeInTheDocument()
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

    expect(hearts()).toHaveAccessibleName('2 of 2 hearts left')
    await answer('0')
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Your answer' })).toBeDisabled()
    expect(hearts()).toHaveAccessibleName('1 of 2 hearts left')
    expect(screen.getByText('That cost a heart. 1 heart left.')).toBeInTheDocument()
    expect(seen.hints).toBe(0)

    await user.click(screen.getByRole('button', { name: 'Continue' }))
    await passQuiz()
    expect(await screen.findByRole('complementary', { name: 'Ask' })).toBeInTheDocument()
  })

  it('keeps the phone composer disabled and never raises the sheet during the quiz', async () => {
    open('/chapter/u-5/l-2', { width: 375 })
    for (let n = 1; n <= 6; n += 1) await skip()
    await user.click(await screen.findByRole('button', { name: 'Short quiz' }))
    await screen.findByText(/Quiz · Question 1 of 6$/)

    expect(screen.queryByRole('button', { name: 'Hint' })).not.toBeInTheDocument()
    const composer = within(document.querySelector<HTMLElement>('[data-ask-docked]')!).getByRole('textbox')
    expect(composer).toBeDisabled()
    await user.type(composer, 'Help')
    expect(screen.queryByRole('dialog', { name: 'Ask' })).not.toBeInTheDocument()
    expect(document.querySelector('[data-ask-surface]')).toBeNull()
  })
})

describe('losing the quiz', () => {
  it('ends it where the backend says, with nothing finished, and it can be taken again', async () => {
    await skipIntoQuiz(4)
    await answerWrong()
    expect(hearts()).toHaveAttribute('data-quiz-hearts', '1')
    await answerWrong()

    const failed = await screen.findByRole('heading', { name: 'Not yet' })
    expect(failed).toHaveFocus()
    expect(screen.getByText('Keep practising and try again.')).toBeInTheDocument()
    expect(seen.completes).toEqual([])

    await user.click(screen.getByRole('button', { name: 'Back to the lesson' }))
    expect(['l-2-e5', 'l-2-e6']).toContain(await onScreen())
    await user.click(screen.getByRole('button', { name: 'Short quiz' }))
    expect(await screen.findByText(/Quiz · Question 1 of \d+$/)).toBeInTheDocument()
    expect(hearts()).toHaveAccessibleName('2 of 2 hearts left')
    expect(seen.starts).toHaveLength(2)
  })

  it('lost after testing out: back to the chapter with nothing changed, or the quiz again', async () => {
    open('/chapter/u-5/l-2?mode=quiz')
    await screen.findByText(/Quiz · Question 1 of 5$/)
    await answerWrong()
    await answerWrong()
    expect(await screen.findByRole('heading', { name: 'Not yet' })).toHaveFocus()
    expect(seen.completes).toEqual([])

    await user.click(screen.getByRole('button', { name: 'Try the quiz again' }))
    expect(await screen.findByText(/Quiz · Question 1 of 5$/)).toBeInTheDocument()
    expect(seen.starts).toEqual([
      { lessonId: 'l-2', kind: 'testOut' },
      { lessonId: 'l-2', kind: 'testOut' },
    ])
    await answerWrong()
    await answerWrong()

    await user.click(await screen.findByRole('link', { name: 'Back to the chapter' }))
    expect(where()).toBe('/chapter/u-5')
    const rows = within(await screen.findByRole('list')).getAllByRole('listitem')
    expect(rows.map((row) => row.getAttribute('data-lesson-status'))).toEqual(['completed', 'current', 'locked', 'locked'])
    expect(seen.completes).toEqual([])
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

  it('a locked lesson offers no test-out, and ?mode=quiz on it shows the locked notice (#96)', async () => {
    open('/chapter/u-5/l-3?mode=quiz')
    expect(await screen.findByRole('heading', { level: 1, name: 'This lesson is locked' })).toBeInTheDocument()
    expect(screen.queryByText(/Quiz · Question \d+ of \d+$/)).not.toBeInTheDocument()
    expect(seen.starts).toEqual([])
  })

  it('opens a lesson already done as the lesson, not a quiz, even with ?mode=quiz (#96)', async () => {
    open('/chapter/u-5/l-1?mode=quiz')
    expect(await screen.findByRole('heading', { level: 2, name: /^Exercise \d+:/ })).toBeInTheDocument()
    expect(screen.queryByText(/Quiz · Question \d+ of \d+$/)).not.toBeInTheDocument()
    expect(seen.starts).toEqual([])
  })

  it('starts no quiz while the chapter cannot say the lesson is open: the frontend is the only gate (#96)', async () => {
    mswServer.use(http.get(`${API}/practice/math/algebra/roadmap`, () => HttpResponse.json({ detail: 'down' }, { status: 500 })))
    open('/chapter/u-5/l-3?mode=quiz')
    expect(await screen.findByRole('heading', { level: 2, name: /^Exercise \d+:/ })).toBeInTheDocument()
    expect(seen.starts).toEqual([])
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
