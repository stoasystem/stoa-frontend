import { httpClient } from '@/services/api/httpClient'
import {
  mockTutorHelpRequestDetail,
  mockTutorHelpRequests,
  mockTutorStats,
} from '@/data/phase11MockData'
import { withDemoFallback } from '@/services/demo/demoFallback'
import type { TeacherHelpStatus } from '@/types/teacherHelp'
import type {
  TutorHelpRequestDetail,
  TutorHelpRequestNote,
  TutorHelpRequestSummary,
  TutorProfile,
  TutorStats,
  TeacherReplyRichContent,
  TeacherAssistanceSummary,
  AiTeacherDraft,
  AiTeacherDraftList,
  CreateExerciseDraftPayload,
  ReviewAiTeacherDraftPayload,
} from '@/types/tutor'

const mockTutorProfile: TutorProfile = {
  id: 'tutor-profile-elena',
  userId: 'demo-tutor',
  name: 'Elena Meyer',
  email: 'tutor@test.com',
  phone: '+41 76 555 27 19',
  city: 'Zurich',
  country: 'Switzerland',
  timezone: 'Europe/Zurich',
  accountStatus: 'active',
  verificationStatus: 'verified',
  teachingSummary:
    'Lower-secondary mathematics and physics teacher focused on step-by-step explanations after students get stuck.',
  subjects: ['Mathematics', 'Physics'],
  levels: ['Lower secondary', 'Grade 7-9', 'Gymnasium preparation'],
  languages: ['English', 'German'],
  qualifications: [
    {
      title: 'MSc Mathematics Education',
      institution: 'University of Zurich',
      verified: true,
    },
    {
      title: 'Lower-secondary teaching certificate',
      institution: 'Canton Zurich',
      verified: true,
    },
  ],
  availabilitySummary: 'Mon-Thu evenings, Sat morning. Emergency teacher support enabled.',
  payout: {
    method: 'bank_transfer',
    accountHolder: 'Elena Meyer',
    bankName: 'UBS Switzerland',
    maskedIban: 'CH93 **** **** **** **** 7',
    currency: 'CHF',
    settlementCycle: 'Monthly settlement, paid by the 5th business day',
    nextPayoutDate: '2026-06-05',
    lastPayoutDate: '2026-05-05',
    contractType: 'Independent contractor',
    taxStatus: 'Swiss self-employed declaration on file',
  },
  compliance: {
    credentialReview: 'verified',
    backgroundCheck: 'verified',
    termsAcceptedAt: '2026-04-18T08:30:00Z',
  },
  createdAt: '2026-04-18T08:30:00Z',
  updatedAt: '2026-05-27T11:00:00Z',
}

export async function getTutorProfile() {
  return withDemoFallback(async () => {
    const response = await httpClient.get<TutorProfile>('/tutors/me/profile')
    return mergeTutorProfile(response.data)
  }, mockTutorProfile)
}

export async function getTutorHelpRequests() {
  return withDemoFallback(async () => {
    const response = await httpClient.get<{ items: TutorHelpRequestSummary[] }>(
      '/tutors/me/help-requests',
    )
    return response.data
  }, { items: mockTutorHelpRequests })
}

export async function getTutorHelpRequestDetail(requestId: string) {
  return withDemoFallback(async () => {
    const response = await httpClient.get<TutorHelpRequestDetail>(
      `/tutors/me/help-requests/${requestId}`,
    )
    return response.data
  }, { ...mockTutorHelpRequestDetail, requestId })
}

export async function updateTutorHelpRequestStatus({
  requestId,
  status,
  resolutionNote,
}: {
  requestId: string
  status: TeacherHelpStatus
  resolutionNote?: string
}) {
  return withDemoFallback(async () => {
    const response = await httpClient.patch<TutorHelpRequestSummary>(
      `/tutors/me/help-requests/${requestId}`,
      { status, resolutionNote },
    )
    return response.data
  }, { ...mockTutorHelpRequests[0], requestId, status })
}

