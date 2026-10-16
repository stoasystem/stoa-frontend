import { expect, test } from './support/fixtures'
import { signInAsStudent } from './support/signIn'
import { StudentWorld } from './support/student'

// #162 production walkthrough at 375 px: the notification panel was as wide as
// the screen less its gutters but hung from the bell, which is not at the edge
// (the account button is to its right), so it started at x = -12 and its first
// letters were cut off. jsdom lays nothing out, so this is checked in a browser.
const PHONE = { width: 375, height: 812 }

test('on a phone, the notification panel opens inside the screen', async ({ page, backend }) => {
  new StudentWorld(backend).install()
  await page.setViewportSize(PHONE)
  await signInAsStudent(page)

  await page.getByRole('button', { name: /^Notifications/ }).first().click()

  const box = await page.locator('[data-notification-panel]').boundingBox()
  expect(box, 'the panel is laid out').not.toBeNull()
  expect(box!.x, 'its left edge').toBeGreaterThanOrEqual(16)
  expect(box!.x + box!.width, 'its right edge').toBeLessThanOrEqual(PHONE.width - 16)
})

test('on a desktop, the notification panel still hangs from the bell', async ({ page, backend }) => {
  new StudentWorld(backend).install()
  await page.setViewportSize({ width: 1280, height: 800 })
  await signInAsStudent(page)

  const bell = page.getByRole('button', { name: /^Notifications/ }).first()
  await bell.click()

  const panel = await page.locator('[data-notification-panel]').boundingBox()
  const anchor = await bell.boundingBox()
  expect(Math.abs(panel!.x + panel!.width - (anchor!.x + anchor!.width)), 'right edges line up').toBeLessThanOrEqual(1)
  expect(panel!.width).toBeCloseTo(352, 0)
})
