/**
 * One definition of the knowledge-map query (#368). The star map's source
 * and the chapter both read `GET /practice/knowledge-map` under one key; the
 * source used to write its own `useQuery` beside `useKnowledgeMapQuery`, with
 * a retry the hook did not have, and two definitions of one cache entry
 * drift. The source now reads through the hook, and the hook keeps the retry.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { KnowledgeMapSourceProvider } from '@/features/starmap/readModelSource'
import { useStarMapSource } from '@/features/starmap/starMapSource'
import { useKnowledgeMapQuery } from '@/hooks/practice/useKnowledgeMapQuery'
import { getKnowledgeMap } from '@/services/practice/practiceApi'
import { useAuthStore } from '@/store/authStore'

vi.mock('@/services/practice/practiceApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/practice/practiceApi')>()),
  getKnowledgeMap: vi.fn(),
}))

// The hook as it is, watched: who reads the sky through it.
vi.mock('@/hooks/practice/useKnowledgeMapQuery', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/hooks/practice/useKnowledgeMapQuery')>()
  return { ...actual, useKnowledgeMapQuery: vi.fn(actual.useKnowledgeMapQuery) }
})

const mockedGet = vi.mocked(getKnowledgeMap)

/** A client whose own default would retry three times, at once: what a query does is its own options. */
function client() {
  return new QueryClient({ defaultOptions: { queries: { retry: 3, retryDelay: 0, gcTime: 0 } } })
}

function withClient(queryClient: QueryClient) {
  return ({ children }: { children: ReactNode }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}

beforeEach(() => {
  mockedGet.mockReset()
  vi.mocked(useKnowledgeMapQuery).mockClear()
  useAuthStore.setState({ isAuthenticated: true, user: { id: 'student-1', email: 's@t', name: 'S', role: 'student' } } as never)
})

describe('the knowledge-map query, defined once (#368)', () => {
  it('is the query the star map’s source reads the sky through', async () => {
    mockedGet.mockRejectedValue(new Error('nope'))
    const { result } = renderHook(() => useStarMapSource(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={client()}>
          <KnowledgeMapSourceProvider>{children}</KnowledgeMapSourceProvider>
        </QueryClientProvider>
      ),
    })

    expect(useKnowledgeMapQuery).toHaveBeenCalled()
    // And so with its options: one retry, not the client's three.
    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(mockedGet).toHaveBeenCalledTimes(2)
  })

  it('retries a sky that could not be read once, whatever the client’s default', async () => {
    mockedGet.mockRejectedValue(new Error('nope'))
    const { result } = renderHook(() => useKnowledgeMapQuery(), { wrapper: withClient(client()) })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(mockedGet).toHaveBeenCalledTimes(2)
  })

  it('asks once for the star map and the chapter together: one cache entry', async () => {
    mockedGet.mockReturnValue(new Promise(() => {}))
    function Chapter() {
      useKnowledgeMapQuery()
      return null
    }
    render(
      <QueryClientProvider client={client()}>
        <KnowledgeMapSourceProvider>
          <Chapter />
        </KnowledgeMapSourceProvider>
      </QueryClientProvider>,
    )

    await waitFor(() => expect(mockedGet).toHaveBeenCalled())
    expect(mockedGet).toHaveBeenCalledTimes(1)
  })
})
