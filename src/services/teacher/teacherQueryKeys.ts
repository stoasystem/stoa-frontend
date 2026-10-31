export const teacherQueryKeys = {
  all: ['teacher'] as const,
  profile: () => [...teacherQueryKeys.all, 'profile'] as const,
  stats: () => [...teacherQueryKeys.all, 'stats'] as const,
  helpRequests: () => [...teacherQueryKeys.all, 'help-requests'] as const,
  helpRequestDetail: (requestId: string) => [...teacherQueryKeys.helpRequests(), requestId] as const,
  // Not under the request's own key, so nothing done to the request's queries
  // (a remove, a reset) takes the pictures with it. Invalidation alone would not
  // read them again either way: their query is `staleTime: 'static'` (#510).
  helpRequestAttachment: (requestId: string, attachmentId: string) =>
    [...teacherQueryKeys.all, 'help-request-attachment', requestId, attachmentId] as const,
  assistanceSummary: (questionId: string) => [...teacherQueryKeys.all, 'assistance-summary', questionId] as const,
}
