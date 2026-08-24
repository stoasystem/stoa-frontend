import { httpClient } from '@/services/api/httpClient'

import type { UserRole } from '@/types/user'
import type { AdminAccountOperations } from '@/types/adminAccountOperations'
import type {
  SubscriptionBilling,
  SubscriptionBillingListResponse,
  SubscriptionRequest,
  SubscriptionRequestFilters,
  SubscriptionRequestListResponse,
} from '@/types/subscriptionOperations'

export type AdminTeacherSlaStats = {
  tracked_questions: number
  first_reply: {
    count: number
    average_seconds: number | null
    max_seconds: number | null
  }
  takeover: {
    count: number
    average_seconds: number | null
    max_seconds: number | null
  }
  resolved: {
    count: number
    average_seconds: number | null
    max_seconds: number | null
  }
  buckets: {
    within_target: number
    at_risk: number
    breached: number
    unknown: number
  }
  targets: {
    first_reply_seconds: number
    first_reply_at_risk_seconds: number
    takeover_seconds: number
  }
}

export type AdminPlatformStats = {
  total_users: number
  total_students: number
  total_parents: number
  total_teachers: number
  total_questions: number
  ai_resolved: number
  teacher_resolved: number
  escalated: number
  teacher_sla: AdminTeacherSlaStats
}

export type ModerationSurface = 'question' | 'ai_answer' | 'teacher_reply'
export type ModerationReason = 'incorrect_answer' | 'unsafe_content' | 'abuse' | 'privacy' | 'other'
export type ModerationSeverity = 'low' | 'medium' | 'high'
export type ModerationCaseStatus = 'open' | 'in_review' | 'actioned' | 'dismissed' | 'closed'

export type ModerationCase = {
  case_id: string
  status: ModerationCaseStatus
  reason: ModerationReason
  severity: ModerationSeverity
  surface: ModerationSurface
  question_id: string
  student_id?: string | null
  reporter_id: string
  reporter_role: string
  assigned_admin_id?: string | null
  report_note?: string | null
  resolution_note?: string | null
  created_at: string
  updated_at: string
  closed_at?: string | null
  question_context?: {
    question_id?: string | null
    student_id?: string | null
    subject?: string | null
    status?: string | null
    content_preview?: string | null
    ai_answer_preview?: string | null
    teacher_response_preview?: string | null
    has_image?: boolean
  } | null
  history?: {
    event_id: string
    event_type: string
    actor_id?: string | null
    actor_role?: string | null
    created_at?: string | null
    changes?: Record<string, unknown> | null
    note?: string | null
  }[]
}

export type ModerationCaseListFilters = {
  status?: ModerationCaseStatus | ''
  severity?: ModerationSeverity | ''
  reason?: ModerationReason | ''
  reporterRole?: string
  assignee?: string
  limit?: number
}

export type ModerationCaseListResponse = {
  items: ModerationCase[]
  count: number
  access_pattern: string
}

export type ModerationReportInput = {
  questionId: string
  surface: ModerationSurface
  reason: ModerationReason
  severity: ModerationSeverity
  note?: string
}

export type ModerationCaseUpdateInput = {
  caseId: string
  status?: ModerationCaseStatus
  assigned_admin_id?: string
  resolution_note?: string
}

export type ModerationCaseNoteInput = {
  caseId: string
  note: string
}

export async function getAdminPlatformStats() {
  const response = await httpClient.get<AdminPlatformStats>('/admin/stats')
  return response.data
}

export async function createModerationReport(input: ModerationReportInput) {
  const response = await httpClient.post<ModerationCase>(
    `/questions/${input.questionId}/reports`,
    {
      surface: input.surface,
      reason: input.reason,
      severity: input.severity,
      note: input.note,
    },
  )
  return response.data
}

