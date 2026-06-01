import {
  createMockQuestionBankSession,
  evaluateMockQuestionBankAnswer,
  filterMockQuestionBankSets,
  getMockQuestionBankMistakes,
  getMockQuestionBankOverview,
  getMockQuestionBankQuestionsForSet,
  getMockQuestionBankResult,
  getMockQuestionBankSavedSets,
  getMockQuestionBankSession,
  getMockQuestionBankSet,
  getMockQuestionBankSubject,
  getMockQuestionBankTopic,
  searchMockQuestionBank,
} from '@/data/mockQuestionBank'
import type { QuestionBankFilters } from '@/types/questionBank'

export async function getQuestionBankOverview() {
  return getMockQuestionBankOverview()
}

export async function getQuestionBankSubject(subjectId: string) {
  const subject = getMockQuestionBankSubject(subjectId)
  if (!subject) {
    throw new Error(`Question Bank subject not found: ${subjectId}`)
  }
  return subject
}

export async function getQuestionBankTopic(subjectId: string, topicId: string, filters: QuestionBankFilters = {}) {
  const topic = getMockQuestionBankTopic(subjectId, topicId)
  if (!topic) {
    throw new Error(`Question Bank topic not found: ${subjectId}/${topicId}`)
  }
  return {
    ...topic,
    sets: filterMockQuestionBankSets(topic.sets, filters),
  }
}

export async function getQuestionBankSet(setId: string) {
  const setItem = getMockQuestionBankSet(setId)
  if (!setItem) {
    throw new Error(`Question Bank set not found: ${setId}`)
  }
  return {
    set: setItem,
    questions: getMockQuestionBankQuestionsForSet(setId),
  }
}

export async function createQuestionBankSession(setId: string) {
  return createMockQuestionBankSession(setId)
}

export async function getQuestionBankSession(sessionId: string) {
  const session = getMockQuestionBankSession(sessionId)
  return {
    session,
    set: await getQuestionBankSet(session.setId),
  }
}

export async function submitQuestionBankAnswer({
  questionId,
  answer,
}: {
  questionId: string
  answer: string | string[]
}) {
  return evaluateMockQuestionBankAnswer(questionId, answer)
}

export async function getQuestionBankResult(sessionId: string) {
  return getMockQuestionBankResult(sessionId)
}

export async function getQuestionBankMistakes(filters: QuestionBankFilters = {}) {
  return getMockQuestionBankMistakes(filters)
}

export async function getQuestionBankSavedSets() {
  return getMockQuestionBankSavedSets()
}

export async function searchQuestionBank(query: string) {
  return searchMockQuestionBank(query)
}
