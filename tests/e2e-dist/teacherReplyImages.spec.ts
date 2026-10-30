import type { Locator, Page } from '@playwright/test'
import { ATTACHMENTS_WORK } from '../../src/features/ask/attachmentsSwitch'
import { expect, test } from './support/fixtures'
import { signInAsStudent } from './support/signIn'
import { signInAt, StaffWorld, TEACHER } from './support/staff'
import { ACCESS_TOKEN, StudentWorld } from './support/student'
import { photo, UploadDesk } from './support/uploads'

/**
 * A teacher's reply with a picture, through the built app (#513,
 * stoa-backend#145): it goes up the way a student's does, as
 * `help_reply_image`, and the reply names it by its upload id. The student
 * then sees it in Ask, read through their own attachment route.
 *
 * The button waits behind `ATTACHMENTS_WORK`, as the student's paperclip does
 * (#512); while it is off the picture goes into the chooser the button would
 * open, which is in the page either way.
 */
async function choosePicture(page: Page, form: Locator, file: { name: string; mimeType: string; buffer: Buffer }) {
  const button = form.getByRole('button', { name: 'Add picture' })
  if (!ATTACHMENTS_WORK) {
    await expect(button).toHaveCount(0)
    await form.locator('input[data-teacher-reply-images]').setInputFiles(file)
    return
  }
  const chooser = page.waitForEvent('filechooser')
  await button.click()
  await (await chooser).setFiles(file)
}

const REQUEST = {
  requestId: 'e2e-request-1',
  conversationId: 'e2e-conversation-1',
  student: { id: 'e2e-student-1', name: 'Mia Keller', grade: '8' },
  subject: 'mathematics',
  status: 'in_progress',
  messages: [
    {
      id: 'e2e-message-1',
      conversationId: 'e2e-conversation-1',
      role: 'student',
      content: 'I do not get step 2.',
      createdAt: '2026-10-30T08:00:00Z',
    },
  ],
  notes: [],
}

test('a teacher replies with a picture: it goes up as the reply picture, and the reply carries its upload id', async ({
  page,
  backend,
  contract,
}) => {
  // The purpose is one the backend's contract names (stoa-backend#145).
  expect(contract.enumOf('UploadPurpose')).toContain('help_reply_image')
  new StaffWorld(backend, TEACHER).install()
  const uploads = new UploadDesk(backend)
  await uploads.install(page)
  backend.on('GET', '/teachers/me/help-requests/{request_id}', () => ({ status: 200, body: REQUEST }))
  // The page's other panels, which this test does not look at.
  const none = () => ({ status: 404, body: { detail: 'Not Found' } })
  backend.on('GET', '/teachers/questions/{question_id}/assistance-summary', none)
  backend.on('GET', '/practice/curriculum/catalog', none)
  backend.on('POST', '/teachers/me/help-requests/{request_id}/notes', ({ body }) => {
    const { content } = body as { content: string }
    return {
      status: 200,
      body: {
        id: 'e2e-note-1',
        note: content,
        createdAt: '2026-10-30T08:05:00Z',
        teacher: { id: TEACHER.id, name: TEACHER.name },
        attachments: [
          {
            attachmentId: 'e2e-attachment-1',
            filename: 'sketch.jpg',
            mediaType: 'image/jpeg',
            sizeBytes: 2048,
            status: 'active',
            createdAt: '2026-10-30T08:05:00Z',
          },
        ],
      },
    }
  })
  await signInAt(page, TEACHER, `/teacher/requests/${REQUEST.requestId}`)

  const form = page.locator('form').filter({ has: page.getByLabel('Teacher reply') })
  await choosePicture(page, form, { name: 'sketch.png', mimeType: 'image/png', buffer: photo() })
  const tray = form.getByRole('list', { name: 'Attached pictures' })
  // Shrunk and written again as a JPEG in the browser before it went (#508).
  await expect(tray.getByText('sketch.jpg')).toBeVisible()
  await expect(tray.getByText('Adding…')).toHaveCount(0)

  const [intent] = backend.callsTo('POST', '/files/intents')
  expect(intent.body).toMatchObject({ purpose: 'help_reply_image', filename: 'sketch.jpg', contentType: 'image/jpeg' })
  expect(uploads.puts).toHaveLength(1)
  expect(uploads.puts[0].headers.authorization, 'the teacher’s token stays with the API').toBeUndefined()

  await form.getByLabel('Teacher reply').fill('Look at the sketch: the angle is 90°.')
  await form.getByRole('button', { name: 'Send reply' }).click()

  await expect.poll(() => backend.callsTo('POST', '/teachers/me/help-requests/{request_id}/notes').length).toBe(1)
  const [reply] = backend.callsTo('POST', '/teachers/me/help-requests/{request_id}/notes')
  expect(reply.body).toMatchObject({
    content: 'Look at the sketch: the angle is 90°.',
    attachmentIds: [{ uploadId: 'e2e-upload-1' }],
  })
  await expect(tray).toHaveCount(0)
})

test('the student sees the picture a teacher replied with, read through their own attachment', async ({
  page,
  backend,
}) => {
  const world = new StudentWorld(backend)
  world.install()
  const conversationId = 'e2e-conversation-teacher'
  world.conversations.set(conversationId, {
    id: conversationId,
    subject: 'mathematics',
    grade: '8',
    createdAt: '2026-10-30T08:00:00Z',
    messages: [
      { id: 'm1', conversationId, role: 'student', content: 'I do not get step 2.', createdAt: '2026-10-30T08:00:00Z' },
      {
        id: 'm2',
        conversationId,
        role: 'teacher',
        content: 'Look at the sketch: the angle is 90°.',
        createdAt: '2026-10-30T08:05:00Z',
        attachments: [
          {
            attachmentId: 'e2e-attachment-1',
            filename: 'sketch.jpg',
            mediaType: 'image/png',
            sizeBytes: 2048,
            status: 'active',
            createdAt: '2026-10-30T08:05:00Z',
          },
        ],
      },
    ],
  })
  const picture = photo(64, 48)
  backend.on('GET', '/files/attachments/{attachment_id}/content', ({ headers, pathname }) =>
    headers.authorization === `Bearer ${ACCESS_TOKEN}` && pathname.endsWith('/e2e-attachment-1/content')
      ? { status: 200, raw: { contentType: 'image/png', bytes: picture } }
      : { status: 404, body: { detail: 'Not Found' } },
  )
  await signInAsStudent(page)
  await page.goto(`/ask/${conversationId}`)

  const panel = page.getByRole('complementary', { name: 'Ask' })
  const pictures = panel.getByRole('list', { name: 'Pictures from the teacher' })
  const open = pictures.getByRole('button', { name: 'Enlarge picture: sketch.jpg' })
  await expect(open).toBeVisible()
  const thumbnail = open.getByRole('img')
  await expect(thumbnail).toHaveAttribute('alt', /: sketch\.jpg$/)
  // Drawn, not only named: the browser decoded what came back.
  await expect.poll(() => thumbnail.evaluate((img) => (img as unknown as { naturalWidth: number }).naturalWidth)).toBe(64)
  expect(backend.callsTo('GET', '/files/attachments/{attachment_id}/content')).toHaveLength(1)

  await open.click()
  await expect(page.getByRole('dialog').getByRole('heading', { name: 'sketch.jpg' })).toBeVisible()
})
