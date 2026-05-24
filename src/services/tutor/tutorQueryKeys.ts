export const tutorQueryKeys = {
  all: ['tutor'] as const,
  helpRequests: () => [...tutorQueryKeys.all, 'help-requests'] as const,
  helpRequestDetail: (requestId: string) => [...tutorQueryKeys.helpRequests(), requestId] as const,
}
