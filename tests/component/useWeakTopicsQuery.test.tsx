/**
 * Exercises the real hooks against a mocked API module, so the mapping from
 * the backend's memory-summary contract is covered rather than a copy of it.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useRecommendationsQuery, useWeakTopicsQuery } from '@/hooks/learning/useWeakTopicsQuery'
import { getMyMemorySummary } from '@/services/learning/memoryApi'

vi.mock('@/services/learning/memoryApi', () => ({ getMyMemorySummary: vi.fn() }))

const mockedGet = vi.mocked(getMyMemorySummary)

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

function summary(overrides: Record<string, unknown> = {}) {
  return {
    studentId: 's1',
    roleView: 'student',
    subjects: [],
    weakTopics: [],
    strengthTopics: [],
    memorySnapshots: [],
    recommendations: [],
    sequencingSummary: {},
    freshness: {},
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  } as never
}

beforeEach(() => {
  mockedGet.mockReset()
})

describe('useWeakTopicsQuery', () => {
  it('maps weak topics into dashboard rows', async () => {
    mockedGet.mockResolvedValue(
      summary({
        weakTopics: [
          { subject: 'math', topicId: 'fractions', label: 'Fractions', count: 5, latestEvidenceAt: null, evidenceQuestionIds: [] },
        ],
      }),
    )

    const { result } = renderHook(() => useWeakTopicsQuery(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.topics).toEqual([
      { id: 'math-fractions', subject: 'math', topic: 'Fractions', level: 'high' },
    ])
  })

  it('derives urgency from the repeat count', async () => {
    mockedGet.mockResolvedValue(
      summary({
        weakTopics: [
          { subject: 'math', topicId: 'a', label: 'A', count: 5 },
          { subject: 'math', topicId: 'b', label: 'B', count: 2 },
          { subject: 'math', topicId: 'c', label: 'C', count: 1 },
        ],
      }),
    )

    const { result } = renderHook(() => useWeakTopicsQuery(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.topics.map((t) => t.level)).toEqual(['high', 'medium', 'low'])
  })

  it('falls back to a humanised topic id when the label is missing', async () => {
    mockedGet.mockResolvedValue(
      summary({ weakTopics: [{ subject: 'math', topicId: 'long_division', label: '', count: 1 }] }),
    )

    const { result } = renderHook(() => useWeakTopicsQuery(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.topics[0].topic).toBe('long division')
  })

  it('caps the list at eight topics', async () => {
    mockedGet.mockResolvedValue(
      summary({
        weakTopics: Array.from({ length: 20 }, (_, i) => ({
          subject: 'math', topicId: `t${i}`, label: `T${i}`, count: 1,
        })),
      }),
    )

    const { result } = renderHook(() => useWeakTopicsQuery(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.topics).toHaveLength(8)
  })

  it('reports an empty list rather than throwing when the request fails', async () => {
    mockedGet.mockRejectedValue(new Error('network down'))

    const { result } = renderHook(() => useWeakTopicsQuery(), { wrapper })
    // The hook retries once before settling, so this needs longer than the
    // default one-second window.
    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 5000 })

    expect(result.current.topics).toEqual([])
    expect(mockedGet).toHaveBeenCalledTimes(2)
  })

  it('yields nothing for a snake_case payload, the shape that once broke this', async () => {
    mockedGet.mockResolvedValue({ weak_topics: [{ subject: 'math', topic_id: 'fractions', count: 5 }] } as never)

    const { result } = renderHook(() => useWeakTopicsQuery(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.topics).toEqual([])
  })
})

describe('useRecommendationsQuery', () => {
  it('returns at most three recommendations in backend order', async () => {
    mockedGet.mockResolvedValue(
      summary({
        recommendations: [
          { candidateId: 'a' }, { candidateId: 'b' }, { candidateId: 'c' }, { candidateId: 'd' },
        ],
      }),
    )

    const { result } = renderHook(() => useRecommendationsQuery(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.recommendations.map((r) => r.candidateId)).toEqual(['a', 'b', 'c'])
  })

  it('shares one request with the weak-topics hook', async () => {
    mockedGet.mockResolvedValue(summary())

    const { result } = renderHook(
      () => ({ weak: useWeakTopicsQuery(), recs: useRecommendationsQuery() }),
      { wrapper },
    )
    await waitFor(() => expect(result.current.weak.isSuccess).toBe(true))
    await waitFor(() => expect(result.current.recs.isSuccess).toBe(true))

    expect(mockedGet).toHaveBeenCalledTimes(1)
  })
})
