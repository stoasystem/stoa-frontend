/**
 * The star quiz (#486, stoa-backend#165): 「我会了，测一下」 on a star not lit,
 * one paper over the whole knowledge point, through the real API layer
 * against a mocked backend (MSW).
 *
 * - the entry is on every star not lit, ready, in progress or waiting on its
 *   prerequisites, and on no lit one; cooling down, it is there and off, with
 *   the time it opens again;
 * - a star lit by its quiz says so; a star with every lesson done and
 *   exercises still wrong is told it can test the whole star;
 * - the paper, each verdict, the mistakes left and the cooldown come off the
 *   wire; two hearts, no hint, Ask off, no skip;
 * - passed: the whole star is lit, and the sky is read again; lost: when it
 *   can be taken again, and the way to its lessons;
 * - every refusal the endpoints name has its own sentence; an answer lost on
 *   the way is sent again for the same exercise;
 * - a quiz lighting is celebrated on the map like one seen happening.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { render, screen, within } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { StarCard } from '@/features/starmap/components/StarCard'
import { isCelebrated } from '@/features/starmap/lighting/lightingEvents'
import { litEventsOf } from '@/features/starmap/lighting/readModelLighting'
import type { Star, StarMap } from '@/features/starmap/model/starMap'
import i18n from '@/i18n'
import { ChapterPage, StarQuizPage } from '@/pages/chapter/ChapterPages'
import { ApiError } from '@/services/api/httpClient'
import { resetAsk } from '@/store/askStore'
import { type CurrentUser, useAuthStore } from '@/store/authStore'
import type { KnowledgeMapResponse } from '@/types/practice'
import { mswServer } from '../mswServer'

vi.mock('@/services/analytics/analyticsClient', () => ({ trackEvent: vi.fn() }))
vi.mock('@/hooks/notifications/useNotificationsQuery', () => ({
  useNotificationsQuery: () => ({ data: { items: [] }, isLoading: false, isError: false }),
  useUnreadNotificationCountQuery: () => ({ data: 0 }),
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

// ---------------------------------------------------------------------------
// The backend
// ---------------------------------------------------------------------------

const API = 'https://api.test'
const RETRY_AT = '2099-11-01T22:10:00+00:00'

type Refusal = { status: number; code: string; extra?: Record<string, unknown> }
type Paper = { quizId: string; asked: string[]; answers: { exerciseId: string; correct: boolean }[] }

/** What the mocked backend decides. Each test bends only what it is about. */
let rules: {
  size: number
  judge: (exerciseId: string, answer: unknown) => boolean
  startRefusal: Refusal | null
  answerRefusal: Refusal | null
  /** Answers to drop on the way, by how many have been sent (1-based). */
  dropAnswer: number[]
}
let paper: Paper | null
let seen: { starts: string[]; answers: { exerciseId: string; answer: unknown }[]; skyReads: number }

const exerciseId = (n: number) => `sq-e${n}`
const right = (id: string) => String(Number(id.split('-e')[1]) * 3)

function exerciseBody(id: string) {
  const n = Number(id.split('-e')[1])
  return {
    challengeId: id,
    lessonId: `l-${n}`,
    unitId: 'u-5',
    subjectId: 'math',
    gradeLevel: '8',
    topicId: 'algebra',
    topic: 'Multiply.',
    type: 'text_input',
    prompt: `Star question ${n}: what is ${n} × 3?`,
    hintAvailable: true,
  }
}

const refuse = ({ status, code, extra }: Refusal) =>
  HttpResponse.json({ detail: { code, message: `refused: ${code}`, ...extra } }, { status })

function view(current: Paper) {
  const mistakes = current.answers.filter((answer) => !answer.correct).length
  const status = mistakes > 1 ? 'failed' : current.answers.length === current.asked.length ? 'passed' : 'inProgress'
  return {
    quizId: current.quizId,
    unitId: 'u-5',
    status,
    total: current.asked.length,
    answered: current.answers.length,
    mistakes,
    mistakesAllowed: 1,
    expiresAt: '2099-01-01T00:00:00+00:00',
    exercise: status === 'inProgress' ? exerciseBody(current.asked[current.answers.length]) : null,
    retryAt: status === 'failed' ? RETRY_AT : null,
  }
}

