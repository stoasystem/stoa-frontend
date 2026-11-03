/**
 * Marking read and archiving put the event id into the path. Since #46 every
 * click in the bell marks its item read, so an id the backend minted with a
 * `/`, `?` or `#` in it must stay one path segment, not reach another route.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { useAdminNotificationsQuery, useNotificationsQuery } from '@/hooks/notifications/useNotificationsQuery'
import { httpClient } from '@/services/api/httpClient'
import { notificationQueryKeys } from '@/services/notifications/notificationQueryKeys'
import { archiveNotification, markNotificationRead } from '@/services/notifications/notificationApi'
import { mswServer } from '../mswServer'

beforeAll(() => mswServer.listen({ onUnhandledRequest: 'error' }))
afterEach(() => mswServer.resetHandlers())
afterAll(() => mswServer.close())

function seenPaths() {
  const seen: string[] = []
  mswServer.use(
    http.post('https://api.test/notifications/:id/:action', ({ request }) => {
      seen.push(new URL(request.url).pathname)
      return HttpResponse.json({})
    }),
  )
  return seen
}

describe('the notification commands', () => {
  it.each([
    ['e-1', '/notifications/e-1/read'],
    ['../admin/x', '/notifications/..%2Fadmin%2Fx/read'],
    ['a?b#c', '/notifications/a%3Fb%23c/read'],
  ])('mark %s read at %s', async (eventId, path) => {
    const seen = seenPaths()
    await markNotificationRead(eventId)
    expect(seen).toEqual([path])
  })

  it('archive with the id kept as one segment', async () => {
    const seen = seenPaths()
    await archiveNotification('a/b')
    expect(seen).toEqual(['/notifications/a%2Fb/archive'])
  })
})

/*
 * #518: the bell's reads take their query's signal, so a read the query gave
 * up on (unmounted, cancelled) is called off rather than left to run.
 */
describe('the bell reads', () => {
  afterEach(() => vi.restoreAllMocks())

  it.each([
    ['the list', '/notifications', () => useNotificationsQuery(), notificationQueryKeys.list()],
    ['the admin list', '/admin/notifications', () => useAdminNotificationsQuery(), notificationQueryKeys.adminList()],
  ] as const)('call off %s when its query is cancelled', async (_name, path, useRead, queryKey) => {
    const signals: AbortSignal[] = []
    vi.spyOn(httpClient, 'get').mockImplementation((url, config) => {
      if (url === path && config?.signal) signals.push(config.signal as AbortSignal)
      return new Promise(() => {})
    })
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    renderHook(useRead, {
      wrapper: ({ children }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>,
    })
    await waitFor(() => expect(signals).toHaveLength(1))
    expect(signals[0].aborted).toBe(false)

    await client.cancelQueries({ queryKey })

    expect(signals[0].aborted).toBe(true)
  })
})
