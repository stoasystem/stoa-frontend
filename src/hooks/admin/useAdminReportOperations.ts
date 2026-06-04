import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  bulkResendReportEmails,
  getReportOperationDetail,
  getReportOperations,
  resendReportEmail,
  retryReportGeneration,
  type ReportOperationTarget,
  type ReportOperationsListFilters,
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

export function useBulkResendReportEmailsMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: bulkResendReportEmails,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.reportOperations() })
    },
  })
}
