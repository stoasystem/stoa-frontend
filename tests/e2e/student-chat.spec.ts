import { expect, test } from '@playwright/test'
import { loginAs } from './helpers'

test('student can use chat and request teacher help', async ({ page }) => {
  await loginAs(page, 'student')
  await page.goto('/chat')

  await page.getByRole('textbox', { name: /learning question/i }).fill('How do I solve x squared equals 9?')
  await page.getByRole('button', { name: /send message/i }).click()

  await expect(page.getByRole('main').getByText(/x squared equals 9/i).first()).toBeVisible()
  await expect(page.getByText(/explanation|steps|core idea/i).first()).toBeVisible()

  await page.getByRole('button', { name: /ask a teacher/i }).first().click()
  await expect(page.getByText(/sent to a teacher|waiting for a teacher/i).first()).toBeVisible()
})
