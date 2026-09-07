// Titles come back from the backend in the student's locale, so any key that
// carries a subject/topic/unit/lesson title takes the active language as an
// explicit argument — otherwise switching languages keeps serving the
// response cached under whichever language happened to fetch it first.
// The language is passed in (from useTranslation()'s i18n.language in the
// calling hook) rather than read from the shared i18n singleton here, so this
// module stays free of react-i18next's side-effecting init for callers/tests
// that only need the key shape.
export const practiceQueryKeys = {
  all: ['practice'] as const,
  overview: (language: string) => [...practiceQueryKeys.all, 'overview', language] as const,
  subjects: (language: string) => [...practiceQueryKeys.all, 'subjects', language] as const,
  subjectPath: (subjectId: string, topicId: string, language: string) =>
    [...practiceQueryKeys.subjects(language), subjectId, 'topics', topicId, 'path'] as const,
  roadmap: (subjectId: string, topicId: string, language: string) =>
    [...practiceQueryKeys.all, 'roadmap', subjectId, topicId, language] as const,
  lesson: (lessonId: string, language: string) => [...practiceQueryKeys.all, 'lessons', lessonId, language] as const,
  // Not locale-bearing (lessonId, completion flags, streak) — no language needed.
  lessonResult: (lessonId: string) => [...practiceQueryKeys.all, 'lessons', lessonId, 'result'] as const,
  mistakes: () => [...practiceQueryKeys.all, 'mistakes'] as const,
  curriculumCatalog: (subjectId: string | undefined, gradeLevel: string | undefined, includePreview: boolean | undefined, language: string) =>
    [...practiceQueryKeys.all, 'curriculum-catalog', subjectId ?? 'all', gradeLevel ?? 'all', includePreview ? 'preview' : 'active', language] as const,
  curriculumProgress: (studentId?: string, subjectId?: string) =>
    [...practiceQueryKeys.all, 'curriculum-progress', studentId ?? 'self', subjectId ?? 'all'] as const,
  reviewDue: () => [...practiceQueryKeys.all, 'review-due'] as const,
  reviewSummary: () => [...practiceQueryKeys.all, 'review-summary'] as const,
}
