/**
 * Drives the real tutor help-request hooks with fake timers and counts the
 * fetches they make, so the cadence is what the hooks actually do.
 *
 * stoasystem/stoa-backend#30 (card 032): the list had no refetch at all and the
 * app turns window-focus refetching off, so a teacher saw a new request only
 * after reloading - while an unaccepted offer lapses after ten minutes.
 */
import { QueryClient, QueryClientProvider, focusManager } from '@tanstack/react-query'
import { act, render, renderHook, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { queryClient as appQueryClient } from '@/app/query/queryClient'
import { useTutorHelpRequestDetailQuery } from '@/hooks/tutor/useTutorHelpRequestDetailQuery'
import { useTutorHelpRequestsQuery } from '@/hooks/tutor/useTutorHelpRequestsQuery'
import { TutorDashboardPage } from '@/pages/tutor/TutorDashboardPage'
import { getTutorHelpRequestDetail, getTutorHelpRequests } from '@/services/tutor/tutorApi'

vi.mock('@/services/tutor/tutorApi', () => ({
  getTutorHelpRequests: vi.fn(),
  getTutorHelpRequestDetail: vi.fn(),
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { resolvedLanguage: 'en', language: 'en' },
  }),
}))
vi.mock('@/layouts/DashboardLayout', () => ({
  DashboardLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}))
vi.mock('@/hooks/tutor/useTutorStatsQuery', () => ({
  useTutorStatsQuery: () => ({ data: undefined, isLoading: false }),
}))

const mockedList = vi.mocked(getTutorHelpRequests)
const mockedDetail = vi.mocked(getTutorHelpRequestDetail)

// The app's own defaults, window-focus refetching off among them.
function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { ...appQueryClient.getDefaultOptions().queries, retry: false, gcTime: 0 },
    },
  })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms)
  })
}

beforeEach(() => {
  mockedList.mockReset()
  mockedDetail.mockReset()
  vi.useFakeTimers()
  focusManager.setFocused(true)
})

afterEach(() => {
  focusManager.setFocused(undefined)
  vi.useRealTimers()
})

describe('the help-request list', () => {
  it('refreshes every fifteen seconds while the tab is visible', async () => {
    mockedList.mockResolvedValue({ items: [] })
    renderHook(() => useTutorHelpRequestsQuery(), { wrapper })
    await advance(0)
    expect(mockedList).toHaveBeenCalledTimes(1)

    await advance(14_999)
    expect(mockedList).toHaveBeenCalledTimes(1)
    await advance(1)
    expect(mockedList).toHaveBeenCalledTimes(2)
    await advance(15_000)
    expect(mockedList).toHaveBeenCalledTimes(3)
  })

  it('does not poll while the tab is hidden', async () => {
    mockedList.mockResolvedValue({ items: [] })
    renderHook(() => useTutorHelpRequestsQuery(), { wrapper })
    await advance(0)
    act(() => focusManager.setFocused(false))

    await advance(60_000)
    expect(mockedList).toHaveBeenCalledTimes(1)
  })

  // The app keeps data fresh for a minute, so focus refetches only what is
  // older than that; a shorter absence is caught by the next 15-second poll.
  it('refreshes as soon as the teacher comes back after more than a minute away', async () => {
    mockedList.mockResolvedValue({ items: [] })
    renderHook(() => useTutorHelpRequestsQuery(), { wrapper })
    await advance(0)
    act(() => focusManager.setFocused(false))
    await advance(70_000)
    expect(mockedList).toHaveBeenCalledTimes(1)

    act(() => focusManager.setFocused(true))
    await advance(0)
    expect(mockedList).toHaveBeenCalledTimes(2)
  })

  it('catches up within one poll after a short absence', async () => {
    mockedList.mockResolvedValue({ items: [] })
    renderHook(() => useTutorHelpRequestsQuery(), { wrapper })
    await advance(0)
    act(() => focusManager.setFocused(false))
    await advance(20_000)

    act(() => focusManager.setFocused(true))
    await advance(15_000)
    expect(mockedList).toHaveBeenCalledTimes(2)
  })
})

describe('the teacher dashboard', () => {
  // The cadence tests above count fetches; this one checks the teacher sees
  // what a later fetch brings, on the page they would be sitting on.
  it('shows a request that arrives after the page was opened, on the next poll', async () => {
    mockedList.mockResolvedValueOnce({ items: [] }).mockResolvedValue({
      items: [
        {
          requestId: 'req-new',
          conversationId: 'conv-new',
          studentName: 'Neue Schülerin',
          subject: 'math',
          grade: 'Grade 6',
          status: 'pending',
          requestMessage: 'Ich komme bei Brüchen nicht weiter.',
          createdAt: '2026-09-26T12:00:00Z',
        },
      ],
    })
    const client = new QueryClient({
      defaultOptions: {
        queries: { ...appQueryClient.getDefaultOptions().queries, retry: false, gcTime: 0 },
      },
    })
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={['/tutor']}>
          <TutorDashboardPage />
        </MemoryRouter>
      </QueryClientProvider>,
    )
    await advance(0)
    expect(screen.queryByText('Neue Schülerin')).not.toBeInTheDocument()

    await advance(15_000)
    // The query notifies its observers on a scheduled tick after the fetch.
    await advance(200)
    expect(screen.getByText('Neue Schülerin')).toBeInTheDocument()
  })
})

describe('a help request the teacher has open', () => {
  it.each([
    ['pending', 10_000],
    ['assigned', 10_000],
    ['in_progress', 5_000],
  ] as const)('is refreshed every %s -> %i ms', async (status, interval) => {
    mockedDetail.mockResolvedValue({ status } as never)
    renderHook(() => useTutorHelpRequestDetailQuery('req-1'), { wrapper })
    await advance(0)
    expect(mockedDetail).toHaveBeenCalledTimes(1)

    await advance(interval - 1)
    expect(mockedDetail).toHaveBeenCalledTimes(1)
    await advance(1)
    expect(mockedDetail).toHaveBeenCalledTimes(2)
  })

  it.each(['resolved', 'cancelled'] as const)('stops once it is %s', async (status) => {
    mockedDetail.mockResolvedValue({ status } as never)
    renderHook(() => useTutorHelpRequestDetailQuery('req-1'), { wrapper })
    await advance(0)

    await advance(60_000)
    expect(mockedDetail).toHaveBeenCalledTimes(1)
  })

  it('is not fetched without a request id', async () => {
    renderHook(() => useTutorHelpRequestDetailQuery(undefined), { wrapper })
    await advance(60_000)
    expect(mockedDetail).not.toHaveBeenCalled()
  })
})
