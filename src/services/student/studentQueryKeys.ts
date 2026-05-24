export const studentQueryKeys = {
  all: ['student'] as const,
  profile: () => [...studentQueryKeys.all, 'profile'] as const,
  learningHistory: () => [...studentQueryKeys.all, 'learning-history'] as const,
}
