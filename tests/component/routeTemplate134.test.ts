/**
 * Card 134-F2: analytics reports the route pattern a page is served by, never
 * its address, so no id in an address leaves the browser.
 */
import { describe, expect, it } from 'vitest'
import { legacyRedirects, pageRoutes } from '@/app/router/routeManifest'
import { matchRouteTemplate, UNMATCHED_ROUTE } from '@/services/analytics/routeTemplate'

const ID = '7f3c2a10-9b1e-4c5d-8e2f-0a1b2c3d4e5f'
const PATTERNS = new Set([...pageRoutes.map((r) => r.path), ...legacyRedirects.map((r) => r.from), UNMATCHED_ROUTE])

describe('matchRouteTemplate', () => {
  it.each([
    ['/admin/users', '/admin/users'],
    [`/admin/users/${ID}/usage-period`, '/admin/users/:userId/usage-period'],
    [`/teacher/requests/${ID}`, '/teacher/requests/:requestId'],
    [`/classroom/${ID}`, '/classroom/:conversationId'],
    ['/', '/'],
  ])('maps %s to %s', (pathname, template) => {
    expect(matchRouteTemplate(pathname)).toBe(template)
  })

  it('never returns an address carrying an id', () => {
    const addresses = [
      `/admin/users/${ID}/usage-period`,
      `/teacher/requests/${ID}`,
      `/classroom/${ID}`,
      `/ask/${ID}`,
      `/no-such-page/${ID}`,
      `/parent/children/${ID}/report`,
    ]
    for (const address of addresses) {
      const template = matchRouteTemplate(address)
      expect(template).not.toContain(ID)
      expect(PATTERNS.has(template)).toBe(true)
    }
  })

  it('works on any list of patterns and falls back when none matches', () => {
    expect(matchRouteTemplate('/practice/abc123', ['/practice/:lessonId', '/practice'])).toBe('/practice/:lessonId')
    expect(matchRouteTemplate('/practice', ['/practice/:lessonId', '/practice'])).toBe('/practice')
    expect(matchRouteTemplate('/elsewhere/abc123', ['/practice/:lessonId'])).toBe(UNMATCHED_ROUTE)
  })
})
