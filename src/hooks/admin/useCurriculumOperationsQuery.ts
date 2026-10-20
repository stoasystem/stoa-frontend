import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  applyCurriculumMigration,
  approveCurriculumVersion,
  dryRunCurriculumMigration,
  getCurriculumAudit,
  getCurriculumDiff,
  getCurriculumMigrationEvidence,
  getCurriculumPreview,
  getCurriculumValidationPreview,
  getCurriculumWorklist,
  patchCurriculumDraft,
  publishCurriculumVersion,
  requestCurriculumChanges,
  submitCurriculumReview,
} from '@/services/admin/curriculumApi'
import { adminQueryKeys } from '@/services/admin/adminQueryKeys'
import type {
  CurriculumMigrationApplyInput,
  CurriculumPatchInput,
  CurriculumPublishInput,
  CurriculumReviewNoteInput,
} from '@/types/curriculumOperations'

export function useCurriculumWorklistQuery(status?: string) {
  return useQuery({
    queryKey: adminQueryKeys.curriculumWorklist(status),
    queryFn: () => getCurriculumWorklist(status),
    retry: false,
  })
}

export function useCurriculumPreviewQuery(publicLessonId?: string, versionId?: string) {
  return useQuery({
    queryKey: adminQueryKeys.curriculumPreview(publicLessonId ?? '', versionId ?? ''),
    queryFn: () => getCurriculumPreview(publicLessonId as string, versionId as string),
    enabled: Boolean(publicLessonId && versionId),
    retry: false,
  })
}

export function useCurriculumValidationQuery(publicLessonId?: string, versionId?: string, enabled = false) {
  return useQuery({
    queryKey: adminQueryKeys.curriculumValidation(publicLessonId ?? '', versionId ?? ''),
    queryFn: () => getCurriculumValidationPreview(publicLessonId as string, versionId as string),
    enabled: Boolean(enabled && publicLessonId && versionId),
    retry: false,
  })
}

export function useCurriculumAuditQuery(publicLessonId?: string, enabled = false) {
  return useQuery({
    queryKey: adminQueryKeys.curriculumAudit(publicLessonId ?? ''),
    queryFn: () => getCurriculumAudit(publicLessonId as string),
    enabled: Boolean(enabled && publicLessonId),
    retry: false,
  })
}

export function useCurriculumDiffQuery(
  publicLessonId?: string,
  fromVersionId?: string,
  toVersionId?: string,
  enabled = false,
) {
  return useQuery({
    queryKey: adminQueryKeys.curriculumDiff(publicLessonId ?? '', fromVersionId ?? '', toVersionId ?? ''),
    queryFn: () => getCurriculumDiff(publicLessonId as string, fromVersionId as string, toVersionId as string),
    enabled: Boolean(enabled && publicLessonId && fromVersionId && toVersionId),
    retry: false,
  })
}

export function useCurriculumMigrationEvidenceQuery(migrationId?: string, enabled = false) {
  return useQuery({
    queryKey: adminQueryKeys.curriculumMigrationEvidence(migrationId ?? ''),
    queryFn: () => getCurriculumMigrationEvidence(migrationId as string),
    enabled: Boolean(enabled && migrationId),
    retry: false,
  })
}

export function usePatchCurriculumDraftMutation() {
  const refresh = useRefreshCurriculumVersion()
  return useMutation({
    mutationFn: (input: CurriculumPatchInput) => patchCurriculumDraft(input),
    onSuccess: (_version, { publicLessonId, versionId }) => refresh(publicLessonId, versionId, { content: true }),
  })
}

/**
 * After a write to a version the worklist, the version's preview and its
 * audit trail all say something new. Nothing refreshed them, so an admin who
 * saw no change clicked again (#258). A write that changes the content also
 * changes the version's validation and every diff of the lesson; a patch left
 * them showing the verdict from before the fix (#404).
 */
function useRefreshCurriculumVersion() {
  const queryClient = useQueryClient()
  return (publicLessonId: string, versionId: string, { content = false } = {}) => {
    void queryClient.invalidateQueries({ queryKey: adminQueryKeys.curriculumWorklistAll() })
    void queryClient.invalidateQueries({ queryKey: adminQueryKeys.curriculumPreview(publicLessonId, versionId) })
    void queryClient.invalidateQueries({ queryKey: adminQueryKeys.curriculumAudit(publicLessonId) })
    if (!content) return
    void queryClient.invalidateQueries({ queryKey: adminQueryKeys.curriculumValidation(publicLessonId, versionId) })
    void queryClient.invalidateQueries({ queryKey: adminQueryKeys.curriculumDiffsOf(publicLessonId) })
  }
}

export function useSubmitCurriculumReviewMutation() {
  const refresh = useRefreshCurriculumVersion()
  return useMutation({
    mutationFn: ({ publicLessonId, versionId }: { publicLessonId: string; versionId: string }) =>
      submitCurriculumReview(publicLessonId, versionId),
    onSuccess: (_data, { publicLessonId, versionId }) => refresh(publicLessonId, versionId),
  })
}

export function useApproveCurriculumVersionMutation() {
  const refresh = useRefreshCurriculumVersion()
  return useMutation({
    mutationFn: ({ publicLessonId, versionId }: { publicLessonId: string; versionId: string }) =>
      approveCurriculumVersion(publicLessonId, versionId),
    onSuccess: (_data, { publicLessonId, versionId }) => refresh(publicLessonId, versionId),
  })
}

export function useRequestCurriculumChangesMutation() {
  const refresh = useRefreshCurriculumVersion()
  return useMutation({
    mutationFn: (input: CurriculumReviewNoteInput) => requestCurriculumChanges(input),
    onSuccess: (_data, { publicLessonId, versionId }) => refresh(publicLessonId, versionId),
  })
}

export function usePublishCurriculumVersionMutation() {
  const refresh = useRefreshCurriculumVersion()
  return useMutation({
    mutationFn: (input: CurriculumPublishInput) => publishCurriculumVersion(input),
    // A refusal counts too: the backend writes `publish_refused` to the audit,
    // and a 409 stale_pointer means the worklist's live version is out of
    // date, so the next publish read from it would be refused again (#404).
    onSettled: (_data, _error, { publicLessonId, versionId }) => refresh(publicLessonId, versionId),
  })
}

export function useDryRunCurriculumMigrationMutation() {
  return useMutation({
    mutationFn: (manifest: Record<string, unknown>) => dryRunCurriculumMigration(manifest),
  })
}

export function useApplyCurriculumMigrationMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CurriculumMigrationApplyInput) => applyCurriculumMigration(input),
    // An apply writes versions, live pointers and audit entries for any lesson
    // in the manifest, so everything the console has read may be out of date:
    // with `publish: true` the worklist kept the old live version and the next
    // publish was refused with stale_pointer. The backend writes one row at a
    // time, so a refusal part-way leaves the earlier rows written (#404).
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.curriculumAll() })
    },
  })
}
