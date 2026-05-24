import { expect, test } from '@playwright/test'
import { loginAs } from './helpers'

test('parent can view child summary and report', async ({ page }) => {
  await loginAs(page, 'parent')
  await expect(page).toHaveURL(/\/parent/)
  await expect(page.getByText(/anna keller/i)).toBeVisible()

  await page.getByRole('link', { name: /^summary$/i }).click()
  await expect(page).toHaveURL(/\/parent\/children\/user-student/)
  await expect(page.getByText(/weak topics/i)).toBeVisible()

  await page.getByRole('link', { name: /weekly report/i }).click()
  await expect(page).toHaveURL(/\/parent\/children\/user-student\/report/)
  await expect(page.getByRole('heading', { name: /weekly report/i })).toBeVisible()
})
