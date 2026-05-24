export const chatQueryKeys = {
  all: ['chat'] as const,
  conversations: () => [...chatQueryKeys.all, 'conversations'] as const,
  conversation: (conversationId: string) =>
    [...chatQueryKeys.conversations(), conversationId] as const,
}
