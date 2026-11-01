/**
 * Small stars as question types (#501, stoa-backend#127): extension small
 * stars told apart, 「先点亮」 hints that link to the star and never lock, and
 * a small star's practice sets by stage.
 *
 * - the model: which skills are question types, which lessons are a small
 *   star's practice sets, a stage's title, and the hints;
 * - the star's card: an extension small star has its own dot, a tag and a
 *   note; a hint links to the star to light first; a question type links to
 *   its own page; a ZAP star's skills stay names;
 * - the small star's page (`/chapter/:unitId?skill=`): its practice sets in
 *   order, titled by stage in the reader's language, done ones ticked, the one
 *   to do now marked, the hints beside them and every set still open;
 * - the design preview's demo knowledge point: the star lights from its core,
 *   the extension small star on its own.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEMO_KNOWLEDGE_POINT, demoKnowledgePointState, demoPracticeSets, demoSkillsAfter } from '@/dev/demo/data'
import { StarCard } from '@/features/starmap/components/StarCard'
import { isPracticeSetOf, isQuestionType, prerequisiteHints, stageTitle } from '@/features/starmap/model/skillPractice'
import type { KnowledgeSkill, Star, StarMap } from '@/features/starmap/model/starMap'
import i18n from '@/i18n'
import { ChapterPage } from '@/pages/chapter/ChapterPages'
import { getCurriculumCatalog, getKnowledgeMap, getPracticeRoadmap } from '@/services/practice/practiceApi'
import { type CurrentUser, useAuthStore } from '@/store/authStore'
import type { KnowledgeMapResponse, PracticeRoadmap, RoadmapLessonStatus } from '@/types/practice'

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
vi.mock('@/services/student/studentApi', () => ({
  getStudentProfile: vi.fn(async () => ({ grade: '6', primarySubjects: ['math'] })),
}))
vi.mock('@/services/learning/memoryApi', () => ({
  getMyMemorySummary: vi.fn(async () => ({ recommendations: [], weakTopics: [] })),
}))
vi.mock('@/services/practice/practiceApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/practice/practiceApi')>()),
  getCurriculumCatalog: vi.fn(),
  getKnowledgeMap: vi.fn(),
  getPracticeRoadmap: vi.fn(),
}))

// ---------------------------------------------------------------------------
// A knowledge-base star beside a ZAP star, as stoa-backend#127 sends them
// ---------------------------------------------------------------------------

const UNIT = 'zahlen-addition-bis-20'
const KOPF = `${UNIT}--kopfrechnen`
const SACH = `${UNIT}--sachaufgaben`
const SCHLIESSEN = `${UNIT}--schliessen`

const SKILLS: KnowledgeSkill[] = [
  { skillId: KOPF, name: 'Kopfrechnen-Trick', lit: true },
  { skillId: SACH, name: 'Sachaufgaben', lit: false, missingPrerequisites: [{ unitId: UNIT, name: 'Addition bis 20' }] },
  {
    skillId: SCHLIESSEN,
    name: 'Formeln und Schlussfolgern',
    lit: false,
    extension: true,
    missingPrerequisites: [{ unitId: 'funktionen-grundlagen', name: 'Funktionen: Grundlagen' }],
  },
]

/** Practice sets in the backend's `order`: stage first, then question type. */
const SETS = [
  { id: `${KOPF}--1`, title: 'Kopfrechnen-Trick · Stufe 1', order: 111 },
  { id: `${SACH}--1`, title: 'Sachaufgaben · Stufe 1', order: 121 },
  { id: `${KOPF}--2`, title: 'Kopfrechnen-Trick · Stufe 2', order: 211 },
  { id: `${SACH}--2-1`, title: 'Sachaufgaben · Stufe 2 · Teil 1', order: 221 },
  { id: `${SACH}--2-2`, title: 'Sachaufgaben · Stufe 2 · Teil 2', order: 222 },
  { id: `${SCHLIESSEN}--1`, title: 'Formeln und Schlussfolgern', order: 341 },
]
let completed: Set<string>

