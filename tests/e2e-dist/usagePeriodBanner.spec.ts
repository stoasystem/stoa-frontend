import { expect, test } from './support/fixtures'
import { signInAsStudent } from './support/signIn'
import { PARENT, signInAt, StaffWorld } from './support/staff'
import { StudentWorld } from './support/student'

/**
 * The usage period reminder through the built app (#616, stoa-backend#343):
 * at the top of every page from a week before the last day and once it is
 * over, closed for the visit with its button. The replies are checked against
 * the backend's OpenAPI document, so the shapes read here are the shipped ones.
 */

// Not imported from src: this suite's tsconfig has no `@/` paths.
function zurichDay(offsetDays: number) {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Zurich', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
  return new Date(Date.parse(`${today}T00:00:00Z`) + offsetDays * 86_400_000).toISOString().slice(0, 10)
}

test('a student three days from the end of a parent’s period reads it until closing it, and again next visit', async ({ page, backend }) => {
  const world = new StudentWorld(backend)
  world.usagePeriod = { endsAt: zurichDay(3), state: 'active', daysLeft: 3, paidBy: 'parent' }
  world.install()
  await signInAsStudent(page)

  const banner = page.getByRole('complementary', { name: 'Usage period' })
  await expect(banner).toContainText('Your usage period ends in 3 days')
  await expect(banner).toContainText('Ask a parent to renew it.')

  await banner.getByRole('button', { name: 'Hide until next time' }).click()
  await expect(banner).toHaveCount(0)
  // Closed for this visit only: the page opened again has it back.
  await page.reload()
  await expect(page.getByRole('complementary', { name: 'Usage period' })).toContainText('Your usage period ends in 3 days')
})

test('a student whose own period is over reads that it ended and where to renew', async ({ page, backend }) => {
  const world = new StudentWorld(backend)
  world.usagePeriod = { endsAt: zurichDay(-2), state: 'expired', daysLeft: 0, paidBy: 'self' }
  world.install()
  await signInAsStudent(page)

  const banner = page.getByRole('complementary', { name: 'Usage period' })
  await expect(banner).toContainText('Your usage period ended on')
  await expect(banner).toContainText('To renew it, contact STOA: info@stoaedu.ch')
})

test('a parent reads which child’s period ends, never which other parent pays, and every period on the Overview', async ({ page, backend }) => {
  const world = new StaffWorld(backend, PARENT)
  world.children = [
    { id: 'e2e-child-1', userId: 'e2e-child-1', name: 'Lina', email: 'lina@example.test', grade: null, subjects: [] },
    { id: 'e2e-child-2', userId: 'e2e-child-2', name: 'Noah', email: 'noah@example.test', grade: null, subjects: [] },
  ]
  world.usagePeriods = {
    own: { endsAt: zurichDay(90), state: 'active', daysLeft: 90 },
    children: [
      { studentId: 'e2e-child-1', name: 'Lina', endsAt: zurichDay(-1), state: 'expired', paidBy: 'other_parent' },
      { studentId: 'e2e-child-2', name: 'Noah', endsAt: zurichDay(90), state: 'active', paidBy: 'you' },
    ],
    renewalContactEmail: 'info@stoaedu.ch',
  }
  world.install()
  await signInAt(page, PARENT, '/parent')

  const banner = page.getByRole('complementary', { name: 'Usage period' })
  await expect(banner).toContainText('Lina\'s usage period ended on')
  await expect(banner).toContainText('Another parent pays for it.')
  await expect(banner).toContainText('To renew, contact STOA: info@stoaedu.ch')
  await expect(banner).not.toContainText('Noah')

  const periods = page.locator('[data-usage-periods]')
  await expect(periods.getByRole('heading', { name: 'Usage periods' })).toBeVisible()
  await expect(periods).toContainText('Your account')
  await expect(periods).toContainText('Paid by another parent')
  await expect(periods).toContainText('Paid by you')
  await expect(periods).toContainText('Expired')
})
