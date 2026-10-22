import type { Page } from '@playwright/test'
import type { MockBackend } from './support/backend'
import { expect, test } from './support/fixtures'
import { signInAsStudent } from './support/signIn'
import { StudentWorld } from './support/student'

/*
 * A module the build loads on demand that cannot be fetched (#272, #401, #447).
 *
 * The component tests stand in for Vite's preload helper; these run the real
 * one, so they see it if it changes: a page's failure must still reach
 * lazyPage as the error Vite announced, which is what reloads the tab once,
 * and an optional module's must still reach the code that asked for it. And
 * they run Chromium's module map, which keeps a failed import for the rest of
 * the document, and Vite's, which never asks again for a stylesheet that failed.
 */

/** Counts the documents the tab loads from now on: a reload is one. */
function documentLoads(page: Page) {
  let loads = 0
  page.on('request', (request) => {
    if (request.isNavigationRequest() && request.frame() === page.mainFrame()) loads += 1
  })
  return () => loads
}

/** A chunk's file, at any address: `?retry=1` too. */
const chunkFile = (chunk: string) => (url: URL) => new RegExp(`^/assets/${chunk}-[\\w-]+\\.js$`).test(url.pathname)

/** Refuses a chunk while `blocked()` holds, as a dropped connection would; returns what it refused. */
async function refuse(page: Page, chunk: string, blocked: () => boolean) {
  const refused: string[] = []
  await page.route(chunkFile(chunk), async (route) => {
    if (!blocked()) return route.fallback()
    const { pathname, search } = new URL(route.request().url())
    refused.push(pathname + search)
    return route.abort('internetdisconnected')
  })
  return refused
}

/** Holds the first request for a file until `release()`, then fails it, as a connection that timed out. */
async function holdThenFail(page: Page, file: string | ((url: URL) => boolean)) {
  let release = () => {}
  const released = new Promise<void>((resolve) => (release = resolve))
  let asked = () => {}
  const askedFor = new Promise<void>((resolve) => (asked = resolve))
  let requests = 0
  await page.route(file, async (route) => {
    requests += 1
    if (requests > 1) return route.fallback()
    asked()
    await released
    return route.abort('timedout')
  })
  return { askedFor, release, requests: () => requests }
}

/** A mark on this document, which a reload would not carry over. */
async function markDocument(page: Page) {
  await page.evaluate(() => {
    ;(globalThis as { stoaE2eDocument?: string }).stoaE2eDocument = 'kept'
  })
  return () => page.evaluate(() => (globalThis as { stoaE2eDocument?: string }).stoaE2eDocument ?? null)
}

/** Signed in, on Help: a document in which the star map's code was never asked for. */
async function onHelp(page: Page, backend: MockBackend) {
  new StudentWorld(backend).install()
  await signInAsStudent(page)
  await page.goto('/support')
  await expect(page.getByRole('link', { name: 'STOA home' })).toBeVisible()
  await page.waitForLoadState('networkidle')
}

const MAP_HEADING = { name: 'Mathematics' }
// The map's stylesheet (PlanetScreen-*.css) hides each nebula's link until it
// has focus and places each star's link; without it both show as stray text.
const STYLED_NEBULA_LINK = 'inset(50%)'

