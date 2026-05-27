export const practiceQueryKeys = {
  all: ['practice'] as const,
  overview: () => [...practiceQueryKeys.all, 'overview'] as const,
  subjects: () => [...practiceQueryKeys.all, 'subjects'] as const,
  subjectPath: (subjectId: string, topicId: string) => [...practiceQueryKeys.subjects(), subjectId, 'topics', topicId, 'path'] as const,
  roadmap: (subjectId: string, topicId: string) => [...practiceQueryKeys.all, 'roadmap', subjectId, topicId] as const,
  lesson: (lessonId: string) => [...practiceQueryKeys.all, 'lessons', lessonId] as const,
  lessonResult: (lessonId: string) => [...practiceQueryKeys.lesson(lessonId), 'result'] as const,
  mistakes: () => [...practiceQueryKeys.all, 'mistakes'] as const,
  parentSummary: (childId: string) => [...practiceQueryKeys.all, 'parent-summary', childId] as const,
}
