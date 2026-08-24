import { httpClient } from '@/services/api/httpClient'
import type { LearningProfile } from '@/types/learningProfile'

export async function getLearningProfile(studentId: string) {
  const response = await httpClient.get<LearningProfile>(`/students/${studentId}/learning-profile`)
  return response.data
}
