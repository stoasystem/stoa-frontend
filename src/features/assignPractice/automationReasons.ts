import type { TFunction } from 'i18next'
import { readsEnglish } from '@/lib/userFacingText'
import type { AutomationCandidate, AutomationExecutionResult } from '@/types/learningOperations'

/*
 * Why the practice automation proposes, refuses or did something, in the
 * teacher's language (#703). The backend sends each reason as a code beside
 * its English (stoa-backend#495, `message_catalog/assignment_automation.py`).
 * A code these locales know is translated; one the backend added later shows
 * its English to a reader of English and a plain sentence to anyone else, so
 * no backend English reaches a German, French or Italian page.
 */

export const RATIONALE_CODES = [
  'remediation_topic',
  'curriculum_exercise',
  'reviewed_ai_draft',
  'continuation_lesson',
] as const

export const REFUSAL_CODES = [
  'automation_off',
  'policy_paused',
  'student_out_of_scope',
  'source_type_not_allowed',
  'subject_out_of_scope',
  'topic_out_of_scope',
  'low_confidence',
  'stale_candidate',
  'duplicate_or_active',
  'review_boundary_missing',
  'max_assignments_reached',
  'unsupported_assignment_source',
  'source_not_assignable',
] as const

export const RESULT_CODES = ['created', 'not_approved', 'already_created', 'source_has_history', 'refused', 'failed'] as const

/** What a result's status means to the teacher, by the status the backend sends. */
export const RESULT_STATUSES = ['assigned', 'delivered', 'created', 'duplicate', 'skipped', 'refused', 'failed'] as const

const known = (codes: readonly string[], code: unknown): code is string => typeof code === 'string' && codes.includes(code)

function englishOr(sentence: string | null | undefined, fallback: string) {
  const text = (sentence ?? '').trim()
  return text && readsEnglish() ? text : fallback
}

/** The one sentence a candidate is proposed with. */
export function candidateReason(candidate: Pick<AutomationCandidate, 'rationaleCode' | 'type' | 'rationale'>, t: TFunction) {
  // The code is the candidate's type (stoa-backend#495); an older answer sent only the type.
  const code = candidate.rationaleCode ?? candidate.type
  if (known(RATIONALE_CODES, code)) return t(`teacher:assignPractice.reasons.rationale.${code}`)
  return englishOr(candidate.rationale, t('teacher:assignPractice.reasons.rationaleFallback'))
}

/** Why a candidate is not proposed. */
export function refusalReason(candidate: Pick<AutomationCandidate, 'refusalCode' | 'refusalReason'>, t: TFunction) {
  if (known(REFUSAL_CODES, candidate.refusalCode)) return t(`teacher:assignPractice.reasons.refusal.${candidate.refusalCode}`)
  return englishOr(candidate.refusalReason, t('teacher:assignPractice.reasons.refusalFallback'))
}

/**
 * What became of a ticked candidate. A refused or failed one says why it was
 * refused; the others say what happened.
 */
export function resultReason(result: Pick<AutomationExecutionResult, 'reasonCode' | 'refusalCode' | 'reason'>, t: TFunction) {
  if ((result.reasonCode === 'refused' || result.reasonCode === 'failed') && known(REFUSAL_CODES, result.refusalCode)) {
    return t(`teacher:assignPractice.reasons.refusal.${result.refusalCode}`)
  }
  if (known(RESULT_CODES, result.reasonCode)) return t(`teacher:assignPractice.reasons.result.${result.reasonCode}`)
  if (known(REFUSAL_CODES, result.refusalCode)) return t(`teacher:assignPractice.reasons.refusal.${result.refusalCode}`)
  return englishOr(result.reason, t('teacher:assignPractice.reasons.resultFallback'))
}

/** A result's status as a short label. */
export function resultStatusLabel(status: string, t: TFunction) {
  return known(RESULT_STATUSES, status)
    ? t(`teacher:assignPractice.resultStatus.${status}`)
    : t('teacher:assignPractice.resultStatus.unknown')
}

/** Whether a result put something in front of the student. */
export function resultCreatedWork(status: string) {
  return status === 'assigned' || status === 'delivered' || status === 'created'
}
