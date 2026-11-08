import { expect, test } from './support/fixtures'
import { signInAsStudent } from './support/signIn'
import { StudentWorld } from './support/student'

// The review reminder (#593): with cards due, Murmi whistles in the map's corner beside the count;
// a tap flies to the star with the most cards due, and Murmi's bubble there leads into its review.
test('with reviews due, the corner Murmi says how many and leads to the star’s review', async ({ page, backend }) => {
  const world = new StudentWorld(backend)
  world.reviewSummary = { dueCount: 3, scheduledCount: 5, nextDueAt: '2026-09-29T08:00:00Z' }
  world.install()
  await signInAsStudent(page)

  const reminder = page.getByRole('button', { name: '3 cards due for review' })
  await expect(reminder).toBeVisible()
  await reminder.click()

  const bubble = page.getByRole('complementary', { name: 'Reducing fractions' })
  await expect(bubble).toBeVisible()
  await expect(bubble.getByRole('link', { name: 'Review 3 exercises' })).toHaveAttribute('href', '/review/reducing')
})

// Nothing scheduled (the default): no Murmi in the corner at all.
test('with nothing scheduled, there is no review reminder', async ({ page, backend }) => {
  const world = new StudentWorld(backend)
  world.install()
  const summary = page.waitForResponse((response) => response.url().endsWith('/practice/review/summary'))
  await signInAsStudent(page)

  await summary
  await expect(page.locator('[data-starmap-stage]')).toBeVisible()
  await expect(page.getByRole('button', { name: /due for review/ })).toHaveCount(0)
  await expect(page.locator('[data-review-reminder]')).toHaveCount(0)
})
