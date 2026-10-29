export const teacherQueryKeys = {
  all: ['teacher'] as const,
  profile: () => [...teacherQueryKeys.all, 'profile'] as const,
  stats: () => [...teacherQueryKeys.all, 'stats'] as const,
  helpRequests: () => [...teacherQueryKeys.all, 'help-requests'] as const,
  helpRequestDetail: (requestId: string) => [...teacherQueryKeys.helpRequests(), requestId] as const,
  // Not under the request's own key: invalidating the request after a reply
  // must not read every picture in it again (#510).
  helpRequestAttachment: (requestId: string, attachmentId: string) =>
    [...teacherQueryKeys.all, 'help-request-attachment', requestId, attachmentId] as const,
  assistanceSummary: (questionId: string) => [...teacherQueryKeys.all, 'assistance-summary', questionId] as const,
}
