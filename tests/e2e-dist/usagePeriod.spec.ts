// Not imported from src: this suite's tsconfig has no `@/` paths, and a
// mock that reused the console's own arithmetic could not catch it being wrong.
type Unit = 'months' | 'days'
type Role = 'student' | 'parent' | 'teacher' | 'admin'
type PeriodRecord = {
  recordId: string
  recordedAt: string
  actorId: string
  kind: 'extend' | 'set'
  unit: Unit | null
  amount: number | null
  previousEndsOn: string | null
  newEndsOn: string
  source: 'paid' | 'gifted' | null
  paymentReference: string | null
  note: string | null
  reason: string | null
  subscriptionTier: string | null
}

const DAY_MS = 86_400_000
const utc = (day: string) => new Date(`${day}T00:00:00Z`)
const iso = (date: Date) => date.toISOString().slice(0, 10)

/** Today in Zurich, as the backend counts. */
function zurichToday() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Zurich', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
}

function addDays(day: string, days: number) {
  return iso(new Date(utc(day).getTime() + days * DAY_MS))
}

/** stoa-backend `usage_period.extended_end`: from the later of today and the end; a short month ends on its last day. */
function extendedEnd(current: string | null, today: string, unit: Unit, amount: number) {
  const start = current !== null && current > today ? current : today
  if (unit === 'days') return addDays(start, amount)
  const from = utc(start)
  const index = from.getUTCMonth() + amount
  const year = from.getUTCFullYear() + Math.floor(index / 12)
  const month = index % 12
  const last = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  return iso(new Date(Date.UTC(year, month, Math.min(from.getUTCDate(), last))))
}

function stateOn(endsOn: string | null, today: string) {
  return endsOn === null ? 'none' : today <= endsOn ? 'active' : 'expired'
}

import type { BackendRequest } from './support/backend'
import { expect, test } from './support/fixtures'
import { ADMIN, signInAt, StaffWorld } from './support/staff'

/**
 * An administrator sets a student's usage period through the built app
 * (#614, stoa-backend#342): from the users list to the account's period, a
 * paid extension, a changed end date that another administrator got to first,
 * and the account in the list of periods that ended. Every request body is
 * checked against the backend's OpenAPI document, whose request models refuse
 * any field they do not name.
 */
const TOKEN = `e2e-${ADMIN.role}-access-token`
const STUDENT_ID = 'e2e-student-1'
const OTHER_ADMIN_ID = 'e2e-admin-2'

function row(userId: string, name: string, role: Role, accountNumber: string) {
  return {
    userId,
    accountNumber,
    name,
    email: `${userId}@example.test`,
    role,
    accountStatus: 'active',
    isMinor: false,
    minorKnown: true,
    createdAt: '2026-10-01T09:00:00+00:00',
    lastLoginAt: '2026-11-01T09:00:00+00:00',
    linkedAccounts: [],
  }
}

/** One student's period as the backend keeps it. */
class Period {
  endsOn: string | null = null
  version = 0
  records: PeriodRecord[] = []

  write(actorId: string, fields: Partial<PeriodRecord> & Pick<PeriodRecord, 'kind' | 'newEndsOn'>) {
    const record: PeriodRecord = {
      recordId: `rec-${this.records.length + 1}`,
      recordedAt: new Date().toISOString(),
      actorId,
      unit: null,
      amount: null,
      previousEndsOn: this.endsOn,
      source: null,
      paymentReference: null,
      note: null,
      reason: null,
      subscriptionTier: 'standard',
      ...fields,
    }
    this.endsOn = record.newEndsOn
    this.version += 1
    this.records.unshift(record)
    return record
  }

  account() {
    return {
      userId: STUDENT_ID,
      role: 'student',
      endsOn: this.endsOn,
      state: stateOn(this.endsOn, zurichToday()),
      version: this.version,
    }
  }
}

const conflict = {
  status: 409,
  body: {
    detail: {
      code: 'usage_period_version_conflict',
      message: 'The usage period changed in the meantime. Reload and try again.',
      correlationId: 'e2e-correlation',
    },
  },
}

