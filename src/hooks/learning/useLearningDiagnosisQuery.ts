import { useQuery } from '@tanstack/react-query'
import { getLearningDiagnosis } from '@/services/learning/diagnosisApi'

export function useLearningDiagnosisQuery(studentId: string) {
  return useQuery({
    queryKey: ['students', studentId, 'diagnosis'],
    queryFn: () => getLearningDiagnosis(studentId),
    enabled: Boolean(studentId),
  })
}
