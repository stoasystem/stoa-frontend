import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  bulkResendReportEmails,
  cancelRecoveryJob,
  createResendRecoveryJob,
  getRecoveryEvidenceExport,
  getRecoveryJobAuditEvents,
  getRecoveryJobResults,
  getRecoveryJobs,
  getReportAuditEvents,
  getReportOperationDetail,
  getReportOperations,
  previewResendRecoveryJob,
  resendReportEmail,
  retryReportGeneration,
  type ReportOperationTarget,
  type ReportOperationsListFilters,
  type RecoveryEvidenceExportParams,
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
