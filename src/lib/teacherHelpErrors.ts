/**
 * Say why a teacher request failed in the student's own words.
 *
 * The server answers a refused escalation with its own vocabulary — an
 * admission that is "safely recoverable" told a student nothing and read as a
 * fault in the product. Every failure is mapped to one sentence the student can
 * act on, and anything unrecognised falls back to the generic retry.
 */
import { ApiError } from '@/services/api/httpClient'

const KEY_BY_CODE: Record<string, string> = {
  teacher_support_not_included: 'teacher.errors.planDenied',
  teacher_support_allowance_exhausted: 'teacher.errors.allowanceExhausted',
  teacher_support_admission_recoverable: 'teacher.errors.temporary',
}

const KEY_BY_STATUS: Record<number, string> = {
  403: 'teacher.errors.planDenied',
  409: 'teacher.errors.alreadyOpen',
  429: 'teacher.errors.allowanceExhausted',
  502: 'teacher.errors.temporary',
  503: 'teacher.errors.temporary',
  504: 'teacher.errors.temporary',
}

/** Translation key in the `chat` namespace for a failed teacher request. */
export function teacherHelpErrorKey(error: unknown): string {
  if (!(error instanceof ApiError)) return 'teacher.errors.generic'

  const byCode = error.code ? KEY_BY_CODE[error.code] : undefined
  if (byCode) return byCode

  const byStatus = error.status ? KEY_BY_STATUS[error.status] : undefined
  return byStatus ?? 'teacher.errors.generic'
}

const WITHDRAW_KEY_BY_CODE: Record<string, string> = {
  teacher_help_already_accepted: 'ask.help.withdraw.errors.accepted',
  teacher_help_request_closed: 'ask.help.withdraw.errors.closed',
  teacher_help_request_not_found: 'ask.help.withdraw.errors.closed',
}

/**
 * Translation key in the `chat` namespace for a withdrawal the server refused
 * (#543): taken by a teacher, already over, or briefly unavailable (503
 * `teacher_help_withdrawal_unavailable`, or the gateway's 502/504). A 409
 * without a code it knows says the request could not be withdrawn.
 */
export function teacherHelpWithdrawErrorKey(error: unknown): string {
  if (!(error instanceof ApiError)) return 'ask.help.withdraw.errors.generic'
  const byCode = error.code ? WITHDRAW_KEY_BY_CODE[error.code] : undefined
  if (byCode) return byCode
  if (error.status === 502 || error.status === 503 || error.status === 504) return 'ask.help.withdraw.errors.unavailable'
  return 'ask.help.withdraw.errors.generic'
}
