import { useMutation } from '@tanstack/react-query'
import { requestTeacherHelp } from '@/services/chat/chatApi'
import type { TeacherHelpRequest } from '@/types/chat'

export function useTeacherHelpMutation() {
  return useMutation({
    mutationFn: (payload: TeacherHelpRequest) => requestTeacherHelp(payload),
  })
}
