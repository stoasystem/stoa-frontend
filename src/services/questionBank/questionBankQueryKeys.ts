import i18n from '@/i18n'

// Same reasoning as practiceQueryKeys: these responses carry curriculum
// titles in the student's locale, so the key must vary with it or a
// language switch keeps showing whatever was cached first.
export const questionBankQueryKeys = {
  all: ['question-bank'] as const,
  overview: () => [...questionBankQueryKeys.all, 'overview', i18n.language] as const,
  subject: (subjectId: string) => [...questionBankQueryKeys.all, 'subjects', subjectId, i18n.language] as const,
  topic: (subjectId: string, topicId: string) =>
    [...questionBankQueryKeys.subject(subjectId), 'topics', topicId] as const,
  set: (setId: string) => [...questionBankQueryKeys.all, 'sets', setId, i18n.language] as const,
  session: (sessionId: string) => [...questionBankQueryKeys.all, 'sessions', sessionId] as const,
  result: (sessionId: string) => [...questionBankQueryKeys.session(sessionId), 'result'] as const,
  mistakes: () => [...questionBankQueryKeys.all, 'mistakes'] as const,
  saved: () => [...questionBankQueryKeys.all, 'saved'] as const,
  search: (query: string) => [...questionBankQueryKeys.all, 'search', query, i18n.language] as const,
}
