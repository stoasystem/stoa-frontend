
import { httpClient } from '@/services/api/httpClient'

import type { CreateSupportTicketPayload, SupportTicket } from '@/types/supportTicket'

export async function getSupportTickets() {
  const response = await httpClient.get<{ items: SupportTicket[] }>('/support/tickets')
  return response.data
}

export async function getSupportTicket(ticketId: string) {
  const response = await httpClient.get<SupportTicket>(`/support/tickets/${ticketId}`)
  return response.data
}

export async function createSupportTicket(payload: CreateSupportTicketPayload) {
  const response = await httpClient.post<SupportTicket>('/support/tickets', payload)
  return response.data
}

export async function getAdminSupportTickets() {
  const response = await httpClient.get<{ items: SupportTicket[] }>('/admin/support/tickets')
  return response.data
}

export async function updateAdminSupportTicketStatus({
  ticketId,
  status,
}: {
  ticketId: string
  status: SupportTicket['status']
}) {
  const response = await httpClient.patch<SupportTicket>(`/admin/support/tickets/${ticketId}`, {
    status,
  })
  return response.data
}
