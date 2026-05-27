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
}: {
  requestId: string
  content: string
}) {
  return withDemoFallback(async () => {
    const response = await httpClient.post<TutorHelpRequestNote>(
      `/tutors/me/help-requests/${requestId}/notes`,
      { content },
    )
    return response.data
  }, {
    id: `note-${Date.now()}`,
    note: content,
    createdAt: new Date().toISOString(),
    tutor: { id: 'demo-tutor', name: 'STOA teacher' },
  })
}

export async function getTutorStats() {
  return withDemoFallback(async () => {
    const response = await httpClient.get<TutorStats>('/tutors/me/stats')
    return response.data
  }, mockTutorStats)
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