test('an administrator extends a student’s period, changes its end, and finds it among the ended ones', async ({
  page,
  backend,
}) => {
  new StaffWorld(backend, ADMIN).install()
  const period = new Period()
  const signedIn = (request: BackendRequest) => request.headers.authorization === `Bearer ${TOKEN}`
  const denied = { status: 401, body: { detail: 'Not authenticated' } }

  backend.on('GET', '/admin/users', (request) => {
    if (!signedIn(request)) return denied
    const items = [
      row(ADMIN.id, ADMIN.name, 'admin', 'A26-0001'),
      { ...row(STUDENT_ID, 'Lea Muster', 'student', 'S26-0001'), usagePeriodEndsAt: period.endsOn },
    ]
    return { status: 200, body: { items, count: items.length, groups: { admin: 1, student: 1 }, nextCursor: null } }
  })
  backend.on('GET', '/admin/users/{user_id}/usage-period', (request) => {
    if (!signedIn(request)) return denied
    return {
      status: 200,
      body: {
        ...period.account(),
        effective: { endsOn: period.endsOn, state: period.account().state, paidBy: period.endsOn ? 'self' : null, parentId: null },
        records: period.records,
        nextPageToken: null,
      },
    }
  })
  backend.on('POST', '/admin/users/{user_id}/usage-period/extensions', (request) => {
    if (!signedIn(request)) return denied
    const body = request.body as { unit: 'months' | 'days'; amount: number; source: 'paid' | 'gifted'; paymentReference?: string; note?: string; expectedVersion: number }
    if (body.expectedVersion !== period.version) return conflict
    const record = period.write(ADMIN.id, {
      kind: 'extend',
      unit: body.unit,
      amount: body.amount,
      source: body.source,
      paymentReference: body.paymentReference ?? null,
      note: body.note ?? null,
      newEndsOn: extendedEnd(period.endsOn, zurichToday(), body.unit, body.amount),
    })
    return { status: 200, body: { ...period.account(), record } }
  })
  backend.on('PUT', '/admin/users/{user_id}/usage-period', (request) => {
    if (!signedIn(request)) return denied
    const body = request.body as { endsOn: string; reason: string; expectedVersion: number }
    if (body.expectedVersion !== period.version) return conflict
    const record = period.write(ADMIN.id, { kind: 'set', newEndsOn: body.endsOn, reason: body.reason })
    return { status: 200, body: { ...period.account(), record } }
  })
  backend.on('GET', '/admin/usage-periods', (request) => {
    if (!signedIn(request)) return denied
    const today = zurichToday()
    const within = Number(request.query.get('endingWithinDays') ?? 14)
    const listed =
      period.endsOn !== null && period.endsOn >= addDays(today, -30) && period.endsOn <= addDays(today, within)
    const items = listed
      ? [{ userId: STUDENT_ID, accountNumber: 'S26-0001', name: 'Lea Muster', role: 'student', endsOn: period.endsOn, state: period.account().state, children: [] }]
      : []
    return { status: 200, body: { items, count: items.length, endingWithinDays: within } }
  })

  // The users list leads to the student's period.
  await signInAt(page, ADMIN, '/admin/users')
  const student = page.getByRole('row').filter({ hasText: 'Lea Muster' })
  await expect(page.getByRole('columnheader', { name: 'Period ends' })).toBeVisible()
  await student.getByRole('link', { name: /Usage period/ }).click()
  await expect(page).toHaveURL(`/admin/users/${STUDENT_ID}/usage-period`)
  await expect(page.getByRole('heading', { name: 'Lea Muster (S26-0001)' })).toBeVisible()
  await expect(page.getByText('No period').first()).toBeVisible()

  // A paid extension: whole months and the offline payment's reference.
  await page.getByLabel('How many').fill('3')
  await page.getByLabel('Payment reference (required)').fill('RF18 5390 0754')
  await page.getByRole('button', { name: 'Extend', exact: true }).click()
  await expect(page.getByText(/^Extended\. The period now ends on/)).toBeVisible()
  expect(backend.callsTo('POST', '/admin/users/{user_id}/usage-period/extensions').map((call) => call.body)).toEqual([
    { unit: 'months', amount: 3, source: 'paid', paymentReference: 'RF18 5390 0754', expectedVersion: 0 },
  ])
  const extended = page.getByRole('row').filter({ hasText: 'RF18 5390 0754' })
  await expect(extended).toContainText('Ada Rossi (A26-0001)')
  await expect(extended).toContainText('3 months')
  await expect(extended).toContainText('Paid')

  // Another administrator gives a month before this one changes the end date.
  period.write(OTHER_ADMIN_ID, { kind: 'extend', unit: 'months', amount: 1, source: 'gifted', newEndsOn: extendedEnd(period.endsOn, zurichToday(), 'months', 1) })
  const ended = addDays(zurichToday(), -3)
  await page.getByLabel('New end date').fill(ended)
  await page.getByLabel('Reason (required)').fill('refund agreed')
  await page.getByRole('button', { name: 'Change end date…' }).click()
  await expect(page.getByText(/That day has already passed, so the period ends at once/)).toBeVisible()
  await page.getByRole('button', { name: 'Change end date', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Someone else changed this period a moment ago')
  // Read again: the other administrator's record is there, and what was typed stays.
  await expect(page.getByRole('row').filter({ hasText: OTHER_ADMIN_ID })).toContainText('Gifted')
  await expect(page.getByLabel('Reason (required)')).toHaveValue('refund agreed')

  await page.getByRole('button', { name: 'Change end date…' }).click()
  await page.getByRole('button', { name: 'Change end date', exact: true }).click()
  await expect(page.getByText(/^The end date is now/)).toBeVisible()
  expect(backend.callsTo('PUT', '/admin/users/{user_id}/usage-period').map((call) => call.body)).toEqual([
    { endsOn: ended, reason: 'refund agreed', expectedVersion: 1 },
    { endsOn: ended, reason: 'refund agreed', expectedVersion: 2 },
  ])
  await expect(page.getByRole('row').filter({ hasText: 'refund agreed' })).toContainText('End date changed')
  await expect(page.getByText('Expired').first()).toBeVisible()

  // The ended period is among those to follow up.
  await page.getByRole('link', { name: 'Periods ending soon' }).click()
  await expect(page).toHaveURL('/admin/usage-periods')
  const listed = page.getByRole('row').filter({ hasText: 'Lea Muster' })
  await expect(listed).toContainText('Expired')
  await expect(listed).toContainText('ended 3 days ago')
  await listed.getByRole('link', { name: 'S26-0001' }).click()
  await expect(page).toHaveURL(`/admin/users/${STUDENT_ID}/usage-period`)
})
