import { expect, test, type Page } from '@playwright/test'
import { loginAs } from './helpers'

const sampleImage = {
  name: 'sample-question.png',
  mimeType: 'image/png',
  buffer: Buffer.from('sample image content'),
}

const unsupportedFile = {
  name: 'notes.txt',
  mimeType: 'text/plain',
  buffer: Buffer.from('not supported'),
}

function oversizedPdf() {
  return {
    name: 'large-worksheet.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.alloc(11 * 1024 * 1024, 1),
  }
}

async function startChatConversation(page: Page) {
  await page.goto('/chat')
  await page.getByRole('textbox', { name: /first learning question/i }).fill('Can you help me with this worksheet?')
  await page.getByRole('button', { name: /start conversation/i }).click()
  await expect(page.getByRole('main').getByText(/worksheet/i).first()).toBeVisible()
  await expect(page.getByRole('button', { name: /attach file/i })).toBeEnabled()
}

test('chat upload preview can be removed and sent with a message', async ({ page }) => {
  await loginAs(page, 'student')
  await startChatConversation(page)

  const attachInput = page.locator('input[aria-label="Attach File"]').last()
  await attachInput.setInputFiles(sampleImage)
  await expect(page.getByText('sample-question.png').first()).toBeVisible()

  await page.getByRole('button', { name: /remove sample-question\.png/i }).click()
  await expect(page.getByText('sample-question.png')).toHaveCount(0)

  await attachInput.setInputFiles(sampleImage)
  await page.getByRole('textbox', { name: /learning question/i }).fill('Please explain the first step.')
  await page.getByRole('button', { name: /send message/i }).click()

  await expect(page.getByRole('main').getByText(/please explain the first step/i).first()).toBeVisible()
  await expect(page.getByRole('main').getByText('sample-question.png').first()).toBeVisible()
})

test('upload rejects unsupported and oversized files', async ({ page }) => {
  await loginAs(page, 'student')
  await startChatConversation(page)

  const attachInput = page.locator('input[aria-label="Attach File"]').last()
  await attachInput.setInputFiles(unsupportedFile)
  await expect(page.getByText(/not supported/i).first()).toBeVisible()

  await attachInput.setInputFiles(oversizedPdf())
  await expect(page.getByText(/too large|maximum file size/i).first()).toBeVisible()
})

test('practice library upload modal opens and supports keyboard close', async ({ page }) => {
  await loginAs(page, 'student')
  await page.goto('/question-bank')

  await page.getByRole('button', { name: /upload a question/i }).click()
  await expect(page.getByRole('dialog', { name: /upload a question/i })).toBeVisible()

  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: /upload a question/i })).toHaveCount(0)
})

test('question session upload can hand off to learning chat', async ({ page }) => {
  await loginAs(page, 'student')
  await page.goto('/question-bank/session/session-linear-equations-basics')

  await page.locator('input[aria-label="Attach File"]').last().setInputFiles(sampleImage)
  await expect(page.getByText('sample-question.png').first()).toBeVisible()

  await page.getByRole('button', { name: /ask learning assistant/i }).last().click()
  await expect(page).toHaveURL(/\/chat\?source=question-bank/)
  await expect(page.getByText(/uploaded learning material/i).first()).toBeVisible()
  await expect(page.getByText('sample-question.png').first()).toBeVisible()
})