function star(over: Partial<Star> & Pick<Star, 'unitId' | 'name' | 'nebulaId'>): Star {
  return {
    order: 1,
    state: 'in_progress',
    progress: 0.5,
    unmetExercises: 0,
    reviewDue: 0,
    recommendation: null,
    x: 0.5,
    y: 0.5,
    skills: [],
    unlitPrerequisiteIds: [],
    chapter: { lessonCount: 5, lessonsDone: 2, nextLesson: null },
    ...over,
  }
}

const KB_STAR = star({ unitId: UNIT, name: 'Addition bis 20', nebulaId: 'zahlen', skills: SKILLS })
const TARGET = star({ unitId: 'funktionen-grundlagen', name: 'Funktionen: Grundlagen', nebulaId: 'funktionen', state: 'ready' })
const ZAP_STAR = star({
  unitId: 'zap-6-brueche',
  name: 'Brüche',
  nebulaId: 'zahlen',
  skills: [
    { skillId: 'brueche-kuerzen', name: 'Brüche kürzen', lit: true },
    { skillId: 'brueche-addieren', name: 'Brüche addieren', lit: false },
  ],
})

const MAP: StarMap = {
  subject: { subjectId: 'math', name: 'Mathematik' },
  nebulae: [
    { topicId: 'zahlen', name: 'Zahlen', order: 1, subjectId: 'math' },
    { topicId: 'funktionen', name: 'Funktionen', order: 2, subjectId: 'math' },
  ],
  stars: [KB_STAR, TARGET, ZAP_STAR],
  prerequisites: [],
  summary: { lit: 0, total: 3, streakDays: 0, score: 0 },
  subjects: [{ subjectId: 'math', name: 'Mathematik', lit: 0, total: 3, enrolled: true }],
}

function statusOf(id: string): RoadmapLessonStatus {
  if (completed.has(id)) return 'completed'
  const current = SETS.find((set) => !completed.has(set.id))
  return current?.id === id ? 'current' : 'available'
}

function roadmap(): PracticeRoadmap {
  return {
    subjectId: 'math',
    topicId: 'zahlen',
    gradeLevel: '2',
    topic: { id: 'zahlen', subjectId: 'math', gradeLevel: '2', title: 'Zahlen', description: '', progress: 0 },
    progress: 0,
    units: [
      {
        id: UNIT,
        title: 'Addition bis 20',
        description: '',
        order: 1,
        // Served backwards: the page puts them in `order`.
        lessons: [...SETS].reverse().map((set) => ({
          id: set.id,
          title: set.title,
          order: set.order,
          status: statusOf(set.id),
          estimatedMinutes: 10,
          subjectId: 'math',
          gradeLevel: '2',
          topicId: 'zahlen',
          unitId: UNIT,
          challengeCount: 5,
        })),
      },
    ],
  }
}

function knowledgeMap(): KnowledgeMapResponse {
  return {
    subjectId: 'math',
    galaxies: [{ subjectId: 'math', name: 'Mathematik', lit: 0, total: 2, enrolled: true }],
    nebulae: [
      { topicId: 'zahlen', name: 'Zahlen', order: 1, subjectId: 'math' },
      { topicId: 'funktionen', name: 'Funktionen', order: 2, subjectId: 'math' },
    ],
    stars: [KB_STAR, TARGET],
    prerequisites: [],
    summary: { lit: 0, total: 2, streakDays: 0, score: 0 },
  }
}

const catalog = {
  subjects: [],
  topics: [],
  units: [{ id: UNIT, subjectId: 'math', gradeLevel: '2', topicId: 'zahlen', title: 'Addition bis 20', description: '', rolloutState: 'active' as const, order: 1 }],
  lessons: SETS.map((set) => ({
    id: set.id,
    subjectId: 'math',
    gradeLevel: '2',
    unitId: UNIT,
    topicId: 'zahlen',
    title: set.title,
    objective: '',
    difficulty: 'practice',
    estimatedMinutes: 10,
    rolloutState: 'active' as const,
    exerciseCount: 5,
    source: 'test',
  })),
  rolloutSubjects: ['math'],
  includePreview: false,
  source: 'test',
}

