/**
 * The star map in two layers (#503, stoa-backend#127): a skeleton of every
 * star without its small stars, and the few stars around one in full.
 *
 * - opening the map asks for the skeleton and for one neighbourhood in the
 *   galaxy in focus, nothing else;
 * - every neighbourhood is read in the galaxy of its star (ADR 0001), so a
 *   physics star loads as well as a mathematics one;
 * - a star picked that is not loaded yet loads the stars around it, once; one
 *   already here is read again only when out of date (another language);
 * - a read that failed says so and can be read again;
 * - a read that brought nothing new hands back the same stars array;
 * - a backend before #127 (a full sky) is asked for nothing more;
 * - an answer reads the stars around its own point again, once, and not the
 *   skeleton, which follows when the map is back on screen;
 * - the chapter reads its point from the stars around it, practice sets by
 *   `skillId`; the practice stage does not wait for them.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, renderHook, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { StarCard } from '@/features/starmap/components/StarCard'
import { KnowledgeMapSourceProvider, projectStarMap } from '@/features/starmap/readModelSource'
import { StarMapSourceContext, useStarMapSource, type StarMapRequest, type StarMapSource } from '@/features/starmap/starMapSource'
import { useChapter } from '@/features/chapter/useChapter'
import { isPracticeSetOf } from '@/features/starmap/model/skillPractice'
import type { StarMap } from '@/features/starmap/model/starMap'
import { mergeStarDetails, useKnowledgeMapStarsQuery } from '@/hooks/practice/useKnowledgeMapStars'
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
import type {
  CurriculumCatalog,
  KnowledgeMapNeighbour,
  KnowledgeMapNeighbourhood,
  KnowledgeMapResponse,
  KnowledgeMapStar,
  PracticeRoadmap,
} from '@/types/practice'

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

/** Two galaxies: mathematics first (what the backend takes without a subject), physics second. */
function skeleton(view: 'skeleton' | null = 'skeleton'): KnowledgeMapResponse {
  return {
    subjectId: 'math',
    galaxies: [
      { subjectId: 'math', name: 'Mathematik', lit: 0, total: 3, enrolled: true },
      { subjectId: 'physics', name: 'Physik', lit: 0, total: 1, enrolled: true },
    ],
    nebulae: [
      { topicId: 'zahlen', name: 'Zahlen', order: 0, subjectId: 'math' },
      { topicId: 'weit', name: 'Weit', order: 1, subjectId: 'math' },
      { topicId: 'optik', name: 'Optik', order: 0, subjectId: 'physics' },
    ],
    stars: [star('near', 'zahlen', 1), star('focus', 'zahlen', 2), star('far', 'weit', 1), star('licht', 'optik', 1)].map((each) =>
      view ? each : { ...each, skills: [{ skillId: `${each.unitId}--rechnen`, name: 'Rechnen', lit: false }] },
    ),
    prerequisites: [],
    summary: { lit: 0, total: 4, streakDays: 0, score: 0 },
    ...(view ? { view } : {}),
  }
}

function full(unitId: string, relation: KnowledgeMapNeighbour['relation'], sets: KnowledgeMapNeighbour['practiceSets'] = [], name = 'Rechnen'): KnowledgeMapNeighbour {
  return {
    ...star(unitId),
    state: 'in_progress',
    unmetExercises: 4,
    skills: [
      { skillId: `${unitId}--rechnen`, name, lit: true },
      { skillId: `${unitId}--schliessen`, name: 'Schliessen', lit: false, extension: true },
    ],
    relation,
    prerequisiteUnitIds: [],
    practiceSets: sets,
  }
}

