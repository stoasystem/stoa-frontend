import { mockTutorAssignmentBoard } from '@/data/phase12MockData'
import { httpClient } from '@/services/api/httpClient'
import { withDemoFallback } from '@/services/demo/demoFallback'
import type { TutorAssignmentBoard } from '@/types/tutorAssignment'

export async function getTutorAssignmentBoard() {
  return withDemoFallback(async () => {
    const response = await httpClient.get<TutorAssignmentBoard>('/tutors/assignment-board')
    return response.data
  }, mockTutorAssignmentBoard)
}
