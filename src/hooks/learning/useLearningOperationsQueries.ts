import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  executeAssignmentAutomationBatch,
  getCurriculumAnalyticsDashboard,
  getMyAssignments,
  getParentChildProgress,
  getStudentAssignments,
  getWarehouseExportSummary,
  getWarehouseReadiness,
  previewAssignmentAutomationBatch,
  type AutomationExecuteRequest,
  type AutomationPreviewRequest,
} from '@/services/learning/learningOperationsApi'

export const learningOperationsQueryKeys = {
  all: ['learning-operations'] as const,
  studentAssignments: (studentId: string) =>
    [...learningOperationsQueryKeys.all, 'student-assignments', studentId] as const,
  myAssignments: (status?: string) =>
    [...learningOperationsQueryKeys.all, 'my-assignments', status ?? 'all'] as const,
  parentProgress: (studentId: string) =>
    [...learningOperationsQueryKeys.all, 'parent-progress', studentId] as const,
  analyticsDashboard: (subjectId?: string) =>
    [...learningOperationsQueryKeys.all, 'analytics-dashboard', subjectId ?? 'all'] as const,
  warehouseReadiness: () =>
    [...learningOperationsQueryKeys.all, 'warehouse-readiness'] as const,
  warehouseExport: (contentType?: string) =>
    [...learningOperationsQueryKeys.all, 'warehouse-export', contentType ?? 'all'] as const,
}

export function useStudentAssignmentsQuery(studentId: string) {
  return useQuery({
    queryKey: learningOperationsQueryKeys.studentAssignments(studentId),
    queryFn: () => getStudentAssignments(studentId),
    enabled: Boolean(studentId),
  })
}

export function useMyAssignmentsQuery(status?: string) {
  return useQuery({
    queryKey: learningOperationsQueryKeys.myAssignments(status),
    queryFn: () => getMyAssignments(status),
  })
}

export function useParentChildProgressQuery(studentId: string) {
  return useQuery({
    queryKey: learningOperationsQueryKeys.parentProgress(studentId),
    queryFn: () => getParentChildProgress(studentId),
    enabled: Boolean(studentId),
  })
}

export function useCurriculumAnalyticsDashboardQuery(subjectId?: string) {
  return useQuery({
    queryKey: learningOperationsQueryKeys.analyticsDashboard(subjectId),
    queryFn: () => getCurriculumAnalyticsDashboard(subjectId),
  })
}

export function useWarehouseReadinessQuery() {
  return useQuery({
    queryKey: learningOperationsQueryKeys.warehouseReadiness(),
    queryFn: getWarehouseReadiness,
  })
}

export function useWarehouseExportSummaryQuery(contentType?: string) {
  return useQuery({
    queryKey: learningOperationsQueryKeys.warehouseExport(contentType),
    queryFn: () => getWarehouseExportSummary(contentType),
  })
}

export function useAutomationPreviewMutation(studentId: string) {
  return useMutation({
    mutationFn: (request: AutomationPreviewRequest) =>
      previewAssignmentAutomationBatch(studentId, request),
  })
}

export function useAutomationExecuteMutation(studentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: AutomationExecuteRequest) =>
      executeAssignmentAutomationBatch(studentId, request),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: learningOperationsQueryKeys.studentAssignments(studentId),
      })
    },
  })
}