/** What the backend answers: `around` is found only in the subject asked about; without one, the first. */
function answerAround(options: { subjectId?: string; around?: string } = {}, name = 'Rechnen'): KnowledgeMapNeighbourhood {
  const subjectId = options.subjectId ?? 'math'
  const sky = skeleton()
  const inSubject = (unitId: string) => sky.nebulae.find((nebula) => nebula.topicId === sky.stars.find((s) => s.unitId === unitId)!.nebulaId)!.subjectId === subjectId
  const focus = options.around && inSubject(options.around) ? options.around : subjectId === 'math' ? 'focus' : 'licht'
  const others = subjectId === 'math' && focus === 'focus' ? ['near'] : []
  return { subjectId, focus, stars: [full(focus, 'focus', [], name), ...others.map((unitId) => full(unitId, 'neighbour', [], name))] }
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
  getSky.mockImplementation(async () => skeleton())
  getStars.mockImplementation(async (options) => answerAround(options))
  useAuthStore.setState({ isAuthenticated: true, user: { id: 'student-1', email: 's@t', name: 'S', role: 'student' } } as never)
})

afterEach(() => {
  vi.restoreAllMocks()
  useAuthStore.setState({ isAuthenticated: false, user: null } as never)
})

type Source = { current: ReturnType<typeof useStarMapSource> }
const starOf = (result: Source, unitId: string) => result.current.read(request('math')).stars.find((candidate) => candidate.unitId === unitId)!

async function openMap(subjectId = 'math') {
  const hook = renderHook(() => useStarMapSource(), { wrapper })
  await waitFor(() => expect(hook.result.current.status).toBe('success'))
  act(() => hook.result.current.focus?.({ subjectId, unitId: null }))
  return hook
}

describe('opening the map', () => {
  it('asks for the skeleton and one neighbourhood in the galaxy in focus, and lays its small stars on', async () => {
    const { result } = await openMap()

    await waitFor(() => expect(starOf(result, 'focus').skillsKnown).toBe(true))
    expect(getSky).toHaveBeenCalledTimes(1)
    expect(getStars).toHaveBeenCalledTimes(1)
    expect(getStars).toHaveBeenCalledWith({ subjectId: 'math' })
    expect(starOf(result, 'focus').skills.map((skill) => skill.skillId)).toEqual(['focus--rechnen', 'focus--schliessen'])
    expect(starOf(result, 'near').skillsKnown).toBe(true)
    // Not loaded: not "no small stars", but not known yet.
    expect(starOf(result, 'far')).toMatchObject({ skills: [], skillsKnown: false })
    // The skeleton's state stays: the lighting moment reads it, not the neighbourhood.
    expect(starOf(result, 'focus').state).toBe('ready')
  })

  it('asks the galaxy in focus, not the first one', async () => {
    const { result } = await openMap('physics')

    await waitFor(() => expect(starOf(result, 'licht').skillsKnown).toBe(true))
    expect(getStars).toHaveBeenCalledWith({ subjectId: 'physics' })
  })

  it('asks a backend before stoa-backend#127 for nothing more, and keeps its small stars', async () => {
    getSky.mockImplementation(async () => skeleton(null))
    const { result } = await openMap()

    act(() => result.current.focus?.({ subjectId: 'math', unitId: 'far' }))
    expect(getStars).not.toHaveBeenCalled()
    expect(starOf(result, 'far').skills).toHaveLength(1)
    expect(starOf(result, 'far').skillsKnown).toBeUndefined()
  })

  it('sends the skeleton view and the subject in the requests', async () => {
    const get = vi.spyOn(httpClient, 'get').mockResolvedValue({ data: skeleton() })
    const actual = await vi.importActual<typeof import('@/services/practice/practiceApi')>('@/services/practice/practiceApi')

    await actual.getKnowledgeMap()
    await actual.getKnowledgeMapStars({ subjectId: 'physics', around: 'licht' })

    expect(get).toHaveBeenNthCalledWith(1, '/practice/knowledge-map', { params: { view: 'skeleton' } })
    expect(get).toHaveBeenNthCalledWith(2, '/practice/knowledge-map/stars', { params: { subjectId: 'physics', around: 'licht' } })
  })
})

