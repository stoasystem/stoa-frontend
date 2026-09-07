import i18n from '@/i18n'

// Titles come back from the backend in the student's locale, so any key that
// carries a subject/topic/unit/lesson title must include the active language —
// otherwise switching languages keeps serving the response cached under
// whichever language happened to fetch it first.
export const practiceQueryKeys = {
  all: ['practice'] as const,
  overview: () => [...practiceQueryKeys.all, 'overview', i18n.language] as const,
  subjects: () => [...practiceQueryKeys.all, 'subjects', i18n.language] as const,
  subjectPath: (subjectId: string, topicId: string) => [...practiceQueryKeys.subjects(), subjectId, 'topics', topicId, 'path'] as const,
  roadmap: (subjectId: string, topicId: string) => [...practiceQueryKeys.all, 'roadmap', subjectId, topicId, i18n.language] as const,
  lesson: (lessonId: string) => [...practiceQueryKeys.all, 'lessons', lessonId, i18n.language] as const,
  lessonResult: (lessonId: string) => [...practiceQueryKeys.lesson(lessonId), 'result'] as const,
  mistakes: () => [...practiceQueryKeys.all, 'mistakes'] as const,
  curriculumCatalog: (subjectId?: string, gradeLevel?: string, includePreview?: boolean) =>
    [...practiceQueryKeys.all, 'curriculum-catalog', subjectId ?? 'all', gradeLevel ?? 'all', includePreview ? 'preview' : 'active', i18n.language] as const,
  curriculumProgress: (studentId?: string, subjectId?: string) =>
    [...practiceQueryKeys.all, 'curriculum-progress', studentId ?? 'self', subjectId ?? 'all'] as const,
  reviewDue: () => [...practiceQueryKeys.all, 'review-due'] as const,
  reviewSummary: () => [...practiceQueryKeys.all, 'review-summary'] as const,
}
