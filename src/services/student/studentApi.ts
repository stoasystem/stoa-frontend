import { httpClient } from '@/services/api/httpClient'
import type { LearningHistoryItem, StudentProfile } from '@/types/student'

export async function getStudentProfile() {
  const response = await httpClient.get<StudentProfile>('/students/me/profile')
  return response.data
}

export async function updateStudentProfile(payload: Partial<StudentProfile>) {
  const response = await httpClient.patch<StudentProfile>('/students/me/profile', payload)
  return response.data
}

export async function getStudentLearningHistory() {
  const response = await httpClient.get<{ items: LearningHistoryItem[] }>(
    '/students/me/learning-history',
  )
  return response.data
}
