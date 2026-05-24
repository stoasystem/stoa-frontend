import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateTutorHelpRequestStatus } from '@/services/tutor/tutorApi'
import { tutorQueryKeys } from '@/services/tutor/tutorQueryKeys'

export function useUpdateTutorHelpRequestMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateTutorHelpRequestStatus,
    onSuccess: (request) => {
      void queryClient.invalidateQueries({ queryKey: tutorQueryKeys.helpRequests() })
      void queryClient.invalidateQueries({
        queryKey: tutorQueryKeys.helpRequestDetail(request.requestId),
      })
    },
  })
}
