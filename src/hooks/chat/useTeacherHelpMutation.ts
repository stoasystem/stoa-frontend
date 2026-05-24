import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { trackEvent } from '@/services/analytics/analyticsClient'
import { createTeacherHelpRequest } from '@/services/teacherHelp/teacherHelpApi'

export function useTeacherHelpMutation() {
  return useMutation({
    mutationFn: createTeacherHelpRequest,
    onSuccess: (request) => {
      trackEvent('teacher_help_requested', {
        requestId: request.requestId,
        conversationId: request.conversationId,
        status: request.status,
      })
      toast.success('Teacher help requested')
    },
    onError: () => {
      toast.error('Failed to request teacher help')
    },
  })
}