beforeEach(async () => {
  await i18n.changeLanguage('de')
  completed = new Set([`${KOPF}--1`, `${SACH}--1`, `${KOPF}--2`])
  useAuthStore.setState({
    user: { id: 'u-1', name: 'Lina Meier', email: 'lina@example.com', role: 'student' } as CurrentUser,
    accessToken: 'token',
    isAuthenticated: true,
  })
  vi.mocked(getCurriculumCatalog).mockResolvedValue(catalog)
  vi.mocked(getPracticeRoadmap).mockImplementation(async () => roadmap())
  vi.mocked(getKnowledgeMap).mockImplementation(async () => knowledgeMap())
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
})

afterEach(async () => {
  vi.restoreAllMocks()
  await i18n.changeLanguage('en')
})

describe('the model', () => {
  it('tells a question type from a ZAP skill by its id', () => {
    expect(isQuestionType({ skillId: KOPF }, UNIT)).toBe(true)
    expect(isQuestionType({ skillId: 'brueche-kuerzen' }, 'zap-6-brueche')).toBe(false)
    expect(isQuestionType({ skillId: `${UNIT}--` }, UNIT)).toBe(false)
    // A neighbouring star whose id starts with this one's is not this one's.
    expect(isQuestionType({ skillId: `${UNIT}-2--kopfrechnen` }, UNIT)).toBe(false)
  })

  it("finds a small star's practice sets, parts included, and no other's", () => {
    expect(SETS.filter((set) => isPracticeSetOf(set.id, SACH)).map((set) => set.id)).toEqual([`${SACH}--1`, `${SACH}--2-1`, `${SACH}--2-2`])
    expect(isPracticeSetOf(`${KOPF}--1`, SACH)).toBe(false)
  })

  it("titles a practice set by its stage in every language, and leaves a title it can't read whole", () => {
    expect(stageTitle('Sachaufgaben · Stufe 2 · Teil 1', 'Sachaufgaben')).toBe('Stufe 2 · Teil 1')
    expect(stageTitle('Word problems · Level 2 · Part 1', 'Word problems')).toBe('Level 2 · Part 1')
    expect(stageTitle('Problèmes · Niveau 3', 'Problèmes')).toBe('Niveau 3')
    expect(stageTitle('Problemi · Livello 1', 'Problemi')).toBe('Livello 1')
    // One stage only: the title is the name.
    expect(stageTitle('Formeln und Schlussfolgern', 'Formeln und Schlussfolgern')).toBe('Formeln und Schlussfolgern')
    expect(stageTitle('Something else · Stufe 1', 'Sachaufgaben')).toBe('Something else · Stufe 1')
  })

  it('splits the hints into this star’s earlier stages and stars to light first', () => {
    expect(prerequisiteHints(SKILLS[1], UNIT, MAP)).toEqual({ earlierStages: true, stars: [] })
    expect(prerequisiteHints(SKILLS[2], UNIT, MAP)).toEqual({
      earlierStages: false,
      stars: [{ unitId: 'funktionen-grundlagen', name: 'Funktionen: Grundlagen', nebulaId: 'funktionen', subjectId: 'math' }],
    })
    // A star the sky does not hold is named, with nowhere to fly.
    expect(prerequisiteHints({ missingPrerequisites: [{ unitId: 'gone', name: 'Gone' }] }, UNIT, MAP).stars).toEqual([{ unitId: 'gone', name: 'Gone' }])
    expect(prerequisiteHints(SKILLS[0], UNIT, MAP)).toEqual({ earlierStages: false, stars: [] })
  })
})

function card(target: Star) {
  const nebula = MAP.nebulae.find((candidate) => candidate.topicId === target.nebulaId)!
  render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={[`/map/math/${target.nebulaId}/${target.unitId}`]}>
        <Routes>
          <Route path="/map/*" element={<StarCard map={MAP} star={target} nebula={nebula} reducedMotion={false} />} />
        </Routes>
      </MemoryRouter>
    </I18nextProvider>,
  )
  return screen.getByRole('article')
}

