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

export type Conversation = {
  id: string
  title: string
  subject: string
  grade: string
  messages: ChatMessage[]
  updatedAt: string
}
