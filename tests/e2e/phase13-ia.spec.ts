import { expect, test } from '@playwright/test'
import { loginAs } from './helpers'

test('student navigation stays focused on core learning paths', async ({ page }) => {
  await loginAs(page, 'student')

  const primaryNav = page.getByRole('navigation', { name: 'Primary' })
  await expect(primaryNav.getByRole('link', { name: 'Dashboard' })).toBeVisible()
  await expect(primaryNav.getByRole('link', { name: 'Chat' })).toBeVisible()
  await expect(primaryNav.getByRole('link', { name: 'Learning History' })).toBeVisible()
  await expect(primaryNav.getByRole('link', { name: 'Profile' })).toBeVisible()
  await expect(primaryNav.getByRole('link', { name: /advanced analytics/i })).toHaveCount(0)
})

test('admin navigation hides advanced demo routes from primary navigation', async ({ page }) => {
  await loginAs(page, 'admin')

  const primaryNav = page.getByRole('navigation', { name: 'Primary' })
  await expect(primaryNav.getByRole('link', { name: 'Overview' })).toBeVisible()
  await expect(primaryNav.getByRole('link', { name: 'Learning activity' })).toBeVisible()
  await expect(primaryNav.getByRole('link', { name: 'Teacher requests' })).toBeVisible()
  await expect(primaryNav.getByRole('link', { name: 'Support inbox' })).toBeVisible()
  await expect(primaryNav.getByRole('link', { name: 'Advanced Analytics' })).toHaveCount(0)
  await expect(primaryNav.getByRole('link', { name: 'Retention' })).toHaveCount(0)
})

test('deep pages expose breadcrumbs and return actions', async ({ page }) => {
  await loginAs(page, 'tutor')
  await page.goto('/tutor/requests/teacher-request-1')

  const tutorBreadcrumb = page.getByRole('navigation', { name: 'Breadcrumb' })
  await expect(tutorBreadcrumb).toBeVisible()
  await expect(tutorBreadcrumb.getByRole('link', { name: 'Requests' })).toBeVisible()

  await loginAs(page, 'parent')
  await page.goto('/parent/children/student-anna/monthly-report')
  await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Child summary' })).toBeVisible()
})

test('organization role receives organization-mode navigation', async ({ page }) => {
  await loginAs(page, 'organization')

  const primaryNav = page.getByRole('navigation', { name: 'Primary' })
  await expect(primaryNav.getByRole('link', { name: 'Overview' })).toBeVisible()
  await expect(primaryNav.getByRole('link', { name: 'Students' })).toBeVisible()
  await expect(primaryNav.getByRole('link', { name: 'Teachers' })).toBeVisible()
  await expect(primaryNav.getByRole('link', { name: 'Reports' })).toBeVisible()
  await expect(primaryNav.getByRole('link', { name: 'Tutor Assignment' })).toHaveCount(0)
})