function backend() {
  mswServer.use(
    http.get(`${API}/practice/curriculum/catalog`, () =>
      HttpResponse.json({
        subjects: [],
        topics: [],
        units: [{ id: 'u-5', subjectId: 'math', gradeLevel: '8', topicId: 'algebra', title: 'Linear equations', description: '', rolloutState: 'active', order: 2 }],
        lessons: [],
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
        units: [{ id: 'u-5', title: 'Linear equations', description: '', order: 2, lessons: [] }],
      }),
    ),
    http.get(`${API}/practice/knowledge-map`, () => {
      seen.skyReads += 1
      return HttpResponse.json({
        subjectId: 'math',
        galaxies: [{ subjectId: 'math', name: 'Maths', lit: 0, total: 1, enrolled: true }],
        nebulae: [{ topicId: 'algebra', name: 'Algebra', order: 1, subjectId: 'math' }],
        stars: [{ unitId: 'u-5', name: 'Linear equations', nebulaId: 'algebra', order: 1, state: 'ready', progress: 0, unmetExercises: 0, reviewDue: 0, recommendation: null, x: 0, y: 0, skills: [], chapter: { lessonCount: 4, lessonsDone: 0, nextLesson: null }, unlitPrerequisiteIds: [] }],
        prerequisites: [],
        summary: { lit: 0, total: 1, streakDays: 0, score: 0 },
      })
    }),
    http.post(`${API}/practice/knowledge-map/stars/:unitId/quiz`, ({ params }) => {
      seen.starts.push(String(params.unitId))
      if (rules.startRefusal) return refuse(rules.startRefusal)
      // A paper still open is handed back, not replaced.
      if (!paper || view(paper).status !== 'inProgress') {
        paper = { quizId: `sq-${seen.starts.length}`, asked: Array.from({ length: rules.size }, (_, i) => exerciseId(i + 1)), answers: [] }
      }
      return HttpResponse.json(view(paper))
    }),
    http.post(`${API}/practice/knowledge-map/stars/:unitId/quiz/:quizId/answer`, async ({ params, request }) => {
      const body = (await request.json()) as { exerciseId: string; answer: unknown }
      seen.answers.push(body)
      if (rules.dropAnswer.includes(seen.answers.length)) return HttpResponse.error()
      if (rules.answerRefusal) return refuse(rules.answerRefusal)
      if (!paper || paper.quizId !== params.quizId) return refuse({ status: 404, code: 'star_quiz_not_found' })
      // The same answer again: its first verdict, judged once.
      const earlier = paper.answers.find((answer) => answer.exerciseId === body.exerciseId)
      if (earlier) return HttpResponse.json({ ...view(paper), correct: earlier.correct })
      if (paper.asked[paper.answers.length] !== body.exerciseId) return refuse({ status: 409, code: 'star_quiz_out_of_order' })
      const correct = rules.judge(body.exerciseId, body.answer)
      paper.answers.push({ exerciseId: body.exerciseId, correct })
      return HttpResponse.json({ ...view(paper), correct })
    }),
  )
}

// ---------------------------------------------------------------------------
// Harness
// ---------------------------------------------------------------------------

function Where() {
  const location = useLocation()
  return <p data-testid="where">{location.pathname}</p>
}

function open(at: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[at]}>
          <Routes>
            <Route path="/star-quiz/:unitId" element={<StarQuizPage />} />
            <Route path="/chapter/:unitId" element={<ChapterPage />} />
            <Route path="/map/*" element={<p>the star map</p>} />
          </Routes>
          <Where />
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  )
}

let user: UserEvent
const where = () => screen.getByTestId('where').textContent
const hearts = () => document.querySelector('[data-quiz-hearts]')

async function onScreen() {
  const prompt = await screen.findByRole('heading', { level: 2, name: /^Star question \d+:/ })
  return exerciseId(Number(prompt.textContent!.match(/^Star question (\d+):/)![1]))
}

async function answer(value: string) {
  const field = document.querySelector<HTMLInputElement>('[data-stage-exercise] input')!
  await user.type(field, `${value}{Enter}`)
  await screen.findByText(/^(Correct|Not quite)$/)
}

async function answerRight() {
  await answer(right(await onScreen()))
  await user.click(screen.getByRole('button', { name: /^(Next question|Finish the quiz)$/ }))
}

async function answerWrong() {
  await onScreen()
  await answer('0')
  await user.click(screen.getByRole('button', { name: 'Continue' }))
}