const item = (skillId: string) => document.querySelector<HTMLElement>(`[data-skill="${skillId}"]`)!

describe("the star's card", () => {
  it('draws an extension small star apart, and says it does not count for lighting', () => {
    card(KB_STAR)
    expect(item(KOPF).querySelector('[data-skill-dot]')).toHaveAttribute('data-skill-dot', 'core-lit')
    expect(item(SCHLIESSEN).querySelector('[data-skill-dot]')).toHaveAttribute('data-skill-dot', 'extension-dark')
    expect(within(item(SCHLIESSEN)).getByText('Erweiterung')).toBeInTheDocument()
    expect(item(KOPF).querySelector('[data-skill-extension]')).toBeNull()
    expect(document.querySelector('[data-skill-legend]')).toHaveTextContent('Fürs Leuchten des Sterns zählt sie nicht')
  })

  it('names the star to light first and links to it there, without locking the small star', () => {
    card(KB_STAR)
    const hint = item(SCHLIESSEN).querySelector('[data-skill-hint="light-first"]')!
    expect(hint).toHaveTextContent('Zuerst zum Leuchten bringen: Funktionen: Grundlagen')
    expect(within(hint as HTMLElement).getByRole('link', { name: 'Funktionen: Grundlagen' })).toHaveAttribute(
      'href',
      '/map/math/funktionen/funktionen-grundlagen',
    )
    expect(item(SACH).querySelector('[data-skill-hint="earlier-stages"]')).toHaveTextContent('früheren Stufen dieses Sterns')
    // Still a way in, hint or not.
    expect(within(item(SCHLIESSEN)).getByRole('link', { name: 'Formeln und Schlussfolgern üben' })).toHaveAttribute(
      'href',
      `/chapter/${UNIT}?skill=${encodeURIComponent(SCHLIESSEN)}`,
    )
    expect(within(item(SACH)).getByRole('link', { name: 'Sachaufgaben üben' })).toBeInTheDocument()
  })

  it("leaves a ZAP star's skills as they were: names, no tag, no hint, no legend", () => {
    card(ZAP_STAR)
    expect(within(item('brueche-kuerzen')).queryByRole('link')).toBeNull()
    expect(document.querySelectorAll('[data-skill-dot^="extension"]')).toHaveLength(0)
    expect(document.querySelector('[data-skill-hints]')).toBeNull()
    expect(document.querySelector('[data-skill-legend]')).toBeNull()
  })
})

function open(at: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, retryDelay: 0 } } })
  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[at]}>
          <Routes>
            <Route path="/chapter/:unitId" element={<ChapterPage />} />
            <Route path="*" element={<p>elsewhere</p>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  )
}

const rows = () => [...document.querySelectorAll<HTMLElement>('[data-chapter-lessons] > li')]

