// Responses here carry curriculum titles in the reader's language. The language
// is NOT part of these keys: a language switch invalidates every query at once
// (see registerLanguageQueryInvalidation), which refetches in the background
// and leaves the previous content on screen until the new one lands. Keying by
// language instead made every switch a cache miss, so the whole screen dropped
// to skeletons and the student watched it reload.
export const practiceQueryKeys = {
  all: ['practice'] as const,
  overview: () => [...practiceQueryKeys.all, 'overview'] as const,
  subjects: () => [...practiceQueryKeys.all, 'subjects'] as const,
  subjectPath: (subjectId: string, topicId: string) =>
    [...practiceQueryKeys.subjects(), subjectId, 'topics', topicId, 'path'] as const,
  roadmap: (subjectId: string, topicId: string) =>
    [...practiceQueryKeys.all, 'roadmap', subjectId, topicId] as const,
  lesson: (lessonId: string) => [...practiceQueryKeys.all, 'lessons', lessonId] as const,
  lessonResult: (lessonId: string) => [...practiceQueryKeys.all, 'lessons', lessonId, 'result'] as const,
  mistakes: () => [...practiceQueryKeys.all, 'mistakes'] as const,
  curriculumCatalog: (
    subjectId: string | undefined,
    gradeLevel: string | undefined,
    includePreview: boolean | undefined,
  ) =>
    [
      ...practiceQueryKeys.all,
      'curriculum-catalog',
      subjectId ?? 'all',
      gradeLevel ?? 'all',
      includePreview ? 'preview' : 'active',
    ] as const,
  curriculumProgress: (studentId?: string, subjectId?: string) =>
    [...practiceQueryKeys.all, 'curriculum-progress', studentId ?? 'self', subjectId ?? 'all'] as const,
  reviewDue: () => [...practiceQueryKeys.all, 'review-due'] as const,
  reviewSummary: () => [...practiceQueryKeys.all, 'review-summary'] as const,
}
