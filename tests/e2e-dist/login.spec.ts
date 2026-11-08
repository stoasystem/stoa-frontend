import { expect, test } from './support/fixtures'
import { signInAsStudent } from './support/signIn'
import { StudentWorld } from './support/student'

// #185 review (2026-10-13): on a phone the nebula was a 104 px thumbnail
// beside the caption, under the form and the account link, where it decorated
// nothing. It now opens the page, above the heading, as the sky does on a
// desktop; there it stays beside the form. jsdom lays nothing out, so this is
// checked in a real browser.

test('on a phone, the nebula opens the page above the heading, large, and the caption is left out', async ({ page, backend }) => {
  new StudentWorld(backend).install()
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/login')

  const nebula = await page.locator('[data-login-nebula]').boundingBox()
  const title = await page.getByRole('heading', { level: 1 }).boundingBox()
  expect(nebula, 'the nebula is drawn').not.toBeNull()
  expect(nebula!.y + nebula!.height, 'its bottom, against the heading\'s top').toBeLessThanOrEqual(title!.y)
  expect(nebula!.width, 'its width').toBeGreaterThanOrEqual(200)
  // Centred on the page.
  expect(Math.abs(nebula!.x + nebula!.width / 2 - 195), 'its centre, against the page\'s').toBeLessThanOrEqual(2)
  await expect(page.getByText('Good questions open new doors.')).toBeHidden()
})

test('on a desktop, the nebula stays beside the form, with its caption', async ({ page, backend }) => {
  new StudentWorld(backend).install()
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/login')

  const nebula = await page.locator('[data-login-nebula]').boundingBox()
  const form = await page.locator('form').first().boundingBox()
  expect(nebula!.x, 'its left edge, against the form\'s right').toBeGreaterThan(form!.x + form!.width)
  await expect(page.getByText('Good questions open new doors.')).toBeVisible()
})

// #601: the page wakes the backend as it opens, so a cold Lambda start falls
// in the time the visitor types. The wake-up must be a CORS simple request, or
// the browser would send a preflight first and wait on the cold start for it:
// no header of ours (no JSON content type, no token). Playwright answers
// preflights itself, out of sight of the mock, so what is checked here is the
// request's headers; the options it is sent with are pinned in
// tests/component/loginPrewarm601.test.tsx. Opening the page again in the same
// tab (a reload, a second visit) does not ask again.
test('the page asks for /health once as it opens, as a simple request', async ({ page, backend }) => {
  new StudentWorld(backend).install()

  await page.goto('/login')
  await expect.poll(() => backend.callsTo('GET', '/health').length, 'the wake-up').toBe(1)
  const [wake] = backend.callsTo('GET', '/health')
  expect(wake.headers.authorization, 'no token goes with it').toBeUndefined()
  expect(wake.headers['content-type'], 'no content type of ours').toBeUndefined()
  expect(wake.query.toString(), 'nothing in the address either').toBe('')

  await page.reload()
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await signInAsStudent(page)

  expect(backend.callsTo('GET', '/health'), 'sent once, for all three loads of the page').toHaveLength(1)
  // The sign-in, by contrast, goes with a JSON body: that one is preflighted.
  expect(backend.callsTo('POST', '/auth/login')[0]?.headers['content-type']).toContain('application/json')
})
