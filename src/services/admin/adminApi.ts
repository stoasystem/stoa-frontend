import { httpClient } from '@/services/api/httpClient'
import type { UserRole } from '@/types/user'

export type AdminUsageSummary = {
  activeUsers: number
  roleCounts: Record<UserRole, number>
  messages: number
  helpRequests: number
  uploads: number
  feedback: number
  billingInterestItems?: number
  generatedAt?: string
}

export type AdminFeedbackStatus = 'new' | 'reviewed' | 'resolved'

export type AdminFeedbackItem = {
  id: string
  type: string
  message: string
  page: string
  userRole?: UserRole
  userEmail?: string
  status?: AdminFeedbackStatus
  createdAt: string
}

export type AdminFeedbackListResponse = {
  items: AdminFeedbackItem[]
}

export type AdminHelpRequestItem = {
  requestId: string
  studentName: string
  subject: string
  status: string
  priority?: 'low' | 'medium' | 'high'
  createdAt: string
}

export type AdminUserItem = {
  id: string
  name: string
  email: string
  role: UserRole
  status?: string
}

export type AdminSupportRequestItem = {
  id: string
  subject: string
  status: string
  createdAt: string
}

export type AdminBillingInterestItem = {
  id: string
  email: string
  plan: string
  source: string
  createdAt: string
}

export type AdminSystemStatus = {
  api: string
  analytics: string
  monitoring: string
  generatedAt?: string
}

export type ReportOperationActionState = {
  enabled: boolean
  reason?: string | null
}

export type ReportOperationRow = {
  report_id: string
  parent_id: string
  student_id: string
  student_name?: string | null
  week_start: string
  status?: string | null
  email_status?: string | null
  artifacts: {
    json_available: boolean
    html_available: boolean
  }
  generation: Record<string, string | null>
  delivery: Record<string, string | null>
  operations: Record<string, string | null>
  actions: {
    resend_email: ReportOperationActionState
    retry_generation: ReportOperationActionState
  }
}

export type ReportOperationsListFilters = {
  status?: string
  weekStart?: string
  parentId?: string
  studentId?: string
  nextToken?: string | null
  limit?: number
}

export type ReportOperationsListResponse = {
  items: ReportOperationRow[]
  count: number
  next_token?: string | null
  access_pattern: string
}

export type ReportOperationTarget = {
  parent_id: string
  student_id: string
  week_start: string
}

export type ReportOperationMutationResponse = {
  report_id: string
  status: string
  email_status?: string | null
  operation: string
  operation_result: string
  updated_at: string
  artifacts?: {
    json_available: boolean
    html_available: boolean
  }
}

export type BulkReportResendItemResult = ReportOperationTarget & {
  result: 'success' | 'refused' | 'not_found' | 'failed' | string
  report_id?: string | null
  status?: string | null
  email_status?: string | null
  operation: string
  operation_result?: string | null
  updated_at?: string | null
  detail?: string | null
  error_class?: string | null
}

export type BulkReportResendResponse = {
  operation: string
  count: number
  results: BulkReportResendItemResult[]
}

export async function getAdminUsageSummary() {
  const response = await httpClient.get<AdminUsageSummary>('/admin/usage-summary')
  return response.data
}

export async function getAdminFeedbackList() {
  const response = await httpClient.get<AdminFeedbackListResponse>('/admin/feedback')
  return response.data
}

export async function getAdminHelpRequests() {
  const response = await httpClient.get<{ items: AdminHelpRequestItem[] }>(
    '/admin/help-requests',
  )
  return response.data
}

export async function getAdminUsers() {
  const response = await httpClient.get<{ items: AdminUserItem[] }>('/admin/users')
  return response.data
}

export async function getAdminSupportRequests() {
  const response = await httpClient.get<{ items: AdminSupportRequestItem[] }>(
    '/admin/support-requests',
  )
  return response.data
}

export async function getAdminBillingInterest() {
  const response = await httpClient.get<{ items: AdminBillingInterestItem[] }>(
    '/admin/billing-interest',
  )
  return response.data
}

export async function getAdminSystemStatus() {
  const response = await httpClient.get<AdminSystemStatus>('/admin/system-status')
  return response.data
}

export async function getReportOperations(filters: ReportOperationsListFilters = {}) {
  const response = await httpClient.get<ReportOperationsListResponse>('/admin/reports/ops', {
    params: {
      status: filters.status || undefined,
      week_start: filters.weekStart || undefined,
      parent_id: filters.parentId || undefined,
      student_id: filters.studentId || undefined,
      next_token: filters.nextToken || undefined,
      limit: filters.limit,
    },
  })
  return response.data
}

export async function getReportOperationDetail(target: ReportOperationTarget) {
  const response = await httpClient.get<ReportOperationRow>(
    `/admin/reports/${target.parent_id}/${target.student_id}/${target.week_start}/ops`,
  )
  return response.data
}

export async function retryReportGeneration(target: ReportOperationTarget) {
  const response = await httpClient.post<ReportOperationMutationResponse>(
    `/admin/reports/${target.parent_id}/${target.student_id}/${target.week_start}/retry-generation`,
  )
  return response.data
}

export async function resendReportEmail(target: ReportOperationTarget) {
  const response = await httpClient.post<ReportOperationMutationResponse>(
    `/admin/reports/${target.parent_id}/${target.student_id}/${target.week_start}/resend`,
  )
  return response.data
}

export async function bulkResendReportEmails(reports: ReportOperationTarget[]) {
  const response = await httpClient.post<BulkReportResendResponse>('/admin/reports/bulk-resend', {
    reports,
  })
  return response.data
}
