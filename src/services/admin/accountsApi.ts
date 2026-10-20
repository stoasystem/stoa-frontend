import { apiPath } from '@/services/api/apiPath'
import { httpClient } from '@/services/api/httpClient'

import type { UserRole } from '@/types/user'

export type AccountRole = 'student' | 'teacher' | 'parent' | 'admin'
export type AccountStatus = 'invited' | 'active' | 'suspended' | 'archived'

export type AccountLink = {
  userId: string
  accountNumber: string
  status: string
}

export type AccountRow = {
  userId: string
  accountNumber: string
  name?: string
  email?: string
  role: UserRole
  accountStatus: AccountStatus
  /** Derived server-side from the stored date of birth, which is never sent here. */
  isMinor: boolean
  /** Whether a date of birth is on file at all; false means nobody ever said. */
  minorKnown?: boolean
  createdAt: string
  lastLoginAt: string
  linkedAccounts: AccountLink[]
  /** Present only while the account is `invited` and a live invitation exists. */
  invitationId?: string
}

export type AccountListResponse = {
  items: AccountRow[]
  count: number
  groups: Record<string, number>
  nextCursor: string | null
}

export type AccountListFilters = {
  role?: string
  status?: string
  q?: string
  createdFrom?: string
  createdTo?: string
  cursor?: string
  limit?: number
}

export type AccountInvitationResponse = {
  userId: string
  role: AccountRole
  accountNumber: string
  email: string
  accountStatus: AccountStatus
  invitationId: string
  activationToken: string
  expiresAt: string
  invitationDelivered: boolean
  replacedInvitationId?: string
}

export type AccountAssignmentResponse = {
  userId: string
  role: AccountRole
  accountNumber: string
  email: string
  accountStatus: AccountStatus
  initialPassword: string
}

export type AccountPasswordResetResponse = {
  userId: string
  temporaryPassword: string
  mustChangePasswordAtNextSignIn: boolean
}

export type AccountStatusResponse = {
  userId: string
  accountStatus: AccountStatus
  previousStatus: AccountStatus
}

/** Requests behind one call to `listAccounts`, so a heavy table cannot hang it. */
export const MAX_ACCOUNT_PAGES = 20

const ZURICH = 'Europe/Zurich'

/** Milliseconds Zurich is ahead of UTC at `instant` (+1 h in winter, +2 h in summer). */
function zurichOffset(instant: number) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: ZURICH,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(instant))
  const part = (type: string) => Number(parts.find((item) => item.type === type)?.value)
  const wall = Date.UTC(part('year'), part('month') - 1, part('day'), part('hour'), part('minute'), part('second'))
  return wall - Math.floor(instant / 1000) * 1000
}

/** The UTC instant at which the Zurich calendar day `YYYY-MM-DD` begins, or null for anything else. */
function zurichMidnight(day: string, plusDays = 0) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day)
  if (!match) return null
  const wall = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]) + plusDays)
  // Twice: the offset at the guess can differ from the offset at the answer
  // on the two nights a year the clocks change.
  const first = wall - zurichOffset(wall)
  return wall - zurichOffset(first)
}

/** `2026-10-19T22:00:00` — no suffix, so every stored timestamp of that second or later sorts at or after it. */
function utcStamp(instant: number) {
  return new Date(instant).toISOString().slice(0, 19)
}

/**
 * The `created_from` / `created_to` the server compares as strings (#335).
 *
 * The picker hands over a day, `2026-10-20`, and the server compares it with
 * stored timestamps such as `2026-10-20T09:15:00.123456+00:00`. As a "to"
 * bound the bare day sorts before every timestamp of that day, so "created
 * up to 20 October" left out everything created on the 20th. Both ends are
 * now the edges of the Zurich day, the day the administrator means, in UTC:
 * from its first second, to its last microsecond.
 */
export function createdRangeParams(createdFrom?: string, createdTo?: string) {
  const start = createdFrom ? zurichMidnight(createdFrom) : null
  const end = createdTo ? zurichMidnight(createdTo, 1) : null
  return {
    created_from: start === null ? createdFrom || undefined : utcStamp(start),
    created_to: end === null ? createdTo || undefined : `${utcStamp(end - 1000)}.999999+00:00`,
  }
}

type ListOptions = {
  signal?: AbortSignal
  /** Carry on from this continuation key, with a fresh budget ("load more"). */
  after?: string
}

async function accountPage(filters: AccountListFilters, cursor: string | undefined, signal?: AbortSignal) {
  const response = await httpClient.get<AccountListResponse>('/admin/users', {
    params: {
      role: filters.role || undefined,
      status: filters.status || undefined,
      q: filters.q || undefined,
      ...createdRangeParams(filters.createdFrom, filters.createdTo),
      cursor: cursor || filters.cursor || undefined,
      limit: filters.limit || undefined,
    },
    signal,
  })
  return response.data
}

