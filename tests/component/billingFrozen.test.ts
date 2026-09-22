import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { navItems, routeMetadata } from '@/app/router/routeConfig'

// Card 007: payments and billing are frozen, so the running app must not offer
// a way in. The judge is not "these four routes were deleted" -- that agrees
// with itself the moment somebody adds a fifth. It reads the registration
// source and the navigation table and refuses any paid path it finds there.

const PAID_VOCABULARY =
  /billing|subscription|checkout|stripe|refund|payment|invoice|price|pricing|plan|purchase|charge|coupon|discount|paywall|wallet/i

const ROUTER_SOURCE = path.resolve(__dirname, '../../src/app/router/AppRouter.tsx')

/** Strip block and line comments so a commented-out route does not count. */
function withoutComments(source: string): string {
  return source
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
}

function registeredPaths(source: string): string[] {
  return [...withoutComments(source).matchAll(/path="([^"]+)"/g)].map((m) => m[1])
}

describe('card 007: the paid surface is not reachable from the app', () => {
  it('registers no paid route', () => {
    const paid = registeredPaths(readFileSync(ROUTER_SOURCE, 'utf8')).filter((p) =>
      PAID_VOCABULARY.test(p),
    )

    expect(paid).toEqual([])
  })

  it('notices a paid route that somebody registers again', () => {
    // Negative control, kept so the check above cannot go quiet.
    const poisoned = `${readFileSync(ROUTER_SOURCE, 'utf8')}
      <Route path="/billing" element={<BillingPage />} />`

    expect(registeredPaths(poisoned).filter((p) => PAID_VOCABULARY.test(p))).toEqual([
      '/billing',
    ])
  })

  it('does not count a route that is only present as a comment', () => {
    // The page files are kept, commented out, on purpose: a comment is not a
    // registration, and this is what says so.
    const source = readFileSync(ROUTER_SOURCE, 'utf8')

    expect(source).toContain('/billing')
    expect(registeredPaths(source).filter((p) => PAID_VOCABULARY.test(p))).toEqual([])
  })

  it('offers no paid entry in navigation', () => {
    const paid = navItems.filter(
      (item) => PAID_VOCABULARY.test(item.path) || PAID_VOCABULARY.test(item.label),
    )

    expect(paid).toEqual([])
  })

  it('lists no paid page in the route metadata the navigation is built from', () => {
    const paid = routeMetadata.filter((meta) => PAID_VOCABULARY.test(meta.path))

    expect(paid).toEqual([])
  })
})

