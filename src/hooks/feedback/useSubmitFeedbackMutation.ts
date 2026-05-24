import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  submitFeedback,
  type SubmitFeedbackRequest,
} from '@/services/feedback/feedbackApi'

export function useSubmitFeedbackMutation() {
  return useMutation({
    mutationFn: (payload: SubmitFeedbackRequest) => submitFeedback(payload),
    onSuccess: () => {
      toast.success('Feedback sent')
    },
    onError: () => {
      toast.error('Failed to send feedback')
    },
  })
}
