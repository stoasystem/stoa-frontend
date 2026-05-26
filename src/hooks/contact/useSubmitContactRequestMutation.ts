import { useMutation } from '@tanstack/react-query'
import { submitContactRequest, type ContactRequestPayload } from '@/services/contact/contactApi'

export function useSubmitContactRequestMutation() {
  return useMutation({
    mutationFn: (payload: ContactRequestPayload) => submitContactRequest(payload),
  })
}
