import { matchPath } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { legacyRedirects, pageRoutes } from '@/app/router/routeManifest'
import { getNavItemsForRole, navItems } from '@/lib/navigation'

// The shared setup pins every flag in '@/lib/env'. What a user is shown is
// decided by the real ones, demo visibility included, so this suite reads them
// and only stands in for the runtime document env.ts loads on import.
vi.unmock('@/lib/env')
vi.mock('@/lib/runtimeConfig', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/runtimeConfig')>()),
  getRuntimeConfig: () => ({
    environment: 'production',
    api: { origin: 'https://api.test' },
    realtime: { enabled: false, endpoint: null },
    features: {
      analytics: false,
      errorMonitoring: false,
      feedback: true,
      parentReports: true,
      payments: false,
      publicRegistration: true,
      realtimeNotifications: false,
      referrals: true,
      supportTickets: true,
      teacherHelp: true,
    },
  }),
}))

// The catch-all only renders NotFoundPage, so matching it is not a route; a
// redirect is not a page either.
const registeredRoutes = pageRoutes.map((route) => route.path).filter((route) => route !== '*')

const roles = [...new Set(navItems.map((item) => item.role))]

// stoasystem/stoa-backend#28 (card 030): Report Ops sat in every
// administrator's navigation and led to NotFoundPage. The same selection
// AppLayout makes, desktop and mobile, for every role.
describe('the navigation shown to a user', () => {
  it.each(roles)('only leads to registered routes (%s)', (role) => {
    const shown = [
      ...getNavItemsForRole(role, { includeSecondary: true }).filter(
        (item) => item.priority === 'primary' || item.priority === 'secondary',
      ),
      ...getNavItemsForRole(role, { mobileOnly: true }).slice(0, 5),
    ]
    const deadLinks = shown
      .map((item) => item.path)
      .filter((navPath) => !registeredRoutes.some((route) => matchPath(route, navPath)))
    expect(deadLinks).toEqual([])
  })

  it.each(['/classroom', '/teacher/classroom', '/billing'])(
    'does not accept a withdrawn route that remains in a comment (%s)',
    (navPath) => {
      expect(registeredRoutes.some((route) => matchPath(route, navPath))).toBe(false)
    },
  )

  it('never leads to a path that only redirects', () => {
    const redirected = navItems
      .map((item) => item.path)
      .filter((navPath) =>
        legacyRedirects.some((redirect) => !redirect.onlyFor && matchPath(redirect.from, navPath)),
      )
    expect(redirected).toEqual([])
  })

  it('reads routes from the route manifest', () => {
    expect(registeredRoutes.length).toBeGreaterThan(20)
    expect(registeredRoutes).toContain('/admin/users')
  })
})
