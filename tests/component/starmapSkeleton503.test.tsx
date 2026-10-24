/**
 * The star map in two layers (#503, stoa-backend#127): a skeleton of every
 * star without its small stars, and the few stars around one in full.
 *
 * - opening the map asks for the skeleton and for one neighbourhood, nothing else;
 * - a star picked that is not loaded yet loads the stars around it, once;
 * - a loaded star carries its small stars, one not loaded says so;
 * - a backend before #127 (a full sky) is asked for nothing more;
 * - an answer reads its own stars again, not the skeleton, which follows
 *   when the map is back on screen;
 * - the chapter reads its point from the stars around it, practice sets by `skillId`.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { StarCard } from '@/features/starmap/components/StarCard'
import { KnowledgeMapSourceProvider } from '@/features/starmap/readModelSource'
import { useStarMapSource, type StarMapRequest } from '@/features/starmap/starMapSource'
import { useChapter } from '@/features/chapter/useChapter'
import { useKnowledgeMapStarsQuery, mergeStarDetails } from '@/hooks/practice/useKnowledgeMapStars'
import { useSubmitChallengeAnswerMutation } from '@/hooks/practice/useSubmitChallengeAnswerMutation'
import i18n from '@/i18n'
import { httpClient } from '@/services/api/httpClient'
import {
  getCurriculumCatalog,
  getKnowledgeMap,
  getKnowledgeMapStars,
  getPracticeRoadmap,
  submitChallengeAnswer,
} from '@/services/practice/practiceApi'
import { useAuthStore } from '@/store/authStore'
import type { KnowledgeMapNeighbour, KnowledgeMapNeighbourhood, KnowledgeMapResponse, KnowledgeMapStar } from '@/types/practice'

vi.mock('@/services/practice/practiceApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/practice/practiceApi')>()),
  getKnowledgeMap: vi.fn(),
  getKnowledgeMapStars: vi.fn(),
  getCurriculumCatalog: vi.fn(),
  getPracticeRoadmap: vi.fn(),
  submitChallengeAnswer: vi.fn(),
}))

const getSky = vi.mocked(getKnowledgeMap)
const getStars = vi.mocked(getKnowledgeMapStars)

function star(unitId: string, nebulaId = 'zahlen', order = 1): KnowledgeMapStar {
  return {
    unitId,
    name: unitId,
    nebulaId,
    order,
    state: 'ready',
    progress: 0,
    unmetExercises: 0,
    reviewDue: 0,
    recommendation: null,
    x: 0.5,
    y: 0.5,
    skills: [],
    chapter: { lessonCount: 2, lessonsDone: 0, nextLesson: null },
  }
}


function skeleton(view: 'skeleton' | null = 'skeleton'): KnowledgeMapResponse {
  return {
    subjectId: 'math',
    galaxies: [{ subjectId: 'math', name: 'Mathematik', lit: 0, total: 3, enrolled: true }],
    nebulae: [
      { topicId: 'zahlen', name: 'Zahlen', order: 0, subjectId: 'math' },
      { topicId: 'weit', name: 'Weit', order: 1, subjectId: 'math' },
    ],
    stars: [star('near', 'zahlen', 1), star('focus', 'zahlen', 2), star('far', 'weit', 1)].map((each) =>
      view ? each : { ...each, skills: [{ skillId: `${each.unitId}--rechnen`, name: 'Rechnen', lit: false }] },
    ),
    prerequisites: [],
    summary: { lit: 0, total: 3, streakDays: 0, score: 0 },
    ...(view ? { view } : {}),
  }
}

function full(unitId: string, relation: KnowledgeMapNeighbour['relation'], sets: KnowledgeMapNeighbour['practiceSets'] = []): KnowledgeMapNeighbour {
  return {
    ...star(unitId),
    state: 'in_progress',
    unmetExercises: 4,
    skills: [
      { skillId: `${unitId}--rechnen`, name: 'Rechnen', lit: true },
      { skillId: `${unitId}--schliessen`, name: 'Schliessen', lit: false, extension: true },
    ],
    relation,
    prerequisiteUnitIds: [],
    practiceSets: sets,
  }
}

function around(focus: string, ...others: string[]): KnowledgeMapNeighbourhood {
  return { subjectId: 'math', focus, stars: [full(focus, 'focus'), ...others.map((unitId) => full(unitId, 'neighbour'))] }
}

const request = (subjectId: string): StarMapRequest => ({ subjectId, size: 1000, t: i18n.t, language: 'de', relations: false, longNames: false }) as StarMapRequest

let client: QueryClient

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={client}>
      <KnowledgeMapSourceProvider>{children}</KnowledgeMapSourceProvider>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  getSky.mockReset()
  getStars.mockReset()
  useAuthStore.setState({ isAuthenticated: true, user: { id: 'student-1', email: 's@t', name: 'S', role: 'student' } } as never)
})

afterEach(() => {
  vi.restoreAllMocks()
  useAuthStore.setState({ isAuthenticated: false, user: null } as never)
})

const starOf = (result: { current: ReturnType<typeof useStarMapSource> }, unitId: string) =>
  result.current.read(request('math')).stars.find((candidate) => candidate.unitId === unitId)!

describe('opening the map', () => {
  it('asks for the skeleton and one neighbourhood, and lays its small stars on', async () => {
    getSky.mockResolvedValue(skeleton())
    getStars.mockResolvedValue(around('focus', 'near'))

    const { result } = renderHook(() => useStarMapSource(), { wrapper })

    await waitFor(() => expect(starOf(result, 'focus').skillsKnown).toBe(true))
    expect(getSky).toHaveBeenCalledTimes(1)
    expect(getStars).toHaveBeenCalledTimes(1)
    expect(getStars).toHaveBeenCalledWith({})
    expect(starOf(result, 'focus').skills.map((skill) => skill.skillId)).toEqual(['focus--rechnen', 'focus--schliessen'])
    expect(starOf(result, 'near').skillsKnown).toBe(true)
    // Not loaded: not "no small stars", but not known yet.
    expect(starOf(result, 'far')).toMatchObject({ skills: [], skillsKnown: false })
    // The skeleton's state stays: the lighting moment reads it, not the neighbourhood.
    expect(starOf(result, 'focus').state).toBe('ready')
  })

  it('reads the same stars array again while nothing new has landed', async () => {
    getSky.mockResolvedValue(skeleton())
    getStars.mockResolvedValue(around('focus'))
    const { result } = renderHook(() => useStarMapSource(), { wrapper })
    await waitFor(() => expect(starOf(result, 'focus').skillsKnown).toBe(true))

    expect(result.current.read(request('math')).stars).toBe(result.current.read(request('math')).stars)
  })

  it('asks a backend before stoa-backend#127 for nothing more, and keeps its small stars', async () => {
    getSky.mockResolvedValue(skeleton(null))
    const { result } = renderHook(() => useStarMapSource(), { wrapper })

    await waitFor(() => expect(result.current.read(request('math')).stars).toHaveLength(3))
    act(() => result.current.select?.('far'))
    expect(getStars).not.toHaveBeenCalled()
    expect(starOf(result, 'far').skills).toHaveLength(1)
    expect(starOf(result, 'far').skillsKnown).toBeUndefined()
  })

  it('sends the skeleton view in the request', async () => {
    const get = vi.spyOn(httpClient, 'get').mockResolvedValue({ data: skeleton() })
    const actual = await vi.importActual<typeof import('@/services/practice/practiceApi')>('@/services/practice/practiceApi')

    await actual.getKnowledgeMap()
    await actual.getKnowledgeMapStars({ around: 'far' })

    expect(get).toHaveBeenNthCalledWith(1, '/practice/knowledge-map', { params: { view: 'skeleton' } })
    expect(get).toHaveBeenNthCalledWith(2, '/practice/knowledge-map/stars', { params: { around: 'far' } })
  })
})

describe('picking a star', () => {
  it('loads the stars around one not loaded yet, once', async () => {
    getSky.mockResolvedValue(skeleton())
    getStars.mockImplementation(async (options = {}) => (options.around ? around(options.around) : around('focus')))
    const { result } = renderHook(() => useStarMapSource(), { wrapper })
    await waitFor(() => expect(starOf(result, 'focus').skillsKnown).toBe(true))

    act(() => result.current.select?.('far'))
    await waitFor(() => expect(starOf(result, 'far').skillsKnown).toBe(true))
    expect(getStars).toHaveBeenLastCalledWith({ around: 'far' })
    expect(starOf(result, 'far').skills.some((skill) => skill.extension)).toBe(true)

    act(() => {
      result.current.select?.('far')
      result.current.select?.('focus')
    })
    expect(getStars).toHaveBeenCalledTimes(2)
  })

  it('keeps the latest read of a star when two neighbourhoods hold it', () => {
    const older = { ...around('focus'), stars: [{ ...full('focus', 'focus'), state: 'ready' as const }] }
    const newer = around('focus')
    const index = mergeStarDetails([
      { data: newer, at: 20 },
      { data: older, at: 10 },
    ])
    expect(index.get('focus')?.state).toBe('in_progress')
  })
})

describe('an answer', () => {
  it('reads its own stars again, not the skeleton, which follows when the map is back', async () => {
    getSky.mockResolvedValue(skeleton())
    getStars.mockResolvedValue(around('focus'))
    vi.mocked(submitChallengeAnswer).mockResolvedValue({ challengeId: 'c', correct: true } as never)
    const { result } = renderHook(
      () => ({ source: useStarMapSource(), stars: useKnowledgeMapStarsQuery('focus'), answer: useSubmitChallengeAnswerMutation() }),
      { wrapper },
    )
    await waitFor(() => expect(result.current.stars.isSuccess).toBe(true))
    const skyReads = getSky.mock.calls.length
    const starReads = getStars.mock.calls.length

    await act(async () => {
      await result.current.answer.mutateAsync({ challengeId: 'c', payload: { answer: 'x' } as never })
    })

    await waitFor(() => expect(getStars.mock.calls.length).toBeGreaterThan(starReads))
    expect(getSky).toHaveBeenCalledTimes(skyReads)

    act(() => result.current.source.arrive?.())
    await waitFor(() => expect(getSky).toHaveBeenCalledTimes(skyReads + 1))
  })
})

describe('the star card', () => {
  it('says the small stars are on their way for a star not loaded yet', () => {
    const map = {
      subject: { subjectId: 'math', name: 'Mathematik' },
      subjects: [],
      nebulae: [{ topicId: 'weit', name: 'Weit', order: 1, subjectId: 'math' }],
      stars: [{ ...star('far', 'weit'), skillsKnown: false }],
      prerequisites: [],
      summary: { lit: 0, total: 1, streakDays: 0, score: 0 },
    }
    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={['/map/math/weit/far']}>
          <Routes>
            <Route path="/map/*" element={<StarCard map={map} star={map.stars[0]} nebula={map.nebulae[0]} reducedMotion={false} />} />
          </Routes>
        </MemoryRouter>
      </I18nextProvider>,
    )
    expect(document.querySelector('[data-skills-loading]')).toHaveTextContent('Loading this star’s small stars…')
  })
})

describe('the chapter', () => {
  it('reads its point from the stars around it, and its practice sets by skillId', async () => {
    // Ids that do not follow the naming: only `skillId` can tell them apart.
    const sets: KnowledgeMapNeighbour['practiceSets'] = [
      { lessonId: 'set-a', title: 'Rechnen · Stufe 1', order: 1, exerciseCount: 3, skillId: 'focus--rechnen', status: 'completed' },
      { lessonId: 'set-b', title: 'Schliessen', order: 2, exerciseCount: 2, skillId: 'focus--schliessen', status: 'available', extension: true },
    ]
    getSky.mockResolvedValue(skeleton())
    getStars.mockResolvedValue({ subjectId: 'math', focus: 'focus', stars: [full('focus', 'focus', sets)] })
    vi.mocked(getCurriculumCatalog).mockResolvedValue({
      subjects: [],
      topics: [],
      units: [{ id: 'focus', subjectId: 'math', gradeLevel: '6', topicId: 'zahlen', title: 'Focus', description: '', rolloutState: 'active', order: 1 }],
      lessons: [],
      rolloutSubjects: ['math'],
      includePreview: false,
      source: 'test',
    })
    vi.mocked(getPracticeRoadmap).mockResolvedValue({
      subjectId: 'math',
      topicId: 'zahlen',
      gradeLevel: '6',
      topic: { id: 'zahlen', subjectId: 'math', gradeLevel: '6', title: 'Zahlen', description: '', progress: 0 },
      progress: 0,
      units: [
        {
          id: 'focus',
          title: 'Focus',
          description: '',
          order: 1,
          lessons: sets.map((set) => ({
            id: set.lessonId,
            title: set.title,
            order: set.order,
            status: set.status === 'completed' ? ('completed' as const) : ('available' as const),
            estimatedMinutes: 10,
            subjectId: 'math',
            gradeLevel: '6',
            topicId: 'zahlen',
            unitId: 'focus',
            challengeCount: set.exerciseCount,
          })),
        },
      ],
    })

    const { result } = renderHook(() => useChapter('focus'), { wrapper })
    await waitFor(() => expect(result.current.status).toBe('ready'))
    if (result.current.status !== 'ready') return
    expect(getStars).toHaveBeenCalledWith({ around: 'focus' })
    expect(result.current.chapter.star).toEqual({ state: 'in_progress', unmetExercises: 4 })
    expect(result.current.chapter.skills).toHaveLength(2)
    expect(result.current.chapter.practiceSets.map((set) => set.skillId)).toEqual(['focus--rechnen', 'focus--schliessen'])
  })
})

it('says which practice sets are whose by skillId first, by name only where none is said', async () => {
  const { isPracticeSetOf } = await import('@/features/starmap/model/skillPractice')
  const sets = [{ lessonId: 'set-a', title: '', order: 1, exerciseCount: 1, skillId: 'u--rechnen', status: 'available' as const }]
  expect(isPracticeSetOf('set-a', 'u--rechnen', sets)).toBe(true)
  expect(isPracticeSetOf('u--schliessen--1', 'u--schliessen', sets)).toBe(true)
  expect(isPracticeSetOf('set-a', 'u--schliessen', sets)).toBe(false)
})
