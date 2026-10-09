/**
 * A knowledge point's "review N" opens that point's N questions (#48).
 *
 * The button was on screen and disabled, with "coming soon" under it, because
 * the endpoint handed back whatever was due first across the whole sky: a
 * point with one card due sat behind a point with twenty, and what opened
 * would not have been what the star said. stoa-backend#70 made the server
 * select before it cuts a page, so the two numbers are the same number.
 */
import { describe, expect, it, vi } from 'vitest'
import { pageRoutes } from '@/app/router/routeManifest'
import { practiceQueryKeys } from '@/services/practice/practiceQueryKeys'
import { getDueReview } from '@/services/practice/practiceApi'
import { httpClient } from '@/services/api/httpClient'

describe('asking for one knowledge point', () => {
  it('names the point in the request, and asks for everything when it does not', async () => {
    const get = vi.spyOn(httpClient, 'get').mockResolvedValue({ data: { items: [], dueCount: 0 } } as never)

    await getDueReview('brueche-u1')
    await getDueReview()

    expect(get.mock.calls[0][1]).toEqual({ params: { unitId: 'brueche-u1' } })
    expect(get.mock.calls[1][1]).toEqual({ params: undefined })
    get.mockRestore()
  })

  it('caches each point apart from the whole sky', () => {
    // One cache entry for everything would have shown a point the cards of
    // whichever point was asked for first.
    expect(practiceQueryKeys.reviewDue('brueche-u1')).not.toEqual(practiceQueryKeys.reviewDue())
    expect(practiceQueryKeys.reviewDue('brueche-u1')).not.toEqual(practiceQueryKeys.reviewDue('brueche-u2'))
  })
})

describe('the route it opens', () => {
  it('exists, is the student’s, and has a name', () => {
    const route = pageRoutes.find((entry) => entry.path === '/review/:unitId')

    expect(route, 'the review route is not registered').toBeDefined()
    expect(route!.titleKey, 'every page names a translation key (#103)').toBeTruthy()
    expect(route!.access.kind).toBe('roles')
  })
})
