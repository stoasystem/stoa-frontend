export const parentQueryKeys = {
  all: ['parent'] as const,
  children: () => [...parentQueryKeys.all, 'children'] as const,
  childSummary: (childId: string) => [...parentQueryKeys.children(), childId, 'summary'] as const,
  childHistory: (childId: string) => [...parentQueryKeys.children(), childId, 'history'] as const,
  childReport: (childId: string) => [...parentQueryKeys.children(), childId, 'report'] as const,
}
