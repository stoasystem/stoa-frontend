import { httpClient } from '@/services/api/httpClient'
import { withDemoFallback } from '@/services/demo/demoFallback'
import { isSupportedLanguage } from '@/i18n/languages'
import { learningSubjectOptions, type LearningProfile } from '@/types/learningProfile'
import type { LearningHistoryItem, StudentProfile } from '@/types/student'

const mockStudentProfile: StudentProfile = {
  id: 'student-profile-anna',
  userId: 'demo-student',
  name: 'Anna Keller',
  email: 'student@test.com',
  phone: '+41 79 555 14 28',
  dateOfBirth: '2012-04-18',
  minor: true,
  grade: 'Grade 8',
  primarySubjects: ['Mathematics', 'Physics'],
  schoolSystem: 'Swiss lower secondary',
  preferredAnswerLanguage: 'en',
  guardian: {
    name: 'Martin Keller',
    relationship: 'Parent',
    email: 'parent@test.com',
    phone: '+41 78 555 18 44',
    accountStatus: 'linked',
  },
  billing: {
    planName: 'Family plan',
    status: 'trial',
    payerName: 'Martin Keller',
    payerRole: 'parent',
    billingEmail: 'parent@test.com',
    paymentMethod: 'Visa ending 4242',
    nextBillingDate: '2026-06-15',
  },
  createdAt: '2026-05-24T09:00:00Z',
  updatedAt: '2026-05-27T09:00:00Z',
}

const mockStudentLearningHistory: { items: LearningHistoryItem[] } = {
  items: [
    {
      id: 'history-practice-equations',
      subject: 'Mathematics',
      title: 'Practice Path: Solving equations in two steps',
      summary:
        'Completed a short Practice Path lesson and checked each operation before moving to the final answer.',
      createdAt: '2026-05-27T10:30:00Z',
    },
    {
      id: 'history-learning-chat-equations',
      subject: 'Mathematics',
      title: 'Question explanation',
      summary:
        'Asked for a clearer explanation after a practice hint was not enough to understand the next step.',
      createdAt: '2026-05-26T15:20:00Z',
    },
    {
      id: 'history-teacher-support-linear-systems',
      subject: 'Mathematics',
      title: 'Teacher support request',
      summary:
        'Requested professional teacher support after repeated confusion with substitution in a linear system.',
      createdAt: '2026-05-25T16:45:00Z',
    },
  ],
}

const mockStudentLearningProfile: LearningProfile = {
  studentId: 'demo-student',
  subjects: learningSubjectOptions,
  subjectActivity: [
    {
      subject: 'math',
      label: 'Mathematics',
      rolloutState: 'active',
      questionCount: 9,
      aiResolvedCount: 7,
      teacherEscalationCount: 2,
      feedbackAverage: 4.2,
    },
    {
      subject: 'physics',
      label: 'Physics',
      rolloutState: 'foundation',
      questionCount: 3,
      aiResolvedCount: 2,
      teacherEscalationCount: 1,
      feedbackAverage: 3.7,
    },
  ],
  weakTopics: [
    {
      subject: 'physics',
      topicId: 'newtons-laws',
      label: "Newton's laws",
      count: 2,
      latestEvidenceAt: '2026-06-04T12:00:00Z',
      evidenceQuestionIds: ['question-physics-1', 'question-physics-2'],
    },
  ],
  strengthTopics: [],
  updatedAt: '2026-06-04T12:00:00Z',
}

export async function getStudentProfile() {
  return withDemoFallback(async () => {
    const response = await httpClient.get<StudentProfile>('/students/me/profile')
    return mergeStudentProfile(response.data)
  }, mockStudentProfile)
}

export async function updateStudentProfile(payload: Partial<StudentProfile>) {
  return withDemoFallback(async () => {
    const response = await httpClient.patch<StudentProfile>('/students/me/profile', payload)
    return mergeStudentProfile(response.data)
  }, () => ({
    ...mockStudentProfile,
    ...payload,
    updatedAt: new Date().toISOString(),
  }))
}

export async function getStudentLearningHistory() {
  return withDemoFallback(async () => {
    const response = await httpClient.get<{ items: LearningHistoryItem[] }>(
      '/students/me/learning-history',
    )
    return response.data
  }, mockStudentLearningHistory)
}

export async function getStudentLearningProfile(studentId: string) {
  return withDemoFallback(async () => {
    const response = await httpClient.get<LearningProfile>(`/students/${studentId}/learning-profile`)
    return response.data
  }, mockStudentLearningProfile)
}

function mergeStudentProfile(profile: StudentProfile): StudentProfile {
  const preferredAnswerLanguage = isSupportedLanguage(profile.preferredAnswerLanguage)
    ? profile.preferredAnswerLanguage
    : mockStudentProfile.preferredAnswerLanguage

  return {
    ...mockStudentProfile,
    ...profile,
    email: profile.email || mockStudentProfile.email,
    phone: profile.phone || mockStudentProfile.phone,
    dateOfBirth: profile.dateOfBirth || mockStudentProfile.dateOfBirth,
    schoolSystem: profile.schoolSystem || mockStudentProfile.schoolSystem,
    preferredAnswerLanguage,
    guardian: profile.guardian ?? mockStudentProfile.guardian,
    billing: profile.billing ?? mockStudentProfile.billing,
    primarySubjects: profile.primarySubjects?.length ? profile.primarySubjects : mockStudentProfile.primarySubjects,
    updatedAt: profile.updatedAt || mockStudentProfile.updatedAt,
  }
}