export async function getModerationCases(filters: ModerationCaseListFilters = {}) {
  const params = new URLSearchParams()
  if (filters.limit) params.set('limit', String(filters.limit))
  if (filters.status) params.set('status', filters.status)
  if (filters.severity) params.set('severity', filters.severity)
  if (filters.reason) params.set('reason', filters.reason)
  if (filters.reporterRole) params.set('reporter_role', filters.reporterRole)
  if (filters.assignee) params.set('assignee', filters.assignee)
  const response = await httpClient.get<ModerationCaseListResponse>(
    `/admin/moderation/cases${params.toString() ? `?${params.toString()}` : ''}`,
  )
  return response.data
}

export async function getModerationCase(caseId: string) {
  const response = await httpClient.get<ModerationCase>(`/admin/moderation/cases/${caseId}`)
  return response.data
}

export async function updateModerationCase(input: ModerationCaseUpdateInput) {
  const response = await httpClient.patch<ModerationCase>(
    `/admin/moderation/cases/${input.caseId}`,
    {
      status: input.status,
      assigned_admin_id: input.assigned_admin_id,
      resolution_note: input.resolution_note,
    },
  )
  return response.data
}

export async function addModerationCaseNote(input: ModerationCaseNoteInput) {
  const response = await httpClient.post<ModerationCase>(
    `/admin/moderation/cases/${input.caseId}/notes`,
    { note: input.note },
  )
  return response.data
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
    edit_artifact?: ReportOperationActionState
    rollback_artifact?: ReportOperationActionState
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

export type AuditRetentionReference = {
  scope: 'recovery_job' | 'report' | 'support_handoff' | 'release_evidence' | string
  job_id?: string | null
  parent_id?: string | null
  student_id?: string | null
  week_start?: string | null
  package_id?: string | null
  release_evidence?: Record<string, unknown> | null
}

export type AuditRetentionStatusItem = {
  reference: AuditRetentionReference
  status: string
  reason?: string | null
  counts: Record<string, number>
  privacy: {
    metadata_only: boolean
    private_artifact_fields_omitted: boolean
    passed: boolean
    violation_count: number
    violations: { path?: string; marker?: string }[]
  }
}

export type AuditRetentionStatusResponse = {
  schema_version: string
  checked_at: string
  request_id?: string | null
  scope_count: number
  items: AuditRetentionStatusItem[]
  privacy: AuditRetentionStatusItem['privacy']
}

export type ImmutableStorageStatus = {
  status: string
  mode: string
  cdk_managed: boolean
  resource_configured: boolean
  prefix_configured: boolean
  missing: string[]
}

export type LegalHoldStatusItem = {
  reference: AuditRetentionReference
  scope_key: string
  status: string
  policy_id?: string | null
  hold_id?: string | null
  reason?: string | null
  updated_at?: string | null
}

export type LegalHoldStatusResponse = {
  schema_version: string
  checked_at?: string
  updated_at?: string
  request_id?: string | null
  action?: string
  scope_count: number
  items: LegalHoldStatusItem[]
  privacy: AuditRetentionStatusItem['privacy']
}

export type RetentionApprovalStatus = {
  approval_id?: string | null
  policy_version: string
  approval_state: string
  retention_mode?: string | null
  retention_days?: number | null
  policy_owner?: string | null
  legal_compliance_approver?: string | null
  reason?: string | null
  evidence_references?: Record<string, unknown>[]
  next_review_due_at?: string | null
  approval_version?: number | null
  updated_at?: string | null
  formal_approval_recorded: boolean
  technical_object_lock_verified?: boolean
  broad_compliance_claims_allowed: boolean
}

export type LegalHoldReviewStatusItem = {
  reference: AuditRetentionReference
  scope_key: string
  legal_hold_status: string
  review_status: string
  owner?: string | null
  reviewer?: string | null
  review_cadence?: string | null
  next_review_due_at?: string | null
  review_version?: number | null
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

export type ReportEditDraft = {
  draft_id: string
  report_id: string
  parent_id?: string | null
  student_id?: string | null
  week_start?: string | null
  source_updated_at?: string | null
  created_by?: string | null
  created_at?: string | null
  updated_at?: string | null
  reason?: string | null
  proposed_fields: Record<string, string | null>
  status: string
  applied_by?: string | null
  applied_at?: string | null
}

export type ReportArtifactEditDiffItem = {
  field: string
  before?: unknown
  after?: unknown
  changed: boolean
}

export type ReportArtifactEditPreview = {
  draft_id: string
  report_id: string
  parent_id?: string | null
  student_id?: string | null
  week_start?: string | null
  source_updated_at?: string | null
  source_artifact_version_id?: string | null
  created_by?: string | null
  created_at?: string | null
  updated_at?: string | null
  reason?: string | null
  proposed_fields: Record<string, unknown>
  diff: ReportArtifactEditDiffItem[]
  status: string
  applied_by?: string | null
  applied_at?: string | null
  artifact_version_id?: string | null
}

export type ReportArtifactRollbackPreview = {
  preview_id: string
  report_id: string
  parent_id?: string | null
  student_id?: string | null
  week_start?: string | null
  source_updated_at?: string | null
  source_artifact_version_id?: string | null
  target_artifact_version_id?: string | null
  created_by?: string | null
  created_at?: string | null
  updated_at?: string | null
  reason?: string | null
  status: string
  validation_result: string
  applied_by?: string | null
  applied_at?: string | null
  artifact_version_id?: string | null
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

export type ReportAuditEvent = {
  event_id: string
  event_at: string
  report_id?: string | null
  parent_id?: string | null
  student_id?: string | null
  week_start?: string | null
  actor?: string | null
  action: string
  reason?: string | null
  source?: string | null
  result: string
  before?: Record<string, unknown> | null
  after?: Record<string, unknown> | null
  error_class?: string | null
  error_message?: string | null
  correlation_id?: string | null
  metadata?: Record<string, unknown> | null
}

export type ReportAuditListResponse = {
  items: ReportAuditEvent[]
  count: number
  next_token?: string | null
  scope: 'report' | 'recovery_job' | string
}

export type RecoveryJobFilters = {
  status?: string
  week_start?: string | null
  parent_id?: string | null
  student_id?: string | null
}

export type RecoveryJobType = 'resend_email' | 'retry_generation'

export type RecoveryJobPreviewTarget = {
  target_id: string
  report_id?: string | null
  parent_id?: string | null
  student_id?: string | null
  student_name?: string | null
  week_start?: string | null
  status?: string | null
  email_status?: string | null
  artifacts: { html_available: boolean; json_available: boolean }
  eligibility: string
  refusal_reason?: string | null
}

export type RecoveryJobPreviewResponse = {
  operation: RecoveryJobType | string
  reason: string
  requested_by: string
  filters: RecoveryJobFilters
  max_targets: number
  scanned_pages: number
  eligible_count: number
  refused_count: number
  missing_count: number
  sample: RecoveryJobPreviewTarget[]
  preview_token: string
}

export type RecoveryJob = {
  job_id: string
  job_type: RecoveryJobType | string
  status: string
  reason?: string | null
  created_by?: string | null
  created_at?: string | null
  updated_at?: string | null
  started_at?: string | null
  completed_at?: string | null
  cancellation_requested_by?: string | null
  cancellation_requested_at?: string | null
  filters?: RecoveryJobFilters | null
  target_count: number
  pending_count: number
  attempted_count: number
  success_count: number
  refused_count: number
  not_found_count: number
  failed_count: number
  skipped_cancelled_count: number
  stop_reason?: string | null
  source_job_id?: string | null
  resume_result_filters?: string[] | null
}

export type RecoveryJobListResponse = {
  items: RecoveryJob[]
  count: number
  next_token?: string | null
}

export type RecoveryJobTarget = {
  target_id: string
  report_id?: string | null
  parent_id?: string | null
  student_id?: string | null
  student_name?: string | null
  week_start?: string | null
  result: string
  status?: string | null
  email_status?: string | null
  detail?: string | null
  error_class?: string | null
  attempted_at?: string | null
  completed_at?: string | null
  source_job_id?: string | null
  source_target_result?: string | null
}

export type RecoveryJobTargetsResponse = {
  items: RecoveryJobTarget[]
  count: number
  next_token?: string | null
}

export type RecoveryJobResumePreviewTarget = RecoveryJobPreviewTarget & {
  source_result?: string | null
  detail?: string | null
  error_class?: string | null
}

export type RecoveryJobResumePreviewResponse = {
  operation: string
  source_job_id: string
  job_type: RecoveryJobType | string
  reason: string
  requested_by: string
  result_filters: string[]
  max_targets: number
  scanned_targets: number
  eligible_count: number
  refused_count: number
  missing_count: number
  sample: RecoveryJobResumePreviewTarget[]
  preview_token: string
}

export type SupportHandoffDestinationMode = 'preview' | 'copy' | 'download' | 'external_write'

export type ReleaseEvidenceValidationResult = {
  schema_version: string
  validated_at: string
  status: 'passed' | 'failed' | string
  missing_required_fields: string[]
  schema_errors: string[]
  status_errors: string[]
  fixture_errors: string[]
  privacy: {
    passed: boolean
    violation_count: number
    violations: Array<Record<string, string>>
    denylist?: string[]
  }
  bundle: Record<string, unknown>
}

export type ReleaseFixtureStatus = {
  generated_at: string
  fixture_name?: string | null
  approved: boolean
  status: 'ready' | 'dirty' | 'missing' | 'disabled' | string
  identity: {
    parent_id?: string | null
    student_id?: string | null
    week_start?: string | null
  }
  artifact_versions: {
    current?: string | null
    expected_baseline?: string | null
    previous?: string | null
    created_at?: string | null
    created_by?: string | null
  }
  report: {
    report_id?: string | null
    status?: string | null
    email_status?: string | null
    last_operation?: string | null
    updated_at?: string | null
  }
  audit_refs: Array<Record<string, string | null>>
  mutation_refusal: Record<string, unknown>
  privacy: {
    metadata_only: boolean
    private_artifact_fields_omitted: boolean
    passed: boolean
    violation_count: number
    violations: Array<Record<string, string>>
  }
}

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

export async function getReportAuditEvents(target: ReportOperationTarget) {
  const response = await httpClient.get<ReportAuditListResponse>(
    `/admin/reports/${target.parent_id}/${target.student_id}/${target.week_start}/audit`,
  )
  return response.data
}

export async function previewResendRecoveryJob(input: {
  reason: string
  filters: RecoveryJobFilters
  max_targets?: number
}) {
  const response = await httpClient.post<RecoveryJobPreviewResponse>(
    '/admin/reports/recovery-jobs/resend-email/preview',
    input,
  )
  return response.data
}

export async function previewGenerationRetryRecoveryJob(input: {
  reason: string
  filters: RecoveryJobFilters
  max_targets?: number
}) {
  const response = await httpClient.post<RecoveryJobPreviewResponse>(
    '/admin/reports/recovery-jobs/retry-generation/preview',
    input,
  )
  return response.data
}

export async function createResendRecoveryJob(input: {
  reason: string
  filters: RecoveryJobFilters
  preview_token: string
  max_targets?: number
}) {
  const response = await httpClient.post<RecoveryJob>(
    '/admin/reports/recovery-jobs/resend-email',
    input,
  )
  return response.data
}

export async function createGenerationRetryRecoveryJob(input: {
  reason: string
  filters: RecoveryJobFilters
  preview_token: string
  max_targets?: number
}) {
  const response = await httpClient.post<RecoveryJob>(
    '/admin/reports/recovery-jobs/retry-generation',
    input,
  )
  return response.data
}

export async function previewResumeRecoveryJob(input: {
  jobId: string
  reason: string
  results: string[]
  max_targets?: number
}) {
  const response = await httpClient.post<RecoveryJobResumePreviewResponse>(
    `/admin/reports/recovery-jobs/${input.jobId}/resume/preview`,
    {
      reason: input.reason,
      results: input.results,
      max_targets: input.max_targets,
    },
  )
  return response.data
}

export async function createResumeRecoveryJob(input: {
  jobId: string
  reason: string
  results: string[]
  preview_token: string
  max_targets?: number
}) {
  const response = await httpClient.post<RecoveryJob>(
    `/admin/reports/recovery-jobs/${input.jobId}/resume`,
    {
      reason: input.reason,
      results: input.results,
      preview_token: input.preview_token,
      max_targets: input.max_targets,
    },
  )
  return response.data
}

export async function getRecoveryJobs() {
  const response = await httpClient.get<RecoveryJobListResponse>('/admin/reports/recovery-jobs')
  return response.data
}

export async function getRecoveryJob(jobId: string) {
  const response = await httpClient.get<RecoveryJob>(`/admin/reports/recovery-jobs/${jobId}`)
  return response.data
}

export async function getRecoveryJobResults(jobId: string) {
  const response = await httpClient.get<RecoveryJobTargetsResponse>(
    `/admin/reports/recovery-jobs/${jobId}/results`,
  )
  return response.data
}

export async function getRecoveryJobAuditEvents(jobId: string) {
  const response = await httpClient.get<ReportAuditListResponse>(
    `/admin/reports/recovery-jobs/${jobId}/audit`,
  )
  return response.data
}

export async function validateReleaseEvidence(bundle: Record<string, unknown>) {
  const response = await httpClient.post<ReleaseEvidenceValidationResult>(
    '/admin/reports/release-evidence/validate',
    bundle,
  )
  return response.data
}

export async function getReleaseFixtureStatus(input: {
  fixtureName: string
  expectedArtifactVersion?: string | null
}) {
  const response = await httpClient.get<ReleaseFixtureStatus>(
    '/admin/reports/release-evidence/fixture-status',
    {
      params: {
        fixture_name: input.fixtureName,
        expected_artifact_version: input.expectedArtifactVersion || undefined,
      },
    },
  )
  return response.data
}

export async function cancelRecoveryJob(jobId: string) {
  const response = await httpClient.post<RecoveryJob>(`/admin/reports/recovery-jobs/${jobId}/cancel`)
  return response.data
}

export async function getSubscriptionRequests(filters: SubscriptionRequestFilters = {}) {
  const response = await httpClient.get<SubscriptionRequestListResponse>(
    '/admin/subscriptions/requests',
    {
      params: {
        status: filters.status || undefined,
        requested_tier: filters.requestedTier || undefined,
        parent_id: filters.parentId || undefined,
        date_from: filters.dateFrom || undefined,
        date_to: filters.dateTo || undefined,
        limit: filters.limit,
      },
    },
  )
  return response.data
}

export async function getSubscriptionRequest(requestId: string) {
  const response = await httpClient.get<SubscriptionRequest>(
    `/admin/subscriptions/requests/${requestId}`,
  )
  return response.data
}

export async function getSubscriptionBilling(filters: {
  parentId?: string
  billingStatus?: string
  billingProvider?: string
  limit?: number
} = {}) {
  const response = await httpClient.get<SubscriptionBillingListResponse>(
    '/admin/subscriptions/billing',
    {
      params: {
        parent_id: filters.parentId || undefined,
        billing_status: filters.billingStatus || undefined,
        billing_provider: filters.billingProvider || undefined,
        limit: filters.limit,
      },
    },
  )
  return response.data
}

export async function getSubscriptionBillingDetail(parentId: string) {
  const response = await httpClient.get<SubscriptionBilling>(
    `/admin/subscriptions/billing/${parentId}`,
  )
  return response.data
}

export async function getAdminParentAccountOperations(parentId: string, day?: string) {
  const response = await httpClient.get<AdminAccountOperations>(
    `/admin/account-operations/parents/${parentId}`,
    { params: { day: day || undefined } },
  )
  return response.data
}

export async function updateSubscriptionRequest(input: {
  requestId: string
  status: string
  adminNote?: string
  effectiveAt?: string
}) {
  const response = await httpClient.patch<SubscriptionRequest>(
    `/admin/subscriptions/requests/${input.requestId}`,
    {
      status: input.status,
      admin_note: input.adminNote,
      effective_at: input.effectiveAt,
    },
  )
  return response.data
}

export async function applySubscriptionRequest(input: { requestId: string; adminNote?: string; effectiveAt?: string }) {
  const response = await httpClient.post<SubscriptionRequest>(
    `/admin/subscriptions/requests/${input.requestId}/apply`,
    { admin_note: input.adminNote, effective_at: input.effectiveAt },
  )
  return response.data
}

export type AdminBillingPlan = 'student' | 'teacher_supported' | 'family'

export type AdminBillingCommandLifecycle = {
  state: string
  providerEffectStatus: string
  createdAt: string
  updatedAt: string
}

export type AdminBillingFactLifecycle = {
  kind:
    | 'checkout_session_completed'
    | 'checkout_session_expired'
    | 'invoice_paid'
    | 'invoice_payment_failed'
    | 'subscription_active'
    | 'subscription_inactive'
  factVersion: number
  providerEventIdDigest: string
  providerObjectIdDigest: string
  signatureVerified: true
  providerLivemode: false
  observedAt: string
}

export type AdminProviderUsageEvidence = {
  beneficiaryId: string
  correlationDigest: string
  providerRequestIdDigest: string
  modelIdDigest: string
  inputTokens: number
  outputTokens: number
  providerCostRetained: boolean
  observedAt: string
}

export type AdminPaymentReminderEvidence = {
  brand: string
  last4: string
  expiryMonth: number
  expiryYear: number
  reminderAt: string
  status: 'pending' | 'notified'
}

export type AdminBillingReconciliation = {
  lifecycleState: string
  lastRecheckedAt: string
  safeAction: string
  failureCode: string
  providerSessionSuffix?: string | null
  reconciliationLeaseGeneration: number
}

export type AdminBillingOperationDetail = {
  checkoutRef: string
  parentId: string
  targetPlan: AdminBillingPlan
  beneficiaryIds: string[]
  commandLifecycle: AdminBillingCommandLifecycle
  factLifecycle: AdminBillingFactLifecycle[]
  grantVersion: Record<string, number>
  allowanceVersion: Record<string, number>
  providerUsageEvidence: AdminProviderUsageEvidence[]
  paymentReminder?: AdminPaymentReminderEvidence | null
  reconciliation: AdminBillingReconciliation
}

export type AdminBillingRecheckResult = {
  checkoutRef: string
  parentId: string
  targetPlan: AdminBillingPlan
  beneficiaryIds: string[]
  createdAt: string
  updatedAt: string
  commandState: string
  providerEffectStatus: string
  lifecycleState: string
  lastRecheckedAt: string
  safeAction: string
  failureCode: string
  providerSessionSuffix?: string | null
  reconciliationLeaseGeneration: number
}

export async function getAdminBillingOperation(checkoutRef: string, parentId: string) {
  const response = await httpClient.get<AdminBillingOperationDetail>(
    `/admin/billing/checkouts/${encodeURIComponent(checkoutRef)}`,
    { params: { parentId, detail: true } },
  )
  return response.data
}

export async function recheckAdminBillingOperation(checkoutRef: string, parentId: string) {
  const response = await httpClient.post<AdminBillingRecheckResult>(
    `/admin/billing/checkouts/${encodeURIComponent(checkoutRef)}/recheck`,
    {},
    { params: { parentId } },
  )
  return response.data
}
