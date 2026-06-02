import { expect, test } from '@playwright/test'
import { loginAs } from './helpers'

test('student dashboard presents the learning support chain clearly', async ({ page }) => {
  await loginAs(page, 'student')

  await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /continue learning/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /need help/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /today's practice/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: /live support/i })).toBeVisible()
  await expect(page.getByText(/practice library/i).first()).toBeVisible()
  await expect(page.getByText(/learning assistant/i).first()).toBeVisible()
  await expect(page.getByText(/online classroom/i).first()).toBeVisible()
})

test('practice library and upload copy avoid automatic solving claims', async ({ page }) => {
  await loginAs(page, 'student')
  await page.goto('/question-bank')

  await expect(page.getByRole('heading', { name: /practice library/i })).toBeVisible()
  await expect(page.getByText(/choose exercises by subject, topic, and difficulty/i)).toBeVisible()

  await page.getByRole('button', { name: /upload a question/i }).click()
  const dialog = page.getByRole('dialog', { name: /upload a question/i })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByText(/take a photo or attach a pdf from your schoolwork/i)).toBeVisible()
  await expect(dialog.getByText(/learning materials only/i)).toBeVisible()
  await expect(page.getByText(/scan and solve|instant solution|perfect answer/i)).toHaveCount(0)
})

test('chat to classroom copy uses tutor support and live classroom states', async ({ page }) => {
  await loginAs(page, 'student')
  await page.goto('/chat')

  await page.getByRole('textbox', { name: /first learning question/i }).fill('I need help with this step.')
  await page.getByRole('button', { name: /start conversation/i }).click()
  await expect(page.getByRole('main').getByText(/this step/i).first()).toBeVisible()

  await page.getByRole('button', { name: /ask a tutor/i }).first().click()
  await expect(page.getByRole('heading', { name: /tutor support requested/i })).toBeVisible()
  await page.getByRole('button', { name: /^tutor joined$/i }).click()
  await expect(page.getByText(/learning assistant is observing/i)).toBeVisible()
  await page.getByRole('button', { name: /start live classroom/i }).click()

  await expect(page.getByRole('heading', { name: /classroom lobby/i })).toBeVisible()
})

test('online classroom room exposes learning workspace panels', async ({ page }) => {
  await loginAs(page, 'student')
  await page.goto('/classroom/sessions/classroom-linear-equations/room')

  await expect(page.getByRole('heading', { name: /mathematics support/i })).toBeVisible()
  await expect(page.getByRole('tab', { name: /materials/i })).toBeVisible()
  await expect(page.getByRole('tab', { name: /notes/i })).toBeVisible()
  await expect(page.getByRole('tab', { name: /participants/i })).toBeVisible()
  await expect(page.getByText(/shared whiteboard/i)).toBeVisible()
})
