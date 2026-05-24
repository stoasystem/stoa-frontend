import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { trackEvent } from '@/services/analytics/analyticsClient'
import { updateTutorHelpRequestStatus } from '@/services/tutor/tutorApi'
import { tutorQueryKeys } from '@/services/tutor/tutorQueryKeys'

export function useUpdateTutorHelpRequestMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateTutorHelpRequestStatus,
    onSuccess: (request) => {
      trackEvent('tutor_request_status_updated', {
        requestId: request.requestId,
        status: request.status,
      })
      if (request.status === 'resolved') {
        trackEvent('teacher_help_resolved', { requestId: request.requestId })
      }
      toast.success('Request status updated')
      void queryClient.invalidateQueries({ queryKey: tutorQueryKeys.helpRequests() })
      void queryClient.invalidateQueries({
        queryKey: tutorQueryKeys.helpRequestDetail(request.requestId),
      })
    },
  })
}
