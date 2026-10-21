import type { Page, Request } from '@playwright/test'
import type { MockBackend } from './support/backend'
import { expect, test } from './support/fixtures'
import { WEB_ORIGIN } from './support/origins'
import { signInAsStudent } from './support/signIn'
import { StudentWorld } from './support/student'

// The star map's own chunk; Vite asks for the chunks it imports beside it.
const MAP_CODE = /^\/assets\/MapPages-[\w-]+\.js$/
// Longer than a Lambda cold start (1-3 s): if the map's code waits for the
// account, it is asked for only after this.
const HOLD_MS = 5_000
// The router's Suspense fallback (PageSkeleton). A string, run in the page:
// whether it was ever drawn while a page was due.
const WATCH_SKELETON = `
  new MutationObserver(() => {
    if (document.querySelector('[data-route-pages] [role=status][aria-label="Loading page"]')) window.__skeletonShown = true
  }).observe(document, { subtree: true, childList: true })
`
// The map's own stylesheet (PlanetScreen-*.css) hides each nebula's link until
// it has focus; without it the link shows as stray text. A string, run in the
// page: the link's clip-path when it first appeared.
const WATCH_NEBULA_LINK = `
  new MutationObserver(() => {
    const link = document.querySelector('.starmap-nebula-link')
    if (link && window.__nebulaLinkFirstSeen === undefined) window.__nebulaLinkFirstSeen = getComputedStyle(link).clipPath
  }).observe(document, { subtree: true, childList: true })
`
const STYLED = 'inset(50%)'

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** Signed in on the star map, with nothing of it still on its way. */
async function onTheMap(page: Page, backend: MockBackend) {
  new StudentWorld(backend).install()
  await signInAsStudent(page)
  await expect(page.getByRole('heading', { name: 'Mathematics' })).toBeVisible()
  await page.waitForLoadState('networkidle')
}

/** Counts the documents the tab loads from now on: a reload is one. */
function documentLoads(page: Page) {
  let loads = 0
  page.on('request', (request) => {
    if (request.isNavigationRequest() && request.frame() === page.mainFrame()) loads += 1
  })
  return () => loads
}

test("a student's reload loads the star map's code while /auth/me is answered, and shows the map at once (#415)", async ({
  page,
  backend,
}) => {
  await onTheMap(page, backend)

  // From here /auth/me answers like a cold start that outlasts the download:
  // once the map's code has been asked for, every file then on its way is in
  // and the page has run it (it is idle), or after HOLD_MS, whichever comes
  // first. So the order below is not a race.
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
    if (!mapAskedFor || downloading > 0) return
    void page
      .evaluate('new Promise((resolve) => requestIdleCallback(() => resolve(null), { timeout: 5000 }))')
      .then(release, release)
  }
  page.on('requestfinished', finished)
  page.on('requestfailed', finished)
  page.on('response', (response) => {
    if (new URL(response.url()).pathname === '/auth/me') seen.push('/auth/me answered')
  })
  const held = Promise.race([codeIn, pause(HOLD_MS)])
  backend.holdUntil('GET', '/auth/me', () => held)
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

// Vite asks for a page's stylesheet only the first time it loads the page in a
// document. When that first time was the preload and the stylesheet failed,
// the render loaded again without it and showed the map unstyled, with no
// reload (#441 audit).
test("a stylesheet refused while the map's code is loaded ahead reloads the tab once, and the map is styled", async ({
  page,
  backend,
}) => {
  await onTheMap(page, backend)
  const documents = documentLoads(page)
  const refused: string[] = []
  let refusedOne = () => {}
  const cssRefused = new Promise<void>((resolve) => (refusedOne = resolve))
  await page.route('**/assets/PlanetScreen-*.css', async (route) => {
    if (refused.length > 0) return route.fallback()
    refused.push(new URL(route.request().url()).pathname)
    refusedOne()
    return route.abort('internetdisconnected')
  })
  // The account comes once the preload's stylesheet has failed: the render is second.
  const held = Promise.race([cssRefused, pause(HOLD_MS)])
  backend.holdUntil('GET', '/auth/me', () => held)

  await page.reload()
  await expect(page.getByRole('heading', { name: 'Mathematics' })).toBeVisible()

  expect(refused).toHaveLength(1)
  expect(documents(), 'the reload, then the one reload for the stylesheet').toBe(2)
  await expect(page.locator('.starmap-nebula-link').first()).toHaveCSS('clip-path', STYLED)
})

test('a stylesheet slower than /auth/me is waited for: the map is never shown without it', async ({ page, backend }) => {
  await onTheMap(page, backend)
  await page.route('**/assets/PlanetScreen-*.css', async (route) => {
    await pause(3_000)
    return route.fallback()
  })
  await page.addInitScript({ content: WATCH_NEBULA_LINK })

  await page.reload()
  await expect(page.getByRole('heading', { name: 'Mathematics' })).toBeVisible()

  expect(await page.evaluate('window.__nebulaLinkFirstSeen'), "the nebula link's clip-path when it appeared").toBe(STYLED)
})

// A reload for a page that failed to load (chunkReload.ts) gets one more try
// in the new document. Asked for early, that try met a network that was not
// back yet, and the browser kept the failure: the page showed its error
// where it used to load (#441 audit). In that document the page's code waits
// for its render again.
test("after a reload for the map's failed code, the next document waits for the account before asking again", async ({
  page,
  backend,
}) => {
  await onTheMap(page, backend)
  const documents = documentLoads(page)
  let documentsSeen = 0
  let secondBegan = 0
  page.on('request', (request) => {
    if (!request.isNavigationRequest() || request.frame() !== page.mainFrame()) return
    documentsSeen += 1
    if (documentsSeen === 2) secondBegan = Date.now()
  })
  // Down for the first document, and for the first 800 ms of the next.
  const refused: string[] = []
  await page.route('**/assets/MapPages-*.js', async (route) => {
    const down = documentsSeen === 1 || (documentsSeen === 2 && Date.now() - secondBegan < 800)
    if (!down) return route.fallback()
    refused.push(`document ${documentsSeen}`)
    return route.abort('internetdisconnected')
  })
  backend.holdUntil('GET', '/auth/me', () => pause(1_500))

  await page.reload()
  await expect(page.getByRole('heading', { name: 'Mathematics' })).toBeVisible({ timeout: 20_000 })

  expect(refused).toEqual(['document 1'])
  expect(documents(), 'the reload, then the one reload for the failed code').toBe(2)
  await expect(page.getByRole('alert')).toHaveCount(0)
})