describe('picking a star', () => {
  it('loads the stars around one not loaded yet, once', async () => {
    const { result } = await openMap()
    await waitFor(() => expect(starOf(result, 'focus').skillsKnown).toBe(true))

    act(() => result.current.focus?.({ subjectId: 'math', unitId: 'far' }))
    await waitFor(() => expect(starOf(result, 'far').skillsKnown).toBe(true))
    expect(getStars).toHaveBeenLastCalledWith({ subjectId: 'math', around: 'far' })
    expect(starOf(result, 'far').skills.some((skill) => skill.extension)).toBe(true)

    act(() => {
      result.current.focus?.({ subjectId: 'math', unitId: 'far' })
      result.current.focus?.({ subjectId: 'math', unitId: 'near' })
    })
    expect(getStars).toHaveBeenCalledTimes(2)
  })

  it('loads a star of another galaxy in that galaxy (S1)', async () => {
    const { result } = await openMap()
    await waitFor(() => expect(starOf(result, 'focus').skillsKnown).toBe(true))

    act(() => result.current.focus?.({ subjectId: 'physics', unitId: 'licht' }))

    await waitFor(() => expect(starOf(result, 'licht').skillsKnown).toBe(true))
    expect(getStars).toHaveBeenLastCalledWith({ subjectId: 'physics', around: 'licht' })
  })

  it('says a read that failed, and reads it again when asked (M3)', async () => {
    const { result } = await openMap()
    await waitFor(() => expect(starOf(result, 'focus').skillsKnown).toBe(true))
    getStars.mockRejectedValueOnce(new Error('upstream'))

    act(() => result.current.focus?.({ subjectId: 'math', unitId: 'far' }))
    await waitFor(() => expect(starOf(result, 'far').skillsFailed).toBe(true))
    expect(starOf(result, 'focus').skillsFailed).toBeUndefined()

    act(() => result.current.retrySkills?.())
    await waitFor(() => expect(starOf(result, 'far').skillsKnown).toBe(true))
    expect(starOf(result, 'far').skillsFailed).toBeUndefined()
  })

  it('reads a star already here again once its read is out of date, as after a switch of language (M4)', async () => {
    const { result } = await openMap()
    await waitFor(() => expect(starOf(result, 'near').skillsKnown).toBe(true))
    // Loaded around another star, and the map then moved on.
    act(() => result.current.focus?.({ subjectId: 'math', unitId: 'far' }))
    await waitFor(() => expect(starOf(result, 'far').skillsKnown).toBe(true))
    getStars.mockImplementation(async (options) => answerAround(options, 'Calcul'))

    // What a switch of language does: every query out of date at once.
    await act(async () => {
      await client.invalidateQueries()
    })
    act(() => result.current.focus?.({ subjectId: 'math', unitId: 'near' }))

    await waitFor(() => expect(starOf(result, 'near').skills[0].name).toBe('Calcul'))
    expect(getStars).toHaveBeenLastCalledWith({ subjectId: 'math', around: 'near' })
  })

  it('keeps the latest read of a star when two neighbourhoods hold it', () => {
    const older = { ...answerAround(), stars: [{ ...full('focus', 'focus'), state: 'ready' as const }] }
    const index = mergeStarDetails([
      { data: answerAround(), at: 20 },
      { data: older, at: 10 },
    ])
    expect(index.get('focus')?.state).toBe('in_progress')
  })
})

describe('a read that brought nothing new (M2)', () => {
  it('hands back the same stars array, and the same star objects', async () => {
    const { result } = await openMap()
    await waitFor(() => expect(starOf(result, 'focus').skillsKnown).toBe(true))
    const before = result.current.read(request('math')).stars

    await act(async () => {
      await client.refetchQueries({ queryKey: ['practice', 'knowledge-map-stars'] })
    })

    expect(getStars).toHaveBeenCalledTimes(2)
    expect(result.current.read(request('math')).stars).toBe(before)
  })

  it('keeps the stars array when a new index holds the same small stars', () => {
    const sky = skeleton()
    const read = answerAround()
    const first = new Map(read.stars.map((each) => [each.unitId, each] as const))
    const before = projectStarMap(sky, request('math'), first).stars

    // Another index -- another neighbourhood read, say -- with the very same stars in it.
    const again = new Map(first)
    expect(projectStarMap(sky, request('math'), again).stars).toBe(before)
    // A star that did change is a new object; the others stay what they were.
    const changed = new Map(first).set('near', { ...first.get('near')!, skills: [] })
    const after = projectStarMap(sky, request('math'), changed).stars
    expect(after).not.toBe(before)
    expect(after.find((each) => each.unitId === 'focus')).toBe(before.find((each) => each.unitId === 'focus'))
  })
})

