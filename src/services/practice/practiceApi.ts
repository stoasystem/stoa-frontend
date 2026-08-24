import { getMockMistakes } from '@/data/mockPractice'

import { httpClient } from '@/services/api/httpClient'
import { createConversation } from '@/services/chat/chatApi'
import { createTeacherHelpRequest } from '@/services/teacherHelp/teacherHelpApi'

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
  CurriculumCatalog,
  CurriculumProgressSummary,
} from '@/types/practice'

export async function getPracticeOverview() {
  const response = await httpClient.get<PracticeOverview>('/practice/overview')
  return response.data
}

export async function getPracticeSubjects() {
  const response = await httpClient.get<{ items: PracticeSubject[] }>('/practice/subjects')
  return response.data
}

export async function getSubjectPath(subjectId: string, topicId?: string) {
  const path = topicId
    ? `/practice/${subjectId}/${topicId}/path`
    : `/practice/${subjectId}/${topicId ?? 'default'}/path`
  const response = await httpClient.get<PracticePath>(path)
  return response.data
}

export async function getPracticeRoadmap(subjectId: string, topicId: string) {
  const response = await httpClient.get<PracticeRoadmap>(
    `/practice/${subjectId}/${topicId}/roadmap`,
  )
  return response.data
}

export async function getPracticeLesson(lessonId: string) {
  const response = await httpClient.get<PracticeLesson>(`/practice/lessons/${lessonId}`)
  return response.data
}

export async function submitChallengeAnswer(challengeId: string, payload: PracticeAnswerRequest) {
  const response = await httpClient.post<PracticeAnswerResult>(
    `/practice/challenges/${challengeId}/answer`,
    payload,
  )
  return response.data
}

export async function completePracticeLesson(lessonId: string) {
  const response = await httpClient.post<PracticeLessonResult>(
    `/practice/lessons/${lessonId}/complete`,
  )
  return response.data
}

export async function getPracticeMistakes() {
  const response = await httpClient.get<ReturnType<typeof getMockMistakes>>('/practice/mistakes')
  return response.data
}

export async function getPracticeHint(payload: PracticeHintRequest) {
  const response = await httpClient.post<PracticeHintResponse>('/practice/hints', payload)
  return response.data
}

export async function requestPracticeTeacherHelp(
  payload: PracticeTeacherHelpRequest,
): Promise<PracticeTeacherHelpResponse> {
  // Practice help joins the same escalation lane as chat so the student and the
  // teacher continue in one thread instead of a separate practice-only channel.
  const conversation = await createConversation({
    subject: payload.subjectId,
    grade: payload.gradeLevel ?? '',
    initialMessage: describePracticeContext(payload),
  })
  const request = await createTeacherHelpRequest({
    conversationId: conversation.id,
    message: payload.message,
  })
  return {
    requestId: request.requestId,
    conversationId: conversation.id,
    status: request.status,
    teacherName: request.teacherName ?? null,
  }
}

function describePracticeContext(payload: PracticeTeacherHelpRequest) {
  const context = payload.practiceContext
  const lines = [payload.message]
  if (context?.challengePrompt) lines.push(`Aufgabe: ${context.challengePrompt}`)
  if (context?.studentAnswer) lines.push(`Meine Antwort: ${context.studentAnswer}`)
  if (context?.attempts) lines.push(`Versuche: ${context.attempts}`)
  return lines.join('\n')
}

export async function getPracticeParentSummary(childId: string) {
  const response = await httpClient.get<PracticeParentSummary>(
    `/parents/me/children/${childId}/practice-summary`,
  )
  return response.data
}

export async function getCurriculumCatalog({
  subjectId,
  gradeLevel,
  includePreview = false,
}: {
  subjectId?: string
  gradeLevel?: string
  includePreview?: boolean
} = {}) {
  const response = await httpClient.get<CurriculumCatalog>('/practice/curriculum/catalog', {
    params: { subjectId, gradeLevel, includePreview },
  })
  return response.data
}

export async function getCurriculumProgress({
  studentId,
  subjectId,
}: {
  studentId?: string
  subjectId?: string
} = {}) {
  const response = await httpClient.get<CurriculumProgressSummary>('/practice/curriculum/progress', {
    params: { studentId, subjectId },
  })
  return response.data
}

export function normalizeCurriculumSubjectId(subjectId?: string) {
  const normalized = subjectId?.trim().toLowerCase()
  if (!normalized) return undefined
  const aliases: Record<string, string> = {
    mathematics: 'math',
    mathematik: 'math',
    deutsch: 'german',
    englisch: 'english',
  }
  return aliases[normalized] ?? normalized
}
