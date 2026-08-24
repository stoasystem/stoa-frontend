import { httpClient } from '@/services/api/httpClient'

import { isSupportedLanguage } from '@/i18n/languages'
import { type LearningProfile } from '@/types/learningProfile'
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

export async function getStudentProfile() {
  const response = await httpClient.get<StudentProfile>('/students/me/profile')
  return mergeStudentProfile(response.data)
}

export async function updateStudentProfile(payload: Partial<StudentProfile>) {
  const response = await httpClient.patch<StudentProfile>('/students/me/profile', payload)
  return mergeStudentProfile(response.data)
}

export async function getStudentLearningHistory() {
  const response = await httpClient.get<{ items: LearningHistoryItem[] }>(
    '/students/me/learning-history',
  )
  return response.data
}

export async function getStudentLearningProfile(studentId: string) {
  const response = await httpClient.get<LearningProfile>(`/students/${studentId}/learning-profile`)
  return response.data
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
