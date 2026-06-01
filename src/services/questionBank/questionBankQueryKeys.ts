export const questionBankQueryKeys = {
  all: ['question-bank'] as const,
  overview: () => [...questionBankQueryKeys.all, 'overview'] as const,
  subject: (subjectId: string) => [...questionBankQueryKeys.all, 'subjects', subjectId] as const,
  topic: (subjectId: string, topicId: string) =>
    [...questionBankQueryKeys.subject(subjectId), 'topics', topicId] as const,
  set: (setId: string) => [...questionBankQueryKeys.all, 'sets', setId] as const,
  session: (sessionId: string) => [...questionBankQueryKeys.all, 'sessions', sessionId] as const,
  result: (sessionId: string) => [...questionBankQueryKeys.session(sessionId), 'result'] as const,
  mistakes: () => [...questionBankQueryKeys.all, 'mistakes'] as const,
  saved: () => [...questionBankQueryKeys.all, 'saved'] as const,
  search: (query: string) => [...questionBankQueryKeys.all, 'search', query] as const,
}
