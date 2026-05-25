import { useQuery } from '@tanstack/react-query'
import { getTutorAssignmentBoard } from '@/services/tutor/tutorAssignmentApi'

export function useTutorAssignmentBoardQuery() {
  return useQuery({
    queryKey: ['tutor', 'assignment-board'],
    queryFn: getTutorAssignmentBoard,
  })
}
