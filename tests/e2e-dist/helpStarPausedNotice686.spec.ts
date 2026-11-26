import type { Locator, Page } from '@playwright/test'
import { expect, test } from './support/fixtures'
import { guideAlreadySeen } from './support/guide'
import { signInAsStudent } from './support/signIn'
import { StudentWorld } from './support/student'

/*
 * On a phone, once a student's usage period has ended (#615), the notice over
 * the docked composer rose three lines into the map's bottom-left corner and
 * the help star (#671) stood over the start of its third line (#686). jsdom
 * lays nothing out, so the boxes are compared in the built app. With cards due
 * for review, the corner Murmi and the zoom pair stand on the right of the same
 * band, and must keep clear of the notice too.
 */

const PHONES = [
  { width: 375, height: 812 },
  { width: 390, height: 844 },
]

type Box = { x: number; y: number; width: number; height: number }

function intersect(a: Box, b: Box) {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height
}

async function box(locator: Locator, what: string) {
  await expect(locator, what).toBeVisible()
  const found = await locator.boundingBox()
  expect(found, `${what} is laid out`).not.toBeNull()
  return found!
}

async function signInExpired(page: Page, backend: ConstructorParameters<typeof StudentWorld>[0], viewport: { width: number; height: number }) {
  const world = new StudentWorld(backend)
  world.usagePeriod = { endsAt: '2026-09-01', state: 'expired', daysLeft: 0, paidBy: 'self' }
  world.reviewSummary = { dueCount: 3, scheduledCount: 5, nextDueAt: '2026-09-29T08:00:00Z' }
  world.install()
  await page.setViewportSize(viewport)
  // The star clusters' hint (#747) seen: it would stand in front of the review Murmi the first time.
  await guideAlreadySeen(page)
  await signInAsStudent(page)
}

for (const viewport of PHONES) {
  test(`the paused notice keeps clear of the help star, the zoom pair and the review Murmi at ${viewport.width} x ${viewport.height}`, async ({ page, backend }) => {
    await signInExpired(page, backend, viewport)

    const notice = await box(page.locator('[data-ask-docked] [data-usage-period-paused]'), 'the paused notice')
    const help = await box(page.locator('[data-starmap-help-button]'), 'the help star')
    const zoom = await box(page.getByRole('button', { name: /zoom in/i }).locator('..'), 'the zoom pair')
    const reminder = await box(page.getByRole('button', { name: '3 cards due for review' }), 'the review Murmi')

    expect(intersect(notice, help), `the notice ${JSON.stringify(notice)} and the help star ${JSON.stringify(help)}`).toBe(false)
    expect(intersect(notice, zoom), `the notice ${JSON.stringify(notice)} and the zoom pair ${JSON.stringify(zoom)}`).toBe(false)
    expect(intersect(notice, reminder), `the notice ${JSON.stringify(notice)} and the review Murmi ${JSON.stringify(reminder)}`).toBe(false)

    // The help star still takes its own taps: nothing of the dock lies over it.
    await page.mouse.click(help.x + help.width / 2, help.y + help.height / 2)
    await expect(page.locator('[data-starmap-help-dialog]')).toBeVisible()
  })
}
