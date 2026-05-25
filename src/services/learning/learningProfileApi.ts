import { mockLearningProfile } from '@/data/phase12MockData'
import { httpClient } from '@/services/api/httpClient'
import { withDemoFallback } from '@/services/demo/demoFallback'
import type { LearningProfile } from '@/types/learningProfile'

export async function getLearningProfile(studentId: string) {
  return withDemoFallback(async () => {
    const response = await httpClient.get<LearningProfile>(`/students/${studentId}/learning-profile`)
    return response.data
  }, {
    ...mockLearningProfile,
    student: { ...mockLearningProfile.student, id: studentId },
  })
}
