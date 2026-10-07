import { expect, type Page } from '@playwright/test'
import { STUDENT } from './student'

export async function signInAsStudent(page: Page) {
  await page.goto('/login')
  await page.getByLabel(/e-?mail/i).first().fill(STUDENT.email)
  await page.locator('input[type=password]').first().fill(STUDENT.password)
  await page.locator('button[type=submit]').first().click()
  await expect(page).toHaveURL('/')
}
