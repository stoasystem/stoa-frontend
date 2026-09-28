/**
 * Marking read and archiving put the event id into the path. Since #46 every
 * click in the bell marks its item read, so an id the backend minted with a
 * `/`, `?` or `#` in it must stay one path segment, not reach another route.
 */
import { http, HttpResponse } from 'msw'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
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