test('formulas whose KaTeX chunk cannot be fetched stay as written, and the tab is never reloaded for them', async ({
  page,
  backend,
}) => {
  const world = new StudentWorld(backend)
  world.install()
  await signInAsStudent(page)

  const refused = await refuse(page, 'katexLoader', () => true)
  const documents = documentLoads(page)
  // A mark on this document, which a reload would not carry over.
  await page.evaluate(() => {
    ;(globalThis as { stoaE2eDocument?: string }).stoaE2eDocument = 'before the formulas'
  })

  const first = 'What is $x^2$?'
  await page.getByRole('textbox', { name: 'Your question' }).fill(first)
  const panel = page.getByRole('complementary', { name: 'Ask' })
  await panel.getByRole('textbox', { name: 'Your question' }).press('Enter')
  const thread = panel.getByRole('log', { name: 'Messages' })
  await expect(thread.getByText(world.answerFor(first))).toBeVisible()
  await expect.poll(() => refused.length, { message: 'KaTeX was asked for' }).toBeGreaterThan(0)

  // The next formula fails the same way, and that does not reload either.
  const second = 'And $y^3$?'
  await panel.getByRole('textbox', { name: 'Your question' }).fill(second)
  await panel.getByRole('textbox', { name: 'Your question' }).press('Enter')
  await expect(thread.getByText(world.answerFor(second))).toBeVisible()
  await expect.poll(() => refused.length, { message: 'KaTeX was asked for again' }).toBeGreaterThan(1)
  await expect(thread.locator('.katex')).toHaveCount(0)

  // The same document all along: nothing that lives in memory was thrown away.
  expect(documents(), 'documents loaded since the first formula').toBe(0)
  expect(await page.evaluate(() => (globalThis as { stoaE2eDocument?: string }).stoaE2eDocument)).toBe('before the formulas')
})

// Chromium keeps a failed import for the rest of the document and answers the
// same address from it without asking the network, so the next formula asks
// for the file under a new one (#447).
test('a KaTeX chunk refused once is asked for under a new address, and the next formula is typeset', async ({
  page,
  backend,
}) => {
  new StudentWorld(backend).install()
  await signInAsStudent(page)

  let failures = 1
  const refused = await refuse(page, 'katexLoader', () => failures-- > 0)
  const asked: string[] = []
  page.on('request', (request) => {
    const url = new URL(request.url())
    if (chunkFile('katexLoader')(url)) asked.push(url.pathname + url.search)
  })
  const documents = documentLoads(page)

  // The question's formula asks for KaTeX first, and is refused; the
  // answer's, which comes a moment later, is the next one.
  const question = 'What is $x^2$?'
  await page.getByRole('textbox', { name: 'Your question' }).fill(question)
  const panel = page.getByRole('complementary', { name: 'Ask' })
  await panel.getByRole('textbox', { name: 'Your question' }).press('Enter')
  const thread = panel.getByRole('log', { name: 'Messages' })
  await expect.poll(() => refused.length, { message: 'KaTeX was asked for' }).toBe(1)
  await expect(thread.locator('.katex').first()).toBeVisible()
  expect(asked).toEqual([
    expect.stringMatching(/^\/assets\/katexLoader-[\w-]+\.js$/),
    expect.stringMatching(/^\/assets\/katexLoader-[\w-]+\.js\?retry=1$/),
  ])
  expect(documents()).toBe(0)
})
// Vite fetches a lazy module's stylesheet first and never again once it has
// failed, so a stylesheet of KaTeX's own could fail while its code later
// loaded: every formula then showed twice, typeset and as raw text.
test('KaTeX and its stylesheet come in one file, and a formula is typeset with it', async ({ page, backend }) => {
  const world = new StudentWorld(backend)
  world.install()
  await signInAsStudent(page)

  const katexFiles: string[] = []
  page.on('request', (request) => {
    const { pathname } = new URL(request.url())
    if (/^\/assets\/katex/i.test(pathname) && !/\.(woff2?|ttf)$/.test(pathname)) katexFiles.push(pathname)
  })

  const question = 'What is $x^2$?'
  await page.getByRole('textbox', { name: 'Your question' }).fill(question)
  const panel = page.getByRole('complementary', { name: 'Ask' })
  await panel.getByRole('textbox', { name: 'Your question' }).press('Enter')
  const formula = panel.getByRole('log', { name: 'Messages' }).locator('.katex').first()
  await expect(formula).toBeVisible()

  expect(katexFiles).toEqual([expect.stringMatching(/^\/assets\/katexLoader-[\w-]+\.js$/)])
  // Styled: the MathML copy kept for screen readers is not shown beside the typeset formula.
  await expect(formula.locator('.katex-mathml')).toHaveCSS('position', 'absolute')
})

