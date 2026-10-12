import { expect, test } from './support/fixtures'
import { signInAsStudent } from './support/signIn'
import { StudentWorld } from './support/student'

// #162 production walkthrough at 375 px: "Switch account" opened its list to
// the left of the account menu, at x = -152, so more than half of it was off
// the screen and the account in it could not be tapped. The language list sat
// the same way. jsdom lays nothing out, so this is checked in a real browser.
const PHONE = { width: 375, height: 812 }

for (const submenu of ['Language', 'Switch account']) {
  test(`on a phone, the "${submenu}" list opens on the screen`, async ({ page, backend }) => {
    new StudentWorld(backend).install()
    await page.setViewportSize(PHONE)
    await signInAsStudent(page)

    await page.getByRole('button', { name: 'Account' }).first().click()
    await page.getByRole('menuitem', { name: submenu }).click()

    const menus = page.getByRole('menu')
    await expect(menus).toHaveCount(2)
    const box = await menus.nth(1).boundingBox()
    expect(box, 'the submenu is laid out').not.toBeNull()
    expect(box!.x, 'its left edge').toBeGreaterThanOrEqual(0)
    expect(box!.x + box!.width, 'its right edge').toBeLessThanOrEqual(PHONE.width)

    // And what is in it can be reached where it is drawn: a trial click runs
    // Playwright's checks, the element at that point among them, and stops.
    await menus.nth(1).locator('[role^=menuitem]').first().click({ trial: true, timeout: 2000 })
  })
}
