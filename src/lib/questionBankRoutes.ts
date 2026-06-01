import type { QuestionBankMistake, QuestionBankSet } from '@/types/questionBank'

export function getQuestionBankPath() {
  return '/question-bank'
}

export function getQuestionBankSubjectPath(subjectId: string) {
  return `/question-bank/${subjectId}`
}

export function getQuestionBankTopicPath(subjectId: string, topicId: string) {
  return `/question-bank/${subjectId}/${topicId}`
}

export function getQuestionBankSetPath(setId: string) {
  return `/question-bank/sets/${setId}`
}

export function getQuestionBankSessionPath(sessionId: string) {
  return `/question-bank/session/${sessionId}`
}

export function getQuestionBankResultPath(sessionId: string) {
  return `/question-bank/session/${sessionId}/result`
}

export function getQuestionBankMistakesPath() {
  return '/question-bank/mistakes'
}

export function getQuestionBankSavedPath() {
  return '/question-bank/saved'
}

export function getQuestionBankSetPracticePath(set: Pick<QuestionBankSet, 'id' | 'status'>) {
  return getQuestionBankSetPath(set.id)
}

export function getQuestionBankMistakeSetPath(mistake: Pick<QuestionBankMistake, 'setId'>) {
  return getQuestionBankSetPath(mistake.setId)
}
