// Same reasoning as practiceQueryKeys: these responses carry curriculum
// titles in the student's locale, so the key must vary with it (passed in
// from the calling hook's useTranslation().i18n.language) or a language
// switch keeps showing whatever was cached first.
export const questionBankQueryKeys = {
  all: ['question-bank'] as const,
  overview: (language: string) => [...questionBankQueryKeys.all, 'overview', language] as const,
  subject: (subjectId: string, language: string) => [...questionBankQueryKeys.all, 'subjects', subjectId, language] as const,
  topic: (subjectId: string, topicId: string, language: string) =>
    [...questionBankQueryKeys.subject(subjectId, language), 'topics', topicId] as const,
  set: (setId: string, language: string) => [...questionBankQueryKeys.all, 'sets', setId, language] as const,
  session: (sessionId: string) => [...questionBankQueryKeys.all, 'sessions', sessionId] as const,
  result: (sessionId: string) => [...questionBankQueryKeys.session(sessionId), 'result'] as const,
  mistakes: () => [...questionBankQueryKeys.all, 'mistakes'] as const,
  saved: () => [...questionBankQueryKeys.all, 'saved'] as const,
  search: (query: string, language: string) => [...questionBankQueryKeys.all, 'search', query, language] as const,
}
