export type AutomationPolicy = {
  policyId?: string
  name?: string
  status: 'active' | 'paused' | 'off'
  autonomyLevel: 'suggest_only' | 'tutor_approved_batch' | 'auto_create_reviewed' | 'off'
  studentIds?: string[]
  subjectIds?: string[]
  topicIds?: string[]
  sourceTypes: Array<'ai_draft' | 'curriculum_exercise' | 'recommendation'>
  maxAssignmentsPerStudent: number
  confidenceThreshold: 'low' | 'medium' | 'high'
  freshnessDays: number
  dueInDays: number
  deliveryMode: 'recommended' | 'assigned'
  pausedReason?: string | null
}

export type AutomationCandidate = {
  candidateId: string
  type?: string | null
  sourceType: string
  sourceId: string
  title?: string | null
  subject?: string | null
  topicId?: string | null
  topicIds: string[]
  confidence?: string | null
  freshness?: Record<string, unknown>
  rationale?: string | null
  expectedImpact?: string | null
  reviewStatus?: string | null
  proposedStatus?: string | null
  dueAt?: string | null
  sourceSignals?: Record<string, unknown>
  reviewRequired: boolean
  autonomousDecision: boolean
  refusalCode?: string
  refusalReason?: string
  approved?: boolean
}

export type AutomationBatchSummary = {
  selectedCount: number
  refusedCount: number
  topTopics: string[]
  duplicateCount: number
  lowConfidenceCount: number
  staleCount: number
  reviewRequiredCount: number
  refusalCounts: Record<string, number>
}

export type AutomationPreviewResponse = {
  batchId: string
  policyId: string
  policy: AutomationPolicy
  studentId: string
  createdBy: string
  createdAt: string
  status: 'preview'
  selected: AutomationCandidate[]
  refused: AutomationCandidate[]
  summary: AutomationBatchSummary
  reviewRequired: boolean
  autonomousDecision: boolean
}

export type AssignmentAutomation = {
  policyId?: string | null
  batchId?: string | null
  candidateId?: string | null
  autonomyLevel?: string | null
  deliveryState?: string | null
  reviewRequired?: boolean
  autonomousDecision?: boolean
  explanation?: string | null
  createdBy?: string | null
  createdAt?: string | null
  automationKey?: string | null
  deliveryMode?: string | null
  sourceSignals?: Record<string, unknown>
  resultEvidence?: Record<string, unknown>
}

export type LearningAssignment = {
  assignmentId: string
  studentId: string
  status: string
  sourceType: string
  sourceId: string
  title?: string | null
  subject?: string | null
  topicIds: string[]
  lessonId?: string | null
  exerciseId?: string | null
  rationale?: string | null
  createdBy?: string | null
  createdByRole?: string | null
  reviewed: boolean
  createdAt?: string | null
  updatedAt?: string | null
  assignedAt?: string | null
  startedAt?: string | null
  completedAt?: string | null
  skippedAt?: string | null
  archivedAt?: string | null
  dueAt?: string | null
  note?: string | null
  completionResult?: Record<string, unknown> | null
  sequencingFeedback?: Record<string, unknown> | null
  automation?: AssignmentAutomation
}

export type AssignmentListResponse = {
  items: LearningAssignment[]
  count: number
}

export type AutomationExecutionResult = {
  candidateId: string
  automationKey: string
  status: 'assigned' | 'delivered' | 'created' | 'skipped' | 'refused' | 'duplicate' | 'failed' | string
  reason: string
  assignmentId?: string
  assignment?: LearningAssignment
  refusalCode?: string
  evidence?: Record<string, unknown>
}

export type AutomationExecuteResponse = {
  batchId: string
  policyId: string
  studentId: string
  status: 'executed' | string
  results: AutomationExecutionResult[]
  summary: Record<string, number>
  reviewRequired: boolean
  autonomousDecision: boolean
}

export type CurriculumQualityMetric = {
  publicId: string
  contentType: string
  versionId: string
  subjectId?: string | null
  topicId?: string | null
  totalSignals: number
  wrongAnswers: number
  assignmentStarts: number
  assignmentSkips: number
  assignmentArchives: number
  assignmentCompletions: number
  lessonCompletions: number
  completions: number
  publishEvents: number
  archiveEvents: number
  priorityScore: number
  updatedAt?: string | null
}

export type CurriculumAnalyticsDashboard = {
  generatedAt: string
  filters: Record<string, unknown>
  sampleSize: number
  sampled: boolean
  summary: Record<string, number>
  sequencingCoverage: Record<string, number>
  qualityHotspots: CurriculumQualityMetric[]
  interventions: Array<Record<string, unknown>>
  emptyState?: string | null
  privacy: Record<string, boolean>
}

export type WarehouseReadiness = {
  state: string
  exportAllowed: boolean
  liveWarehouseConfigured: boolean
  schemaVersion: string
  sources: Array<Record<string, unknown>>
  sourceSchemas: Record<string, Record<string, unknown>>
  lastMetricAt?: string | null
  blockers: string[]
  warnings: string[]
  privacy: Record<string, boolean>
}

export type WarehouseExportSummary = {
  schemaVersion: string
  count: number
  filters: Record<string, unknown>
  window: Record<string, unknown>
  privacy: Record<string, boolean>
}

export type ParentProgressResponse = {
  studentId: string
  weakAreas: Array<Record<string, unknown>>
  recommendations: AutomationCandidate[]
  sequencingSummary: Record<string, unknown>
  assignedPracticeCount: number
  completedPracticeCount: number
  freshness: Record<string, unknown>
  assignments: LearningAssignment[]
  completedAssignments: LearningAssignment[]
}
