import {
  completeMockLesson,
  getMockLesson,
  getMockMistakes,
  getMockPracticeHint,
  getMockPracticeOverview,
  getMockPracticeParentSummary,
  getMockPracticePath,
  getMockPracticeRoadmap,
  practiceSubjects,
  submitMockChallengeAnswer,
} from '@/data/mockPractice'
import { apiMode, enableDemoApi } from '@/lib/env'
import { httpClient } from '@/services/api/httpClient'
import { withDemoFallback } from '@/services/demo/demoFallback'
import type {
  PracticeAnswerRequest,
  PracticeAnswerResult,
  PracticeHintRequest,
  PracticeHintResponse,
  PracticeLesson,
  PracticeLessonResult,
  PracticeOverview,
  PracticeParentSummary,
  PracticePath,
  PracticeRoadmap,
  PracticeSubject,
  PracticeTeacherHelpRequest,
  PracticeTeacherHelpResponse,
} from '@/types/practice'

const shouldUsePracticeMockFirst = apiMode === 'mock' || (apiMode === 'demo' && !enableDemoApi)

function resolveFallback<T>(fallback: T | (() => T)) {
  return typeof fallback === 'function' ? (fallback as () => T)() : fallback
}

async function withPracticeDemo<T>(request: () => Promise<T>, fallback: T | (() => T)) {
  if (shouldUsePracticeMockFirst) {
    return resolveFallback(fallback)
  }

  return withDemoFallback(request, fallback)
}

export async function getPracticeOverview() {
  return withPracticeDemo(async () => {
    const response = await httpClient.get<PracticeOverview>('/practice/overview')
    return response.data
  }, getMockPracticeOverview)
}

export async function getPracticeSubjects() {
  return withPracticeDemo(async () => {
    const response = await httpClient.get<{ items: PracticeSubject[] }>('/practice/subjects')
    return response.data
  }, { items: practiceSubjects })
}

export async function getSubjectPath(subjectId: string, topicId?: string) {
  return withPracticeDemo(async () => {
    const path = topicId
      ? `/practice/subjects/${subjectId}/topics/${topicId}/path`
      : `/practice/subjects/${subjectId}/path`
    const response = await httpClient.get<PracticePath>(path)
    return response.data
  }, () => getMockPracticePath(subjectId, topicId))
}

export async function getPracticeRoadmap(subjectId: string, topicId: string) {
  return withPracticeDemo(async () => {
    const response = await httpClient.get<PracticeRoadmap>(
      `/practice/${subjectId}/${topicId}/roadmap`,
    )
    return response.data
  }, () => getMockPracticeRoadmap(subjectId, topicId))
}

export async function getPracticeLesson(lessonId: string) {
  return withPracticeDemo(async () => {
    const response = await httpClient.get<PracticeLesson>(`/practice/lessons/${lessonId}`)
    return response.data
  }, () => {
    const lesson = getMockLesson(lessonId)
    if (!lesson) {
      throw new Error(`Practice lesson not found: ${lessonId}`)
    }
    return lesson
  })
}

export async function submitChallengeAnswer(challengeId: string, payload: PracticeAnswerRequest) {
  return withPracticeDemo(async () => {
    const response = await httpClient.post<PracticeAnswerResult>(
      `/practice/challenges/${challengeId}/answer`,
      payload,
    )
    return response.data
  }, () => submitMockChallengeAnswer(challengeId, payload.answer))
}

export async function completePracticeLesson(lessonId: string) {
  return withPracticeDemo(async () => {
    const response = await httpClient.post<PracticeLessonResult>(
      `/practice/lessons/${lessonId}/complete`,
    )
    return response.data
  }, () => completeMockLesson(lessonId))
}

export async function getPracticeMistakes() {
  return withPracticeDemo(async () => {
    const response = await httpClient.get<ReturnType<typeof getMockMistakes>>('/practice/mistakes')
    return response.data
  }, getMockMistakes)
}

export async function getPracticeHint(payload: PracticeHintRequest) {
  return withPracticeDemo(async () => {
    const response = await httpClient.post<PracticeHintResponse>('/practice/hints', payload)
    return response.data
  }, () => getMockPracticeHint(payload.challengeId))
}

export async function requestPracticeTeacherHelp(payload: PracticeTeacherHelpRequest) {
  return withPracticeDemo(async () => {
    const response = await httpClient.post<PracticeTeacherHelpResponse>(
      '/practice/teacher-help',
      payload,
    )
    return response.data
  }, {
    requestId: `practice-help-${payload.challengeId}`,
    status: 'ready',
    message: 'A teacher can review this practice step with the student.',
  })
}

export async function getPracticeParentSummary(childId: string) {
  return withPracticeDemo(async () => {
    const response = await httpClient.get<PracticeParentSummary>(
      `/parents/me/children/${childId}/practice-summary`,
    )
    return response.data
  }, getMockPracticeParentSummary)
}
