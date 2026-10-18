import { apiPath } from '@/services/api/apiPath'
import { ApiError, httpClient } from '@/services/api/httpClient'
import type {
  CurriculumAuditResponse,
  CurriculumDiffResponse,
  CurriculumMigrationApplyInput,
  CurriculumMigrationDryRunResponse,
  CurriculumMigrationEvidenceResponse,
  CurriculumPatchInput,
  CurriculumPublishInput,
  CurriculumReviewNoteInput,
  CurriculumValidationPreview,
  CurriculumVersion,
  CurriculumWorklistResponse,
} from '@/types/curriculumOperations'

/**
 * A read the backend refused with 403 answers "you may not see this" instead
 * of failing, so the page can say which capability is missing.
 *
 * Only 403, and only on these reads. Every other failure goes through the
 * shared client's error path: a 401 renews the session and retries, and the
 * error keeps its status, code and detail. These calls used to resolve every
 * 4xx themselves, which skipped the renewal and lost the code (#260).
 */
async function orPermissionDenied<T, D>(read: () => Promise<{ data: T }>, denied: D): Promise<T | D> {
  try {
    return (await read()).data
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) return denied
    throw error
  }
}

export async function getCurriculumWorklist(status?: string) {
  return orPermissionDenied(
    () => httpClient.get<CurriculumWorklistResponse>('/admin/curriculum/worklist', {
      params: status ? { status } : undefined,
    }),
    { items: [], count: 0, permissionDenied: true },
  )
}

export async function getCurriculumPreview(publicLessonId: string, versionId: string) {
  const response = await httpClient.get<CurriculumVersion>(
    apiPath`/admin/curriculum/lessons/${publicLessonId}/preview`,
    { params: { versionId } },
  )
  return response.data
}

export async function patchCurriculumDraft(input: CurriculumPatchInput) {
  const response = await httpClient.patch<CurriculumVersion>(
    apiPath`/admin/curriculum/lessons/${input.publicLessonId}/drafts/${input.versionId}`,
    input.payload,
  )
  return response.data
}

export async function getCurriculumValidationPreview(publicLessonId: string, versionId: string) {
  const response = await httpClient.post<CurriculumValidationPreview>(
    apiPath`/admin/curriculum/lessons/${publicLessonId}/drafts/${versionId}/validation-preview`,
    undefined,
  )
  return response.data
}

export async function getCurriculumDiff(publicLessonId: string, fromVersionId: string, toVersionId: string) {
  const response = await httpClient.get<CurriculumDiffResponse>(
    apiPath`/admin/curriculum/lessons/${publicLessonId}/diff`,
    { params: { fromVersionId, toVersionId } },
  )
  return response.data
}

export async function getCurriculumAudit(publicLessonId: string) {
  return orPermissionDenied(
    () => httpClient.get<CurriculumAuditResponse>(apiPath`/admin/curriculum/lessons/${publicLessonId}/audit`),
    { publicLessonId, items: [], count: 0, permissionDenied: true },
  )
}

export async function submitCurriculumReview(publicLessonId: string, versionId: string) {
  const response = await httpClient.post<CurriculumVersion>(
    apiPath`/admin/curriculum/lessons/${publicLessonId}/drafts/${versionId}/submit-review`,
    undefined,
  )
  return response.data
}

export async function approveCurriculumVersion(publicLessonId: string, versionId: string) {
  const response = await httpClient.post<CurriculumVersion>(
    apiPath`/admin/curriculum/lessons/${publicLessonId}/drafts/${versionId}/approve`,
    undefined,
  )
  return response.data
}

export async function requestCurriculumChanges(input: CurriculumReviewNoteInput) {
  const response = await httpClient.post<CurriculumVersion>(
    apiPath`/admin/curriculum/lessons/${input.publicLessonId}/drafts/${input.versionId}/request-changes`,
    { reason: input.reason },
  )
  return response.data
}

export async function publishCurriculumVersion(input: CurriculumPublishInput) {
  const response = await httpClient.post(
    apiPath`/admin/curriculum/lessons/${input.publicLessonId}/publish`,
    {
      versionId: input.versionId,
      expectedPublishedVersionId: input.expectedPublishedVersionId ?? null,
      reason: input.reason,
    },
  )
  return response.data
}

export async function dryRunCurriculumMigration(manifest: Record<string, unknown>) {
  const response = await httpClient.post<CurriculumMigrationDryRunResponse>(
    '/admin/curriculum/migrations/dry-run',
    manifest,
  )
  return response.data
}

export async function applyCurriculumMigration(input: CurriculumMigrationApplyInput) {
  const response = await httpClient.post<CurriculumMigrationEvidenceResponse>(
    apiPath`/admin/curriculum/migrations/${input.migrationId}/apply`,
    { manifest: input.manifest, confirmationToken: input.confirmationToken },
  )
  return response.data
}

export async function getCurriculumMigrationEvidence(migrationId: string) {
  return orPermissionDenied(
    () => httpClient.get<CurriculumMigrationEvidenceResponse>(apiPath`/admin/curriculum/migrations/${migrationId}`),
    { migrationId, status: 'forbidden', source: {}, summary: emptySummary(), rows: [], permissionDenied: true },
  )
}

function emptySummary() {
  return { total: 0, creates: 0, updates: 0, skips: 0, conflicts: 0, errors: 0 }
}
