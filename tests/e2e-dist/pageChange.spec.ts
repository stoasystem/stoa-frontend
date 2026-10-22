import type { Page } from '@playwright/test'
import { expect, test } from './support/fixtures'
import { signInAsStudent } from './support/signIn'
import { StudentWorld } from './support/student'

// #448: the document scrolls, not the page, and nothing scrolled it when the
// page changed. A page opened from the foot of a long one stayed at that
// offset, and its heading took focus off the screen. And the sign-in page a
// signed-out visitor sees at `/` set no title: the tab kept the last page's
// name, and nothing was said on arriving there. jsdom lays nothing out, so
// where things end up is checked in a real browser.
const DESKTOP = { width: 1280, height: 720 }

const scrollY = (page: Page) => page.evaluate<number>('window.scrollY')

async function readToTheFoot(page: Page) {
  await expect(page.getByRole('contentinfo')).toBeVisible()
  await page.evaluate('window.scrollTo(0, document.documentElement.scrollHeight)')
  const offset = await scrollY(page)
  expect(offset, 'the page is long enough to scroll').toBeGreaterThan(200)
  return offset
}

/** Its heading has focus, under the sticky bar and inside the screen. */
async function expectHeadingInView(page: Page) {
  const heading = page.getByRole('heading', { level: 1 })
  await expect(heading).toBeFocused()
  const bar = await page.locator('header').first().boundingBox()
  const box = await heading.boundingBox()
  expect(bar, 'the bar is drawn').not.toBeNull()
  expect(box, 'the heading is drawn').not.toBeNull()
  expect(bar!.y, 'the bar\'s top').toBe(0)
  expect(box!.y, 'the heading\'s top, against the bar\'s bottom').toBeGreaterThanOrEqual(bar!.y + bar!.height)
  expect(box!.y + box!.height, 'the heading\'s bottom, against the screen\'s').toBeLessThanOrEqual(DESKTOP.height)
}

test('a page opened from the foot of a long one starts at its top, its heading in view under the sticky bar', async ({
  page,
  backend,
}) => {
  new StudentWorld(backend).install()
  await page.setViewportSize(DESKTOP)
  await page.goto('/privacy')
  const read = await readToTheFoot(page)

  await page.getByRole('contentinfo').getByRole('link', { name: 'Terms' }).click()

  await expect(page).toHaveURL('/terms')
  await expectHeadingInView(page)
  expect(await scrollY(page)).toBe(0)

  // Back is the browser's: it gives the page back where it was read. With a
  // page shorter than that offset in between, the browser's restore is
  // clamped, as it was before #448; that is not checked here.
  await page.goBack()
  await expect(page).toHaveURL('/privacy')
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused()
  await expect.poll(() => scrollY(page)).toBe(read)
})

// A full-height page leaves the document nothing to scroll, so the browser
// puts it at the top by itself; checked here because its bar is sticky inside
// a box of the screen's height, and must still be drawn at the top.
test('the star map, a full-height page, opens with its bar and heading on the screen', async ({ page, backend }) => {
  new StudentWorld(backend).install()
  await page.setViewportSize(DESKTOP)
  await signInAsStudent(page)
  await page.goto('/privacy')
  await readToTheFoot(page)

  await page.getByRole('banner').getByRole('link').first().click()

  await expect(page).toHaveURL('/')
  await expect(page.getByRole('main')).toBeVisible()
  await expectHeadingInView(page)
  expect(await scrollY(page)).toBe(0)
})

test('the sign-in page at / names itself in the tab, and says so on arriving from another page', async ({
  page,
  backend,
}) => {
  new StudentWorld(backend).install()
  await page.setViewportSize(DESKTOP)
  await page.goto('/')
  await expect(page).toHaveTitle('Sign in · STOA')

  // The privacy page names itself; that name used to stay over the sign-in form.
  await page.goto('/privacy')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page).not.toHaveTitle('Sign in · STOA')
  await readToTheFoot(page)

  await page.getByRole('banner').getByRole('link').first().click()

  await expect(page).toHaveURL('/')
  await expect(page).toHaveTitle('Sign in · STOA')
  await expect(page.locator('[data-route-announcer]')).toHaveText('Sign in')
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused()
  // A check only: the sign-in page is short, so the browser puts it at the top by itself.
  expect(await scrollY(page)).toBe(0)
})
