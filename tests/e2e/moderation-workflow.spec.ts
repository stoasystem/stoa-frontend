import { expect, test } from '@playwright/test'
import { loginAs } from './helpers'

test('student can report an assistant answer for moderation', async ({ page }) => {
  await loginAs(page, 'student')
  await page.goto('/chat')
  await page.getByText(/quadratic equations/i).first().click()

  await page.getByRole('button', { name: /report answer/i }).first().click()
  const dialog = page.getByRole('dialog', { name: /report content/i })
  await expect(dialog).toBeVisible()
  await dialog.getByLabel(/reason/i).selectOption('incorrect_answer')
  await dialog.getByLabel(/severity/i).selectOption('high')
  await dialog.getByLabel(/note/i).fill('The factoring explanation should be reviewed.')
  await dialog.getByRole('button', { name: /submit report/i }).click()

  await expect(page.getByText(/moderation case .* opened/i)).toBeVisible()
})

test('admin can triage moderation cases', async ({ page }) => {
  await loginAs(page, 'admin')
  await page.goto('/admin/moderation')

  await expect(page.getByRole('heading', { name: /content moderation/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /queue/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /mod-demo-1/i })).toBeVisible()

  await page.getByLabel(/status/i).selectOption('open')
  await expect(page.getByRole('button', { name: /mod-demo-1/i })).toBeVisible()

  await page.getByRole('button', { name: /mod-demo-1/i }).click()
  await expect(page.getByText(/case mod-demo-1/i)).toBeVisible()
  await expect(page.getByText(/assistant response selected|we can factor/i)).toBeVisible()

  await page.getByRole('textbox', { name: /^admin$/i }).fill('admin-2')
  await page.getByRole('button', { name: /assign case/i }).click()
  await page.getByPlaceholder(/resolution note/i).fill('Reviewed and actioned.')
  await page.getByRole('button', { name: /^actioned$/i }).click()
  await page.getByPlaceholder(/add an internal moderation note/i).fill('Follow-up complete.')
  await page.getByRole('button', { name: /add note/i }).click()

  await expect(page.getByText(/follow-up complete/i)).toBeVisible()
})
