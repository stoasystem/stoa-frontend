export const chatQueryKeys = {
  all: ['chat'] as const,
  conversations: () => [...chatQueryKeys.all, 'conversations'] as const,
  conversation: (conversationId: string) =>
    [...chatQueryKeys.conversations(), conversationId] as const,
  teacherAvailability: () =>
    [...chatQueryKeys.all, 'teacher-availability'] as const,
  teacherHelpRequest: (requestId: string) =>
    [...chatQueryKeys.all, 'teacher-help-request', requestId] as const,
}
