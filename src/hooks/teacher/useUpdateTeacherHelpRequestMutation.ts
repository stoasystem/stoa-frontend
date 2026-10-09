import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { trackEvent } from '@/services/analytics/analyticsClient'
import { updateTeacherHelpRequestStatus } from '@/services/teacher/teacherApi'
import { teacherQueryKeys } from '@/services/teacher/teacherQueryKeys'

export function useUpdateTeacherHelpRequestMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateTeacherHelpRequestStatus,
    onSuccess: (request) => {
      trackEvent('teacher_request_status_updated', {
        requestId: request.requestId,
        status: request.status,
      })
      if (request.status === 'resolved') {
        trackEvent('teacher_help_resolved', { requestId: request.requestId })
      }
      toast.success('Request status updated')
      void queryClient.invalidateQueries({ queryKey: teacherQueryKeys.helpRequests() })
      void queryClient.invalidateQueries({
        queryKey: teacherQueryKeys.helpRequestDetail(request.requestId),
      })
    },
  })
}
