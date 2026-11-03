import { expect, test } from './support/fixtures'
import { ADMIN, signInAt, StaffWorld } from './support/staff'
import { photo } from './support/uploads'

/**
 * An `image_upload` case in the moderation queue, through the built app
 * (#538, stoa-backend#139): the image moderation refused is read with the
 * admin's token, drawn from an object URL, blurred until the admin asks to see
 * it, and named by what it was blocked for. A deleted image is said to be
 * deleted, and not asked for.
 */
const ADMIN_TOKEN = `e2e-${ADMIN.role}-access-token`

function imageCase(caseId: string, image: { status: 'stored' | 'deleted'; deletedAt?: string }) {
  return {
    case_id: caseId,
    status: 'open',
    reason: 'unsafe_content',
    severity: 'high',
    surface: 'image_upload',
    question_id: null,
    student_id: 'e2e-student-1',
    reporter_id: 'image-moderation',
    reporter_role: 'system',
    assigned_admin_id: null,
    report_note: null,
    resolution_note: null,
    created_at: '2026-10-30T09:15:01+00:00',
    updated_at: '2026-10-30T09:15:01+00:00',
    closed_at: null,
    question_context: null,
    image_context: {
      upload_id: 'e2e-upload-1',
      conversation_id: 'e2e-conversation-1',
      uploaded_at: '2026-10-30T09:15:00+00:00',
      uploader_id: 'e2e-student-1',
      uploader_role: 'student',
      media_type: 'image/png',
      size_bytes: 2048,
      hits: [{ label: 'Middle Finger', category: 'Rude Gestures', confidence: 97.3 }],
      image_status: image.status,
      image_deleted_at: image.deletedAt ?? null,
    },
    history: [],
  }
}

test('an admin sees the blocked image blurred, then clearly, with what it was blocked for', async ({
  page,
  backend,
}) => {
  new StaffWorld(backend, ADMIN).install()
  const item = imageCase('mod-upload-e2e-1', { status: 'stored' })
  backend.on('GET', '/admin/moderation/cases', () => ({ status: 200, body: { items: [item], count: 1 } }))
  backend.on('GET', '/admin/moderation/cases/{case_id}', () => ({ status: 200, body: item }))
  const picture = photo(64, 48)
  backend.on('GET', '/admin/moderation/cases/{case_id}/image', ({ headers, pathname }) =>
    headers.authorization === `Bearer ${ADMIN_TOKEN}` && pathname.endsWith('/mod-upload-e2e-1/image')
      ? { status: 200, raw: { contentType: 'image/png', bytes: picture } }
      : { status: 404 },
  )
  await signInAt(page, ADMIN, '/admin/moderation')

  await expect(page.getByRole('button', { name: /^mod-upload-e2e-1/ })).toContainText('Blocked image · Rude Gestures')
  const section = page.getByRole('region', { name: 'Blocked image' })
  const image = section.getByRole('img', { name: 'The image moderation blocked' })
  await expect(image).toBeVisible()
  // Drawn, not only named: the browser decoded what came back, from an object URL.
  await expect.poll(() => image.evaluate((img) => (img as unknown as { naturalWidth: number }).naturalWidth)).toBe(64)
  await expect(image).toHaveAttribute('src', /^blob:/)
  await expect(image).toHaveCSS('filter', /blur/)
  await expect(section.getByRole('listitem')).toContainText('Rude Gestures · Middle Finger')
  await expect(section.getByRole('listitem')).toContainText('97.3%')
  await expect(section).toContainText('e2e-conversation-1')

  await section.getByRole('button', { name: 'Show image' }).click()
  await expect(image).toHaveCSS('filter', 'none')
  expect(backend.callsTo('GET', '/admin/moderation/cases/{case_id}/image')).toHaveLength(1)
})

test('a deleted image is said to be deleted, and not asked for', async ({ page, backend }) => {
  new StaffWorld(backend, ADMIN).install()
  const item = imageCase('mod-upload-e2e-2', { status: 'deleted', deletedAt: '2026-12-01T03:00:00+00:00' })
  backend.on('GET', '/admin/moderation/cases', () => ({ status: 200, body: { items: [item], count: 1 } }))
  backend.on('GET', '/admin/moderation/cases/{case_id}', () => ({ status: 200, body: item }))
  await signInAt(page, ADMIN, '/admin/moderation')

  const section = page.getByRole('region', { name: 'Blocked image' })
  await expect(section.getByText(/^Image deleted on /)).toBeVisible()
  await expect(section.getByRole('img')).toHaveCount(0)
  await expect(section.getByRole('button', { name: 'Show image' })).toHaveCount(0)
  expect(backend.callsTo('GET', '/admin/moderation/cases/{case_id}/image')).toHaveLength(0)
})
