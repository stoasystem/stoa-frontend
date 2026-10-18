import type { TFunction } from 'i18next'
import { ApiError, SESSION_UNREACHABLE } from '@/services/api/httpClient'

/**
 * What the curriculum console says when a request fails, in the reader's
 * language and addressed formally (Sie / vous): every reader here is staff.
 *
 * The backend's own message is English, or a bare code such as
 * `migration_confirmation_mismatch`; the panel used to show it as it came, so a
 * German administrator read raw codes, and a 403 on publish looked like any
 * other failure (#260). The phrase is chosen by the backend's code first, then
 * by the status, and never taken from `error.message`.
 *
 * Shared by every curriculum action, so the review and publish flow (#258)
 * says the same thing for the same refusal.
 */

/** Codes the curriculum endpoints answer with, each with its own phrase. */
const CODE_KEYS = {
  curriculum_capability_required: 'curriculum.errors.code.curriculum_capability_required',
  stale_pointer: 'curriculum.errors.code.stale_pointer',
  active_assignments_block_archive: 'curriculum.errors.code.active_assignments_block_archive',
  curriculum_version_not_found: 'curriculum.errors.code.curriculum_version_not_found',
  curriculum_unit_not_found: 'curriculum.errors.code.curriculum_unit_not_found',
  validation_failed: 'curriculum.errors.code.validation_failed',
  draft_not_editable: 'curriculum.errors.code.draft_not_editable',
  not_reviewable: 'curriculum.errors.code.not_reviewable',
  not_in_review: 'curriculum.errors.code.not_in_review',
  not_approved: 'curriculum.errors.code.not_approved',
  rollback_target_not_publishable: 'curriculum.errors.code.rollback_target_not_publishable',
  migration_confirmation_mismatch: 'curriculum.errors.code.migration_confirmation_mismatch',
  migration_not_ready: 'curriculum.errors.code.migration_not_ready',
  migration_not_found: 'curriculum.errors.code.migration_not_found',
  invalid_manifest: 'curriculum.errors.code.invalid_manifest',
  [SESSION_UNREACHABLE]: 'curriculum.errors.code.session_unreachable',
} as const

export type CurriculumErrorCode = keyof typeof CODE_KEYS

const BARE_CODE = /^[a-z][a-z0-9_]*$/

/**
 * The backend's code for this failure, if it sent one.
 *
 * It sends it two ways: as `{detail: {code}}`, which the shared client reads
 * into `code`, and as a bare string `{detail: "stale_pointer"}`, which only
 * reaches `detail`.
 */
export function curriculumErrorCode(error: unknown): string | undefined {
  if (!(error instanceof ApiError)) return undefined
  if (error.code) return error.code
  if (typeof error.detail === 'string' && BARE_CODE.test(error.detail)) return error.detail
  return undefined
}

function statusKey({ status, transportCode }: ApiError) {
  // No answer at all: the request never reached the server, or timed out.
  if (status === undefined) return transportCode ? 'curriculum.errors.status.network' : 'curriculum.requestFailed'
  if (status === 401) return 'curriculum.errors.status.unauthorized'
  if (status === 403) return 'curriculum.errors.status.forbidden'
  if (status === 404) return 'curriculum.errors.status.notFound'
  if (status === 409) return 'curriculum.errors.status.conflict'
  if (status === 400 || status === 422) return 'curriculum.errors.status.invalid'
  if (status === 429) return 'curriculum.errors.status.tooMany'
  if (status >= 500) return 'curriculum.errors.status.server'
  return 'curriculum.requestFailed'
}

/** One sentence for a failed curriculum request, `t` bound to the `admin` namespace. */
export function curriculumErrorMessage(error: unknown, t: TFunction): string {
  if (!(error instanceof ApiError)) return t('curriculum.requestFailed')
  const code = curriculumErrorCode(error)
  if (code && code in CODE_KEYS) return t(CODE_KEYS[code as CurriculumErrorCode])
  return t(statusKey(error))
}