/**
 * Every account, not the first page of them.
 *
 * The endpoint answers from a table scan, so a page is rows read rather than
 * accounts found, and it hands back a continuation key whenever it stopped
 * early. This console has no pagination: it groups whatever it is given and
 * says how many are in each group. Reading one page and stopping meant the
 * numbers were wrong and some accounts were simply absent - on a table where
 * audit rows outnumber profiles, the administrator's own account was on page
 * two and nowhere on screen.
 *
 * The walk still stops after `MAX_ACCOUNT_PAGES` requests. When it does, the
 * key it stopped at comes back as `nextCursor`, and the caller has to say the
 * list is incomplete (#335); `after` carries on from there.
 */
export async function listAccounts(filters: AccountListFilters = {}, options: ListOptions = {}) {
  const { signal, after } = options
  const first = await accountPage(filters, after, signal)
  // An explicit cursor asks for one page and means it.
  if (filters.cursor || !first.nextCursor) return first

  const items = [...first.items]
  const groups: Record<string, number> = { ...first.groups }
  let cursor: string | null = first.nextCursor

  for (let page = 1; page < MAX_ACCOUNT_PAGES && cursor; page += 1) {
    const next: AccountListResponse = await accountPage(filters, cursor, signal)
    items.push(...next.items)
    for (const [role, count] of Object.entries(next.groups)) {
      groups[role] = (groups[role] ?? 0) + count
    }
    cursor = next.nextCursor
  }

  return { items, count: items.length, groups, nextCursor: cursor }
}

export async function inviteAccount(input: {
  role: AccountRole
  email: string
  fullName?: string
  dateOfBirth?: string
  locale?: string
}) {
  const response = await httpClient.post<AccountInvitationResponse>('/admin/users/invitations', {
    role: input.role,
    email: input.email,
    fullName: input.fullName ?? '',
    dateOfBirth: input.dateOfBirth || undefined,
    locale: input.locale,
  })
  return response.data
}

export async function assignAccount(input: {
  role: AccountRole
  email: string
  fullName?: string
  dateOfBirth?: string
}) {
  const response = await httpClient.post<AccountAssignmentResponse>('/admin/users', {
    role: input.role,
    email: input.email,
    fullName: input.fullName ?? '',
    dateOfBirth: input.dateOfBirth || undefined,
  })
  return response.data
}

export async function reissueInvitation(input: { invitationId: string; locale?: string }) {
  const response = await httpClient.post<AccountInvitationResponse>(
    apiPath`/admin/users/invitations/${input.invitationId}/reissue`,
    { locale: input.locale },
  )
  return response.data
}

export async function revokeInvitation(invitationId: string) {
  const response = await httpClient.delete<{ invitationId: string; status: string }>(
    apiPath`/admin/users/invitations/${invitationId}`,
  )
  return response.data
}

export async function resetAccountPassword(input: { userId: string; reason: string }) {
  const response = await httpClient.post<AccountPasswordResetResponse>(
    apiPath`/admin/users/${input.userId}/password-reset`,
    { reason: input.reason },
  )
  return response.data
}

export async function changeAccountStatus(input: {
  userId: string
  status: Exclude<AccountStatus, 'invited'>
  reason: string
}) {
  const response = await httpClient.post<AccountStatusResponse>(
    apiPath`/admin/users/${input.userId}/status`,
    { status: input.status, reason: input.reason },
  )
  return response.data
}

export async function updateAccountProfile(input: {
  userId: string
  name?: string
  grade?: string
  school?: string
}) {
  const response = await httpClient.patch<{ user_id: string }>(apiPath`/admin/users/${input.userId}`, {
    name: input.name,
    grade: input.grade,
    school: input.school,
  })
  return response.data
}

export async function assignParentLink(input: {
  parentId: string
  studentId: string
  relationship?: string
}) {
  const response = await httpClient.post<Record<string, unknown>>('/admin/users/parent-links', {
    parent_id: input.parentId,
    student_id: input.studentId,
    relationship: input.relationship ?? 'child',
  })
  return response.data
}

export type TeacherSupportAllowance = {
  studentId: string
  weeklyCases: number
  /** `default` when nobody has set one, `administrator` once somebody has. */
  source: 'default' | 'administrator'
  default: number
  maximum: number
}

export async function readTeacherSupportAllowance(studentId: string) {
  const response = await httpClient.get<TeacherSupportAllowance>(
    apiPath`/admin/teacher-support/allowances/${studentId}`,
  )
  return response.data
}

export async function setTeacherSupportAllowance(input: {
  studentId: string
  weeklyCases: number
  reason: string
}) {
  const response = await httpClient.put<TeacherSupportAllowance & { stateVersion: number }>(
    apiPath`/admin/teacher-support/allowances/${input.studentId}`,
    { weekly_cases: input.weeklyCases, reason: input.reason },
  )
  return response.data
}

export type InvitationClaimResponse = {
  status: string
  userId: string
  role: AccountRole
  accountNumber: string
}

/** Public counterpart of the invitation command: unauthenticated and rate limited. */
export async function claimInvitation(input: {
  token: string
  password: string
  dateOfBirth?: string
}) {
  const response = await httpClient.post<InvitationClaimResponse>('/auth/invitations/claim', {
    token: input.token,
    password: input.password,
    // Only sent when supplied: an invitation that already carries a date of
    // birth keeps the one the administrator recorded.
    dateOfBirth: input.dateOfBirth || undefined,
  })
  return response.data
}
