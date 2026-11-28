/**
 * Exercises the real hook against a mocked API module, so the mapping from
 * the backend's memory-summary contract is covered rather than a copy of it.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useRecommendationsQuery } from '@/hooks/learning/useWeakTopicsQuery'
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
})
