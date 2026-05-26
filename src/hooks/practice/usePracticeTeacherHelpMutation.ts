import { useMutation } from '@tanstack/react-query'
import { requestPracticeTeacherHelp } from '@/services/practice/practiceApi'
import type { PracticeTeacherHelpRequest } from '@/types/practice'

export function usePracticeTeacherHelpMutation() {
  return useMutation({
    mutationFn: (payload: PracticeTeacherHelpRequest) => requestPracticeTeacherHelp(payload),
  })
}
