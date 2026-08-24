import { httpClient } from '@/services/api/httpClient'

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

// Backend gap: /teachers/me/profile is not implemented, so /tutor/profile still fails
// against a real API. Prefixed for consistency only; needs a backend endpoint to work.
export async function getTutorProfile() {
  const response = await httpClient.get<TutorProfile>('/teachers/me/profile')
  return mergeTutorProfile(response.data)
}

export async function getTutorHelpRequests() {
  const response = await httpClient.get<{ items: TutorHelpRequestSummary[] }>(
    '/teachers/me/help-requests',
  )
  return response.data
}

export async function getTutorHelpRequestDetail(requestId: string) {
  const response = await httpClient.get<TutorHelpRequestDetail>(
    `/teachers/me/help-requests/${requestId}`,
  )
  return response.data
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
  const response = await httpClient.patch<TutorHelpRequestSummary>(
    `/teachers/me/help-requests/${requestId}`,
    { status, resolutionNote },
  )
  return response.data
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
  const response = await httpClient.post<TutorHelpRequestNote>(
    `/teachers/me/help-requests/${requestId}/notes`,
    { content, richContent },
  )
  return response.data
}

export async function getTutorStats() {
  const response = await httpClient.get<TutorStats>('/teachers/me/stats')
  return response.data
}

export async function getTutorAssistanceSummary(questionId: string) {
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