test('a page whose chunk cannot be fetched reloads the tab once, and then shows', async ({ page, backend }) => {
  new StudentWorld(backend).install()
  const documents = documentLoads(page)
  let failures = 1
  const refused = await refuse(page, 'MapPages', () => failures-- > 0)

  // Signed in on a page from an older release, say, whose star map chunk is gone.
  await signInAsStudent(page)
  await expect(page.getByRole('heading', { name: 'Mathematics' })).toBeVisible()
  expect(refused).toHaveLength(1)
  expect(documents(), 'the sign-in page, then the one reload').toBe(2)
})

test('a page whose chunk still cannot be fetched after that reload shows its error instead of reloading again', async ({
  page,
  backend,
}) => {
  new StudentWorld(backend).install()
  const documents = documentLoads(page)
  let offline = true
  const refused = await refuse(page, 'MapPages', () => offline)

  await signInAsStudent(page)
  const alert = page.getByRole('alert')
  await expect(alert.getByText('This page could not be shown')).toBeVisible()
  expect(refused).toHaveLength(2)
  expect(documents(), 'the sign-in page, then the one reload').toBe(2)

  // Long enough for another reload to have started, had one been coming.
  await page.waitForTimeout(2_000)
  expect(documents()).toBe(2)

  // Only a reload is offered: "Try again" loaded the page again in this
  // document, which answered it with the same failure, never the network (#447).
  await expect(alert.getByRole('button', { name: 'Try again' })).toHaveCount(0)
  offline = false
  await alert.getByRole('button', { name: 'Reload page' }).click()
  await expect(page.getByRole('heading', { name: 'Mathematics' })).toBeVisible()
  expect(documents()).toBe(3)
})

test('a page whose chunk hangs past the window before it fails again after the reload shows its error, not another reload', async ({
  page,
  backend,
}) => {
  test.setTimeout(120_000)
  new StudentWorld(backend).install()
  // As if the page's two clocks disagreed by half a second: when the reloaded
  // document began, worked out from them, comes out before the reload that
  // made it, as it does by a millisecond in about a third of Chromium's reloads.
  await page.addInitScript(() => {
    const elapsed = performance.now.bind(performance)
    Object.defineProperty(performance, 'now', { value: () => elapsed() + 500 })
  })
  const documents = documentLoads(page)
  let requests = 0
  await page.route('**/assets/MapPages-*.js', async (route) => {
    requests += 1
    // The first document's request fails at once. The reloaded document's
    // hangs past chunkReload's 30 s window, then fails the same way.
    if (requests > 1) await new Promise((resolve) => setTimeout(resolve, 32_000))
    return route.abort('timedout')
  })

  await signInAsStudent(page)
  await expect(page.getByRole('alert').getByText('This page could not be shown')).toBeVisible({ timeout: 60_000 })
  expect(requests).toBe(2)
  expect(documents(), 'the sign-in page, then the one reload').toBe(2)
})

test('a page asked for while offline waits for the connection, then the tab reloads once and shows it', async ({
  page,
  backend,
  context,
}) => {
  await onHelp(page, backend)
  const documents = documentLoads(page)
  const mark = await markDocument(page)
  let offline = false
  const refused: string[] = []
  await page.route('**/assets/**', (route) => {
    if (!offline) return route.fallback()
    refused.push(new URL(route.request().url()).pathname)
    return route.abort('internetdisconnected')
  })

  await context.setOffline(true)
  offline = true
  await page.getByRole('link', { name: 'STOA home' }).click()
  await expect.poll(() => refused.some((file) => /^\/assets\/(MapPages|PlanetScreen)-/.test(file))).toBe(true)
  // Long enough for a reload to have started, had one been coming. Reloaded
  // offline, the tab showed the browser's offline page.
  await page.waitForTimeout(2_000)
  expect(documents(), 'documents loaded while offline').toBe(0)
  expect(await mark()).toBe('kept')
  await expect(page.getByRole('alert')).toHaveCount(0)

  offline = false
  await context.setOffline(false)
  await expect(page.getByRole('heading', MAP_HEADING)).toBeVisible()
  expect(documents(), 'the one reload, once back online').toBe(1)
})

