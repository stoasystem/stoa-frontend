import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { trackEvent } from '@/services/analytics/analyticsClient'
import { addTutorHelpRequestNote } from '@/services/tutor/tutorApi'
import { tutorQueryKeys } from '@/services/tutor/tutorQueryKeys'

export function useAddTutorHelpRequestNoteMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: addTutorHelpRequestNote,
    onSuccess: (note, variables) => {
      trackEvent('tutor_note_added', {
        requestId: variables.requestId,
        noteId: note.id,
      })
      toast.success('Teacher note added')
      void queryClient.invalidateQueries({
        queryKey: tutorQueryKeys.helpRequestDetail(variables.requestId),
      })
    },
    onError: () => {
      toast.error('Failed to add teacher note')
    },
  })
}
