import { useMutation } from '@tanstack/react-query'
import { createTeacherHelpRequest } from '@/services/teacherHelp/teacherHelpApi'

export function useTeacherHelpMutation() {
  return useMutation({
    mutationFn: createTeacherHelpRequest,
  })
}
