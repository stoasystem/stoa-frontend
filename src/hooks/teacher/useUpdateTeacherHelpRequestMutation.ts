import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import i18n from '@/i18n'
import { isHelpRequestConflict } from '@/lib/teacherHelpRequestConflict'
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
      toast.success(i18n.t('teacher:toasts.statusUpdated'))
      // The list key is the detail's prefix, so this reads both again.
      void queryClient.invalidateQueries({ queryKey: teacherQueryKeys.helpRequests() })
      void queryClient.invalidateQueries({ queryKey: teacherQueryKeys.stats() })
    },
    onError: (error) => {
      // Someone else took it or it lapsed: what is on screen is stale, so read
      // it again instead of leaving the same refused button in place (#269).
      // Any failure, this one or another, is said on the page, as an alert that
      // takes the focus (#410); a toast as well would say it twice.
      if (!isHelpRequestConflict(error)) return
      void queryClient.invalidateQueries({ queryKey: teacherQueryKeys.helpRequests() })
      void queryClient.invalidateQueries({ queryKey: teacherQueryKeys.stats() })
    },
  })
}