test('a page that fails after the reader went back reloads nothing, and the next visit gets it', async ({
  page,
  backend,
}) => {
  await onHelp(page, backend)
  const documents = documentLoads(page)
  const mark = await markDocument(page)
  const map = await holdThenFail(page, chunkFile('MapPages'))

  await page.getByRole('link', { name: 'STOA home' }).click()
  await map.askedFor
  // The reader gives up on the slow page before it fails.
  await page.goBack()
  await expect(page).toHaveURL('/support')
  map.release()
  // Long enough for a reload to have started, had one been coming.
  await page.waitForTimeout(2_000)
  expect(documents(), 'documents loaded since the reader went back').toBe(0)
  expect(await mark()).toBe('kept')
  await expect(page.getByRole('alert')).toHaveCount(0)

  // Asked for again, the page meets the failure the document kept, and the
  // reader is at its address now: the tab reloads once and shows it.
  await page.getByRole('link', { name: 'STOA home' }).click()
  await expect(page.getByRole('heading', MAP_HEADING)).toBeVisible()
  expect(documents()).toBe(1)
})

test('a stylesheet that failed after the reader went back is put back when the map is next shown, without a reload', async ({
  page,
  backend,
}) => {
  await onHelp(page, backend)
  const documents = documentLoads(page)
  const mark = await markDocument(page)
  const stylesheet = await holdThenFail(page, '**/assets/PlanetScreen-*.css')

  await page.getByRole('link', { name: 'STOA home' }).click()
  await stylesheet.askedFor
  await page.goBack()
  await expect(page).toHaveURL('/support')
  stylesheet.release()
  await page.waitForTimeout(2_000)
  expect(documents(), 'documents loaded since the reader went back').toBe(0)

  // Vite will not ask for the stylesheet again in this document; the map
  // asks for it itself, and waits for it.
  await page.getByRole('link', { name: 'STOA home' }).click()
  await expect(page.getByRole('heading', MAP_HEADING)).toBeVisible()
  await expect(page.locator('.starmap-nebula-link').first()).toHaveCSS('clip-path', STYLED_NEBULA_LINK)
  expect(stylesheet.requests(), 'the stylesheet, asked for again').toBe(2)
  expect(documents()).toBe(0)
  expect(await mark()).toBe('kept')
})

test('a stylesheet that failed in the document the reload made is put back for the next page that shares it', async ({
  page,
  backend,
}) => {
  new StudentWorld(backend).install()
  const documents = documentLoads(page)
  let blocked = true
  await page.route('**/assets/PlanetScreen-*.css', (route) =>
    blocked ? route.abort('internetdisconnected') : route.fallback(),
  )

  await signInAsStudent(page)
  const alert = page.getByRole('alert')
  await expect(alert.getByText('This page could not be shown')).toBeVisible()
  expect(documents(), 'the sign-in page, then the one reload').toBe(2)
  await expect(alert.getByRole('button', { name: 'Try again' })).toHaveCount(0)

  // A subject's map shares the home map's stylesheet. (No link leads there
  // from the error page, so the address is changed as a link would.)
  blocked = false
  await page.evaluate("history.pushState({}, '', '/map/math/fractions'); dispatchEvent(new PopStateEvent('popstate'))")
  await expect(page.getByRole('heading', { name: 'Fractions' })).toBeVisible()
  // Placed by the stylesheet; unstyled, a star's link sits in the flow.
  await expect(page.locator('.starmap-link').first()).toHaveCSS('position', 'absolute')
  expect(documents()).toBe(2)
})
