import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { trackEvent } from '@/services/analytics/analyticsClient'
import { updateTutorAvailability } from '@/services/tutor/tutorAvailabilityApi'
import type { TutorAvailability } from '@/types/tutorAvailability'

export function useUpdateTutorAvailabilityMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: TutorAvailability) => updateTutorAvailability(payload),
    onSuccess: () => {
      trackEvent('tutor_availability_updated')
      toast.success('Availability updated')
      void queryClient.invalidateQueries({ queryKey: ['tutor', 'availability'] })
    },
  })
}
