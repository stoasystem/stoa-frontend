import { mockTutorAssignmentBoard } from '@/data/phase12MockData'
import { httpClient } from '@/services/api/httpClient'
import { withDemoFallback } from '@/services/demo/demoFallback'
import type { TutorAssignmentBoard } from '@/types/tutorAssignment'

// No backend counterpart exists under either /tutors or /teachers. Only reachable
// from the demo-gated /organization/tutor-assignment surface, so it is deliberately
// left off the /teachers prefix rather than repointed at a route that does not exist.
export async function getTutorAssignmentBoard() {
  return withDemoFallback(async () => {
    const response = await httpClient.get<TutorAssignmentBoard>('/tutors/assignment-board')
    return response.data
  }, mockTutorAssignmentBoard)
}
