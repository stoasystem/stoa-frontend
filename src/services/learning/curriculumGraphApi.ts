import { mockCurriculumGraph } from '@/data/phase12MockData'
import { httpClient } from '@/services/api/httpClient'
import { withDemoFallback } from '@/services/demo/demoFallback'
import type { CurriculumGraph } from '@/types/curriculumGraph'

export async function getCurriculumGraph(studentId: string) {
  return withDemoFallback(async () => {
    const response = await httpClient.get<CurriculumGraph>(`/students/${studentId}/curriculum-graph`)
    return response.data
  }, mockCurriculumGraph)
}
