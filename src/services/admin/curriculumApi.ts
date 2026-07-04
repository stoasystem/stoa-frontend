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

const noRedirectFor403 = (status: number) => status < 500

function isForbidden(status?: number) {
  return status === 403
}

function apiErrorFromStatus(status: number, detail: unknown) {
  const message =
    typeof detail === 'string'
      ? detail
      : detail && typeof detail === 'object' && 'detail' in detail && typeof detail.detail === 'string'
        ? detail.detail
        : 'Curriculum operation failed'
  return new ApiError(message, { status, detail })
}

export async function getCurriculumWorklist(status?: string) {
  const response = await httpClient.get<CurriculumWorklistResponse>('/admin/curriculum/worklist', {
    params: status ? { status } : undefined,
    validateStatus: noRedirectFor403,
  })
  if (isForbidden(response.status)) {
    return { items: [], count: 0, permissionDenied: true }
  }
  if (response.status >= 400) {
    throw apiErrorFromStatus(response.status, response.data)
  }
  return response.data
}

export async function getCurriculumPreview(publicLessonId: string, versionId: string) {
  const response = await httpClient.get<CurriculumVersion>(
    `/admin/curriculum/lessons/${publicLessonId}/preview`,
    { params: { versionId } },
  )
  return response.data
}

export async function patchCurriculumDraft(input: CurriculumPatchInput) {
  const response = await httpClient.patch<CurriculumVersion>(
    `/admin/curriculum/lessons/${input.publicLessonId}/drafts/${input.versionId}`,
    input.payload,
    { validateStatus: noRedirectFor403 },
  )
  if (response.status >= 400) throw apiErrorFromStatus(response.status, response.data)
  return response.data
}

export async function getCurriculumValidationPreview(publicLessonId: string, versionId: string) {
  const response = await httpClient.post<CurriculumValidationPreview>(
    `/admin/curriculum/lessons/${publicLessonId}/drafts/${versionId}/validation-preview`,
    undefined,
    { validateStatus: noRedirectFor403 },
  )
  if (response.status >= 400) throw apiErrorFromStatus(response.status, response.data)
  return response.data
}

export async function getCurriculumDiff(publicLessonId: string, fromVersionId: string, toVersionId: string) {
  const response = await httpClient.get<CurriculumDiffResponse>(
    `/admin/curriculum/lessons/${publicLessonId}/diff`,
    {
      params: { fromVersionId, toVersionId },
      validateStatus: noRedirectFor403,
    },
  )
  if (response.status >= 400) throw apiErrorFromStatus(response.status, response.data)
  return response.data
}

export async function getCurriculumAudit(publicLessonId: string) {
  const response = await httpClient.get<CurriculumAuditResponse>(
    `/admin/curriculum/lessons/${publicLessonId}/audit`,
    { validateStatus: noRedirectFor403 },
  )
  if (isForbidden(response.status)) {
    return { publicLessonId, items: [], count: 0, permissionDenied: true }
  }
  if (response.status >= 400) throw apiErrorFromStatus(response.status, response.data)
  return response.data
}

export async function submitCurriculumReview(publicLessonId: string, versionId: string) {
  const response = await httpClient.post<CurriculumVersion>(
    `/admin/curriculum/lessons/${publicLessonId}/drafts/${versionId}/submit-review`,
    undefined,
    { validateStatus: noRedirectFor403 },
  )
  if (response.status >= 400) throw apiErrorFromStatus(response.status, response.data)
  return response.data
}

export async function approveCurriculumVersion(publicLessonId: string, versionId: string) {
  const response = await httpClient.post<CurriculumVersion>(
    `/admin/curriculum/lessons/${publicLessonId}/drafts/${versionId}/approve`,
    undefined,
    { validateStatus: noRedirectFor403 },
  )
  if (response.status >= 400) throw apiErrorFromStatus(response.status, response.data)
  return response.data
}

export async function requestCurriculumChanges(input: CurriculumReviewNoteInput) {
  const response = await httpClient.post<CurriculumVersion>(
    `/admin/curriculum/lessons/${input.publicLessonId}/drafts/${input.versionId}/request-changes`,
    { reason: input.reason },
    { validateStatus: noRedirectFor403 },
  )
  if (response.status >= 400) throw apiErrorFromStatus(response.status, response.data)
  return response.data
}

export async function publishCurriculumVersion(input: CurriculumPublishInput) {
  const response = await httpClient.post(
    `/admin/curriculum/lessons/${input.publicLessonId}/publish`,
    {
      versionId: input.versionId,
      expectedPublishedVersionId: input.expectedPublishedVersionId ?? null,
      reason: input.reason,
    },
    { validateStatus: noRedirectFor403 },
  )
  if (response.status >= 400) throw apiErrorFromStatus(response.status, response.data)
  return response.data
}

export async function dryRunCurriculumMigration(manifest: Record<string, unknown>) {
  const response = await httpClient.post<CurriculumMigrationDryRunResponse>(
    '/admin/curriculum/migrations/dry-run',
    manifest,
    { validateStatus: noRedirectFor403 },
  )
  if (response.status >= 400) throw apiErrorFromStatus(response.status, response.data)
  return response.data
}

export async function applyCurriculumMigration(input: CurriculumMigrationApplyInput) {
  const response = await httpClient.post<CurriculumMigrationEvidenceResponse>(
    `/admin/curriculum/migrations/${input.migrationId}/apply`,
    { manifest: input.manifest, confirmationToken: input.confirmationToken },
    { validateStatus: noRedirectFor403 },
  )
  if (response.status >= 400) throw apiErrorFromStatus(response.status, response.data)
  return response.data
}

export async function getCurriculumMigrationEvidence(migrationId: string) {
  const response = await httpClient.get<CurriculumMigrationEvidenceResponse>(
    `/admin/curriculum/migrations/${migrationId}`,
    { validateStatus: noRedirectFor403 },
  )
  if (isForbidden(response.status)) {
    return { migrationId, status: 'forbidden', source: {}, summary: emptySummary(), rows: [], permissionDenied: true }
  }
  if (response.status >= 400) throw apiErrorFromStatus(response.status, response.data)
  return response.data
}

function emptySummary() {
  return { total: 0, creates: 0, updates: 0, skips: 0, conflicts: 0, errors: 0 }
}