describe('an answer', () => {
  it('reads the stars around its own point again, once, not the skeleton, which follows when the map is back (M1)', async () => {
    vi.mocked(submitChallengeAnswer).mockResolvedValue({ challengeId: 'c', correct: true } as never)
    const { result } = renderHook(
      () => ({
        source: useStarMapSource(),
        // The chapter's read of the point, and the map's own on its star.
        stars: useKnowledgeMapStarsQuery('math', 'focus'),
        answer: useSubmitChallengeAnswerMutation({ unitId: 'focus' }),
      }),
      { wrapper },
    )
    await waitFor(() => expect(result.current.source.status).toBe('success'))
    act(() => result.current.source.focus?.({ subjectId: 'math', unitId: null }))
    await waitFor(() => expect(result.current.stars.isSuccess).toBe(true))
    await waitFor(() => expect(getStars).toHaveBeenCalledTimes(2))
    const skyReads = getSky.mock.calls.length

    await act(async () => {
      await result.current.answer.mutateAsync({ challengeId: 'c', payload: { answer: 'x' } as never })
    })

    await waitFor(() => expect(getStars).toHaveBeenCalledTimes(3))
    // Give any second read the chance to go out: there must be none.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20))
    })
    expect(getStars).toHaveBeenCalledTimes(3)
    expect(getStars).toHaveBeenLastCalledWith({ subjectId: 'math', around: 'focus' })
    expect(getSky).toHaveBeenCalledTimes(skyReads)

    act(() => result.current.source.arrive?.())
    await waitFor(() => expect(getSky).toHaveBeenCalledTimes(skyReads + 1))
  })
})

function cardMap(over: Partial<StarMap['stars'][number]>): StarMap {
  return {
    subject: { subjectId: 'math', name: 'Mathematik' },
    subjects: [],
    nebulae: [{ topicId: 'weit', name: 'Weit', order: 1, subjectId: 'math' }],
    stars: [{ ...star('far', 'weit'), ...over }],
    prerequisites: [],
    summary: { lit: 0, total: 1, streakDays: 0, score: 0 },
  }
}

function renderCard(map: StarMap, source: Partial<StarMapSource> = {}) {
  render(
    <I18nextProvider i18n={i18n}>
      <StarMapSourceContext.Provider value={{ read: () => map, demo: false, ...source }}>
        <MemoryRouter initialEntries={['/map/math/weit/far']}>
          <Routes>
            <Route path="/map/*" element={<StarCard map={map} star={map.stars[0]} nebula={map.nebulae[0]} reducedMotion={false} />} />
          </Routes>
        </MemoryRouter>
      </StarMapSourceContext.Provider>
    </I18nextProvider>,
  )
}

describe('the star card', () => {
  it('says the small stars are on their way for a star not loaded yet', () => {
    renderCard(cardMap({ skillsKnown: false }))
    expect(document.querySelector('[data-skills-loading]')).toHaveTextContent('Loading this star’s small stars…')
    expect(document.querySelector('[data-skills-failed]')).toBeNull()
  })

  it('says a read that failed and reads it again (M3)', async () => {
    const retrySkills = vi.fn()
    renderCard(cardMap({ skillsKnown: false, skillsFailed: true }), { retrySkills })

    expect(screen.getByRole('alert')).toHaveTextContent('This star’s small stars could not be loaded.')
    expect(document.querySelector('[data-skills-loading]')).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(retrySkills).toHaveBeenCalledTimes(1)
  })
})

