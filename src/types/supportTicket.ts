export type SupportTicketStatus = 'open' | 'waiting_on_user' | 'in_review' | 'resolved'

export type SupportTicketPriority = 'low' | 'normal' | 'high' | 'urgent'

export type SupportTicket = {
  id: string
  subject: string
  message: string
  status: SupportTicketStatus
  priority: SupportTicketPriority
  category: string
  createdAt: string
  updatedAt: string
  requesterEmail?: string
}

export type CreateSupportTicketPayload = {
  subject: string
  message: string
  category: string
  priority: SupportTicketPriority
  contactEmail?: string
}
