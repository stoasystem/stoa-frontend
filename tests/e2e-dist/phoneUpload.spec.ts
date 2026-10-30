import type { Page } from '@playwright/test'
import { encode } from 'uqr'
import { ATTACHMENTS_WORK } from '../../src/features/ask/attachmentsSwitch'
import { expect, test } from './support/fixtures'
import type { MockBackend } from './support/backend'
import { codeRefused, PhoneUploadDesk } from './support/phoneUploads'
import { signInAsStudent } from './support/signIn'
import { serveSite } from './support/site'
import { StudentWorld } from './support/student'
import { photo, UploadDesk } from './support/uploads'

/**
 * A photo from the phone into Ask on the computer, by QR, through the built
 * app (#514; stoa-backend#146). The phone's page needs no sign-in and runs
 * whatever `ATTACHMENTS_WORK` says; the button in Ask waits behind the switch
 * like the paperclip, so the computer's half checks it is absent while the
 * switch is off and runs whole once it is on.
 */

const SENT = 'Done! Go back to your computer: your photo is waiting there for you to add it.'
/** The modules of a QR for `text`, as Ask draws them. */
function qrPath(text: string) {
  let drawn = ''
  encode(text, { ecc: 'M', border: 4 }).data.forEach((row, y) =>
    row.forEach((dark, x) => {
      if (dark) drawn += `M${x} ${y}h1v1h-1z`
    }),
  )
  return drawn
}

const exercise = () => ({ name: 'IMG_0001.png', mimeType: 'image/png', buffer: photo() })

/** The phone: its own page on the site and the backend, with no session. */
async function onThePhone(page: Page, backend: MockBackend, desk: UploadDesk, url: string) {
  await backend.refuseEverythingElse(page)
  await serveSite(page, backend.problems)
  await backend.attach(page)
  await desk.answerS3(page)
  // What reaches any server: the address and the requests, never the fragment.
  const requested: string[] = []
  page.on('request', (request) => requested.push(request.url()))
  await page.goto(url)
  await page.locator('input[data-phone-picker]').setInputFiles(exercise())
  return requested
}

test('the phone spends the code once and sends the photo with the upload token, the code never in a URL', async ({
  page,
  backend,
}) => {
  const desk = new UploadDesk(backend)
  const phone = new PhoneUploadDesk(backend, desk)
  phone.install()

  const requested = await onThePhone(page, backend, desk, phone.phoneUrl)

  await expect(page.getByText(SENT)).toBeVisible()
  // Taken out of the address bar once read.
  await expect(page).toHaveURL(/\/upload$/)
  const secret = phone.code.split('.')[1]
  expect(requested.filter((url) => url.includes(secret)), 'the code in a URL').toEqual([])

  const [redeem, ...more] = backend.callsTo('POST', '/upload-codes/redeem')
  expect(more, 'redeemed twice').toEqual([])
  // Redeemed for the JPEG the phone made of the photo (#508).
  expect(redeem.body).toMatchObject({ code: phone.code, filename: 'IMG_0001.jpg', contentType: 'image/jpeg' })
  const later = [...backend.callsTo('POST', '/upload-codes/parts/{part_number}'), ...backend.callsTo('POST', '/upload-codes/complete')]
  expect(later).toHaveLength(2)
  for (const call of later) {
    expect(call.body).toMatchObject({ uploadToken: phone.token })
    expect(call.body).not.toHaveProperty('code')
  }
  for (const call of [redeem, ...later]) expect(call.headers.authorization, 'a session on the phone’s calls').toBeUndefined()
  expect(desk.puts).toHaveLength(1)
  expect(desk.puts[0].bytes.subarray(0, 2), 'a JPEG').toEqual(Buffer.from([0xff, 0xd8]))
  expect(phone.completed).toBe(true)
})

test('the phone says a code that expired or was used, and sends nothing', async ({ page, backend }) => {
  const desk = new UploadDesk(backend)
  const phone = new PhoneUploadDesk(backend, desk)
  phone.redeemRefusal = codeRefused()
  phone.install()

  await onThePhone(page, backend, desk, phone.phoneUrl)

  await expect(page.getByRole('alert')).toHaveText(
    'This code has expired or has already been used. Make a new one on your computer.',
  )
  expect(desk.puts).toHaveLength(0)
  expect(backend.callsTo('POST', '/upload-codes/parts/{part_number}')).toHaveLength(0)
})

test('Ask shows the code as a QR, and adds the phone’s photo only once the student says so', async ({
  page,
  backend,
  browser,
}) => {
  const world = new StudentWorld(backend)
  world.install()
  const desk = new UploadDesk(backend)
  await desk.install(page)
  const phone = new PhoneUploadDesk(backend, desk)
  phone.install()
  await phone.answerPreview(page)
  await signInAsStudent(page)

  // A code belongs to a conversation: the first question starts one.
  const panel = page.getByRole('complementary', { name: 'Ask' })
  const field = panel.getByRole('textbox', { name: 'Your question' })
  const first = 'What is the area of a circle with radius 2?'
  await page.getByRole('textbox', { name: 'Your question' }).fill(first)
  await field.press('Enter')
  const thread = panel.getByRole('log', { name: 'Messages' })
  await expect(thread.getByText(world.answerFor(first))).toBeVisible()

  const button = panel.getByRole('button', { name: 'Send a photo from your phone' })
  if (!ATTACHMENTS_WORK) {
    await expect(button).toHaveCount(0)
    expect(backend.callsTo('POST', '/conversations/{conv_id}/upload-codes')).toHaveLength(0)
    return
  }
  await button.click()
  const qr = panel.getByRole('img', { name: 'QR code to send a photo from your phone' })
  await expect(qr).toBeVisible()
  // What the phone's camera reads: the page's address, the code after its `#`.
  expect(await qr.locator('path').getAttribute('d')).toBe(qrPath(phone.phoneUrl))
  await expect(panel.getByText(/^Works for \d+:\d\d more$/)).toBeVisible()

  // A phone that is not signed in, as the QR would open it.
  const phoneContext = await browser.newContext({ viewport: { width: 390, height: 844 } })
  try {
    const phonePage = await phoneContext.newPage()
    await onThePhone(phonePage, backend, desk, phone.phoneUrl)
    await expect(phonePage.getByText(SENT)).toBeVisible()
  } finally {
    await phoneContext.close()
  }

  // Shown, read with the student's session, and not in the question until added.
  await expect(panel.getByRole('img', { name: 'The photo from your phone' })).toBeVisible()
  expect(phone.previews[0].authorization).toMatch(/^Bearer /)
  await expect(panel.getByRole('list', { name: 'Attached files' })).toHaveCount(0)
  await panel.getByRole('button', { name: 'Add photo' }).click()
  await expect(panel.getByRole('list', { name: 'Attached files' }).getByText('phone-photo.jpg')).toBeVisible()

  const question = 'Is my working on this right?'
  await field.fill(question)
  await field.press('Enter')
  await expect(thread.getByText(world.answerFor(question))).toBeVisible()
  const [sent] = backend.callsTo('POST', '/conversations/{conv_id}/messages/stream')
  expect(sent.body).toMatchObject({ content: question, attachmentIds: [{ uploadId: phone.uploadId }] })
})
