export const studentQueryKeys = {
  all: ['student'] as const,
  profile: () => [...studentQueryKeys.all, 'profile'] as const,
  learningHistory: () => [...studentQueryKeys.all, 'learning-history'] as const,
  learningProfile: (studentId?: string) => [...studentQueryKeys.all, 'learning-profile', studentId ?? 'me'] as const,
}
