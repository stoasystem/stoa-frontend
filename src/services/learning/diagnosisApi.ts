import { mockLearningDiagnosis } from '@/data/phase12MockData'
import { httpClient } from '@/services/api/httpClient'
import { withDemoFallback } from '@/services/demo/demoFallback'
import type { LearningDiagnosis } from '@/types/diagnosis'

export async function getLearningDiagnosis(studentId: string) {
  return withDemoFallback(async () => {
    const response = await httpClient.get<LearningDiagnosis>(`/students/${studentId}/diagnosis`)
    return response.data
  }, { ...mockLearningDiagnosis, studentId })
}
