export const teacherQueryKeys = {
  all: ['teacher'] as const,
  profile: () => [...teacherQueryKeys.all, 'profile'] as const,
  stats: () => [...teacherQueryKeys.all, 'stats'] as const,
  helpRequests: () => [...teacherQueryKeys.all, 'help-requests'] as const,
  helpRequestDetail: (requestId: string) => [...teacherQueryKeys.helpRequests(), requestId] as const,
  assistanceSummary: (questionId: string) => [...teacherQueryKeys.all, 'assistance-summary', questionId] as const,
  aiTeacherDrafts: () => [...teacherQueryKeys.all, 'ai-teacher-drafts'] as const,
  aiTeacherDraft: (draftId: string) => [...teacherQueryKeys.aiTeacherDrafts(), draftId] as const,
}
