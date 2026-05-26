import { expect, test } from '@playwright/test'
import { loginAs } from './helpers'

test('tutor can filter and open a help request', async ({ page }) => {
  await loginAs(page, 'tutor')
  await expect(page).toHaveURL(/\/tutor/)
  await expect(page.getByRole('heading', { name: /teacher support requests/i })).toBeVisible()

  await page.getByRole('button', { name: /^all$/i }).click()
  await page.getByText(/anna keller/i).first().click()
  await expect(page).toHaveURL(/\/tutor\/requests\//)
  await expect(page.getByRole('heading', { name: /request detail|anna keller/i })).toBeVisible()

  await page.getByRole('button', { name: /mark in progress/i }).click()
  await expect(page.getByText(/request status updated/i)).toBeVisible()
})