beforeAll(() => mswServer.listen({ onUnhandledRequest: 'error' }))
beforeEach(async () => {
  user = userEvent.setup({ delay: null })
  await i18n.changeLanguage('en')
  rules = { size: 6, judge: (id, value) => value === right(id), startRefusal: null, answerRefusal: null, dropAnswer: [] }
  paper = null
  seen = { starts: [], answers: [], skyReads: 0 }
  useAuthStore.setState({
    user: { id: 'u-1', name: 'Lina Meier', email: 'lina@example.com', role: 'student' } as CurrentUser,
    accessToken: 'token',
    isAuthenticated: true,
  })
  resetAsk()
  backend()
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
})
afterEach(() => {
  mswServer.resetHandlers()
  vi.restoreAllMocks()
})
afterAll(() => mswServer.close())

// ---------------------------------------------------------------------------
// The card
// ---------------------------------------------------------------------------

function star(extra: Partial<Star>): Star {
  return {
    unitId: 'u-5',
    name: 'Linear equations',
    nebulaId: 'algebra',
    order: 1,
    state: 'ready',
    progress: 0,
    unmetExercises: 0,
    reviewDue: 0,
    recommendation: null,
    x: 0,
    y: 0,
    skills: [],
    chapter: { lessonCount: 4, lessonsDone: 0, nextLesson: null },
    unlitPrerequisiteIds: [],
    ...extra,
  }
}

function showCard(shown: Star) {
  const map: StarMap = {
    subject: { subjectId: 'math', name: 'Maths' },
    nebulae: [{ topicId: 'algebra', name: 'Algebra', order: 1, subjectId: 'math' }],
    stars: [shown, star({ unitId: 'u-1', name: 'Fractions' })],
    prerequisites: [],
    summary: { lit: 0, total: 2, streakDays: 0, score: 0 },
    subjects: [{ subjectId: 'math', name: 'Maths', lit: 0, total: 2, enrolled: true }],
  }
  render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <StarCard map={map} star={shown} nebula={map.nebulae[0]} reducedMotion />
      </MemoryRouter>
    </I18nextProvider>,
  )
  return screen.getByRole('article', { name: shown.name })
}

