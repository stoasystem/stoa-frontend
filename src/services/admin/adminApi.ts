import { httpClient } from '@/services/api/httpClient'
import { withDemoFallback } from '@/services/demo/demoFallback'
import type { UserRole } from '@/types/user'
import type {
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

const mockModerationCases: ModerationCase[] = [
  {
    case_id: 'mod-demo-1',
    status: 'open',
    reason: 'unsafe_content',
    severity: 'high',
    surface: 'ai_answer',
    question_id: 'conv-1',
    student_id: 'student-1',
    reporter_id: 'student-1',
    reporter_role: 'student',
    assigned_admin_id: null,
    report_note: 'The answer sounded too absolute and needs review.',
    resolution_note: null,
    created_at: '2026-06-08T09:35:00Z',
    updated_at: '2026-06-08T09:35:00Z',
    closed_at: null,
    question_context: {
      question_id: 'conv-1',
      student_id: 'student-1',
      subject: 'Mathematics',
      status: 'ai_answered',
      content_preview: 'Can you explain how to solve x^2 - 5x + 6 = 0?',
      ai_answer_preview: 'We can factor the expression as (x - 2)(x - 3) = 0.',
      teacher_response_preview: null,
      has_image: false,
    },
    history: [
      {
        event_id: 'event-demo-1',
        event_type: 'reported',
        actor_id: 'student-1',
        actor_role: 'student',
        created_at: '2026-06-08T09:35:00Z',
        note: 'The answer sounded too absolute and needs review.',
      },
    ],
  },
  {
    case_id: 'mod-demo-2',
    status: 'in_review',
    reason: 'incorrect_answer',
    severity: 'medium',
    surface: 'teacher_reply',
    question_id: 'teacher-request-1',
    student_id: 'student-2',
    reporter_id: 'demo-tutor',
    reporter_role: 'tutor',
    assigned_admin_id: 'admin-1',
    report_note: 'Formula formatting should be checked before closing.',
    resolution_note: null,
    created_at: '2026-06-08T08:20:00Z',
    updated_at: '2026-06-08T09:10:00Z',
    closed_at: null,
    question_context: {
      question_id: 'teacher-request-1',
      student_id: 'student-2',
      subject: 'Mathematics',
      status: 'teacher_active',
      content_preview: 'I am stuck moving terms across the equals sign.',
      ai_answer_preview: 'First isolate x by moving constants to the other side.',
      teacher_response_preview: 'Move 4 to the right side, then divide by 2.',
      has_image: false,
    },
    history: [
      {
        event_id: 'event-demo-2',
        event_type: 'reported',
        actor_id: 'demo-tutor',
        actor_role: 'tutor',
        created_at: '2026-06-08T08:20:00Z',
        note: 'Formula formatting should be checked before closing.',
      },
    ],
  },
]

let demoModerationCases = [...mockModerationCases]

const mockAdminPlatformStats: AdminPlatformStats = {
  total_users: 42,
  total_students: 18,
  total_parents: 12,
  total_teachers: 6,
  total_questions: 128,
  ai_resolved: 96,
  teacher_resolved: 19,
  escalated: 4,
  teacher_sla: {
    tracked_questions: 23,
    first_reply: { count: 19, average_seconds: 1080, max_seconds: 2400 },
    takeover: { count: 21, average_seconds: 720, max_seconds: 1500 },
    resolved: { count: 19, average_seconds: 3600, max_seconds: 7200 },
    buckets: { within_target: 15, at_risk: 2, breached: 2, unknown: 4 },
    targets: {
      first_reply_seconds: 1800,
      first_reply_at_risk_seconds: 1200,
      takeover_seconds: 900,
    },
  },
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

export async function getAdminPlatformStats() {
  return withDemoFallback(async () => {
    const response = await httpClient.get<AdminPlatformStats>('/admin/stats')
    return response.data
  }, mockAdminPlatformStats)
}

export async function createModerationReport(input: ModerationReportInput) {
  return withDemoFallback(async () => {
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
  }, () => {
    const now = new Date().toISOString()
    const created: ModerationCase = {
      case_id: `mod-demo-${Date.now()}`,
      status: 'open',
      reason: input.reason,
      severity: input.severity,
      surface: input.surface,
      question_id: input.questionId,
      student_id: 'demo-student',
      reporter_id: 'demo-user',
      reporter_role: 'student',
      assigned_admin_id: null,
      report_note: input.note,
      resolution_note: null,
      created_at: now,
      updated_at: now,
      closed_at: null,
      question_context: {
        question_id: input.questionId,
        subject: 'Mathematics',
        status: 'reported',
        content_preview: 'Reported from the active learning workflow.',
        ai_answer_preview: input.surface === 'ai_answer' ? 'Assistant response selected for review.' : null,
        teacher_response_preview: input.surface === 'teacher_reply' ? 'Teacher reply selected for review.' : null,
        has_image: false,
      },
      history: [{
        event_id: `event-${Date.now()}`,
        event_type: 'reported',
        actor_id: 'demo-user',
        actor_role: 'student',
        created_at: now,
        note: input.note,
      }],
    }
    demoModerationCases = [created, ...demoModerationCases]
    return created
  })
}

export async function getModerationCases(filters: ModerationCaseListFilters = {}) {
  return withDemoFallback(async () => {
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
  }, () => {
    const items = demoModerationCases.filter((item) =>
      (!filters.status || item.status === filters.status) &&
      (!filters.severity || item.severity === filters.severity) &&
      (!filters.reason || item.reason === filters.reason) &&
      (!filters.reporterRole || item.reporter_role === filters.reporterRole) &&
      (!filters.assignee || item.assigned_admin_id === filters.assignee),
    ).slice(0, filters.limit ?? 50)
    return { items, count: items.length, access_pattern: 'demo_bounded_scan' }
  })
}

export async function getModerationCase(caseId: string) {
  return withDemoFallback(async () => {
    const response = await httpClient.get<ModerationCase>(`/admin/moderation/cases/${caseId}`)
    return response.data
  }, () => demoModerationCases.find((item) => item.case_id === caseId) ?? demoModerationCases[0])
}

export async function updateModerationCase(input: ModerationCaseUpdateInput) {
  return withDemoFallback(async () => {
    const response = await httpClient.patch<ModerationCase>(
      `/admin/moderation/cases/${input.caseId}`,
      {
        status: input.status,
        assigned_admin_id: input.assigned_admin_id,
        resolution_note: input.resolution_note,
      },
    )
    return response.data
  }, () => {
    const now = new Date().toISOString()
    demoModerationCases = demoModerationCases.map((item) =>
      item.case_id === input.caseId
        ? {
            ...item,
            status: input.status ?? item.status,
            assigned_admin_id: input.assigned_admin_id ?? item.assigned_admin_id,
            resolution_note: input.resolution_note ?? item.resolution_note,
            updated_at: now,
            closed_at: ['actioned', 'dismissed', 'closed'].includes(input.status ?? '') ? now : item.closed_at,
            history: [
              ...(item.history ?? []),
              {
                event_id: `event-${Date.now()}`,
                event_type: 'updated',
                actor_id: 'admin-1',
                actor_role: 'admin',
                created_at: now,
                note: input.resolution_note,
              },
            ],
          }
        : item,
    )
    return demoModerationCases.find((item) => item.case_id === input.caseId) ?? demoModerationCases[0]
  })
}

export async function addModerationCaseNote(input: ModerationCaseNoteInput) {
  return withDemoFallback(async () => {
    const response = await httpClient.post<ModerationCase>(
      `/admin/moderation/cases/${input.caseId}/notes`,
      { note: input.note },
    )
    return response.data
  }, () => {
    const now = new Date().toISOString()
    demoModerationCases = demoModerationCases.map((item) =>
      item.case_id === input.caseId
        ? {
            ...item,
            updated_at: now,
            history: [
              ...(item.history ?? []),
              {
                event_id: `event-${Date.now()}`,
                event_type: 'note_added',
                actor_id: 'admin-1',
                actor_role: 'admin',
                created_at: now,
                note: input.note,
              },
            ],
          }
        : item,
    )
    return demoModerationCases.find((item) => item.case_id === input.caseId) ?? demoModerationCases[0]
  })
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

export type AuditRetentionManifest = {
  schema_version: string
  manifest_id: string
  generated_at: string
  generated_by: string
  reason: string
  scope: {
    references: AuditRetentionReference[]
    reference_count: number
  }
  retention_category: string
  retention_clock: Record<string, string | null>
  items: {
    item_id: string
    scope: string
    reference: AuditRetentionReference
    status: string
    summary: Record<string, unknown>
    digest: string
  }[]
  verification: {
    item_count: number
    missing_references: { reference: AuditRetentionReference; reason?: string | null }[]
    skipped_references: { reference: AuditRetentionReference; reason?: string | null }[]
    refusal_reasons: string[]
    privacy: AuditRetentionStatusItem['privacy']
    manifest_digest?: string | null
  }
  status: string
}

export type AuditRetentionManifestInput = {
  reason: string
  references: AuditRetentionReference[]
  retention_category?: string
  retention_action?: string
  target_limit?: number
  audit_limit?: number
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

export type ImmutableEvidenceStatusResponse = {
  schema_version: string
  checked_at: string
  request_id?: string | null
  immutable_storage: ImmutableStorageStatus
  audit_retention: AuditRetentionStatusResponse
  legal_hold: LegalHoldStatusResponse
  privacy: AuditRetentionStatusItem['privacy']
}

export type ImmutableEvidencePersistInput = {
  reason: string
  references: AuditRetentionReference[]
  retention_category?: string
  target_limit?: number
  audit_limit?: number
}

export type ImmutableEvidencePersistResponse = {
  schema_version: string
  manifest_id: string
  generated_at: string
  generated_by: string
  reason: string
  retention_category: string
  manifest_status: string
  manifest_digest?: string | null
  item_count?: number | null
  immutable_storage: {
    status: string
    reason?: string | null
    immutable_ref_id?: string | null
    manifest_id?: string | null
    manifest_digest?: string | null
    storage?: ImmutableStorageStatus
    privacy?: AuditRetentionStatusItem['privacy']
  }
  verification: {
    privacy?: AuditRetentionStatusItem['privacy']
    refusal_reasons: string[]
  }
  privacy: AuditRetentionStatusItem['privacy']
}

export type LegalHoldMetadataInput = {
  reason: string
  references: AuditRetentionReference[]
  action?: 'apply' | 'release'
  policy_id?: string
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

export type RetentionGovernanceStatusResponse = {
  schema_version: string
  checked_at: string
  request_id?: string | null
  immutable_storage: ImmutableStorageStatus
  retention_approval: RetentionApprovalStatus
  legal_hold_reviews: {
    scope_count: number
    items: LegalHoldReviewStatusItem[]
  }
  privacy: AuditRetentionStatusItem['privacy']
}

export type RetentionApprovalMetadataInput = {
  policy_version: string
  retention_mode: string
  retention_days: number
  policy_owner: string
  legal_compliance_approver: string
  approval_state: string
  reason: string
  evidence_references?: Record<string, unknown>[]
  next_review_due_at?: string | null
}

export type RetentionApprovalMetadataResponse = {
  schema_version: string
  updated_at: string
  request_id?: string | null
  status: string
  retention_approval: RetentionApprovalStatus
  privacy: AuditRetentionStatusItem['privacy']
}

export type LegalHoldReviewMetadataInput = {
  reason: string
  references: AuditRetentionReference[]
  owner: string
  reviewer: string
  review_cadence: string
  outcome?: string
  next_review_due_at?: string | null
  break_glass?: Record<string, unknown> | null
}

export type LegalHoldReviewMetadataResponse = {
  schema_version: string
  updated_at: string
  request_id?: string | null
  scope_count: number
  items: {
    reference: AuditRetentionReference
    scope_key: string
    status: string
    reason?: string | null
    review_id?: string | null
    outcome?: string | null
    owner?: string | null
    reviewer?: string | null
    next_review_due_at?: string | null
    review_version?: number | null
    privacy?: AuditRetentionStatusItem['privacy']
  }[]
  privacy: AuditRetentionStatusItem['privacy']
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

export type ReportEditDraftInput = ReportOperationTarget & {
  reason: string
  proposed_fields: Record<string, string | null>
}

export type ReportEditApplyInput = ReportOperationTarget & {
  draft_id: string
}

export type ReportEditApplyResponse = {
  operation: string
  operation_result: string
  draft: ReportEditDraft
  report: Record<string, unknown>
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

export type ReportArtifactEditPreviewInput = ReportOperationTarget & {
  reason: string
  proposed_fields: Record<string, unknown>
}

export type ReportArtifactEditApplyInput = ReportOperationTarget & {
  draft_id: string
  reason: string
}

export type ReportArtifactEditApplyResponse = {
  operation: string
  operation_result: string
  draft: ReportArtifactEditPreview
  report: Record<string, unknown>
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

export type ReportArtifactRollbackPreviewInput = ReportOperationTarget & {
  reason: string
}

export type ReportArtifactRollbackApplyInput = ReportOperationTarget & {
  preview_id: string
  reason: string
}

export type ReportArtifactRollbackApplyResponse = {
  operation: string
  operation_result: string
  preview: ReportArtifactRollbackPreview
  report: Record<string, unknown>
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

export type RecoveryEvidenceExportParams = {
  jobId?: string | null
  status?: string | null
  limit?: number
  includeTargets?: boolean
  includeJobAudit?: boolean
  targetLimit?: number
  auditLimit?: number
}

export type RecoveryEvidenceExport = {
  exported_at: string
  request_id?: string | null
  scope: 'recovery_job' | 'recent_recovery_jobs' | string
  complete: boolean
  filters: Record<string, unknown>
  jobs: RecoveryJob[]
  targets: RecoveryJobTarget[]
  job_audit: ReportAuditEvent[]
  report_audit: ReportAuditEvent[]
  next_tokens: {
    jobs?: string | null
    targets?: string | null
    job_audit?: string | null
    report_audit?: string | null
  }
  privacy: {
    metadata_only: boolean
    private_artifact_fields_omitted: boolean
  }
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

export type RecoveryJobSupportPackage = {
  exported_at: string
  request_id?: string | null
  scope: 'support_package' | string
  complete: boolean
  job: RecoveryJob
  source_job?: RecoveryJob | null
  rollup: Record<string, number>
  targets: RecoveryJobTarget[]
  job_audit: ReportAuditEvent[]
  report_audit: ReportAuditEvent[]
  operator_note?: string | null
  next_tokens: {
    targets?: string | null
    job_audit?: string | null
    report_audit?: string | null
  }
  privacy: {
    metadata_only: boolean
    private_artifact_fields_omitted: boolean
    redacted_operator_note?: boolean
  }
}

export type SupportHandoffDestinationMode = 'preview' | 'copy' | 'download' | 'external_write'

export type SupportHandoffPackageInput = {
  reason: string
  destination_mode: SupportHandoffDestinationMode
  recovery_job_ids?: string[]
  include_targets?: boolean
  include_job_audit?: boolean
  include_report_audit?: boolean
  target_limit?: number
  audit_limit?: number
  release_evidence?: Record<string, unknown> | null
  fixture?: {
    fixture_name: string
    expected_artifact_version?: string | null
  } | null
  operator_note?: string | null
}

export type SupportHandoffPackage = {
  schema_version: string
  package_id: string
  generated_at: string
  generated_by: string
  reason: string
  destination: {
    mode: SupportHandoffDestinationMode | string
    status: 'ready' | 'refused' | string
    refusal_reasons: string[]
  }
  evidence_references: Array<{ type: string; id: string }>
  sections: Array<{
    type: string
    reference?: { type: string; id: string } | null
    status: string
    data: Record<string, unknown>
  }>
  validation: {
    status: 'passed' | 'refused' | 'failed' | string
    failures?: string[]
    missing_references: Array<{ type: string; id: string }>
    skipped_sections: Array<{ type: string; reason: string }>
    privacy: {
      metadata_only: boolean
      private_artifact_fields_omitted: boolean
      passed: boolean
      violation_count: number
      violations: Array<Record<string, string>>
    }
  }
  audit: {
    correlation_id?: string | null
    audit_event_refs: Array<Record<string, string>>
  }
  copy?: { format: 'markdown' | string; text: string }
  download?: { filename: string; content_type: string }
}

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

export async function createReportEditDraft(input: ReportEditDraftInput) {
  const response = await httpClient.post<ReportEditDraft>(
    `/admin/reports/${input.parent_id}/${input.student_id}/${input.week_start}/edit-drafts`,
    {
      reason: input.reason,
      proposed_fields: input.proposed_fields,
    },
  )
  return response.data
}

export async function getReportEditDraft(input: ReportEditApplyInput) {
  const response = await httpClient.get<ReportEditDraft>(
    `/admin/reports/${input.parent_id}/${input.student_id}/${input.week_start}/edit-drafts/${input.draft_id}`,
  )
  return response.data
}

export async function applyReportEditDraft(input: ReportEditApplyInput) {
  const response = await httpClient.post<ReportEditApplyResponse>(
    `/admin/reports/${input.parent_id}/${input.student_id}/${input.week_start}/edit-drafts/${input.draft_id}/apply`,
  )
  return response.data
}

export async function createReportArtifactEditPreview(input: ReportArtifactEditPreviewInput) {
  const response = await httpClient.post<ReportArtifactEditPreview>(
    `/admin/reports/${input.parent_id}/${input.student_id}/${input.week_start}/artifact-edit-previews`,
    {
      reason: input.reason,
      proposed_fields: input.proposed_fields,
    },
  )
  return response.data
}

export async function applyReportArtifactEditPreview(input: ReportArtifactEditApplyInput) {
  const response = await httpClient.post<ReportArtifactEditApplyResponse>(
    `/admin/reports/${input.parent_id}/${input.student_id}/${input.week_start}/artifact-edit-previews/${input.draft_id}/apply`,
    { reason: input.reason },
  )
  return response.data
}

export async function createReportArtifactRollbackPreview(input: ReportArtifactRollbackPreviewInput) {
  const response = await httpClient.post<ReportArtifactRollbackPreview>(
    `/admin/reports/${input.parent_id}/${input.student_id}/${input.week_start}/artifact-rollback-previews`,
    { reason: input.reason },
  )
  return response.data
}

export async function applyReportArtifactRollbackPreview(input: ReportArtifactRollbackApplyInput) {
  const response = await httpClient.post<ReportArtifactRollbackApplyResponse>(
    `/admin/reports/${input.parent_id}/${input.student_id}/${input.week_start}/artifact-rollback-previews/${input.preview_id}/apply`,
    { reason: input.reason },
  )
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

export async function getRecoveryEvidenceExport(params: RecoveryEvidenceExportParams = {}) {
  const response = await httpClient.get<RecoveryEvidenceExport>('/admin/reports/recovery-evidence', {
    params: {
      job_id: params.jobId || undefined,
      status: params.status || undefined,
      limit: params.limit,
      include_targets: params.includeTargets,
      include_job_audit: params.includeJobAudit,
      target_limit: params.targetLimit,
      audit_limit: params.auditLimit,
    },
  })
  return response.data
}

export async function getRecoveryJobSupportPackage(input: {
  jobId: string
  includeTargets?: boolean
  includeJobAudit?: boolean
  includeReportAudit?: boolean
  targetLimit?: number
  auditLimit?: number
  note?: string | null
}) {
  const response = await httpClient.get<RecoveryJobSupportPackage>(
    `/admin/reports/recovery-jobs/${input.jobId}/support-package`,
    {
      params: {
        include_targets: input.includeTargets,
        include_job_audit: input.includeJobAudit,
        include_report_audit: input.includeReportAudit,
        target_limit: input.targetLimit,
        audit_limit: input.auditLimit,
        note: input.note || undefined,
      },
    },
  )
  return response.data
}

export async function createSupportHandoffPackage(input: SupportHandoffPackageInput) {
  const response = await httpClient.post<SupportHandoffPackage>(
    '/admin/reports/support-handoff-package',
    input,
  )
  return response.data
}

export async function getAuditRetentionStatus(input: { references: AuditRetentionReference[]; limit?: number }) {
  const response = await httpClient.post<AuditRetentionStatusResponse>(
    '/admin/reports/audit-retention/status',
    input,
  )
  return response.data
}

export async function createAuditRetentionManifest(input: AuditRetentionManifestInput) {
  const response = await httpClient.post<AuditRetentionManifest>(
    '/admin/reports/audit-retention/manifest',
    input,
  )
  return response.data
}

export async function getImmutableEvidenceStatus(input: { references: AuditRetentionReference[]; limit?: number }) {
  const response = await httpClient.post<ImmutableEvidenceStatusResponse>(
    '/admin/reports/immutable-evidence/status',
    input,
  )
  return response.data
}

export async function persistImmutableEvidenceManifest(input: ImmutableEvidencePersistInput) {
  const response = await httpClient.post<ImmutableEvidencePersistResponse>(
    '/admin/reports/immutable-evidence/persist',
    input,
  )
  return response.data
}

export async function getLegalHoldStatus(input: { references: AuditRetentionReference[]; limit?: number }) {
  const response = await httpClient.post<LegalHoldStatusResponse>(
    '/admin/reports/legal-holds/status',
    input,
  )
  return response.data
}

export async function applyLegalHoldMetadata(input: LegalHoldMetadataInput) {
  const response = await httpClient.post<LegalHoldStatusResponse>(
    '/admin/reports/legal-holds',
    input,
  )
  return response.data
}

export async function getRetentionGovernanceStatus(input: {
  policy_version?: string
  references?: AuditRetentionReference[]
  limit?: number
}) {
  const response = await httpClient.post<RetentionGovernanceStatusResponse>(
    '/admin/reports/retention-governance/status',
    input,
  )
  return response.data
}

export async function recordRetentionApprovalMetadata(input: RetentionApprovalMetadataInput) {
  const response = await httpClient.post<RetentionApprovalMetadataResponse>(
    '/admin/reports/retention-governance/approval',
    input,
  )
  return response.data
}

export async function recordLegalHoldReviewMetadata(input: LegalHoldReviewMetadataInput) {
  const response = await httpClient.post<LegalHoldReviewMetadataResponse>(
    '/admin/reports/legal-holds/review',
    input,
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
