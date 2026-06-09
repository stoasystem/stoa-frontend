export const tutorQueryKeys = {
  all: ['tutor'] as const,
  profile: () => [...tutorQueryKeys.all, 'profile'] as const,
  stats: () => [...tutorQueryKeys.all, 'stats'] as const,
  helpRequests: () => [...tutorQueryKeys.all, 'help-requests'] as const,
  helpRequestDetail: (requestId: string) => [...tutorQueryKeys.helpRequests(), requestId] as const,
  assistanceSummary: (questionId: string) => [...tutorQueryKeys.all, 'assistance-summary', questionId] as const,
  aiTeacherDrafts: () => [...tutorQueryKeys.all, 'ai-teacher-drafts'] as const,
  aiTeacherDraft: (draftId: string) => [...tutorQueryKeys.aiTeacherDrafts(), draftId] as const,
}
