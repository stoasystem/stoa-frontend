import type { Page } from '@playwright/test'
import { expect, test } from './support/fixtures'
import { signInAt, StaffWorld, TEACHER } from './support/staff'
import { photo } from './support/uploads'

/**
 * A teacher opens a help request and reads the preparation table first
 * (#704, stoa-backend#517): the first question, the last one before asking
 * for help, every upload, the related stars. The whole conversation is folded
 * under it, and "Show in conversation" opens it on that message. The detail
 * the mock serves is held to the backend's OpenAPI document, so the four
 * fields are the contract's; nothing runs off a phone's width.
 *
 * `STOA_E2E_SHOTS=<dir>` also saves the page at desktop and phone width.
 */
const PHONE = { width: 375, height: 812 }
const DESKTOP = { width: 1280, height: 900 }
const REQUEST_ID = 'e2e-request-704'
const CONVERSATION_ID = 'e2e-conversation-704'

const upload = (attachmentId: string, filename: string) => ({
  attachmentId,
  filename,
  mediaType: 'image/png',
  sizeBytes: 2048,
  status: 'active',
  createdAt: '2026-11-19T08:00:00Z',
})

const message = (id: string, role: string, content: string, minute: number, attachments: unknown[] = []) => ({
  id,
  conversationId: CONVERSATION_ID,
  role,
  content,
  createdAt: `2026-11-19T08:${String(minute).padStart(2, '0')}:00Z`,
  attachments,
})

const NOTEBOOK = upload('att-notebook', 'notebook.png')
const SKETCH = upload('att-sketch', 'sketch.png')

const DETAIL = {
  requestId: REQUEST_ID,
  conversationId: CONVERSATION_ID,
  student: { id: 'e2e-student-704', name: 'Mia Keller', grade: 'grade_8_secondary' },
  subject: 'math',
  status: 'in_progress',
  mode: 'text',
  requestMessage: 'I still do not get it.',
  messages: [
    message('m-1', 'student', 'How do I simplify 18/24? This is from my notebook.', 0, [NOTEBOOK]),
    message('m-2', 'assistant', 'Divide the numerator and the denominator by their greatest common divisor, 6: **18/24 = 3/4**.', 1),
    message('m-3', 'student', 'Why 6 and not 2? Here is my sketch.', 3, [SKETCH]),
    message('m-4', 'assistant', 'Dividing by 2 works too, but you would have to divide again: 9/12, then 3/4.', 4),
  ],
  notes: [],
  firstQuestion: {
    messageId: 'm-1',
    content: 'How do I simplify 18/24? This is from my notebook.',
    createdAt: '2026-11-19T08:00:00Z',
    attachments: [NOTEBOOK],
  },
  lastQuestion: {
    messageId: 'm-3',
    content: 'Why 6 and not 2? Here is my sketch.',
    createdAt: '2026-11-19T08:03:00Z',
    attachments: [SKETCH],
  },
  uploads: [NOTEBOOK, SKETCH],
  askedStars: [
    { unitId: 'unit-simplify', title: 'Simplify fractions' },
    { unitId: 'unit-gcd', title: 'Greatest common divisor' },
  ],
}

async function shoot(page: Page, name: string) {
  const dir = process.env.STOA_E2E_SHOTS
  if (dir) await page.screenshot({ path: `${dir}/${name}.png`, fullPage: true })
}

for (const [label, viewport] of [['desktop', DESKTOP], ['phone', PHONE]] as const) {
  test(`a teacher reads the preparation table, then opens the conversation on the last question (${label})`, async ({ page, backend }) => {
    await page.setViewportSize(viewport)
    new StaffWorld(backend, TEACHER).install()
    const picture = photo()
    backend.on('GET', '/teachers/me/help-requests', () => ({ status: 200, body: { items: [] } }))
    backend.on('GET', '/teachers/me/help-requests/{request_id}', () => ({ status: 200, body: DETAIL }))
    backend.on('GET', '/teachers/me/help-requests/{request_id}/attachments/{attachment_id}/content', () => ({
      status: 200,
      raw: { contentType: 'image/png', bytes: picture },
    }))
    backend.on('GET', '/practice/curriculum/catalog', () => ({
      status: 200,
      body: { subjects: [], topics: [], units: [], lessons: [], rolloutSubjects: [], includePreview: true, source: 'e2e' },
    }))

    await signInAt(page, TEACHER, `/teacher/requests/${REQUEST_ID}`)

    const table = page.getByRole('region', { name: 'Preparation' })
    await expect(table.getByText('First question')).toBeVisible()
    await expect(table.getByText('How do I simplify 18/24? This is from my notebook.')).toBeVisible()
    await expect(table.getByText('Last question before asking for help')).toBeVisible()
    await expect(table.getByText('Why 6 and not 2? Here is my sketch.')).toBeVisible()
    await expect(table.getByRole('listitem').filter({ hasText: 'Simplify fractions' })).toBeVisible()
    await expect(table.getByRole('listitem').filter({ hasText: 'Greatest common divisor' })).toBeVisible()
    // Every upload, drawn once: under Uploads, not again on its question.
    await expect(table.getByRole('img')).toHaveCount(2)

    // The conversation is folded: the AI's answers are not on the page yet.
    const answer = page.getByText('Dividing by 2 works too', { exact: false })
    await expect(answer).toBeHidden()
    await shoot(page, `704-${label}-table`)

    await table.getByRole('button', { name: 'Show in conversation' }).nth(1).click()
    await expect(answer).toBeVisible()
    await expect(page.locator('#help-message-m-3')).toBeFocused()
    await expect(page.locator('#help-message-m-3')).toBeInViewport()

    // Nothing runs off the side of a phone.
    const overflow = (await page.evaluate('document.documentElement.scrollWidth - document.documentElement.clientWidth')) as number
    expect(overflow).toBeLessThanOrEqual(0)
    await shoot(page, `704-${label}-conversation`)
  })
}
