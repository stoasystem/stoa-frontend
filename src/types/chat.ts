export type ChatRole = 'student' | 'assistant' | 'teacher' | 'system'

export type ChatMessageStatus = 'sending' | 'sent' | 'failed'

export type ChatMessage = {
  id: string
  conversationId: string
  role: ChatRole
  content: string
  createdAt: string
  status?: ChatMessageStatus
}

export type ConversationSummary = {
  id: string
  title: string
  subject: string
  grade: string
  updatedAt: string
  lastMessagePreview?: string
}

export type Conversation = ConversationSummary & {
  messages: ChatMessage[]
}

export type ConversationListResponse = {
  items: ConversationSummary[]
}

export type SendMessageRequest = {
  content: string
}

export type SendMessageResponse = {
  studentMessage: ChatMessage
  assistantMessage: ChatMessage
}

export type CreateConversationRequest = {
  subject: string
  grade: string
  initialMessage: string
}

export type TeacherHelpRequest = {
  conversationId: string
  message?: string
}

export type TeacherHelpResponse = {
  requestId: string
  conversationId: string
  status: 'pending' | 'assigned' | 'resolved'
  createdAt: string
}
