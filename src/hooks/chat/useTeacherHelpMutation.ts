import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { trackEvent } from '@/services/analytics/analyticsClient'
import { teacherHelpErrorKey } from '@/lib/teacherHelpErrors'
import { createTeacherHelpRequest } from '@/services/teacherHelp/teacherHelpApi'

export function useTeacherHelpMutation() {
  const { t } = useTranslation('chat')

  return useMutation({
    mutationFn: createTeacherHelpRequest,
    onSuccess: (request) => {
      trackEvent('teacher_help_requested', {
        requestId: request.requestId,
        conversationId: request.conversationId,
        status: request.status,
      })
      toast.success(t('teacher.requested'))
    },
    onError: (error) => {
      trackEvent('teacher_help_request_failed', {
        reason: teacherHelpErrorKey(error),
      })
      toast.error(t(teacherHelpErrorKey(error)))
    },
  })
}
