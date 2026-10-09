import { httpClient } from '@/services/api/httpClient'

import type { TeacherHelpStatus } from '@/types/teacherHelp'
import type {
  TeacherHelpRequestDetail,
  TeacherHelpRequestNote,
  TeacherHelpRequestSummary,
  TeacherProfile,
  TeacherStats,
  TeacherReplyRichContent,
  TeacherAssistanceSummary,
  AiTeacherDraft,
  AiTeacherDraftList,
  CreateExerciseDraftPayload,
  ReviewAiTeacherDraftPayload,
} from '@/types/teacher'

export async function getTeacherProfile() {
  const response = await httpClient.get<TeacherProfile>('/teachers/me/profile')
  return response.data
}

export async function getTeacherHelpRequests() {
  const response = await httpClient.get<{ items: TeacherHelpRequestSummary[] }>(
    '/teachers/me/help-requests',
  )
  return response.data
}

export async function getTeacherHelpRequestDetail(requestId: string) {
  const response = await httpClient.get<TeacherHelpRequestDetail>(
    `/teachers/me/help-requests/${requestId}`,
  )
  return response.data
}

export async function updateTeacherHelpRequestStatus({
  requestId,
  status,
  resolutionNote,
}: {
  requestId: string
  status: TeacherHelpStatus
  resolutionNote?: string
}) {
  const response = await httpClient.patch<TeacherHelpRequestSummary>(
    `/teachers/me/help-requests/${requestId}`,
    { status, resolutionNote },
  )
  return response.data
}

export async function addTeacherHelpRequestNote({
  requestId,
  content,
  richContent,
}: {
  requestId: string
  content: string
  richContent?: TeacherReplyRichContent
}) {
  const response = await httpClient.post<TeacherHelpRequestNote>(
    `/teachers/me/help-requests/${requestId}/notes`,
    { content, richContent },
  )
  return response.data
}

export async function getTeacherStats() {
  const response = await httpClient.get<TeacherStats>('/teachers/me/stats')
  return response.data
}

export async function getTeacherAssistanceSummary(questionId: string) {
  const response = await httpClient.get<TeacherAssistanceSummary>(
    `/teachers/questions/${questionId}/assistance-summary`,
  )
  return response.data
}

export async function createAiTeacherSummaryDraft(questionId: string) {
  const response = await httpClient.post<AiTeacherDraft>(
    `/teachers/questions/${questionId}/ai-tools/summary-draft`,
    {},
  )
  return response.data
}

export async function createAiTeacherExerciseDraft(payload: CreateExerciseDraftPayload) {
  const response = await httpClient.post<AiTeacherDraft>('/teachers/ai-tools/exercise-drafts', payload)
  return response.data
}

export async function getAiTeacherDrafts() {
  const response = await httpClient.get<AiTeacherDraftList>('/teachers/ai-tools/drafts')
  return response.data
}

export async function getAiTeacherDraft(draftId: string) {
  const response = await httpClient.get<AiTeacherDraft>(`/teachers/ai-tools/drafts/${draftId}`)
  return response.data
}

export async function regenerateAiTeacherDraft(draftId: string) {
  const response = await httpClient.post<AiTeacherDraft>(`/teachers/ai-tools/drafts/${draftId}/regenerate`, {})
  return response.data
}

export async function acceptAiTeacherDraft(payload: ReviewAiTeacherDraftPayload) {
  return reviewAiTeacherDraft('accept', payload)
}

export async function rejectAiTeacherDraft(payload: ReviewAiTeacherDraftPayload) {
  return reviewAiTeacherDraft('reject', payload)
}

export async function archiveAiTeacherDraft(payload: ReviewAiTeacherDraftPayload) {
  return reviewAiTeacherDraft('archive', payload)
}

async function reviewAiTeacherDraft(
  action: 'accept' | 'reject' | 'archive',
  { draftId, note }: ReviewAiTeacherDraftPayload,
) {
  const response = await httpClient.post<AiTeacherDraft>(`/teachers/ai-tools/drafts/${draftId}/${action}`, { note })
  return response.data
}


