import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError } from '@/services/api/httpClient'
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
    // A 404 is an answer (no such student, or not one this account may see),
    // and asking again only delays saying so.
    retry: (failures, error) => !(error instanceof ApiError && error.status === 404) && failures < 1,
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

// The student travels with each call rather than with the hook, so a batch is
// executed for the student it was previewed for, and the history refreshed is
// that student's, whatever the id field says by then.
type StudentAutomationCall<Request> = { studentId: string; request: Request }

export function useAutomationPreviewMutation() {
  return useMutation({
    mutationFn: ({ studentId, request }: StudentAutomationCall<AutomationPreviewRequest>) =>
      previewAssignmentAutomationBatch(studentId, request),
  })
}

export function useAutomationExecuteMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ studentId, request }: StudentAutomationCall<AutomationExecuteRequest>) =>
      executeAssignmentAutomationBatch(studentId, request),
    onSuccess: (_data, { studentId }) => {
      void queryClient.invalidateQueries({
        queryKey: learningOperationsQueryKeys.studentAssignments(studentId),
      })
    },
  })
}