describe('the chapter', () => {
  const sets: KnowledgeMapNeighbour['practiceSets'] = [
    { lessonId: 'set-a', title: 'Rechnen · Stufe 1', order: 1, exerciseCount: 3, skillId: 'licht--rechnen', status: 'completed' },
    { lessonId: 'set-b', title: 'Schliessen', order: 2, exerciseCount: 2, skillId: 'licht--schliessen', status: 'available', extension: true },
  ]

  beforeEach(() => {
    // A physics point: its neighbourhood has to be read in physics (S1).
    getStars.mockImplementation(async (options = {}) =>
      options.subjectId === 'physics' && options.around === 'licht'
        ? { subjectId: 'physics', focus: 'licht', stars: [full('licht', 'focus', sets)] }
        : answerAround(options),
    )
    vi.mocked(getCurriculumCatalog).mockResolvedValue({
      subjects: [],
      topics: [],
      // The catalog's own spelling of the subject; the sky's galaxy is what is asked.
      units: [{ id: 'licht', subjectId: 'physik', gradeLevel: '9', topicId: 'optik', title: 'Licht', description: '', rolloutState: 'active', order: 1 }],
      lessons: [],
      rolloutSubjects: ['physics'],
      includePreview: false,
      source: 'test',
    } as CurriculumCatalog)
    vi.mocked(getPracticeRoadmap).mockResolvedValue({
      subjectId: 'physics',
      topicId: 'optik',
      gradeLevel: '9',
      topic: { id: 'optik', subjectId: 'physics', gradeLevel: '9', title: 'Optik', description: '', progress: 0 },
      progress: 0,
      units: [
        {
          id: 'licht',
          title: 'Licht',
          description: '',
          order: 1,
          lessons: sets.map((set) => ({
            id: set.lessonId,
            title: set.title,
            order: set.order,
            status: set.status === 'completed' ? ('completed' as const) : ('available' as const),
            estimatedMinutes: 10,
            subjectId: 'physics',
            gradeLevel: '9',
            topicId: 'optik',
            unitId: 'licht',
            challengeCount: set.exerciseCount,
          })),
        },
      ],
    } as PracticeRoadmap)
  })

  it('reads its point from the stars around it, in its own galaxy, and its practice sets by skillId', async () => {
    const { result } = renderHook(() => useChapter('licht', { waitForSkills: true }), { wrapper })
    await waitFor(() => expect(result.current.status).toBe('ready'))
    if (result.current.status !== 'ready') return
    expect(getStars).toHaveBeenCalledWith({ subjectId: 'physics', around: 'licht' })
    expect(result.current.chapter.star).toEqual({ state: 'in_progress', unmetExercises: 4 })
    expect(result.current.chapter.skills).toHaveLength(2)
    expect(result.current.chapter.practiceSets.map((set) => set.skillId)).toEqual(['licht--rechnen', 'licht--schliessen'])
  })

  it('is ready for the practice stage without waiting for the stars around it (M5)', async () => {
    getStars.mockImplementation(() => new Promise(() => {}))
    const { result } = renderHook(() => useChapter('licht'), { wrapper })

    await waitFor(() => expect(result.current.status).toBe('ready'))
    if (result.current.status !== 'ready') return
    // From the skeleton meanwhile; its small stars are not known yet.
    expect(result.current.chapter.star).toEqual({ state: 'ready', unmetExercises: 0 })
    expect(result.current.chapter.skills).toEqual([])
  })
})

it('says which practice sets are whose by skillId first, by name only where none is said', () => {
  const sets = [{ lessonId: 'set-a', title: '', order: 1, exerciseCount: 1, skillId: 'u--rechnen', status: 'available' as const }]
  expect(isPracticeSetOf('set-a', 'u--rechnen', sets)).toBe(true)
  expect(isPracticeSetOf('u--schliessen--1', 'u--schliessen', sets)).toBe(true)
  expect(isPracticeSetOf('set-a', 'u--schliessen', sets)).toBe(false)
})