describe('「我会了，测一下」 on the star’s card', () => {
  it.each([
    ['ready', star({ state: 'ready' })],
    ['in progress', star({ state: 'in_progress', progress: 0.5 })],
    ['waiting on its prerequisites', star({ state: 'ready', unlitPrerequisiteIds: ['u-1'] })],
  ])('is on a star %s, and leads to its quiz', (_name, shown) => {
    const card = showCard(shown)
    expect(within(card).getByRole('link', { name: 'I know this – test me' })).toHaveAttribute('href', '/star-quiz/u-5')
  })

  it('is not on a lit star, which says when its quiz lit it', () => {
    const card = showCard(star({ state: 'lit', progress: 1, litAtSource: 'quiz' }))
    expect(within(card).queryByText('I know this – test me')).toBeNull()
    expect(within(card).getByText('Lit by passing the star quiz')).toBeInTheDocument()
  })

  it('says nothing of the quiz on a star lit by its exercises', () => {
    const card = showCard(star({ state: 'lit', progress: 1, litAtSource: 'observed' }))
    expect(within(card).queryByText('Lit by passing the star quiz')).toBeNull()
  })

  it('is there and off while the quiz cools down, with the time it opens again', () => {
    const card = showCard(star({ starQuizRetryAt: RETRY_AT }))
    const button = within(card).getByRole('button', { name: 'I know this – test me' })
    expect(button).toBeDisabled()
    expect(within(card).queryByRole('link', { name: 'I know this – test me' })).toBeNull()
    expect(button).toHaveAccessibleDescription(/^You can take the test again from .+\.$/)
  })

  it('opens again once the time has passed', () => {
    const card = showCard(star({ starQuizRetryAt: '2001-01-01T00:00:00+00:00' }))
    expect(within(card).getByRole('link', { name: 'I know this – test me' })).toBeInTheDocument()
  })

  it('tells a star with every lesson done and exercises still wrong that it can test the whole star', () => {
    const card = showCard(star({ state: 'in_progress', unmetExercises: 3, chapter: { lessonCount: 4, lessonsDone: 4, nextLesson: null } }))
    expect(within(card).getByText('All lessons done: 3 exercises still to get right')).toBeInTheDocument()
    expect(within(card).getByText('You can also test the whole star.')).toBeInTheDocument()
  })

  it('does not say so while lessons are left', () => {
    const card = showCard(star({ state: 'in_progress', unmetExercises: 3, chapter: { lessonCount: 4, lessonsDone: 2, nextLesson: null } }))
    expect(within(card).queryByText('You can also test the whole star.')).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// The quiz
// ---------------------------------------------------------------------------

describe('taking the star quiz', () => {
  it('asks what the backend sends, with two hearts and the count, and no hint, Ask or skip', async () => {
    open('/star-quiz/u-5')
    expect(await onScreen()).toBe('sq-e1')
    expect(seen.starts).toEqual(['u-5'])
    expect(hearts()).toHaveAttribute('data-quiz-hearts', '2')
    expect(screen.getByText(/Star quiz · Question 1 of 6$/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Hint' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Skip' })).toBeNull()
    expect(screen.queryByRole('complementary', { name: 'Ask' })).toBeNull()
  })

  it('passes: the whole star is lit, the sky is read again, and the way back is to the star', async () => {
    open('/star-quiz/u-5')
    for (let n = 0; n < 6; n += 1) await answerRight()
    expect(await screen.findByRole('heading', { level: 2, name: 'The whole star is lit' })).toHaveFocus()
    expect(screen.getByText('You knew it: Linear equations now shines on your star map.')).toBeInTheDocument()
    expect(seen.answers.map((sent) => sent.exerciseId)).toEqual(['sq-e1', 'sq-e2', 'sq-e3', 'sq-e4', 'sq-e5', 'sq-e6'])
    const reads = seen.skyReads
    expect(reads).toBeGreaterThan(1)
    await user.click(screen.getByRole('link', { name: 'See it on the star map' }))
    expect(where()).toBe('/map/math/algebra/u-5')
  })

  it('takes one wrong answer, a heart lost, and goes on', async () => {
    open('/star-quiz/u-5')
    await answerWrong()
    expect(await onScreen()).toBe('sq-e2')
    expect(hearts()).toHaveAttribute('data-quiz-hearts', '1')
  })

  it('is lost at the second wrong answer: when it can be taken again, and the way to its lessons', async () => {
    open('/star-quiz/u-5')
    await answerWrong()
    await onScreen()
    await answer('0')
    expect(screen.getByText('That was your last heart.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(await screen.findByRole('heading', { level: 2, name: 'Not this time' })).toHaveFocus()
    expect(screen.getByText(/^You can take the star quiz again from .+\. Until then, its lessons are the way to light it\.$/)).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'Go to its lessons' }))
    expect(where()).toBe('/chapter/u-5')
  })

  it('sends an answer lost on the way again for the same exercise, and takes its verdict', async () => {
    rules.dropAnswer = [1]
    open('/star-quiz/u-5')
    await onScreen()
    const field = document.querySelector<HTMLInputElement>('[data-stage-exercise] input')!
    await user.type(field, `${right('sq-e1')}{Enter}`)
    expect(await screen.findByText('Your answer could not be checked. Try again.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Check answer' }))
    expect(await screen.findByText('Correct')).toBeInTheDocument()
    expect(seen.answers.map((sent) => sent.exerciseId)).toEqual(['sq-e1', 'sq-e1'])
    expect(hearts()).toHaveAttribute('data-quiz-hearts', '2')
  })
})

describe('what the student reads when the backend refuses', () => {
  it('cooling down: when it opens again, and the way to the lessons', async () => {
    rules.startRefusal = { status: 409, code: 'star_quiz_cooling_down', extra: { retryAt: RETRY_AT } }
    open('/star-quiz/u-5')
    expect(await screen.findByText(/^You can take this star quiz again from .+\.$/)).toBeInTheDocument()
    expect(document.querySelector('[data-star-quiz-end="trouble"]')).not.toBeNull()
    expect(screen.getByRole('link', { name: 'Go to its lessons' })).toHaveAttribute('href', '/chapter/u-5')
    expect(screen.queryByRole('button', { name: 'Start the star quiz again' })).toBeNull()
  })

  it.each([
    ['star_quiz_already_lit', 409, 'This star is lit already.'],
    ['star_quiz_unavailable', 409, 'This star has no exercises a quiz could ask yet.'],
    ['star_quiz_unknown_star', 404, 'This knowledge point has no star quiz.'],
  ])('%s: its sentence, and the way back to the map only', async (code, status, sentence) => {
    rules.startRefusal = { status, code }
    open('/star-quiz/u-5')
    expect(await screen.findByText(sentence)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to the star map' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Start the star quiz again' })).toBeNull()
  })

  it.each([
    ['star_quiz_expired', 409, 'This star quiz ran out of time: each one is open for 30 minutes.'],
    ['star_quiz_finished', 409, 'This star quiz is already over.'],
    ['star_quiz_not_found', 404, 'This star quiz is no longer open.'],
    ['star_quiz_out_of_order', 409, 'That answer was for a different question.'],
  ])('%s while answering: its sentence, and the quiz again', async (code, status, sentence) => {
    open('/star-quiz/u-5')
    await onScreen()
    rules.answerRefusal = { status, code }
    const field = document.querySelector<HTMLInputElement>('[data-stage-exercise] input')!
    await user.type(field, '3{Enter}')
    expect(await screen.findByText(sentence)).toBeInTheDocument()
    rules.answerRefusal = null
    await user.click(screen.getByRole('button', { name: 'Start the star quiz again' }))
    // The paper still open is handed back.
    expect(await onScreen()).toBe('sq-e1')
    expect(seen.starts).toEqual(['u-5', 'u-5'])
  })

  it('says so when the paper cannot be opened at all, and offers it again', async () => {
    mswServer.use(http.post(`${API}/practice/knowledge-map/stars/:unitId/quiz`, () => HttpResponse.error()))
    open('/star-quiz/u-5')
    expect(await screen.findByText('The star quiz could not be started. Check your connection and try again.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Start the star quiz again' })).toBeInTheDocument()
  })
})

