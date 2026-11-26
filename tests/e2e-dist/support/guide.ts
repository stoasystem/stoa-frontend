import type { Page } from '@playwright/test'
import { STUDENT } from './student'

/**
 * The star clusters' guide (#747) as already seen by the e2e student: the
 * panorama hint and the route scene's tour, under the per-account keys the app
 * keeps them in (`src/features/starmap/onboarding/shownOnce.ts`). For specs
 * about something else on the map, which the hint would otherwise stand in
 * front of the first time (it comes before the review reminder, by design).
 */
export async function guideAlreadySeen(page: Page) {
  await page.addInitScript((id) => {
    try {
      localStorage.setItem(`stoa.starmap.clusterHint.${id}`, '1')
      localStorage.setItem(`stoa.starmap.routeTour.${id}`, '1')
    } catch {
      // A page with no storage shows the guide; the spec then says so.
    }
  }, STUDENT.id)
}
