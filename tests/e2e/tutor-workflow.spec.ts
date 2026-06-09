import { expect, test } from '@playwright/test'
import { loginAs } from './helpers'

test('tutor can filter and open a help request', async ({ page }) => {
  await loginAs(page, 'tutor')
  await expect(page).toHaveURL(/\/tutor/)
  await expect(page.getByRole('heading', { name: /tutor support requests/i })).toBeVisible()

  await page.getByRole('button', { name: /^all$/i }).click()
  await page.getByText(/anna keller/i).first().click()
  await expect(page).toHaveURL(/\/tutor\/requests\//)
  await expect(page.getByRole('heading', { name: /request detail|anna keller/i })).toBeVisible()
  await expect(page.getByText(/within sla/i).first()).toBeVisible()
  await expect(page.getByText('3x = 15', { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: /teacher assistance seed/i })).toBeVisible()
  await expect(page.getByText(/clarify the algebra step/i)).toBeVisible()
  await expect(page.getByRole('heading', { name: /ai teacher tools/i })).toBeVisible()
  await page.getByRole('button', { name: /generate summary draft/i }).click()
  await expect(page.getByText(/summary draft created/i)).toBeVisible()
  await expect(page.getByText(/not delivered/i).first()).toBeVisible()
  await expect(page.getByText(/likely gap/i)).toBeVisible()
  await page.getByRole('button', { name: /generate exercise draft/i }).click()
  await expect(page.getByText(/exercise draft created/i)).toBeVisible()
  await expect(page.getByText(/solve 2x/i)).toBeVisible()
  await page.getByRole('button', { name: /^accept$/i }).first().click()
  await expect(page.getByText(/draft accepted/i)).toBeVisible()
  await expect(page.getByRole('heading', { name: /curriculum context/i })).toBeVisible()
  await expect(page.getByText(/teacher-visible curriculum coverage/i)).toBeVisible()

  await page.getByRole('button', { name: /mark in progress/i }).click()
  await expect(page.getByText(/request status updated/i)).toBeVisible()

  await page.getByRole('button', { name: /^formula$/i }).click()
  await page.getByLabel(/teacher reply/i).fill('x = 5')
  await page.getByRole('button', { name: /send reply/i }).click()
  await expect(page.getByText(/teacher note added/i)).toBeVisible()

  await page.getByLabel(/teacher reply/i).fill('<script>alert(1)</script> private/student-1/image.png')
  await expect(page.getByText(/unsafe raw html is not allowed|private markers cannot be sent/i)).toBeVisible()
  await expect(page.getByRole('button', { name: /send reply/i })).toBeDisabled()
})

test('admin dashboard exposes aggregate teacher SLA metrics', async ({ page }) => {
  await loginAs(page, 'admin')
  await expect(page).toHaveURL(/\/admin/)
  await expect(page.getByRole('heading', { name: /teacher sla/i })).toBeVisible()
  await expect(page.getByText(/avg reply/i)).toBeVisible()
  await expect(page.getByText(/breached/i)).toBeVisible()
  await expect(page.getByRole('heading', { name: /operational notifications/i })).toBeVisible()
  await expect(page.getByText(/subscription request updated/i)).toBeVisible()
})
