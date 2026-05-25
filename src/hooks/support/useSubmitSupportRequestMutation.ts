import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  submitSupportRequest,
  type SubmitSupportRequestPayload,
} from '@/services/support/supportApi'

export function useSubmitSupportRequestMutation() {
  return useMutation({
    mutationFn: (payload: SubmitSupportRequestPayload) => submitSupportRequest(payload),
    onSuccess: () => {
      toast.success('Support request sent')
    },
    onError: () => {
      toast.error('Failed to send support request')
    },
  })
}
