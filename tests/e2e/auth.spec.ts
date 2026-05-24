import { expect, test } from '@playwright/test'
import { loginAs, logout } from './helpers'

test('student can login and logout', async ({ page }) => {
  await loginAs(page, 'student')
  await expect(page).toHaveURL(/\/dashboard/)
  await expect(page.getByRole('heading', { name: /student dashboard/i })).toBeVisible()

  await logout(page)
  await expect(page).toHaveURL(/\/login/)
})
