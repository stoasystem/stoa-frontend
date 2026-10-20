import type { Page } from '@playwright/test'
import { expect, test } from './support/fixtures'
import { signInAsStudent } from './support/signIn'
import { StudentWorld } from './support/student'

/*
 * A module the build loads on demand that cannot be fetched (#272, #401).
 *
 * The component tests stand in for Vite's preload helper; these run the real
 * one, so they see it if it changes: a page's failure must still reach
 * lazyPage as the error Vite announced, which is what reloads the tab once,
 * and an optional module's must still reach the code that asked for it.
 */

/** Counts the documents the tab loads from now on: a reload is one. */
function documentLoads(page: Page) {
  let loads = 0
  page.on('request', (request) => {
    if (request.isNavigationRequest() && request.frame() === page.mainFrame()) loads += 1
  })
  return () => loads
}

/** Refuses a chunk while `blocked()` holds, as a dropped connection would. */
async function refuse(page: Page, chunk: string, blocked: () => boolean) {
  const refused: string[] = []
  await page.route(`**/assets/${chunk}-*.js`, async (route) => {
    if (!blocked()) return route.fallback()
    refused.push(new URL(route.request().url()).pathname)
    return route.abort('internetdisconnected')
  })
  return refused
}

// Not checked here: that a later formula is typeset once the chunk can be
// fetched again. Chromium keeps a failed import in the document's module map
// and answers the same URL from it without asking the network (seen with
// Chromium 148), so a retry in the same document fails again; the next
// document fetches afresh.
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
  await expect(thread.locator('.katex')).toHaveCount(0)

  // The same document all along: nothing that lives in memory was thrown away.
  expect(documents(), 'documents loaded since the first formula').toBe(0)
  expect(await page.evaluate(() => (globalThis as { stoaE2eDocument?: string }).stoaE2eDocument)).toBe('before the formulas')
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

  // The reader's own reload gets the page back. ("Try again" cannot, in this
  // document: see the note on the first test.)
  offline = false
  await alert.getByRole('button', { name: 'Reload page' }).click()
  await expect(page.getByRole('heading', { name: 'Mathematics' })).toBeVisible()
  expect(documents()).toBe(3)
})
