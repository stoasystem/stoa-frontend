/**
 * Say why a tutor request failed in the student's own words.
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

/** Translation key in the `chat` namespace for a failed tutor request. */
export function teacherHelpErrorKey(error: unknown): string {
  if (!(error instanceof ApiError)) return 'teacher.errors.generic'

  const byCode = error.code ? KEY_BY_CODE[error.code] : undefined
  if (byCode) return byCode

  const byStatus = error.status ? KEY_BY_STATUS[error.status] : undefined
  return byStatus ?? 'teacher.errors.generic'
}
