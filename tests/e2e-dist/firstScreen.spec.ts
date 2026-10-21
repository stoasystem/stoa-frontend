import type { Request } from '@playwright/test'
import { expect, test } from './support/fixtures'
import { WEB_ORIGIN } from './support/origins'
import { signInAsStudent } from './support/signIn'
import { StudentWorld } from './support/student'

// The star map's own chunk; Vite asks for the chunks it imports beside it.
const MAP_CODE = /^\/assets\/MapPages-[\w-]+\.js$/
// Longer than a Lambda cold start (1-3 s): if the map's code waits for the
// account, it is asked for only after this.
const HOLD_MS = 5_000
// For the downloaded code to run once its last file is in.
const SETTLE_MS = 250
// The router's Suspense fallback (PageSkeleton). A string, run in the page:
// whether it was ever drawn while a page was due.
const WATCH_SKELETON = `
  new MutationObserver(() => {
    if (document.querySelector('[data-route-pages] [role=status][aria-label="Loading page"]')) window.__skeletonShown = true
  }).observe(document, { subtree: true, childList: true })
`

test("a student's reload loads the star map's code while /auth/me is answered, and shows the map at once (#415)", async ({
  page,
  backend,
}) => {
  new StudentWorld(backend).install()
  await signInAsStudent(page)
  await expect(page.getByRole('heading', { name: 'Mathematics' })).toBeVisible()
  // Nothing of the signed-in page is still on its way to be counted below.
  await page.waitForLoadState('networkidle')

  // From here /auth/me answers like a cold start that outlasts the download:
  // once the map's code has been asked for and every file then on its way is
  // in, or after HOLD_MS, whichever comes first. So the order below is not a race.
  const seen: string[] = []
  let mapAskedFor = false
  let downloading = 0
  let release = () => {}
  const codeIn = new Promise<void>((resolve) => (release = resolve))
  const fromSite = (request: Request) => new URL(request.url()).origin === WEB_ORIGIN
  page.on('request', (request) => {
    if (!fromSite(request)) return
    downloading += 1
    if (!MAP_CODE.test(new URL(request.url()).pathname)) return
    seen.push('map code asked for')
    mapAskedFor = true
  })
  const finished = (request: Request) => {
    if (!fromSite(request)) return
    downloading -= 1
    if (mapAskedFor && downloading === 0) setTimeout(release, SETTLE_MS)
  }
  page.on('requestfinished', finished)
  page.on('requestfailed', finished)
  page.on('response', (response) => {
    if (new URL(response.url()).pathname === '/auth/me') seen.push('/auth/me answered')
  })
  backend.holdUntil('GET', '/auth/me', Promise.race([codeIn, new Promise((resolve) => setTimeout(resolve, HOLD_MS))]))
  await page.addInitScript({ content: WATCH_SKELETON })

  await page.reload()
  await expect(page.getByRole('heading', { name: 'Mathematics' })).toBeVisible()

  expect(seen[0], 'what came first after the reload').toBe('map code asked for')
  expect(seen).toContain('/auth/me answered')
  // The preload and the page share one download.
  expect(seen.filter((event) => event === 'map code asked for')).toHaveLength(1)
  // With its code in, the map follows the account at once: no skeleton,
  // which React would have held for at least 300 ms.
  expect(await page.evaluate('window.__skeletonShown === true'), 'the page skeleton was drawn').toBe(false)
})
