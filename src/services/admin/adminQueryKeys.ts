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
}
