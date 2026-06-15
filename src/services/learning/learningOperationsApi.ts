import { httpClient } from '@/services/api/httpClient'
import type {
  AssignmentListResponse,
  AutomationCandidate,
  AutomationExecuteResponse,
  AutomationPolicy,
  AutomationPreviewResponse,
  CurriculumAnalyticsDashboard,
  ParentProgressResponse,
  WarehouseExportSummary,
  WarehouseReadiness,
} from '@/types/learningOperations'

export type AutomationPreviewRequest = {
  policy: AutomationPolicy
  subject?: string
}

export type AutomationExecuteRequest = {
  batchId: string
  approved: boolean
  policy: AutomationPolicy
  candidates: AutomationCandidate[]
  subject?: string
}

export async function previewAssignmentAutomationBatch(
  studentId: string,
  request: AutomationPreviewRequest,
) {
  const response = await httpClient.post<AutomationPreviewResponse>(
    `/adaptive/students/${studentId}/assignment-automation/batches/preview`,
    request,
  )
  return response.data
}

export async function executeAssignmentAutomationBatch(
  studentId: string,
  request: AutomationExecuteRequest,
) {
  const response = await httpClient.post<AutomationExecuteResponse>(
    `/adaptive/students/${studentId}/assignment-automation/batches/execute`,
    request,
  )
  return response.data
}

export async function getStudentAssignments(studentId: string, includeArchived = true) {
  const response = await httpClient.get<AssignmentListResponse>(`/adaptive/students/${studentId}/assignments`, {
    params: { includeArchived },
  })
  return response.data
}

export async function getMyAssignments(status?: string) {
  const response = await httpClient.get<AssignmentListResponse>('/adaptive/students/me/assignments', {
    params: { status },
  })
  return response.data
}

export async function getParentChildProgress(studentId: string) {
  const response = await httpClient.get<ParentProgressResponse>(`/adaptive/parents/me/children/${studentId}/progress`)
  return response.data
}

export async function getCurriculumAnalyticsDashboard(subjectId?: string) {
  const response = await httpClient.get<CurriculumAnalyticsDashboard>('/admin/curriculum/analytics/dashboard', {
    params: { subjectId: subjectId || undefined },
  })
  return response.data
}

export async function getWarehouseReadiness() {
  const response = await httpClient.get<WarehouseReadiness>('/admin/curriculum/analytics/warehouse-readiness')
  return response.data
}

export async function getWarehouseExportSummary(contentType?: string) {
  const response = await httpClient.get<WarehouseExportSummary>('/admin/curriculum/analytics/warehouse-export', {
    params: { contentType: contentType || undefined },
  })
  return response.data
}
