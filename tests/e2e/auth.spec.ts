import { expect, test } from '@playwright/test'
import { demoUsers, loginAs, logout } from './helpers'

test('student can login and logout', async ({ page }) => {
  await loginAs(page, 'student')
  await expect(page).toHaveURL(/\/dashboard/)
  await expect(page.getByRole('heading', { name: /student dashboard/i })).toBeVisible()

  await logout(page)
  await expect(page).toHaveURL(/\/login/)
})

test('student lands on dashboard after protected chat login', async ({ page }) => {
  await page.goto('/chat')
  await expect(page).toHaveURL(/\/login/)

  await page.getByLabel('Email').fill(demoUsers.student.email)
  await page.getByLabel('Password').fill(demoUsers.student.password)
  await page.getByRole('button', { name: /sign in/i }).click()

  await expect(page).toHaveURL(/\/dashboard/)
  await expect(page.getByRole('heading', { name: /student dashboard/i })).toBeVisible()
})
