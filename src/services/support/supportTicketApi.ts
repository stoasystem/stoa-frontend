import { mockSupportTickets } from '@/data/phase11MockData'
import { httpClient } from '@/services/api/httpClient'
import { withDemoFallback } from '@/services/demo/demoFallback'
import type { CreateSupportTicketPayload, SupportTicket } from '@/types/supportTicket'

let demoTickets = [...mockSupportTickets]

export async function getSupportTickets() {
  return withDemoFallback(async () => {
    const response = await httpClient.get<{ items: SupportTicket[] }>('/support/tickets')
    return response.data
  }, { items: demoTickets })
}

export async function getSupportTicket(ticketId: string) {
  return withDemoFallback(async () => {
    const response = await httpClient.get<SupportTicket>(`/support/tickets/${ticketId}`)
    return response.data
  }, demoTickets.find((ticket) => ticket.id === ticketId) ?? demoTickets[0])
}

export async function createSupportTicket(payload: CreateSupportTicketPayload) {
  return withDemoFallback(async () => {
    const response = await httpClient.post<SupportTicket>('/support/tickets', payload)
    return response.data
  }, () => {
    const now = new Date().toISOString()
    const ticket: SupportTicket = {
      id: `ticket-${demoTickets.length + 101}`,
      subject: payload.subject,
      message: payload.message,
      status: 'open',
      priority: payload.priority,
      category: payload.category,
      createdAt: now,
      updatedAt: now,
      requesterEmail: payload.contactEmail,
    }
    demoTickets = [ticket, ...demoTickets]
    return ticket
  })
}

export async function getAdminSupportTickets() {
  return withDemoFallback(async () => {
    const response = await httpClient.get<{ items: SupportTicket[] }>('/admin/support/tickets')
    return response.data
  }, { items: demoTickets })
}

export async function updateAdminSupportTicketStatus({
  ticketId,
  status,
}: {
  ticketId: string
  status: SupportTicket['status']
}) {
  return withDemoFallback(async () => {
    const response = await httpClient.patch<SupportTicket>(`/admin/support/tickets/${ticketId}`, {
      status,
    })
    return response.data
  }, () => {
    demoTickets = demoTickets.map((ticket) =>
      ticket.id === ticketId ? { ...ticket, status, updatedAt: new Date().toISOString() } : ticket,
    )
    return demoTickets.find((ticket) => ticket.id === ticketId) ?? demoTickets[0]
  })
}
