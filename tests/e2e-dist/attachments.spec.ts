import { createHash } from 'node:crypto'
import type { Locator, Page } from '@playwright/test'
import { ATTACHMENTS_WORK } from '../../src/features/ask/attachmentsSwitch'
import { expect, test } from './support/fixtures'
import { signInAsStudent } from './support/signIn'
import { StudentWorld } from './support/student'
import { photo, UploadDesk } from './support/uploads'

/**
 * A photo sent with a question, through the built app (#512). The + waits
 * behind `ATTACHMENTS_WORK` until a smoke run on production has sent one;
 * while it is off, the file goes into the chooser its menu would open, which
 * is in the page either way. Once it is on, the + opens its menu (#553) and
 * the menu's "Choose" opens the chooser: the same test then covers the
 * switch's wiring too.
 */
async function choosePhoto(page: Page, panel: Locator, file: { name: string; mimeType: string; buffer: Buffer }) {
  const add = panel.getByRole('button', { name: 'Add a photo' })
  if (!ATTACHMENTS_WORK) {
    await expect(add).toHaveCount(0)
    await panel.locator('input[type=file]:not([data-ask-camera])').setInputFiles(file)
    return
  }
  await add.click()
  const chooser = page.waitForEvent('filechooser')
  await panel.getByRole('menuitem', { name: 'Choose a photo or file' }).click()
  await (await chooser).setFiles(file)
}

const exercise = () => ({ name: 'exercise.png', mimeType: 'image/png', buffer: photo() })

test('a photo goes up straight to S3, and the question carries it by its upload id', async ({ page, backend }) => {
  const world = new StudentWorld(backend)
  world.install()
  const uploads = new UploadDesk(backend)
  await uploads.install(page)
  await signInAsStudent(page)
  await page.goto('/ask')

  const panel = page.getByRole('complementary', { name: 'Ask' })
  await choosePhoto(page, panel, exercise())
  const tray = panel.getByRole('list', { name: 'Attached files' })
  // Shrunk and written again as a JPEG in the browser before it went (#508).
  await expect(tray.getByText('exercise.jpg')).toBeVisible()
  await expect(tray.getByText('Adding…')).toHaveCount(0)

  const [intent] = backend.callsTo('POST', '/files/intents')
  expect(intent.body).toMatchObject({ purpose: 'conversation_attachment', filename: 'exercise.jpg', contentType: 'image/jpeg' })
  expect(uploads.puts).toHaveLength(1)
  const [put] = uploads.puts
  expect(put.bytes.subarray(0, 2), 'a JPEG').toEqual(Buffer.from([0xff, 0xd8]))
  expect(put.bytes.length).toBe((intent.body as { sizeBytes: number }).sizeBytes)
  expect(put.headers['x-amz-checksum-sha256']).toBe(createHash('sha256').update(put.bytes).digest('base64'))
  expect(put.headers.authorization, 'the student’s token stays with the API').toBeUndefined()
  expect(backend.callsTo('POST', '/files/{upload_id}/complete')[0].body).toEqual({ partCount: 1 })

  const question = 'What did I do wrong here?'
  await panel.getByRole('textbox', { name: 'Your question' }).fill(question)
  await panel.getByRole('textbox', { name: 'Your question' }).press('Enter')
  await expect(panel.getByRole('log', { name: 'Messages' }).getByText(world.answerFor(question))).toBeVisible()

  // `POST /conversations` takes no files: the conversation starts empty and the question is sent into it.
  expect(backend.callsTo('POST', '/conversations')[0].body).not.toHaveProperty('initialMessage')
  const [sent] = backend.callsTo('POST', '/conversations/{conv_id}/messages/stream')
  expect(sent.body).toMatchObject({ content: question, attachmentIds: [{ uploadId: 'e2e-upload-1' }] })
  await expect(tray).toHaveCount(0)
})

test('a picture image moderation refuses is said to be refused, and the question goes out without it', async ({
  page,
  backend,
  contract,
}) => {
  // The code the backend answers with is one its contract names (stoa-backend#138).
  expect(contract.enumOf('AttachmentErrorCode')).toContain('upload_content_blocked')
  const world = new StudentWorld(backend)
  world.install()
  const uploads = new UploadDesk(backend)
  uploads.verdict = 'upload_content_blocked'
  await uploads.install(page)
  await signInAsStudent(page)
  await page.goto('/ask')

  const panel = page.getByRole('complementary', { name: 'Ask' })
  await choosePhoto(page, panel, exercise())
  const row = panel.getByRole('list', { name: 'Attached files' }).getByRole('listitem')
  await expect(row.getByRole('alert')).toHaveText(
    'This picture cannot be sent. Choose a different one, or describe the question in words.',
  )
  await expect(row).toHaveAttribute('data-attachment-state', 'failed')
  // Moderation looks at what reached S3, at `complete`: the bytes went, the picture did not.
  expect(uploads.puts).toHaveLength(1)
  expect(backend.callsTo('POST', '/files/{upload_id}/complete')).toHaveLength(1)

  const question = 'A right triangle with legs 3 and 4: how long is the hypotenuse?'
  await panel.getByRole('textbox', { name: 'Your question' }).fill(question)
  await panel.getByRole('textbox', { name: 'Your question' }).press('Enter')
  await expect(panel.getByRole('log', { name: 'Messages' }).getByText(world.answerFor(question))).toBeVisible()
  expect(backend.callsTo('POST', '/conversations')[0].body).toMatchObject({ initialMessage: question })
  expect(backend.callsTo('POST', '/conversations/{conv_id}/messages/stream')).toHaveLength(0)
  // Still on screen with its reason: the student knows the picture did not go.
  await expect(row.getByRole('alert')).toBeVisible()
})
