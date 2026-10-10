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

/**
 * A refusal is an answer, not a failure.
 *
 * Reading the analytics needs `curriculum_analytics_reader`; exporting the
 * warehouse is a separate grant, `curriculum_analytics_exporter`, and an
 * administrator who holds the first and not the second is the ordinary case.
 * Letting that 403 reject left the panel blank — the dashboard said nothing at
 * all — and the query's one retry sent the refused request a second time.
 * Carrying it back as data ends both.
 */
export type WarehouseExportSummaryResult = {
  /** The account may read the analytics but not export the warehouse. */
  permissionDenied: boolean
  /** Absent exactly when the export was refused. */
  summary?: WarehouseExportSummary
}

const resolvedOrForbidden = (status: number) => (status >= 200 && status < 300) || status === 403

export async function getWarehouseExportSummary(contentType?: string): Promise<WarehouseExportSummaryResult> {
  const response = await httpClient.get<WarehouseExportSummary>('/admin/curriculum/analytics/warehouse-export', {
    params: { contentType: contentType || undefined },
    validateStatus: resolvedOrForbidden,
  })
  if (response.status === 403) return { permissionDenied: true }
  return { permissionDenied: false, summary: response.data }
}
