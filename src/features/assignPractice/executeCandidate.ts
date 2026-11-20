import type { AutomationCandidate } from '@/types/learningOperations'

/*
 * A previewed candidate as the execute call takes it back (#703). The
 * backend's `AssignmentAutomationCandidateRequest` names its fields, and its
 * OpenAPI document allows no others: the preview's `rationaleCode`,
 * `freshness` or `refusalCode` are not part of it. A field the preview left
 * empty is left out, so the backend's default applies rather than a null it
 * refuses (`confidence` is a string). The backend reads each candidate again
 * from its own preview; these fields only have to match it.
 */
const EXECUTE_FIELDS = [
  'candidateId',
  'type',
  'sourceType',
  'sourceId',
  'title',
  'subject',
  'topicId',
  'topicIds',
  'confidence',
  'rationale',
  'expectedImpact',
  'reviewStatus',
  'proposedStatus',
  'dueAt',
  'sourceSignals',
  'reviewRequired',
  'autonomousDecision',
] as const satisfies readonly (keyof AutomationCandidate)[]

export type ExecuteCandidate = Pick<AutomationCandidate, (typeof EXECUTE_FIELDS)[number]> & { approved: boolean }

export function toExecuteCandidate(candidate: AutomationCandidate, approved: boolean): ExecuteCandidate {
  const out: Record<string, unknown> = { approved }
  for (const field of EXECUTE_FIELDS) {
    const value = candidate[field]
    if (value !== null && value !== undefined) out[field] = value
  }
  return out as ExecuteCandidate
}
