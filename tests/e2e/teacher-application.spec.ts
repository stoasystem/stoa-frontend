import { expect, test } from '@playwright/test'

test('teacher support page explains role and links to teacher application', async ({ page }) => {
  await page.goto('/teacher-support')

  await expect(page.getByRole('heading', { name: /how teachers participate/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /what teachers are responsible for/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /how to become a stoa teacher/i })).toBeVisible()

  const applyLinks = page.getByRole('link', { name: /apply to teach on stoa/i })
  await expect(applyLinks.first()).toHaveAttribute('href', '/register?role=tutor')

  await applyLinks.first().click()
  await expect(page).toHaveURL(/\/register\?role=tutor/)
  await expect(page.getByRole('radio', { name: /teacher selected/i })).toBeVisible()
})
