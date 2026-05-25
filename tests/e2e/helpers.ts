import { expect, type Page } from '@playwright/test'

export const demoUsers = {
  student: { email: 'student@test.com', password: 'password123' },
  parent: { email: 'parent@test.com', password: 'password123' },
  tutor: { email: 'tutor@test.com', password: 'password123' },
  admin: { email: 'admin@test.com', password: 'password123' },
  organization: { email: 'organization@test.com', password: 'password123' },
}

const roleLandingRoutes: Record<keyof typeof demoUsers, RegExp> = {
  student: /\/dashboard/,
  parent: /\/parent/,
  tutor: /\/tutor/,
  admin: /\/admin/,
  organization: /\/organization/,
}

export async function loginAs(page: Page, role: keyof typeof demoUsers) {
  const user = demoUsers[role]
  await page.goto('/login')
  await page.getByLabel('Email').fill(user.email)
  await page.getByLabel('Password').fill(user.password)
  await page.getByRole('button', { name: /sign in/i }).click()
  await expect(page).toHaveURL(roleLandingRoutes[role])
}

export async function logout(page: Page) {
  await page.getByRole('button', { name: /log out/i }).click()
}
