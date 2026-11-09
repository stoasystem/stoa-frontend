/**
 * Why a star is recommended, and the way on from a star just lit (#485,
 * stoa-backend#164, #474's rule).
 *
 * - the star card says why the system recommends a star: the one in
 *   progress, the one after the star just lit (named, in the reader's
 *   language, from the sky), or where to start; nothing for a teacher's
 *   recommendation, for a backend that does not say why yet, or for an
 *   `after_lit` whose star the sky does not hold;
 * - the lesson's done page, once the star is lit, leads to the star its
 *   subject's recommendation is on now -- that star's card -- with the same
 *   sentence under it; nothing while the subject has none, while it is still
 *   on the star just lit, or while the star is not lit;
 * - the copy is in all four languages.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { StarCard } from '@/features/starmap/components/StarCard'
import type { StarMap } from '@/features/starmap/model/starMap'
import { projectStarMap } from '@/features/starmap/readModelSource'
import i18n from '@/i18n'
import { LessonStagePage } from '@/pages/chapter/ChapterPages'
import { ApiError } from '@/services/api/httpClient'
import {
  completePracticeLesson,
  getCurriculumCatalog,
  getKnowledgeMap,
  getPracticeLesson,
  getPracticeRoadmap,
  submitChallengeAnswer,
} from '@/services/practice/practiceApi'
import { resetAsk } from '@/store/askStore'
import { type CurrentUser, useAuthStore } from '@/store/authStore'
import type { KnowledgeMapResponse, PracticeLesson, PracticeRoadmap } from '@/types/practice'

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
  // The shell reads the usage period for its reminder (#616); not what this is about: years away.
  getStudentEntitlement: vi.fn(async () => ({
    effectivePlan: 'basic',
    newUsageAllowed: true,
    teacherSupportIncluded: true,
    usagePeriod: { endsAt: '2099-12-31', state: 'active', daysLeft: 9999, paidBy: 'parent' },
    renewalContactEmail: 'info@stoaedu.ch',
  })),
}))
vi.mock('@/services/learning/memoryApi', () => ({
  getMyMemorySummary: vi.fn(async () => ({ recommendations: [], weakTopics: [] })),
}))
vi.mock('@/services/practice/practiceApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/practice/practiceApi')>()),
  getCurriculumCatalog: vi.fn(),
  getKnowledgeMap: vi.fn(),
  getPracticeRoadmap: vi.fn(),
  getPracticeLesson: vi.fn(),
  submitChallengeAnswer: vi.fn(),
  completePracticeLesson: vi.fn(),
}))

// ---------------------------------------------------------------------------
// The sky
// ---------------------------------------------------------------------------

type ResponseStar = KnowledgeMapResponse['stars'][number]
type Recommendation = ResponseStar['recommendation']

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
    chapter: { lessonCount: 2, lessonsDone: 0, nextLesson: null },
    unlitPrerequisiteIds: [],
    ...extra,
  }
}

function sky(stars: ResponseStar[]): KnowledgeMapResponse {
  return {
    subjectId: 'math',
    galaxies: [
      { subjectId: 'math', name: 'Maths', lit: 1, total: 3, enrolled: true },
      { subjectId: 'physics', name: 'Physics', lit: 0, total: 1, enrolled: true },
    ],
    nebulae: [
      { topicId: 'algebra', name: 'Algebra', order: 1, subjectId: 'math' },
      { topicId: 'mechanics', name: 'Mechanics', order: 2, subjectId: 'physics' },
    ],
    stars,
    prerequisites: [],
    summary: { lit: 1, total: 3, streakDays: 0, score: 0 },
  }
}

// ---------------------------------------------------------------------------
// The star card
// ---------------------------------------------------------------------------

describe('the star card says why the system recommends it', () => {
  function showCard(recommendation: Recommendation, { language = 'en', related = true } = {}) {
    const map: StarMap = projectStarMap(
      sky([
        ...(related ? [responseStar('u-1', language === 'de' ? 'Brüche' : 'Fractions', 'algebra', { state: 'lit', progress: 1 })] : []),
        responseStar('u-6', 'Quadratic equations', 'algebra', { recommendation }),
      ]),
      { subjectId: 'math' } as never,
    )
    const star = map.stars.find((candidate) => candidate.unitId === 'u-6')!
    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <StarCard map={map} star={star} nebula={map.nebulae[0]} reducedMotion />
        </MemoryRouter>
      </I18nextProvider>,
    )
    return screen.getByRole('article', { name: 'Quadratic equations' })
  }
  const reason = () => document.querySelector('[data-recommendation-reason]')

  beforeEach(async () => {
    await i18n.changeLanguage('en')
  })

  it('in progress: where the student left off', () => {
    const card = showCard({ source: 'system', reason: 'in_progress', relatedUnitId: null })
    expect(within(card).getByText('Suggested next')).toBeInTheDocument()
    expect(reason()).toHaveTextContent(/^Where you left off last time$/)
  })

  it('after a lighting: names the star just lit, as the sky has it', () => {
    showCard({ source: 'system', reason: 'after_lit', relatedUnitId: 'u-1' })
    expect(reason()).toHaveTextContent(/^Follows on from Fractions, which you just lit$/)
  })

  it('from the start: where to begin', () => {
    showCard({ source: 'system', reason: 'start', relatedUnitId: null })
    expect(reason()).toHaveTextContent(/^Start here$/)
  })

  it('says it in the language shown, with the name the sky sends in it', async () => {
    await i18n.changeLanguage('de')
    showCard({ source: 'system', reason: 'after_lit', relatedUnitId: 'u-1' }, { language: 'de' })
    expect(reason()).toHaveTextContent(/^Weiter nach Brüche: gerade von dir zum Leuchten gebracht$/)
  })

  it('says nothing for an after_lit whose star the sky does not hold, or that names none', () => {
    const card = showCard({ source: 'system', reason: 'after_lit', relatedUnitId: 'u-1' }, { related: false })
    expect(within(card).getByText('Suggested next')).toBeInTheDocument()
    expect(reason()).toBeNull()
  })

  it('says nothing for an after_lit without a related star', () => {
    showCard({ source: 'system', reason: 'after_lit', relatedUnitId: null })
    expect(reason()).toBeNull()
  })

  it('says nothing, and breaks nothing, while the backend does not say why (before stoa-backend#164)', () => {
    const card = showCard({ source: 'system' })
    expect(within(card).getByText('Suggested next')).toBeInTheDocument()
    expect(reason()).toBeNull()
  })

  it('leaves a teacher’s recommendation as it was', () => {
    const card = showCard({ source: 'teacher', reason: 'start', relatedUnitId: null })
    expect(within(card).getByText('Suggested next')).toBeInTheDocument()
    expect(reason()).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// The done page
// ---------------------------------------------------------------------------

const LESSONS = [
  { id: 'l-1', title: 'What an equation says', order: 1 },
  { id: 'l-2', title: 'Balancing both sides', order: 2 },
]
let completed: Set<string>
/** What the sky says once the lesson is in: the point's state and where its subject's recommendation is. */
let after: { state: ResponseStar['state']; recommendation: { unitId: string; recommendation: Recommendation } | null }

