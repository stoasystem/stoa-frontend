import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { trackEvent } from '@/services/analytics/analyticsClient'
import { createSupportTicket } from '@/services/support/supportTicketApi'
import type { CreateSupportTicketPayload } from '@/types/supportTicket'

export function useCreateSupportTicketMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateSupportTicketPayload) => createSupportTicket(payload),
    onSuccess: (ticket) => {
      trackEvent('support_ticket_created', { ticketId: ticket.id, category: ticket.category })
      toast.success('Support ticket created')
      void queryClient.invalidateQueries({ queryKey: ['support', 'tickets'] })
    },
  })
}
