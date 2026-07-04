export type CurriculumCapability =
  | 'curriculum_author'
  | 'curriculum_reviewer'
  | 'curriculum_publisher'
  | 'migration_operator'

export type CurriculumVersion = {
  publicLessonId: string
  versionId: string
  state: string
  reviewState?: string | null
  updatedAt?: string | null
  updatedBy?: string | null
  lesson?: Record<string, unknown> | null
  exercises?: Record<string, unknown>[] | null
}

export type CurriculumWorklistResponse = {
  items: CurriculumVersion[]
  count: number
  permissionDenied?: boolean
}

export type CurriculumValidationIssue = {
  severity: string
  field: string
  message: string
  hint?: string | null
}

export type CurriculumValidationPreview = {
  publicLessonId: string
  versionId: string
  status: string
  publishReady: boolean
  issues: CurriculumValidationIssue[]
  issueCount: number
}

export type CurriculumDiffChange = {
  path: string
  type: string
  before?: unknown
  after?: unknown
}

export type CurriculumDiffResponse = {
  publicLessonId: string
  fromVersionId: string
  toVersionId: string
  changes: CurriculumDiffChange[]
  changeCount: number
}

export type CurriculumAuditEvent = {
  eventId: string
  publicLessonId: string
  versionId?: string | null
  operation: string
  fromState?: string | null
  toState?: string | null
  reason?: string | null
  actorId: string
  actorRole?: string | null
  actorCapabilities: CurriculumCapability[]
  createdAt?: string | null
}

export type CurriculumAuditResponse = {
  publicLessonId: string
  items: CurriculumAuditEvent[]
  count: number
  nextToken?: string | null
  permissionDenied?: boolean
}

export type CurriculumPatchInput = {
  publicLessonId: string
  versionId: string
  payload: Record<string, unknown>
}

export type CurriculumReviewNoteInput = {
  publicLessonId: string
  versionId: string
  reason: string
}

export type CurriculumPublishInput = {
  publicLessonId: string
  versionId: string
  expectedPublishedVersionId?: string | null
  reason?: string | null
}

export type CurriculumMigrationRow = {
  rowIndex: number
  publicLessonId: string
  action: string
  status?: string
  publishIntent: boolean
  validationIssues: CurriculumValidationIssue[]
  conflicts: Record<string, unknown>[]
  versionId?: string
  pointer?: Record<string, unknown> | null
  manifest?: Record<string, unknown> | null
  rollback?: Record<string, unknown> | null
}

export type CurriculumMigrationSummary = {
  total: number
  creates: number
  updates: number
  skips: number
  conflicts: number
  errors: number
}

export type CurriculumMigrationDryRunResponse = {
  migrationId: string
  confirmationToken: string
  source: Record<string, unknown>
  operatorNote?: string | null
  summary: CurriculumMigrationSummary
  rows: CurriculumMigrationRow[]
  publishReady: boolean
}

export type CurriculumMigrationApplyInput = {
  migrationId: string
  manifest: Record<string, unknown>
  confirmationToken: string
}

export type CurriculumMigrationEvidenceResponse = {
  migrationId: string
  status: string
  source: Record<string, unknown>
  operatorNote?: string | null
  summary: CurriculumMigrationSummary
  rows: CurriculumMigrationRow[]
  appliedBy?: string | null
  appliedAt?: string | null
  idempotent?: boolean | null
  permissionDenied?: boolean
}