function roadmap(): PracticeRoadmap {
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
        lessons: LESSONS.map((lesson) => ({
          id: lesson.id,
          title: lesson.title,
          order: lesson.order,
          status: completed.has(lesson.id) ? 'completed' : 'current',
          estimatedMinutes: 10,
          subjectId: 'math',
          gradeLevel: '8',
          topicId: 'algebra',
          unitId: 'u-5',
          challengeCount: 1,
        })),
      },
    ],
  }
}

function knowledgeMap(): KnowledgeMapResponse {
  const done = LESSONS.every((lesson) => completed.has(lesson.id))
  const recommended = (unitId: string): Recommendation =>
    done
      ? after.recommendation?.unitId === unitId
        ? after.recommendation.recommendation
        : null
      : unitId === 'u-5'
        ? { source: 'system', reason: 'in_progress', relatedUnitId: null }
        : null
  return sky([
    responseStar('u-1', 'Fractions', 'algebra', { state: 'lit', progress: 1 }),
    responseStar('u-5', 'Linear equations', 'algebra', {
      order: 2,
      state: done ? after.state : 'in_progress',
      progress: completed.size / LESSONS.length,
      recommendation: recommended('u-5'),
      chapter: { lessonCount: 2, lessonsDone: completed.size, nextLesson: null },
    }),
    responseStar('u-6', 'Quadratic equations', 'algebra', { order: 3, recommendation: recommended('u-6') }),
    // Another subject's recommendation is never this one's way on.
    responseStar('p-1', 'Forces', 'mechanics', { recommendation: { source: 'system', reason: 'start', relatedUnitId: null } }),
  ])
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
    exerciseCount: 1,
    source: 'test',
  })),
  rolloutSubjects: ['math'],
  includePreview: false,
  source: 'test',
}

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
    {
      challengeId: 'ch-1',
      lessonId: 'l-2',
      unitId: 'u-5',
      subjectId: 'math',
      gradeLevel: '8',
      topicId: 'algebra',
      topic: 'Solve for x.',
      type: 'multiple_choice',
      prompt: '3x + 5 = 20',
      hintAvailable: false,
      options: ['x = 3', 'x = 5'],
      correctAnswer: 'x = 5',
    },
  ],
}

