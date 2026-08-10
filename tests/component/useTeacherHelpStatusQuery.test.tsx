/**
 * Drives the real useTeacherHelpStatusQuery with fake timers to observe the
 * polling cadence it actually produces, rather than a copy of the interval rule.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useTeacherHelpStatusQuery } from '@/hooks/chat/useTeacherHelpStatusQuery'
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

  it('stops polling once the request reaches a terminal state', async () => {
    mockedGet.mockResolvedValue({ status: 'resolved' } as never)

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
