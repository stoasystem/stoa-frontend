import { expect, test } from '@playwright/test'
import { loginAs } from './helpers'

test('admin can view Phase 12 platform demo routes', async ({ page }) => {
  await loginAs(page, 'admin')

  await page.goto('/organization')
  await expect(page.getByRole('heading', { name: /workspace dashboard/i })).toBeVisible()
  await expect(page.getByText(/stoa zurich tutoring center/i)).toBeVisible()

  await page.goto('/organization/students')
  await expect(page.getByRole('heading', { level: 1, name: /^students$/i })).toBeVisible()
  await page.getByRole('link', { name: /open profile/i }).first().click()
  await expect(page.getByRole('heading', { name: /advanced learning profile/i })).toBeVisible()

  await page.goto('/students/student-anna/diagnosis')
  await expect(page.getByRole('heading', { name: /weak-point diagnosis/i })).toBeVisible()

  await page.goto('/students/student-anna/curriculum-graph')
  await expect(page.getByRole('heading', { name: /curriculum graph/i })).toBeVisible()

  await page.goto('/organization/tutor-assignment')
  await expect(page.getByRole('heading', { name: /assignment board/i })).toBeVisible()

  await page.goto('/admin/advanced-analytics')
  await expect(page.getByRole('heading', { name: /advanced analytics/i })).toBeVisible()

  await page.goto('/admin/retention')
  await expect(page.getByRole('heading', { name: /retention operations/i })).toBeVisible()
})

test('parent can view monthly report and public partnership onboarding is reachable', async ({ page }) => {
  await loginAs(page, 'parent')

  await page.goto('/parent/children/student-anna/monthly-report')
  await expect(page.getByRole('heading', { name: /monthly learning report/i })).toBeVisible()
  await expect(page.getByText(/june 2026/i)).toBeVisible()

  await page.goto('/partnership/onboarding')
  await expect(page.getByRole('heading', { name: /pilot onboarding/i })).toBeVisible()
  await page.getByRole('button', { name: /submit interest/i }).click()
  await expect(page.getByText(/interest submitted/i)).toBeVisible()
})