export async function addTutorHelpRequestNote({
  requestId,
  content,
  richContent,
}: {
  requestId: string
  content: string
  richContent?: TeacherReplyRichContent
}) {
  return withDemoFallback(async () => {
    const response = await httpClient.post<TutorHelpRequestNote>(
      `/tutors/me/help-requests/${requestId}/notes`,
      { content, richContent },
    )
    return response.data
  }, {
    id: `note-${Date.now()}`,
    note: content,
    createdAt: new Date().toISOString(),
    tutor: { id: 'demo-tutor', name: 'STOA teacher' },
    richContent: richContent ?? {
      version: 1,
      blocks: [{ type: 'paragraph', text: content }],
    },
    responseFormat: 'stoa_teacher_reply_v1',
  })
}

export async function getTutorStats() {
  return withDemoFallback(async () => {
    const response = await httpClient.get<TutorStats>('/tutors/me/stats')
    return response.data
  }, mockTutorStats)
}

export async function getTutorAssistanceSummary(questionId: string) {
  return withDemoFallback(async () => {
    const response = await httpClient.get<TeacherAssistanceSummary>(
      `/tutors/questions/${questionId}/assistance-summary`,
    )
    return response.data
  }, {
    summaryId: `assist-${questionId}`,
    questionId,
    studentId: 'demo-student',
    subject: 'Mathematics',
    studentContextSummary: 'Student has active Mathematics evidence around linear equations and moving terms.',
    questionSummary: 'Anna is stuck on solving 3x = 15 after moving terms across the equals sign.',
    aiAnswerSummary: 'The assistant explained isolating x and checking the result.',
    weakTopics: ['Linear equations', 'Moving terms'],
    suggestedFocus: 'Clarify the algebra step before giving the final answer.',
    sourceCount: 4,
    createdAt: new Date().toISOString(),
  })
}

export async function createAiTeacherSummaryDraft(questionId: string) {
  return withDemoFallback(async () => {
    const response = await httpClient.post<AiTeacherDraft>(
      `/tutors/questions/${questionId}/ai-tools/summary-draft`,
      {},
    )
    return response.data
  }, createMockSummaryDraft(questionId))
}

export async function createAiTeacherExerciseDraft(payload: CreateExerciseDraftPayload) {
  return withDemoFallback(async () => {
    const response = await httpClient.post<AiTeacherDraft>('/tutors/ai-tools/exercise-drafts', payload)
    return response.data
  }, createMockExerciseDraft(payload))
}

export async function getAiTeacherDrafts() {
  return withDemoFallback(async () => {
    const response = await httpClient.get<AiTeacherDraftList>('/tutors/ai-tools/drafts')
    return response.data
  }, { items: [], count: 0 })
}

export async function getAiTeacherDraft(draftId: string) {
  return withDemoFallback(async () => {
    const response = await httpClient.get<AiTeacherDraft>(`/tutors/ai-tools/drafts/${draftId}`)
    return response.data
  }, createMockSummaryDraft('help-1', draftId))
}

export async function regenerateAiTeacherDraft(draftId: string) {
  return withDemoFallback(async () => {
    const response = await httpClient.post<AiTeacherDraft>(`/tutors/ai-tools/drafts/${draftId}/regenerate`, {})
    return response.data
  }, {
    ...createMockSummaryDraft('help-1', `regen-${draftId}`),
    previousDraftId: draftId,
    generatedAt: new Date().toISOString(),
  })
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
  return withDemoFallback(async () => {
    const response = await httpClient.post<AiTeacherDraft>(`/tutors/ai-tools/drafts/${draftId}/${action}`, { note })
    return response.data
  }, {
    ...createMockSummaryDraft('help-1', draftId),
    status: action === 'accept' ? 'accepted' : action === 'reject' ? 'rejected' : 'archived',
    reviewNote: note,
    reviewedBy: 'demo-tutor',
    reviewedAt: new Date().toISOString(),
  })
}

