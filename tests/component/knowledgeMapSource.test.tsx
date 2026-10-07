import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  KnowledgeMapSourceProvider,
  projectStarMap,
} from '@/features/starmap/readModelSource'
import { useStarMapSource } from '@/features/starmap/starMapSource'
import { getKnowledgeMap } from '@/services/practice/practiceApi'
import { useAuthStore } from '@/store/authStore'
import type { KnowledgeMapResponse } from '@/types/practice'

// #48: the seam #131 left on `emptyStarMapSource` now carries the backend read
// model. What matters here is what a student actually sees - an empty sky
// until the request lands, their own subjects after it - and that nobody who
// has no sky asks for one.

vi.mock('@/services/practice/practiceApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/practice/practiceApi')>()),
  getKnowledgeMap: vi.fn(),
}))

const mockedGet = vi.mocked(getKnowledgeMap)

function sky(overrides: Partial<KnowledgeMapResponse> = {}): KnowledgeMapResponse {
  return {
    subjectId: 'math',
    galaxies: [
      { subjectId: 'math', name: 'Mathematik', lit: 1, total: 2, enrolled: true },
      { subjectId: 'physics', name: 'Physik', lit: 0, total: 1, enrolled: false },
    ],
    nebulae: [
      { topicId: 't1', name: 'Brüche', order: 0, subjectId: 'math' },
      { topicId: 't2', name: 'Optik', order: 1, subjectId: 'physics' },
    ],
    stars: [
      star('u1', 't1', 'lit'),
      star('u2', 't1', 'ready'),
      star('u3', 't2', 'ready'),
    ],
    prerequisites: [],
    summary: { lit: 1, total: 2, streakDays: 4, score: 0 },
    ...overrides,
  }
}

function star(
  unitId: string,
  nebulaId: string,
  state: KnowledgeMapResponse['stars'][number]['state'],
): KnowledgeMapResponse['stars'][number] {
  return {
    unitId,
    name: unitId,
    nebulaId,
    order: 0,
    state,
    progress: state === 'lit' ? 1 : 0,
    unmetExercises: 0,
    reviewDue: 0,
    recommendation: null,
    x: 0.5,
    y: 0.5,
    skills: [],
    chapter: { lessonCount: 1, lessonsDone: state === 'lit' ? 1 : 0, nextLesson: null },
  }
}

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  return (
    <QueryClientProvider client={client}>
      <KnowledgeMapSourceProvider>{children}</KnowledgeMapSourceProvider>
    </QueryClientProvider>
  )
}

function signIn(role: string) {
  useAuthStore.setState({
    isAuthenticated: true,
    user: { id: 'student-1', email: 's@t', name: 'S', role },
  } as never)
}

beforeEach(() => {
  mockedGet.mockReset()
  useAuthStore.setState({ isAuthenticated: false, user: null } as never)
})

describe('the star map source behind a signed-in student', () => {
  it('draws their own subjects once the sky arrives', async () => {
    signIn('student')
    mockedGet.mockResolvedValue(sky())

    const { result } = renderHook(() => useStarMapSource(), { wrapper })

    await waitFor(() => {
      const map = result.current.read(request('math'))
      expect(map.subject.name).toBe('Mathematik')
    })
    const map = result.current.read(request('math'))
    expect(map.subjects.map((galaxy) => galaxy.subjectId)).toEqual(['math', 'physics'])
    expect(map.stars).toHaveLength(3)
  })

  it('is the empty sky before the request lands, not a flash of somebody else’s', async () => {
    signIn('student')
    mockedGet.mockReturnValue(new Promise(() => {}))

    const { result } = renderHook(() => useStarMapSource(), { wrapper })

    const map = result.current.read(request('math'))
    expect(map.stars).toEqual([])
    expect(map.subjects).toEqual([])
    expect(map.subject.name).toBe('')
  })

  it('is the empty sky when the read fails, rather than an error page', async () => {
    signIn('student')
    mockedGet.mockRejectedValue(new Error('nope'))

    const { result } = renderHook(() => useStarMapSource(), { wrapper })

    await waitFor(() => expect(mockedGet).toHaveBeenCalled())
    expect(result.current.read(request('math')).stars).toEqual([])
  })

  it('never says it is demo content', async () => {
    signIn('student')
    mockedGet.mockResolvedValue(sky())

    const { result } = renderHook(() => useStarMapSource(), { wrapper })

    await waitFor(() => expect(mockedGet).toHaveBeenCalled())
    expect(result.current.demo).toBe(false)
  })
})

describe('who does not ask for a sky', () => {
  it('nobody signed out', async () => {
    const { result } = renderHook(() => useStarMapSource(), { wrapper })

    await waitFor(() => expect(result.current.read(request('math')).stars).toEqual([]))
    expect(mockedGet).not.toHaveBeenCalled()
  })

  it('and no parent or teacher', async () => {
    for (const role of ['parent', 'teacher', 'admin']) {
      mockedGet.mockReset()
      signIn(role)

      renderHook(() => useStarMapSource(), { wrapper })

      await waitFor(() => expect(mockedGet).not.toHaveBeenCalled())
    }
  })
})

describe('projecting one galaxy out of the sky', () => {
  it('counts the galaxy in focus, not the whole sky', () => {
    const map = projectStarMap(sky(), request('math'))

    expect(map.summary.total).toBe(2)
    expect(map.summary.lit).toBe(1)
  })

  it('follows the galaxy the request names', () => {
    const map = projectStarMap(sky(), request('physics'))

    expect(map.subject).toEqual({ subjectId: 'physics', name: 'Physik' })
    expect(map.summary.total).toBe(1)
    expect(map.summary.lit).toBe(0)
  })

  it('keeps every galaxy, nebula and star so the switcher and the band stay whole', () => {
    const map = projectStarMap(sky(), request('math'))

    expect(map.subjects).toHaveLength(2)
    expect(map.nebulae).toHaveLength(2)
    expect(map.stars).toHaveLength(3)
  })

  it('carries the streak, which belongs to the student and not to a subject', () => {
    expect(projectStarMap(sky(), request('physics')).summary.streakDays).toBe(4)
  })

  it('falls back to the subject the sky names when the request asks for none', () => {
    expect(projectStarMap(sky(), request('')).subject.subjectId).toBe('math')
  })
})

function request(subjectId: string) {
  return {
    subjectId,
    size: 10,
    t: ((key: string) => key) as never,
    language: 'de',
    relations: false,
    longNames: false,
  } as never
}
