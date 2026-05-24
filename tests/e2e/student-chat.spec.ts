import { expect, test } from '@playwright/test'
import { loginAs } from './helpers'

test('student can use chat and request teacher help', async ({ page }) => {
  await loginAs(page, 'student')
  await page.goto('/chat')

  await page
    .getByPlaceholder(/ask a homework question|start with a homework question/i)
    .fill('How do I solve x squared equals 9?')
  await page.getByRole('button', { name: /send message/i }).click()

  await expect(page.getByRole('main').getByText(/x squared equals 9/i)).toBeVisible()
  await expect(page.getByText(/local backend saved your question/i)).toBeVisible()

  await page.getByRole('button', { name: /request teacher/i }).click()
  await expect(page.getByText(/teacher help requested/i)).toBeVisible()
})
