import { readFileSync } from 'node:fs'
import path from 'node:path'
import { matchPath } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { navItems, routeMetadata, routesWithoutMetadata } from '@/app/router/routeConfig'
import { registeredPaths } from './routerSource'

// stoasystem/stoa-backend#39 (card 039): three tables describe the same routes
// and nothing kept them in step. `AppRouter.tsx` is what actually renders,
// `routeMetadata` is the page list the paid-surface guard (billingFrozen) reads,
// and `navItems` is what the navigation is built from. They had drifted: a
// dozen registered pages, `/learn` among them, were missing from the page list,
// so the paid-surface guard never looked at them, and eight navigation entries
// pointed at pages deleted in ca9a045.
//
// This compares whole tables, hidden and demo entries included. Whether an
// entry is shown today is the business of navigationRoutes.test.ts.

const registered = registeredPaths(
  readFileSync(path.resolve(__dirname, '../../src/app/router/AppRouter.tsx'), 'utf8'),
)
const listed = new Set(routeMetadata.map((meta) => meta.path))
const exempt = Object.keys(routesWithoutMetadata)

describe('the router, the page list and the navigation table', () => {
  it('have no navigation entry without a registered route', () => {
    // The catch-all matches everything and only renders NotFoundPage.
    const routes = registered.filter((route) => route !== '*')
    const dead = navItems
      .map((item) => item.path)
      .filter((navPath) => !routes.some((route) => matchPath(route, navPath)))

    expect(dead, `${dead.length} navigation entries lead to no route`).toEqual([])
  })

  it('list no page the router does not register', () => {
    const unregistered = routeMetadata
      .map((meta) => meta.path)
      .filter((metaPath) => !registered.includes(metaPath))

    expect(unregistered, `${unregistered.length} listed pages are not registered`).toEqual([])
  })

  it('register no route the page list leaves out, apart from the named exemptions', () => {
    const unlisted = registered.filter((route) => !listed.has(route) && !exempt.includes(route))

    expect(unlisted, `${unlisted.length} registered routes are missing from routeMetadata`).toEqual(
      [],
    )
  })

  it('exempt only routes that are registered and not listed anyway', () => {
    // An exemption outliving its route, or duplicating a listing, would let the
    // next route with that path through without anybody deciding it.
    const stale = exempt.filter((route) => !registered.includes(route) || listed.has(route))

    expect(stale).toEqual([])
  })
})
