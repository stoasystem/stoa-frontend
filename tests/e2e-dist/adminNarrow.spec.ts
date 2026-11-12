import fs from 'node:fs'
import path from 'node:path'
import type { Page } from '@playwright/test'
import type { MockBackend } from './support/backend'
import { expect, test } from './support/fixtures'
import { ADMIN, signInAt, StaffWorld } from './support/staff'

/**
 * Two admin pages at a phone's width (#640). A long id is one unbreakable
 * word: the usage key `student_… / day` pushed the account-support card to
 * 419 px, and the moderation case id `mod-…` widened the queue page to 531 px,
 * so both pages scrolled sideways at 375. Here they fit, and the id is still
 * there to read in full. The usage card is read in German, as in the walk-through
 * that found it: "Abgeglichen" is the badge wide enough to push the key out.
 */
const STUDENT_ID = 'student_a4e37a64453847fc9108ea35'
const CASE_ID = 'mod-818cd0b08d07488aa419660bf449a519'
const PHONE = { width: 375, height: 812 }
const SHOTS = process.env.STOA_E2E_SHOTS

const MATCHED = (
  JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname, '../../src/i18n/locales/de/admin.json'), 'utf8')) as {
    accountOperations: { usage: { matched: string } }
  }
).accountOperations.usage.matched

/** The administrator's account, read in German. */
function inGerman(backend: MockBackend) {
  const user = {
    id: ADMIN.id,
    name: ADMIN.name,
    email: ADMIN.email,
    role: ADMIN.role,
    preferredLocale: 'de',
    effectiveLocale: 'de',
    mustChangePassword: false,
  }
  const token = `e2e-${ADMIN.role}-access-token`
  backend.on('POST', '/auth/login', () => ({ status: 200, body: { accessToken: token, user } }))
  backend.on('GET', '/auth/me', ({ headers }) =>
    headers.authorization === `Bearer ${token}` ? { status: 200, body: user } : { status: 401, body: { detail: 'Not authenticated' } },
  )
}

async function pageWidth(page: Page) {
  return page.evaluate<number>('document.documentElement.scrollWidth')
}

async function shoot(page: Page, name: string) {
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true })
}

for (const viewport of [PHONE, { width: 1280, height: 900 }]) {
  test(`account support's usage card fits at ${viewport.width}`, async ({ page, backend }) => {
    await page.setViewportSize(viewport)
    new StaffWorld(backend, ADMIN).install()
    inGerman(backend)
    backend.on('GET', '/admin/users', () => ({
      status: 200,
      body: { items: [], count: 0, groups: {}, nextCursor: null },
    }))
    backend.on('GET', '/admin/account-operations/parents/{parent_id}', () => ({
      status: 200,
      body: {
        parentId: 'e2e-parent-1',
        supportState: { state: 'ready', blockers: [], warnings: [] },
        parent: { userId: 'e2e-parent-1', role: 'parent', name: 'Paula Meier', email: 'paula.meier@example.test' },
        billing: { status: 'none', events: [] },
        children: [],
        usage: [
          {
            studentId: STUDENT_ID,
            quotaPeriod: '2026-11-10',
            action: 'question_submission',
            consumed: 1,
            limit: 5,
            remaining: 4,
            unreconciled: false,
          },
        ],
      },
    }))
    await signInAt(page, ADMIN, '/admin/account-operations?parentId=e2e-parent-1')

    const key = page.getByText(`${STUDENT_ID} / 2026-11-10`)
    await expect(key).toBeVisible()
    expect(await pageWidth(page)).toBe(viewport.width)
    await key.scrollIntoViewIfNeeded()
    // The badge beside the key is whole, not cut off at the right edge.
    await expect(page.getByText(MATCHED, { exact: true })).toBeInViewport({ ratio: 1 })
    await shoot(page, `account-operations-${viewport.width}`)
  })

  test(`the moderation queue fits at ${viewport.width}`, async ({ page, backend }) => {
    await page.setViewportSize(viewport)
    new StaffWorld(backend, ADMIN).install()
    const item = {
      case_id: CASE_ID,
      status: 'open',
      reason: 'abuse',
      severity: 'high',
      surface: 'question',
      question_id: 'e2e-question-1',
      student_id: 'e2e-student-1',
      reporter_id: 'e2e-teacher-1',
      reporter_role: 'teacher',
      assigned_admin_id: null,
      report_note: 'Reported from the help queue',
      resolution_note: null,
      created_at: '2026-11-10T09:15:01+00:00',
      updated_at: '2026-11-10T09:15:01+00:00',
      closed_at: null,
      question_context: null,
      image_context: null,
      history: [],
    }
    backend.on('GET', '/admin/moderation/cases', () => ({ status: 200, body: { items: [item], count: 1 } }))
    backend.on('GET', '/admin/moderation/cases/{case_id}', () => ({ status: 200, body: item }))
    await signInAt(page, ADMIN, '/admin/moderation')

    const queued = page.getByRole('button', { name: new RegExp(`^${CASE_ID}`) })
    await expect(queued).toBeVisible()
    expect(await pageWidth(page)).toBe(viewport.width)
    await expect(queued.getByTitle(CASE_ID)).toHaveText(CASE_ID)
    await shoot(page, `moderation-queue-${viewport.width}`)

    await queued.click()
    await expect(page.getByText(`Case ${CASE_ID}`)).toBeVisible()
    expect(await pageWidth(page)).toBe(viewport.width)
    await shoot(page, `moderation-case-${viewport.width}`)
  })
}
