export const practiceQueryKeys = {
  all: ['practice'] as const,
  overview: () => [...practiceQueryKeys.all, 'overview'] as const,
  subjects: () => [...practiceQueryKeys.all, 'subjects'] as const,
  subjectPath: (subjectId: string) => [...practiceQueryKeys.subjects(), subjectId, 'path'] as const,
  lesson: (lessonId: string) => [...practiceQueryKeys.all, 'lessons', lessonId] as const,
  lessonResult: (lessonId: string) => [...practiceQueryKeys.lesson(lessonId), 'result'] as const,
  mistakes: () => [...practiceQueryKeys.all, 'mistakes'] as const,
  parentSummary: (childId: string) => [...practiceQueryKeys.all, 'parent-summary', childId] as const,
}
