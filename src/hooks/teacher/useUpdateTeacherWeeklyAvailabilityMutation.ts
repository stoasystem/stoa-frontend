import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import i18n from '@/i18n'
import { trackEvent } from '@/services/analytics/analyticsClient'
import { updateTeacherWeeklyAvailability } from '@/services/teacher/teacherAvailabilityApi'
import { teacherQueryKeys } from '@/services/teacher/teacherQueryKeys'
import type { TeacherWeeklyAvailability } from '@/types/teacherAvailability'

export function useUpdateTeacherWeeklyAvailabilityMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: TeacherWeeklyAvailability) => updateTeacherWeeklyAvailability(payload),
    onSuccess: () => {
      trackEvent('teacher_availability_updated')
      toast.success(i18n.t('teacher:toasts.availabilityUpdated'))
      void queryClient.invalidateQueries({ queryKey: ['teacher', 'availability'] })
      // The profile page shows the same subjects and hours (#270).
      void queryClient.invalidateQueries({ queryKey: teacherQueryKeys.profile() })
    },
  })
}
