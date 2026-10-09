
import { httpClient } from '@/services/api/httpClient'
import { createConversation } from '@/services/chat/chatApi'
import { createTeacherHelpRequest } from '@/services/teacherHelp/teacherHelpApi'

import type {
  ReviewDueResponse,
  ReviewSummary,
  PracticeAnswerRequest,
  PracticeAnswerResult,
  PracticeHintRequest,
  PracticeHintResponse,
  PracticeLesson,
  PracticeLessonResult,
  PracticeMistake,
  PracticeOverview,
  PracticePath,
  PracticeRoadmap,
  PracticeSubject,
  PracticeTeacherHelpRequest,
  PracticeTeacherHelpResponse,
  CurriculumCatalog,
  CurriculumProgressSummary,
  KnowledgeMapResponse,
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

export async function getDueReview(unitId?: string) {
  const response = await httpClient.get<ReviewDueResponse>('/practice/review/due', {
    params: unitId ? { unitId } : undefined,
  })
  return response.data
}

export async function getReviewSummary() {
  const response = await httpClient.get<ReviewSummary>('/practice/review/summary')
  return response.data
}

export async function getPracticeMistakes() {
  const response = await httpClient.get<{ items: PracticeMistake[] }>('/practice/mistakes')
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
  // The conversation is opened without an initial message: the student asked for
  // a person, so there is no reason to spend an AI turn first.
  const conversation = await createConversation({
    subject: payload.subjectId,
    grade: payload.gradeLevel ?? '',
  })
  const request = await createTeacherHelpRequest({
    conversationId: conversation.id,
    message: describePracticeContext(payload),
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

/**
 * The lighting moments this student has now seen (stoa-backend#71). The
 * student is taken from the token, so this only ever acknowledges the
 * caller's own. At most 50 unit ids per call; over that the backend answers
 * 422, so the caller splits them (`ACKNOWLEDGE_LIMIT`).
 */
export async function acknowledgeLitUnits(unitIds: readonly string[]) {
  const response = await httpClient.post<{ acknowledged: string[] }>(
    '/practice/knowledge-map/acknowledged-lit',
    { unitIds },
  )
  return response.data.acknowledged
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

/** The star map read model (stoa-backend#59). `subjectId` is the galaxy in focus. */
export async function getKnowledgeMap(subjectId?: string) {
  const response = await httpClient.get<KnowledgeMapResponse>('/practice/knowledge-map', {
    params: subjectId ? { subjectId } : undefined,
  })
  return response.data
}
