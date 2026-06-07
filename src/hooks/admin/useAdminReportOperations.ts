import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  bulkResendReportEmails,
  cancelRecoveryJob,
  applyReportArtifactEditPreview,
  applyReportArtifactRollbackPreview,
  applyReportEditDraft,
  createReportArtifactEditPreview,
  createReportArtifactRollbackPreview,
  createReportEditDraft,
  createGenerationRetryRecoveryJob,
  createAuditRetentionManifest,
  createResendRecoveryJob,
  createResumeRecoveryJob,
  createSupportHandoffPackage,
  getRecoveryEvidenceExport,
  getAuditRetentionStatus,
  getRecoveryJobAuditEvents,
  getRecoveryJobResults,
  getRecoveryJobSupportPackage,
  getReleaseFixtureStatus,
  getRecoveryJobs,
  getReportAuditEvents,
  getReportOperationDetail,
  getReportOperations,
  validateReleaseEvidence,
  previewGenerationRetryRecoveryJob,
  previewResendRecoveryJob,
  previewResumeRecoveryJob,
  resendReportEmail,
  retryReportGeneration,
  type ReportArtifactEditApplyInput,
  type ReportArtifactEditPreviewInput,
  type ReportArtifactRollbackApplyInput,
  type ReportArtifactRollbackPreviewInput,
  type ReportEditApplyInput,
  type ReportEditDraftInput,
  type ReportOperationTarget,
  type ReportOperationsListFilters,
  type SupportHandoffPackageInput,
  type RecoveryEvidenceExportParams,
  type AuditRetentionManifestInput,
  type AuditRetentionReference,
} from '@/services/admin/adminApi'
import { adminQueryKeys } from '@/services/admin/adminQueryKeys'

export function useReportOperationsQuery(filters: ReportOperationsListFilters) {
  return useQuery({
    queryKey: [...adminQueryKeys.reportOperations(), filters],
    queryFn: () => getReportOperations(filters),
    retry: false,
  })
}

export function useReportOperationDetailQuery(target: ReportOperationTarget | null) {
  return useQuery({
    queryKey: [...adminQueryKeys.reportOperations(), 'detail', target],
    queryFn: () => getReportOperationDetail(target as ReportOperationTarget),
    enabled: Boolean(target),
    retry: false,
  })
}

export function useReportAuditEventsQuery(target: ReportOperationTarget | null) {
  return useQuery({
    queryKey: [...adminQueryKeys.reportOperations(), 'audit', target],
    queryFn: () => getReportAuditEvents(target as ReportOperationTarget),
    enabled: Boolean(target),
    retry: false,
  })
}

export function useRecoveryJobsQuery() {
  return useQuery({
    queryKey: adminQueryKeys.reportRecoveryJobs(),
    queryFn: getRecoveryJobs,
    retry: false,
  })
}

export function useRecoveryJobResultsQuery(jobId: string | null) {
  return useQuery({
    queryKey: [...adminQueryKeys.reportRecoveryJobs(), jobId, 'results'],
    queryFn: () => getRecoveryJobResults(jobId as string),
    enabled: Boolean(jobId),
    retry: false,
  })
}

export function useRecoveryJobAuditEventsQuery(jobId: string | null) {
  return useQuery({
    queryKey: [...adminQueryKeys.reportRecoveryJobs(), jobId, 'audit'],
    queryFn: () => getRecoveryJobAuditEvents(jobId as string),
    enabled: Boolean(jobId),
    retry: false,
  })
}

export function useRecoveryEvidenceExportMutation() {
  return useMutation({
    mutationFn: (params: RecoveryEvidenceExportParams) => getRecoveryEvidenceExport(params),
  })
}

export function useAuditRetentionStatusMutation() {
  return useMutation({
    mutationFn: (input: { references: AuditRetentionReference[]; limit?: number }) => getAuditRetentionStatus(input),
  })
}

export function useAuditRetentionManifestMutation() {
  return useMutation({
    mutationFn: (input: AuditRetentionManifestInput) => createAuditRetentionManifest(input),
  })
}

export function useReleaseEvidenceValidationMutation() {
  return useMutation({ mutationFn: validateReleaseEvidence })
}

export function useReleaseFixtureStatusMutation() {
  return useMutation({ mutationFn: getReleaseFixtureStatus })
}

export function useRetryReportGenerationMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: retryReportGeneration,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.reportOperations() })
    },
  })
}

export function useResendReportEmailMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: resendReportEmail,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.reportOperations() })
    },
  })
}

export function usePreviewResendRecoveryJobMutation() {
  return useMutation({ mutationFn: previewResendRecoveryJob })
}

export function usePreviewGenerationRetryRecoveryJobMutation() {
  return useMutation({ mutationFn: previewGenerationRetryRecoveryJob })
}

export function useCreateResendRecoveryJobMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createResendRecoveryJob,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.reportRecoveryJobs() })
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.reportOperations() })
    },
  })
}

export function useCreateGenerationRetryRecoveryJobMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createGenerationRetryRecoveryJob,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.reportRecoveryJobs() })
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.reportOperations() })
    },
  })
}

export function usePreviewResumeRecoveryJobMutation() {
  return useMutation({ mutationFn: previewResumeRecoveryJob })
}

export function useCreateResumeRecoveryJobMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createResumeRecoveryJob,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.reportRecoveryJobs() })
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.reportOperations() })
    },
  })
}

export function useRecoveryJobSupportPackageMutation() {
  return useMutation({ mutationFn: getRecoveryJobSupportPackage })
}

export function useSupportHandoffPackageMutation() {
  return useMutation({ mutationFn: (input: SupportHandoffPackageInput) => createSupportHandoffPackage(input) })
}

export function useCancelRecoveryJobMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: cancelRecoveryJob,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.reportRecoveryJobs() })
    },
  })
}

export function useBulkResendReportEmailsMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: bulkResendReportEmails,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.reportOperations() })
    },
  })
}

export function useCreateReportEditDraftMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ReportEditDraftInput) => createReportEditDraft(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.reportOperations() })
    },
  })
}

export function useApplyReportEditDraftMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ReportEditApplyInput) => applyReportEditDraft(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.reportOperations() })
    },
  })
}

export function useCreateReportArtifactEditPreviewMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ReportArtifactEditPreviewInput) => createReportArtifactEditPreview(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.reportOperations() })
    },
  })
}

export function useApplyReportArtifactEditPreviewMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ReportArtifactEditApplyInput) => applyReportArtifactEditPreview(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.reportOperations() })
    },
  })
}

export function useCreateReportArtifactRollbackPreviewMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ReportArtifactRollbackPreviewInput) => createReportArtifactRollbackPreview(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.reportOperations() })
    },
  })
}

export function useApplyReportArtifactRollbackPreviewMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ReportArtifactRollbackApplyInput) => applyReportArtifactRollbackPreview(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.reportOperations() })
    },
  })
}
