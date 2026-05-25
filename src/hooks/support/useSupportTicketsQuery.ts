import { useQuery } from '@tanstack/react-query'
import { getAdminSupportTickets, getSupportTicket, getSupportTickets } from '@/services/support/supportTicketApi'

export function useSupportTicketsQuery() {
  return useQuery({
    queryKey: ['support', 'tickets'],
    queryFn: getSupportTickets,
  })
}

export function useSupportTicketQuery(ticketId: string | undefined) {
  return useQuery({
    queryKey: ['support', 'tickets', ticketId],
    queryFn: () => getSupportTicket(ticketId ?? ''),
    enabled: Boolean(ticketId),
  })
}

export function useAdminSupportTicketsQuery() {
  return useQuery({
    queryKey: ['admin', 'support', 'tickets'],
    queryFn: getAdminSupportTickets,
  })
}
