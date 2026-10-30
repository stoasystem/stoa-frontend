/**
 * #518: a push for "New moderation case" or "Teacher help requested" carries
 * the English the backend stored, so the bell reads its lists again rather
 * than show it. Read with real QueryObservers, the way the bell's hooks hold
 * the lists, and counted at the query function:
 *
 * - a run of pushes is one read of each list, not one per push;
 * - a hidden tab reads nothing until it is shown again (#413);
 * - a read already on its way is not called off; one more read follows it.
 */
import { QueryClient, QueryObserver, focusManager } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { notificationQueryKeys } from '@/services/notifications/notificationQueryKeys'
import {
  ROLE_REFETCH_DELAY_MS,
  mergeRealtimeNotification,
  parseRealtimeNotificationMessage,
} from '@/services/notifications/realtimeNotifications'
import type { NotificationListResponse } from '@/types/notification'

const admin = { id: 'u-1', role: 'admin' } as never

function rolePush(index: number) {
  return parseRealtimeNotificationMessage(
    JSON.stringify({
      eventId: `e-role-${index}`,
      recipientId: null,
      recipientRole: 'admin',
      eventType: 'moderation_case_update',
      targetType: 'moderation_case',
      title: 'New moderation case',
      summary: 'A medium-severity moderation case was reported.',
    }),
  )!
}

type Reads = { list: AbortSignal[]; admin: AbortSignal[] }

/*
 * The bell's two lists, watched as the hooks watch them while realtime is
 * live: no poll and no read on focus of their own. `slow` keeps each read on
 * its way until `finish` is called.
 */
async function watchedLists({ slow = false } = {}) {
  const reads: Reads = { list: [], admin: [] }
  const pending: Array<() => void> = []
  const empty: NotificationListResponse = { items: [], count: 0 }
  const answer = (signal: AbortSignal, into: AbortSignal[]) => {
    into.push(signal)
    if (!slow) return Promise.resolve(empty)
    return new Promise<NotificationListResponse>((resolve) => pending.push(() => resolve(empty)))
  }
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const options = { staleTime: 30_000, refetchOnWindowFocus: false } as const
  const observers = [
    new QueryObserver(client, {
      ...options,
      queryKey: notificationQueryKeys.list(),
      queryFn: ({ signal }) => answer(signal, reads.list),
    }),
    new QueryObserver(client, {
      ...options,
      queryKey: notificationQueryKeys.adminList(),
      queryFn: ({ signal }) => answer(signal, reads.admin),
    }),
  ]
  const unsubscribe = observers.map((observer) => observer.subscribe(() => {}))
  const finish = async () => {
    for (const resolve of pending.splice(0)) resolve()
    await vi.advanceTimersByTimeAsync(0)
  }
  await finish()
  return { client, reads, finish, stop: () => unsubscribe.forEach((off) => off()) }
}

beforeEach(() => {
  vi.useFakeTimers()
  focusManager.setFocused(true)
})
afterEach(() => {
  focusManager.setFocused(undefined)
  vi.useRealTimers()
})

describe('a run of role pushes (#518)', () => {
  it('is one read of each list, a moment after the first', async () => {
    const { client, reads, stop } = await watchedLists()
    expect([reads.list.length, reads.admin.length]).toEqual([1, 1])

    for (let index = 0; index < 10; index += 1) mergeRealtimeNotification(client, rolePush(index), admin)
    await vi.advanceTimersByTimeAsync(ROLE_REFETCH_DELAY_MS)

    expect([reads.list.length, reads.admin.length]).toEqual([2, 2])
    // And nothing more after.
    await vi.advanceTimersByTimeAsync(10 * ROLE_REFETCH_DELAY_MS)
    expect([reads.list.length, reads.admin.length]).toEqual([2, 2])
    stop()
  })

  it('reads again for a push that comes after that read', async () => {
    const { client, reads, stop } = await watchedLists()

    mergeRealtimeNotification(client, rolePush(1), admin)
    await vi.advanceTimersByTimeAsync(ROLE_REFETCH_DELAY_MS)
    mergeRealtimeNotification(client, rolePush(2), admin)
    await vi.advanceTimersByTimeAsync(ROLE_REFETCH_DELAY_MS)

    expect([reads.list.length, reads.admin.length]).toEqual([3, 3])
    stop()
  })
})

describe('a role push in a hidden tab (#413)', () => {
  it('reads nothing while hidden, and each list once when shown', async () => {
    const { client, reads, stop } = await watchedLists()
    focusManager.setFocused(false)

    for (let index = 0; index < 5; index += 1) mergeRealtimeNotification(client, rolePush(index), admin)
    await vi.advanceTimersByTimeAsync(10 * ROLE_REFETCH_DELAY_MS)
    expect([reads.list.length, reads.admin.length]).toEqual([1, 1])

    focusManager.setFocused(true)
    await vi.advanceTimersByTimeAsync(0)
    expect([reads.list.length, reads.admin.length]).toEqual([2, 2])
    stop()
  })
})

describe('a role push while a read is on its way', () => {
  it('lets that read finish rather than call it off, then reads once more', async () => {
    const { client, reads, finish, stop } = await watchedLists({ slow: true })
    void client.refetchQueries({ queryKey: notificationQueryKeys.list() })
    await vi.advanceTimersByTimeAsync(0)
    expect(reads.list).toHaveLength(2)

    mergeRealtimeNotification(client, rolePush(1), admin)
    await vi.advanceTimersByTimeAsync(ROLE_REFETCH_DELAY_MS)

    // Not called off, and not sent again beside it.
    expect(reads.list).toHaveLength(2)
    expect(reads.list[1].aborted).toBe(false)
    // It may have left before the push; one read follows it.
    await finish()
    expect(reads.list).toHaveLength(3)
    await finish()
    await vi.advanceTimersByTimeAsync(10 * ROLE_REFETCH_DELAY_MS)
    expect(reads.list).toHaveLength(3)
    stop()
  })
})
