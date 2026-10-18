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
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CurriculumPatchInput) => patchCurriculumDraft(input),
    onSuccess: (version) => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.curriculumWorklist() })
      void queryClient.invalidateQueries({
        queryKey: adminQueryKeys.curriculumPreview(version.publicLessonId, version.versionId),
      })
    },
  })
}

/**
 * After a review or publish step the worklist, the version's preview and its
 * audit trail all say something new. Nothing refreshed them, so an admin who
 * saw no change clicked again (#258).
 */
function useRefreshCurriculumVersion() {
  const queryClient = useQueryClient()
  return (publicLessonId: string, versionId: string) => {
    void queryClient.invalidateQueries({ queryKey: adminQueryKeys.curriculumWorklist() })
    void queryClient.invalidateQueries({ queryKey: adminQueryKeys.curriculumPreview(publicLessonId, versionId) })
    void queryClient.invalidateQueries({ queryKey: adminQueryKeys.curriculumAudit(publicLessonId) })
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
    onSuccess: (_data, { publicLessonId, versionId }) => refresh(publicLessonId, versionId),
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
    onSuccess: (evidence) => {
      void queryClient.invalidateQueries({
        queryKey: adminQueryKeys.curriculumMigrationEvidence(evidence.migrationId),
      })
    },
  })
}
