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
const MAX_ACCOUNT_PAGES = 20

async function accountPage(filters: AccountListFilters, cursor?: string) {
  const response = await httpClient.get<AccountListResponse>('/admin/users', {
    params: {
      role: filters.role || undefined,
      status: filters.status || undefined,
      q: filters.q || undefined,
      created_from: filters.createdFrom || undefined,
      created_to: filters.createdTo || undefined,
      cursor: cursor || filters.cursor || undefined,
      limit: filters.limit || undefined,
    },
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
 */
export async function listAccounts(filters: AccountListFilters = {}) {
  const first = await accountPage(filters)
  // An explicit cursor asks for one page and means it.
  if (filters.cursor || !first.nextCursor) return first

  const items = [...first.items]
  const groups: Record<string, number> = { ...first.groups }
  let cursor: string | null = first.nextCursor

  for (let page = 1; page < MAX_ACCOUNT_PAGES && cursor; page += 1) {
    const next: AccountListResponse = await accountPage(filters, cursor)
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
    `/admin/users/invitations/${input.invitationId}/reissue`,
    { locale: input.locale },
  )
  return response.data
}

export async function revokeInvitation(invitationId: string) {
  const response = await httpClient.delete<{ invitationId: string; status: string }>(
    `/admin/users/invitations/${invitationId}`,
  )
  return response.data
}

export async function resetAccountPassword(input: { userId: string; reason: string }) {
  const response = await httpClient.post<AccountPasswordResetResponse>(
    `/admin/users/${input.userId}/password-reset`,
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
    `/admin/users/${input.userId}/status`,
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
  const response = await httpClient.patch<{ user_id: string }>(`/admin/users/${input.userId}`, {
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
