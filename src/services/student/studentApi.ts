import { httpClient } from '@/services/api/httpClient'
import { withDemoFallback } from '@/services/demo/demoFallback'
import type { LearningHistoryItem, StudentProfile } from '@/types/student'

const mockStudentProfile: StudentProfile = {
  id: 'student-profile-anna',
  userId: 'demo-student',
  name: 'Demo student',
  grade: 'Grade 8',
  primarySubjects: ['Mathematics', 'Physics'],
  schoolSystem: 'Swiss lower secondary',
  createdAt: '2026-05-24T09:00:00Z',
  updatedAt: '2026-05-27T09:00:00Z',
}

export async function getStudentProfile() {
  return withDemoFallback(async () => {
    const response = await httpClient.get<StudentProfile>('/students/me/profile')
    return response.data
  }, mockStudentProfile)
}

export async function updateStudentProfile(payload: Partial<StudentProfile>) {
  return withDemoFallback(async () => {
    const response = await httpClient.patch<StudentProfile>('/students/me/profile', payload)
    return response.data
  }, () => ({
    ...mockStudentProfile,
    ...payload,
    updatedAt: new Date().toISOString(),
  }))
}

export async function getStudentLearningHistory() {
  const response = await httpClient.get<{ items: LearningHistoryItem[] }>(
    '/students/me/learning-history',
  )
  return response.data
}