function Where() {
  return <p data-testid="where">{useLocation().pathname}</p>
}

function open() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, retryDelay: 0 } } })
  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/chapter/u-5/l-2']}>
          <Routes>
            <Route path="/chapter/:unitId/:lessonId" element={<LessonStagePage />} />
            <Route path="*" element={<p>elsewhere</p>} />
          </Routes>
          <Where />
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  )
}

/** Answers the lesson's one exercise and finishes it; the sky is read again with the lesson in. */
async function finishTheLastLesson() {
  open()
  await userEvent.click(await screen.findByRole('radio', { name: /x = 5/ }))
  await userEvent.click(screen.getByRole('button', { name: 'Check answer' }))
  await userEvent.click(await screen.findByRole('button', { name: 'Finish lesson' }))
  expect(await screen.findByText('Every lesson in Linear equations is done.')).toBeInTheDocument()
  await vi.waitFor(() => expect(vi.mocked(getKnowledgeMap).mock.calls.length).toBeGreaterThan(1))
}

const nextStar = () => screen.queryByRole('link', { name: /^Next star:/ })

describe('the done page leads on from the star just lit', () => {
  const originalMatchMedia = window.matchMedia

  beforeEach(async () => {
    await i18n.changeLanguage('en')
    completed = new Set(['l-1'])
    after = {
      state: 'lit',
      recommendation: { unitId: 'u-6', recommendation: { source: 'system', reason: 'after_lit', relatedUnitId: 'u-5' } },
    }
    window.matchMedia = ((query: string) => ({
      matches: !query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    })) as typeof window.matchMedia
    useAuthStore.setState({
      user: { id: 'u-1', name: 'Lina Meier', email: 'lina@example.com', role: 'student' } as CurrentUser,
      accessToken: 'token',
      isAuthenticated: true,
    })
    resetAsk()
    vi.mocked(getCurriculumCatalog).mockResolvedValue(catalog)
    vi.mocked(getPracticeRoadmap).mockImplementation(async () => roadmap())
    vi.mocked(getKnowledgeMap).mockImplementation(async () => knowledgeMap())
    vi.mocked(getPracticeLesson).mockResolvedValue(lesson)
    vi.mocked(submitChallengeAnswer).mockImplementation(async (challengeId, payload) => ({
      challengeId,
      correct: payload.answer === 'x = 5',
      feedback: 'Balanced.',
      attemptsRemaining: 2,
    }))
    vi.mocked(completePracticeLesson).mockImplementation(async (input) => {
      const lessonId = typeof input === 'string' ? input : input.lessonId
      completed.add(lessonId)
      return { lessonId } as Awaited<ReturnType<typeof completePracticeLesson>>
    })
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
  })

  afterEach(() => {
    window.matchMedia = originalMatchMedia
    sessionStorage.clear()
    vi.restoreAllMocks()
    vi.clearAllMocks()
  })

  it('opens the card of the star its subject recommends now, with why under it', async () => {
    await finishTheLastLesson()
    const link = await screen.findByRole('link', { name: 'Next star: Quadratic equations' })
    expect(link).toHaveAttribute('href', '/map/math/algebra/u-6')
    expect(document.querySelector('[data-stage-done-next-star-reason]')).toHaveTextContent(
      /^Follows on from Linear equations, which you just lit$/,
    )
    // The way to the map stays: the lighting plays there.
    expect(screen.getByRole('link', { name: 'See it on the star map' })).toHaveAttribute('href', '/map/math/algebra/u-5')

    await userEvent.click(link)
    expect(screen.getByTestId('where')).toHaveTextContent('/map/math/algebra/u-6')
  })

  it('gives the way on without a sentence while the backend does not say why', async () => {
    after.recommendation = { unitId: 'u-6', recommendation: { source: 'system' } }
    await finishTheLastLesson()
    expect(await screen.findByRole('link', { name: 'Next star: Quadratic equations' })).toBeInTheDocument()
    expect(document.querySelector('[data-stage-done-next-star-reason]')).toBeNull()
  })

  it('has no way on while the subject has no recommendation (another subject’s is not it)', async () => {
    after.recommendation = null
    await finishTheLastLesson()
    expect(nextStar()).toBeNull()
    expect(document.querySelector('[data-stage-done-next-star]')).toBeNull()
  })

  it('has no way on to a teacher’s recommendation', async () => {
    after.recommendation = { unitId: 'u-6', recommendation: { source: 'teacher' } }
    await finishTheLastLesson()
    expect(nextStar()).toBeNull()
  })

  it('has no way on while the recommendation is still on the star just lit', async () => {
    after.recommendation = { unitId: 'u-5', recommendation: { source: 'system', reason: 'in_progress', relatedUnitId: null } }
    await finishTheLastLesson()
    expect(nextStar()).toBeNull()
  })

  it('has no way on while the star is not lit, every lesson done or not', async () => {
    after.state = 'in_progress'
    await finishTheLastLesson()
    expect(nextStar()).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// The copy
// ---------------------------------------------------------------------------

describe('the copy', () => {
  const bundle = (language: string, namespace: string) =>
    JSON.parse(readFileSync(path.resolve(__dirname, `../../src/i18n/locales/${language}/${namespace}.json`), 'utf8'))
  const copyOf = (language: string) => {
    const reason = bundle(language, 'starmap').marker.reason
    return [reason.inProgress, reason.afterLit, reason.start, bundle(language, 'chapter').stage.done.nextStar] as string[]
  }

  it('says why and the way on in all four languages, each its own words, naming the star where it should', () => {
    const english = copyOf('en')
    for (const language of ['de', 'en', 'fr', 'it']) {
      const copy = copyOf(language)
      for (const [k, sentence] of copy.entries()) {
        expect(sentence, `${language} ${k}`).toBeTruthy()
        if (language !== 'en') expect(sentence, `${language} ${k}`).not.toBe(english[k])
      }
      expect(copy[1], language).toContain('{{name}}')
      expect(copy[3], language).toContain('{{name}}')
    }
  })

  it('speaks to the student as du in German, with ss and no ß', () => {
    const german = copyOf('de').join(' ')
    expect(german).not.toMatch(/ß/)
    expect(german).not.toMatch(/\b(Sie|Ihr|Ihnen)\b/)
    expect(german).toMatch(/\b(du|dir|Fang)\b/)
  })
})
