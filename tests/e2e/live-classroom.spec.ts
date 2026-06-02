import { expect, test } from '@playwright/test'
import { loginAs } from './helpers'

const sampleImage = {
  name: 'classroom-question.png',
  mimeType: 'image/png',
  buffer: Buffer.from('classroom question image'),
}

test('student can open classroom home and schedule a session with materials', async ({ page }) => {
  await loginAs(page, 'student')

  await page.goto('/classroom')
  await expect(page).toHaveURL(/\/classroom$/)
  await expect(page.getByRole('heading', { name: /online classroom/i })).toBeVisible()
  await expect(page.getByText(/mathematics support/i).first()).toBeVisible()

  await page.getByRole('link', { name: /schedule another/i }).click()
  await expect(page).toHaveURL(/\/classroom\/schedule/)
  await page.getByRole('button', { name: /quick help/i }).click()
  await expect(page.getByText(/date and time/i)).toBeVisible()
  await page.getByLabel(/what should the tutor know/i).fill('I get stuck when moving terms across the equals sign.')
  await page.locator('input[aria-label="Attach File"]').last().setInputFiles(sampleImage)
  await expect(page.getByText('classroom-question.png').first()).toBeVisible()

  await page.getByRole('button', { name: /schedule session/i }).click()
  await expect(page.getByText(/session scheduled/i)).toBeVisible()
  await expect(page.getByRole('link', { name: /open lobby/i })).toBeVisible()
})

test('student can move from lobby into the online classroom room and summary', async ({ page }) => {
  await loginAs(page, 'student')
  await page.goto('/classroom/sessions/classroom-linear-equations/lobby')

  await expect(page.getByRole('heading', { name: /classroom lobby/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /camera on/i })).toBeVisible()
  await page.getByRole('button', { name: /join classroom/i }).click()
  await expect(page).toHaveURL(/\/classroom\/sessions\/classroom-linear-equations\/room/)

  await expect(page.getByText(/scheduled classroom/i)).toBeVisible()
  await expect(page.getByRole('button', { name: /unmute/i })).toBeVisible()
  await expect(page.getByText(/shared whiteboard/i)).toBeVisible()
  await page.getByRole('button', { name: /leave/i }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByRole('button', { name: /leave classroom/i }).click()
  await expect(page).toHaveURL(/\/classroom\/sessions\/classroom-linear-equations\/summary/)
  await expect(page.getByText(/live classroom completed/i)).toBeVisible()
})

test('learning chat can escalate tutor support into a classroom lobby', async ({ page }) => {
  await loginAs(page, 'student')
  await page.goto('/chat')

  await page.getByRole('textbox', { name: /first learning question/i }).fill('Can a tutor help me with linear equations?')
  await page.getByRole('button', { name: /start conversation/i }).click()
  await expect(page.getByRole('main').getByText(/linear equations/i).first()).toBeVisible()

  await page.getByRole('button', { name: /ask a tutor/i }).first().click()
  await expect(page.getByRole('heading', { name: /tutor support requested/i })).toBeVisible()
  await page.getByRole('button', { name: /^tutor joined$/i }).click()
  await page.getByRole('button', { name: /start live classroom/i }).click()

  await expect(page).toHaveURL(/\/classroom\/sessions\/classroom-instant-/)
  await expect(page.getByRole('heading', { name: /classroom lobby/i })).toBeVisible()
  await expect(page.getByText(/live classroom help/i).first()).toBeVisible()
})

test('tutor can review classroom queue and open a tutor lobby', async ({ page }) => {
  await loginAs(page, 'tutor')

  await page.getByRole('link', { name: /open classroom queue/i }).click()
  await expect(page).toHaveURL(/\/tutor\/classroom$/)
  await expect(page.getByRole('heading', { name: /classroom queue/i })).toBeVisible()
  await expect(page.getByText(/live support requests/i)).toBeVisible()

  await page.getByRole('link', { name: /review context|open lobby/i }).first().click()
  await expect(page).toHaveURL(/\/tutor\/classroom\/sessions\/.+\/lobby/)
  await expect(page.getByRole('heading', { name: /prepare for classroom/i })).toBeVisible()
  await expect(page.getByText(/review the learning context before joining/i)).toBeVisible()
})

test('parent dashboard shows classroom visibility without observer controls', async ({ page }) => {
  await loginAs(page, 'parent')

  await expect(page.getByRole('heading', { name: /classroom visibility/i })).toBeVisible()
  await expect(page.getByText(/online classroom/i).first()).toBeVisible()
  await expect(page.getByText(/learning reports keep the classroom work connected to practice progress/i)).toBeVisible()
  await expect(page.getByRole('button', { name: /join classroom/i })).toHaveCount(0)
})
