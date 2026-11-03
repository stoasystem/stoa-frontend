/**
 * The way on from a star lit by its quiz (#578, after #485): the star quiz's
 * passed page leads, under 「See it on the star map」, to the star its
 * subject's system recommendation is on now -- that star's card -- as the
 * lesson's done page does. Through the real API layer against a mocked
 * backend (MSW), so the recommendation only moves once the sky is read again
 * after the pass.
 *
 * - passed: 「Next star: …」 opens the recommended star's card, with why;
 * - nothing while the subject has no recommendation (another subject's is
 *   not it);
 * - nothing while the recommendation is still on the star just lit.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import { StarQuizPage } from '@/pages/chapter/ChapterPages'
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
const SIZE = 2

type ResponseStar = KnowledgeMapResponse['stars'][number]
type Recommendation = ResponseStar['recommendation']

/** Where this subject's recommendation is once the quiz is passed. */
let afterPass: { unitId: string; recommendation: Recommendation } | null
let passed: boolean
let answers: number
/** Reads of the sky the backend answered after the star was lit. */
let readsAfterPass: number

const right = (n: number) => String(n * 3)

function responseStar(unitId: string, name: string, nebulaId: string, extra: Partial<ResponseStar> = {}): ResponseStar {
  return {
    unitId,
    name,
    nebulaId,
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

/** Before the pass the recommendation is on the star being tested; after it, wherever the test puts it. */
function sky(): KnowledgeMapResponse {
  const recommended = (unitId: string): Recommendation =>
    passed
      ? afterPass?.unitId === unitId
        ? afterPass.recommendation
        : null
      : unitId === 'u-5'
        ? { source: 'system', reason: 'start', relatedUnitId: null }
        : null
  return {
    subjectId: 'math',
    galaxies: [
      { subjectId: 'math', name: 'Maths', lit: passed ? 1 : 0, total: 2, enrolled: true },
      { subjectId: 'physics', name: 'Physics', lit: 0, total: 1, enrolled: true },
    ],
    nebulae: [
      { topicId: 'algebra', name: 'Algebra', order: 1, subjectId: 'math' },
      { topicId: 'mechanics', name: 'Mechanics', order: 2, subjectId: 'physics' },
    ],
    stars: [
      responseStar('u-5', 'Linear equations', 'algebra', {
        order: 2,
        state: passed ? 'lit' : 'ready',
        progress: passed ? 1 : 0,
        recommendation: recommended('u-5'),
      }),
      responseStar('u-6', 'Quadratic equations', 'algebra', { order: 3, recommendation: recommended('u-6') }),
      // Another subject's recommendation is never this one's way on.
      responseStar('p-1', 'Forces', 'mechanics', { recommendation: { source: 'system', reason: 'start', relatedUnitId: null } }),
    ],
    prerequisites: [],
    summary: { lit: passed ? 1 : 0, total: 3, streakDays: 0, score: 0 },
  }
}

function paperView() {
  const done = answers >= SIZE
  return {
    quizId: 'sq-1',
    unitId: 'u-5',
    status: done ? 'passed' : 'inProgress',
    total: SIZE,
    answered: answers,
    mistakes: 0,
    mistakesAllowed: 1,
    expiresAt: '2099-01-01T00:00:00+00:00',
    exercise: done
      ? null
      : {
          challengeId: `sq-e${answers + 1}`,
          lessonId: `l-${answers + 1}`,
          unitId: 'u-5',
          subjectId: 'math',
          gradeLevel: '8',
          topicId: 'algebra',
          topic: 'Multiply.',
          type: 'text_input',
          prompt: `Star question ${answers + 1}: what is ${answers + 1} × 3?`,
          hintAvailable: true,
        },
    retryAt: null,
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
      if (passed) readsAfterPass += 1
      return HttpResponse.json(sky())
    }),
    http.post(`${API}/practice/knowledge-map/stars/:unitId/quiz`, () => HttpResponse.json(paperView())),
    http.post(`${API}/practice/knowledge-map/stars/:unitId/quiz/:quizId/answer`, async ({ request }) => {
      const body = (await request.json()) as { exerciseId: string; answer: unknown }
      const correct = body.answer === right(answers + 1)
      if (correct) answers += 1
      // The backend lights the star as the last answer is judged.
      if (answers >= SIZE) passed = true
      return HttpResponse.json({ ...paperView(), correct })
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

let user: UserEvent
let client: QueryClient

function open() {
  client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/star-quiz/u-5']}>
          <Routes>
            <Route path="/star-quiz/:unitId" element={<StarQuizPage />} />
            <Route path="/map/*" element={<p>the star map</p>} />
          </Routes>
          <Where />
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  )
}

/** Through the whole paper, right each time, to the passed page. */
async function passTheQuiz() {
  open()
  for (let n = 1; n <= SIZE; n += 1) {
    await screen.findByRole('heading', { level: 2, name: new RegExp(`^Star question ${n}:`) })
    const field = document.querySelector<HTMLInputElement>('[data-stage-exercise] input')!
    await user.type(field, `${right(n)}{Enter}`)
    await screen.findByText('Correct')
    await user.click(screen.getByRole('button', { name: /^(Next question|Finish the quiz)$/ }))
  }
  await screen.findByRole('heading', { level: 2, name: 'The whole star is lit' })
}

/** The sky read again after the pass is in, so an absence is not just an answer still on its way. */
async function skyReadAgain() {
  await waitFor(() => expect(readsAfterPass).toBeGreaterThan(0))
  await waitFor(() => expect(client.isFetching()).toBe(0))
}

beforeAll(() => mswServer.listen({ onUnhandledRequest: 'error' }))
beforeEach(async () => {
  user = userEvent.setup({ delay: null })
  await i18n.changeLanguage('en')
  afterPass = { unitId: 'u-6', recommendation: { source: 'system', reason: 'after_lit', relatedUnitId: 'u-5' } }
  passed = false
  answers = 0
  readsAfterPass = 0
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

describe('the star quiz passed leads on to the next star (#578)', () => {
  it('opens the card of the star its subject recommends now, with why, under the way to the map', async () => {
    await passTheQuiz()
    const link = await screen.findByRole('link', { name: 'Next star: Quadratic equations' })
    expect(link).toHaveAttribute('href', '/map/math/algebra/u-6')
    expect(document.querySelector('[data-stage-done-next-star-reason]')).toHaveTextContent(
      /^Follows on from Linear equations, which you just lit$/,
    )
    // Under the row with the way to the map, not in it; that way stays.
    const end = document.querySelector('[data-star-quiz-end="passed"]')!
    expect(end.querySelector(':scope > [data-stage-done-next-star]')).not.toBeNull()
    expect(screen.getByRole('link', { name: 'See it on the star map' })).toHaveAttribute('href', '/map/math/algebra/u-5')

    await user.click(link)
    expect(screen.getByTestId('where')).toHaveTextContent('/map/math/algebra/u-6')
  })

  it('has no way on while the subject has no recommendation (another subject’s is not it)', async () => {
    afterPass = null
    await passTheQuiz()
    await skyReadAgain()
    expect(screen.getByRole('link', { name: 'See it on the star map' })).toBeInTheDocument()
    expect(document.querySelector('[data-stage-done-next-star]')).toBeNull()
    expect(screen.queryByRole('link', { name: /^Next star:/ })).toBeNull()
  })

  it('has no way on while the recommendation is still on the star just lit', async () => {
    afterPass = { unitId: 'u-5', recommendation: { source: 'system', reason: 'in_progress', relatedUnitId: null } }
    await passTheQuiz()
    await skyReadAgain()
    expect(screen.getByRole('link', { name: 'See it on the star map' })).toBeInTheDocument()
    expect(document.querySelector('[data-stage-done-next-star]')).toBeNull()
    expect(screen.queryByRole('link', { name: /^Next star:/ })).toBeNull()
  })
})
