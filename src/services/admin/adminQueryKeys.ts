export const adminQueryKeys = {
  all: ['admin'] as const,
  platformStats: () => [...adminQueryKeys.all, 'platform-stats'] as const,
  usageSummary: () => [...adminQueryKeys.all, 'usage-summary'] as const,
  feedback: () => [...adminQueryKeys.all, 'feedback'] as const,
  reportOperations: () => [...adminQueryKeys.all, 'report-operations'] as const,
  reportRecoveryJobs: () => [...adminQueryKeys.all, 'report-recovery-jobs'] as const,
  reportRecoveryEvidence: () => [...adminQueryKeys.all, 'report-recovery-evidence'] as const,
  moderationCases: () => [...adminQueryKeys.all, 'moderation-cases'] as const,
  subscriptionRequests: () => [...adminQueryKeys.all, 'subscription-requests'] as const,
  subscriptionBilling: () => [...adminQueryKeys.all, 'subscription-billing'] as const,
  accountsAll: () => [...adminQueryKeys.all, 'accounts'] as const,
  accounts: (filters: Record<string, unknown>) => [...adminQueryKeys.all, 'accounts', filters] as const,
  teacherSupportAllowance: (studentId: string) => [...adminQueryKeys.all, 'teacher-support-allowance', studentId] as const,
  // Every usage day of one parent: a write that changes the parent's children
  // has to reach the query whatever `?day=` it was read with (#262).
  accountOperationsForParent: (parentId?: string) => [...adminQueryKeys.all, 'account-operations', parentId ?? ''] as const,
  accountOperations: (parentId?: string, day?: string) => [...adminQueryKeys.accountOperationsForParent(parentId), day ?? ''] as const,
  // Every read of the curriculum console: a migration apply can write any
  // lesson, so it refreshes all of them (#404).
  curriculumAll: () => [...adminQueryKeys.all, 'curriculum'] as const,
  // Every worklist, whatever status it was filtered by.
  curriculumWorklistAll: () => [...adminQueryKeys.curriculumAll(), 'worklist'] as const,
  curriculumWorklist: (status?: string) => [...adminQueryKeys.curriculumWorklistAll(), status ?? ''] as const,
  curriculumPreview: (publicLessonId: string, versionId: string) => [...adminQueryKeys.curriculumAll(), 'preview', publicLessonId, versionId] as const,
  curriculumValidation: (publicLessonId: string, versionId: string) => [...adminQueryKeys.curriculumAll(), 'validation', publicLessonId, versionId] as const,
  curriculumAudit: (publicLessonId: string) => [...adminQueryKeys.curriculumAll(), 'audit', publicLessonId] as const,
  // Every comparison of one lesson's versions: a patch changes each pair that
  // holds the draft, on either side (#404).
  curriculumDiffsOf: (publicLessonId: string) => [...adminQueryKeys.curriculumAll(), 'diff', publicLessonId] as const,
  curriculumDiff: (publicLessonId: string, fromVersionId: string, toVersionId: string) => [...adminQueryKeys.curriculumDiffsOf(publicLessonId), fromVersionId, toVersionId] as const,
  curriculumMigrationEvidence: (migrationId: string) => [...adminQueryKeys.curriculumAll(), 'migration', migrationId] as const,
}