describe("a small star's page", () => {
  it('lists its practice sets by stage, the done ones ticked and the one to do now marked', async () => {
    open(`/chapter/${UNIT}?skill=${encodeURIComponent(SACH)}`)

    expect(await screen.findByRole('heading', { level: 1, name: 'Sachaufgaben' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Übungsreihen' })).toBeInTheDocument()
    expect(rows().map((row) => row.querySelector('a, div')!.textContent)).toEqual([
      expect.stringContaining('Stufe 1'),
      expect.stringContaining('Stufe 2 · Teil 1'),
      expect.stringContaining('Stufe 2 · Teil 2'),
    ])
    expect(rows()[0].querySelector('[data-node-state]')).toHaveAttribute('data-node-state', 'done')
    expect(rows()[1].querySelector('[aria-current="step"]')).not.toBeNull()
    expect(rows()[2].querySelector('[data-node-state]')).toHaveAttribute('data-node-state', 'ready')
    expect(screen.getByRole('progressbar')).toHaveTextContent('Noch 2 Übungsreihen.')
    expect(screen.getByRole('link', { name: 'Weiter: Stufe 2 · Teil 1' })).toHaveAttribute('href', `/chapter/${UNIT}/${encodeURIComponent(`${SACH}--2-1`)}`)
    // The other small stars' sets are not here.
    expect(screen.queryByText(/Kopfrechnen-Trick/)).toBeNull()
  })

  it('says what to learn first and that it is open all the same', async () => {
    open(`/chapter/${UNIT}?skill=${encodeURIComponent(SCHLIESSEN)}`)

    expect(await screen.findByRole('heading', { level: 1, name: 'Formeln und Schlussfolgern' })).toBeInTheDocument()
    expect(screen.getByText('Erweiterung')).toBeInTheDocument()
    expect(screen.getAllByText(/Fürs Leuchten des Sterns zählt sie nicht/).length).toBeGreaterThan(0)
    expect(screen.getByRole('link', { name: 'Funktionen: Grundlagen' })).toHaveAttribute('href', '/map/math/funktionen/funktionen-grundlagen')
    expect(screen.getByText('Üben kannst du sie trotzdem schon jetzt.')).toBeInTheDocument()
    // Not locked: the set is a link, and the way in is offered.
    expect(rows()[0].querySelector('a')).toHaveAttribute('href', `/chapter/${UNIT}/${encodeURIComponent(`${SCHLIESSEN}--1`)}`)
    expect(screen.getByRole('link', { name: 'Beginnen: Formeln und Schlussfolgern' })).toBeInTheDocument()
  })

  it('opens the whole chapter for a small star the point does not have', async () => {
    open(`/chapter/${UNIT}?skill=brueche-kuerzen`)

    expect(await screen.findByRole('heading', { level: 1, name: 'Addition bis 20' })).toBeInTheDocument()
    expect(rows()).toHaveLength(SETS.length)
  })
})

describe("the design preview's demo knowledge point", () => {
  const core = DEMO_KNOWLEDGE_POINT.lessons.map((lesson) => lesson.lessonId)
  const extension = DEMO_KNOWLEDGE_POINT.extensionLessons.map((lesson) => lesson.lessonId)
  const skills = DEMO_KNOWLEDGE_POINT.skills.map(({ skillId, name }) => ({ skillId, name: name.en, lit: false }))
  const after = (completed: string[]) => demoSkillsAfter(skills, completed, 'functions-2', () => 'Linear functions')

  it('has core and extension small stars, each a question type with practice sets of its own', () => {
    for (const skill of DEMO_KNOWLEDGE_POINT.skills) {
      expect(isQuestionType(skill, DEMO_KNOWLEDGE_POINT.unitId)).toBe(true)
      expect(demoPracticeSets().some((set) => isPracticeSetOf(set.lessonId, skill.skillId))).toBe(true)
    }
    expect(DEMO_KNOWLEDGE_POINT.skills.filter((skill) => skill.extension)).toHaveLength(1)
  })

  it('lights the star from its core alone, and the extension small star on its own', () => {
    expect(demoKnowledgePointState(core)).toBe('lit')
    expect(after(core).find((skill) => skill.extension)?.lit).toBe(false)
    expect(after(core).filter((skill) => !skill.extension).every((skill) => skill.lit)).toBe(true)
    expect(demoKnowledgePointState(extension)).toBe('ready')
    expect(after(extension).find((skill) => skill.extension)?.lit).toBe(true)
  })

  it("asks for the star's earlier stages until the core is done, and for the other star until it is lit", () => {
    const opening = after(core.slice(0, 1)).find((skill) => skill.extension)!
    expect(opening.missingPrerequisites?.map((item) => item.unitId)).toEqual([DEMO_KNOWLEDGE_POINT.unitId, 'functions-2'])
    expect(after(core).find((skill) => skill.extension)!.missingPrerequisites?.map((item) => item.unitId)).toEqual(['functions-2'])
    expect(after(core).find((skill) => !skill.extension)!.missingPrerequisites).toBeUndefined()
  })
})
