export const tutorQueryKeys = {
  all: ['tutor'] as const,
  profile: () => [...tutorQueryKeys.all, 'profile'] as const,
  stats: () => [...tutorQueryKeys.all, 'stats'] as const,
  helpRequests: () => [...tutorQueryKeys.all, 'help-requests'] as const,
  helpRequestDetail: (requestId: string) => [...tutorQueryKeys.helpRequests(), requestId] as const,
}
