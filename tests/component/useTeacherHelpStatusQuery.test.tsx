/**
 * Drives the real useTeacherHelpStatusQuery with fake timers to observe the
 * polling cadence it actually produces, rather than a copy of the interval rule.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useTeacherHelpStatusQuery } from '@/hooks/chat/useTeacherHelpStatusQuery'
import { ApiError } from '@/services/api/httpClient'
import { getTeacherHelpRequest } from '@/services/teacherHelp/teacherHelpApi'

vi.mock('@/services/teacherHelp/teacherHelpApi', () => ({ getTeacherHelpRequest: vi.fn() }))

const mockedGet = vi.mocked(getTeacherHelpRequest)

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

/** Let the initial fetch settle. waitFor is unusable here under fake timers. */
async function settle() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0)
  })
}

/** Advance timers far enough for `count` polls at `interval` to have fired. */
async function advancePolls(interval: number, count: number) {
  for (let i = 0; i < count; i += 1) {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(interval)
    })
  }
}

beforeEach(() => {
  mockedGet.mockReset()
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('polling cadence', () => {
  it('does not fetch at all without a request id', async () => {
    renderHook(() => useTeacherHelpStatusQuery(null), { wrapper })
    await advancePolls(15_000, 4)
    expect(mockedGet).not.toHaveBeenCalled()
  })

  it('polls every five seconds while a teacher is engaged', async () => {
    mockedGet.mockResolvedValue({ status: 'in_progress' } as never)

    renderHook(() => useTeacherHelpStatusQuery('req-1'), { wrapper })
    await settle()
    expect(mockedGet).toHaveBeenCalledTimes(1)

    await advancePolls(5_000, 3)
    expect(mockedGet).toHaveBeenCalledTimes(4)
  })

  it('backs off to fifteen seconds while still waiting for a teacher', async () => {
    mockedGet.mockResolvedValue({ status: 'pending' } as never)

    renderHook(() => useTeacherHelpStatusQuery('req-1'), { wrapper })
    await settle()
    expect(mockedGet).toHaveBeenCalledTimes(1)

    // A 5s tick must not trigger the faster cadence.
    await advancePolls(5_000, 1)
    expect(mockedGet).toHaveBeenCalledTimes(1)

    await advancePolls(10_000, 1)
    expect(mockedGet).toHaveBeenCalledTimes(2)
  })

  // #397: nobody could be offered the request yet, and a teacher takes it once
  // one is free -- so it is read again like pending. A status this app does
  // not know yet is read again too, rather than taken for ended.
  it.each(['waiting_no_teacher', 'reassigning'])('keeps polling every fifteen seconds while it is %s', async (status) => {
    mockedGet.mockResolvedValue({ status } as never)

    renderHook(() => useTeacherHelpStatusQuery('req-1'), { wrapper })
    await settle()
    expect(mockedGet).toHaveBeenCalledTimes(1)

    await advancePolls(5_000, 1)
    expect(mockedGet).toHaveBeenCalledTimes(1)

    await advancePolls(10_000, 1)
    expect(mockedGet).toHaveBeenCalledTimes(2)

    await advancePolls(15_000, 2)
    expect(mockedGet).toHaveBeenCalledTimes(4)
  })

  it.each(['resolved', 'cancelled', 'withdrawn', 'expired'])('stops polling once the request is %s', async (status) => {
    mockedGet.mockResolvedValue({ status } as never)

    renderHook(() => useTeacherHelpStatusQuery('req-1'), { wrapper })
    await settle()
    expect(mockedGet).toHaveBeenCalledTimes(1)

    await advancePolls(15_000, 4)
    expect(mockedGet).toHaveBeenCalledTimes(1)
  })

  it('speeds up when a waiting request becomes assigned', async () => {
    mockedGet.mockResolvedValue({ status: 'pending' } as never)

    renderHook(() => useTeacherHelpStatusQuery('req-1'), { wrapper })
    await settle()
    expect(mockedGet).toHaveBeenCalledTimes(1)

    mockedGet.mockResolvedValue({ status: 'assigned' } as never)
    await advancePolls(15_000, 1)
    expect(mockedGet).toHaveBeenCalledTimes(2)

    await advancePolls(5_000, 2)
    expect(mockedGet).toHaveBeenCalledTimes(4)
  })
})

// #405: a conversation that was never escalated is answered 404. That is its
// answer, not a failure: kept as no help, and not asked again each time the
// conversation opens.
describe('a conversation never escalated', () => {
  function sharedClient() {
    // The app's own staleTime (src/app/query/queryClient.ts).
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 60_000 } } })
    return ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    )
  }

  it('is kept as no help, and not read again when it opens again', async () => {
    mockedGet.mockRejectedValue(new ApiError('This conversation was never escalated to a teacher', { status: 404 }))
    const shared = sharedClient()

    const first = renderHook(() => useTeacherHelpStatusQuery('c1'), { wrapper: shared })
    await settle()
    expect(first.result.current.data).toBeNull()
    expect(first.result.current.isError).toBe(false)
    first.unmount()

    const again = renderHook(() => useTeacherHelpStatusQuery('c1'), { wrapper: shared })
    await settle()
    expect(again.result.current.data).toBeNull()
    expect(mockedGet).toHaveBeenCalledTimes(1)

    await advancePolls(15_000, 2)
    expect(mockedGet).toHaveBeenCalledTimes(1)
  })

  it('still fails on any other answer', async () => {
    mockedGet.mockRejectedValue(new ApiError('Service unavailable', { status: 503 }))

    const { result } = renderHook(() => useTeacherHelpStatusQuery('c1'), { wrapper: sharedClient() })
    await settle()
    expect(result.current.isError).toBe(true)
    expect(result.current.data).toBeUndefined()
  })
})
