import { useQuery } from '@tanstack/react-query'
import { getCurriculumGraph } from '@/services/learning/curriculumGraphApi'

export function useCurriculumGraphQuery(studentId: string) {
  return useQuery({
    queryKey: ['students', studentId, 'curriculum-graph'],
    queryFn: () => getCurriculumGraph(studentId),
    enabled: Boolean(studentId),
  })
}
