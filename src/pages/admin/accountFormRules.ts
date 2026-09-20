import type { AccountRole } from '@/services/admin/accountsApi'

/**
 * Card 014: say why the button is dead.
 *
 * The console used to disable both openings on `!email.trim()` and stop there,
 * so an administrator who typed nothing — or typed an address the server would
 * refuse — saw a grey button and no reason. These rules mirror what the backend
 * refuses with, and every one of them has a phrase in all four languages.
 */
export type AccountFieldIssue =
  | 'role_required'
  | 'email_required'
  | 'email_invalid'
  | 'email_too_long'
  | 'name_too_long'
  | 'date_of_birth_invalid'

export type AccountDraft = {
  role: string
  email: string
  fullName: string
  dateOfBirth: string
}

export type AccountDraftIssues = {
  role?: AccountFieldIssue
  email?: AccountFieldIssue
  fullName?: AccountFieldIssue
  dateOfBirth?: AccountFieldIssue
}

export const PROVISIONABLE_ROLES: AccountRole[] = ['student', 'teacher', 'parent', 'admin']

export const EMAIL_MAX_LENGTH = 320
export const FULL_NAME_MAX_LENGTH = 120

const DATE_SHAPE = /^\d{4}-\d{2}-\d{2}$/

/** Strict `YYYY-MM-DD` that names a real day already past. */
export function isPastCalendarDate(value: string, today: Date = new Date()): boolean {
  if (!DATE_SHAPE.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const parsed = new Date(Date.UTC(year, month - 1, day))
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return false
  }
  const startOfToday = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  return parsed.getTime() < startOfToday
}

export function accountDraftIssues(draft: AccountDraft, today: Date = new Date()): AccountDraftIssues {
  const issues: AccountDraftIssues = {}

  if (!PROVISIONABLE_ROLES.includes(draft.role as AccountRole)) issues.role = 'role_required'

  const email = draft.email.trim()
  if (!email) issues.email = 'email_required'
  else if (email.length > EMAIL_MAX_LENGTH) issues.email = 'email_too_long'
  else if (!email.includes('@')) issues.email = 'email_invalid'

  if (draft.fullName.trim().length > FULL_NAME_MAX_LENGTH) issues.fullName = 'name_too_long'

  const dateOfBirth = draft.dateOfBirth.trim()
  if (dateOfBirth && !isPastCalendarDate(dateOfBirth, today)) {
    issues.dateOfBirth = 'date_of_birth_invalid'
  }

  return issues
}

/** Every issue standing between the draft and a request, in reading order. */
export function blockingIssues(draft: AccountDraft, today: Date = new Date()): AccountFieldIssue[] {
  const issues = accountDraftIssues(draft, today)
  return [issues.role, issues.email, issues.fullName, issues.dateOfBirth].filter(
    (issue): issue is AccountFieldIssue => Boolean(issue),
  )
}

/**
 * An unknown date of birth is not an empty one.
 *
 * The backend reads a missing field as "nobody asked" and an empty string as
 * "asked and the answer is nothing", which are different facts about a minor.
 */
export function accountDraftPayload(draft: AccountDraft) {
  const dateOfBirth = draft.dateOfBirth.trim()
  return {
    role: draft.role as AccountRole,
    email: draft.email.trim(),
    fullName: draft.fullName.trim(),
    dateOfBirth: dateOfBirth || undefined,
  }
}
