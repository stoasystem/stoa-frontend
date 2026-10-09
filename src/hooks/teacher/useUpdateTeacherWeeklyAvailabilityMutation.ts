import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { trackEvent } from '@/services/analytics/analyticsClient'
import { updateTeacherWeeklyAvailability } from '@/services/teacher/teacherAvailabilityApi'
import type { TeacherWeeklyAvailability } from '@/types/teacherAvailability'

export function useUpdateTeacherWeeklyAvailabilityMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: TeacherWeeklyAvailability) => updateTeacherWeeklyAvailability(payload),
    onSuccess: () => {
      trackEvent('teacher_availability_updated')
      toast.success('Availability updated')
      void queryClient.invalidateQueries({ queryKey: ['teacher', 'availability'] })
    },
  })
}