function mergeTutorProfile(profile: TutorProfile): TutorProfile {
  return {
    ...mockTutorProfile,
    ...profile,
    email: profile.email || mockTutorProfile.email,
    phone: profile.phone || mockTutorProfile.phone,
    city: profile.city || mockTutorProfile.city,
    country: profile.country || mockTutorProfile.country,
    timezone: profile.timezone || mockTutorProfile.timezone,
    teachingSummary: profile.teachingSummary || mockTutorProfile.teachingSummary,
    subjects: profile.subjects?.length ? profile.subjects : mockTutorProfile.subjects,
    levels: profile.levels?.length ? profile.levels : mockTutorProfile.levels,
    languages: profile.languages?.length ? profile.languages : mockTutorProfile.languages,
    qualifications: profile.qualifications?.length ? profile.qualifications : mockTutorProfile.qualifications,
    availabilitySummary: profile.availabilitySummary || mockTutorProfile.availabilitySummary,
    payout: {
      ...mockTutorProfile.payout,
      ...profile.payout,
    },
    compliance: {
      ...mockTutorProfile.compliance,
      ...profile.compliance,
    },
    updatedAt: profile.updatedAt || mockTutorProfile.updatedAt,
  }
}

function createMockSummaryDraft(questionId: string, draftId = `draft-summary-${questionId}`): AiTeacherDraft {
  const now = new Date().toISOString()
  return {
    draftId,
    draftType: 'teacher_summary',
    status: 'draft',
    studentId: 'user-student',
    questionId,
    subject: 'Mathematics',
    topicIds: ['linear-equations', 'moving-terms'],
    sessionSummary: 'Anna attempted a two-step linear equation and reached the correct intermediate equation.',
    misconceptionSummary: 'The likely gap is dividing or checking the final value after isolating 3x.',
    suggestedTeachingFocus: 'Ask Anna to explain why subtracting 5 gives 3x = 15 before dividing by 3.',
    draftFollowupExplanation: 'Keep the intervention short and have the student verify by substitution.',
    sourceContext: { sourceCount: 4, boundedToVisibleRequest: true },
    promptVersion: 'stoa_ai_teacher_tools_v1',
    createdBy: 'demo-tutor',
    createdByRole: 'tutor',
    createdAt: now,
    generatedAt: now,
    updatedAt: now,
    studentDeliveryStatus: 'not_delivered',
    difficulty: null,
    exerciseCount: 0,
    items: [],
    answerKey: [],
    explanations: [],
  }
}

function createMockExerciseDraft(payload: CreateExerciseDraftPayload): AiTeacherDraft {
  const now = new Date().toISOString()
  const count = Math.max(1, Math.min(payload.exerciseCount, 5))
  const items = Array.from({ length: count }, (_, index) => ({
    id: `exercise-${index + 1}`,
    type: 'short_answer',
    prompt: `Solve ${index + 2}x + 5 = ${2 * (index + 2) + 5}.`,
  }))
  return {
    draftId: `draft-exercise-${Date.now()}`,
    draftType: 'practice_exercise',
    status: 'draft',
    studentId: payload.studentId,
    questionId: payload.questionId,
    subject: payload.subject,
    topicIds: payload.topicIds,
    sessionSummary: 'Practice draft based on the current teacher help request.',
    misconceptionSummary: 'Student needs repeated checks around inverse operations.',
    suggestedTeachingFocus: 'Use short equations that require one inverse operation at a time.',
    draftFollowupExplanation: 'Review answers before sharing; this draft is not delivered to the student automatically.',
    sourceContext: { boundedToVisibleStudent: true },
    promptVersion: 'stoa_ai_teacher_tools_v1',
    createdBy: 'demo-tutor',
    createdByRole: 'tutor',
    createdAt: now,
    generatedAt: now,
    updatedAt: now,
    studentDeliveryStatus: 'not_delivered',
    difficulty: payload.difficulty,
    exerciseCount: count,
    items,
    answerKey: items.map((item) => ({ itemId: item.id, answer: 'x = 2' })),
    explanations: items.map((item) => ({
      itemId: item.id,
      explanation: 'Subtract 5 from both sides, then divide by the coefficient of x.',
    })),
  }
}