describe('the lighting moment', () => {
  it('celebrates a star lit by its quiz, as one seen happening, and never the backfill', () => {
    expect(isCelebrated({ litAtSource: 'quiz' })).toBe(true)
    expect(isCelebrated({ litAtSource: 'observed' })).toBe(true)
    expect(isCelebrated({ litAtSource: 'backfilled' })).toBe(false)
    const lit = (unitId: string, litAtSource: 'quiz' | 'backfilled') => ({
      unitId, name: unitId, nebulaId: 'algebra', order: 1, state: 'lit' as const, progress: 1, unmetExercises: 0, reviewDue: 0,
      recommendation: null, x: 0, y: 0, skills: [], chapter: { lessonCount: 1, lessonsDone: 1, nextLesson: null },
      litAt: '2026-11-01T10:00:00Z', litAtSource,
    })
    const sky: KnowledgeMapResponse = {
      subjectId: 'math', galaxies: [], nebulae: [], prerequisites: [], summary: { lit: 2, total: 2, streakDays: 0, score: 0 },
      stars: [lit('a', 'quiz'), lit('b', 'backfilled')],
      unacknowledgedLit: ['a', 'b'],
    }
    expect(litEventsOf(sky).map((event) => event.unitId)).toEqual(['a'])
  })
})

describe('the copy', () => {
  const bundle = (language: string, namespace: string) =>
    JSON.parse(readFileSync(path.resolve(__dirname, `../../src/i18n/locales/${language}/${namespace}.json`), 'utf8'))

  it('has all four languages for the entry, the ends and every refusal, each its own words', () => {
    const keys = (value: unknown, prefix = ''): string[] =>
      typeof value === 'object' && value !== null
        ? Object.entries(value).flatMap(([key, inner]) => keys(inner, `${prefix}${key}.`))
        : [prefix.slice(0, -1)]
    const at = (value: unknown, key: string) => key.split('.').reduce<unknown>((inner, part) => (inner as Record<string, unknown>)?.[part], value)
    const english = { chapter: bundle('en', 'chapter').starQuiz, starmap: bundle('en', 'starmap').star.quiz }
    for (const language of ['de', 'fr', 'it']) {
      const own = { chapter: bundle(language, 'chapter').starQuiz, starmap: bundle(language, 'starmap').star.quiz }
      for (const part of ['chapter', 'starmap'] as const) {
        expect(keys(own[part]).sort(), `${language} ${part}`).toEqual(keys(english[part]).sort())
        for (const key of keys(english[part])) {
          expect(at(own[part], key), `${language} ${part}.${key}`).toBeTruthy()
          expect(at(own[part], key), `${language} ${part}.${key}`).not.toBe(at(english[part], key))
        }
      }
      expect(bundle(language, 'common').studentRoutes.starQuiz.title).toBeTruthy()
    }
  })
})
