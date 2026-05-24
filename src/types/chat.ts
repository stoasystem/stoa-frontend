export type ChatRole = 'student' | 'assistant' | 'teacher' | 'system'

export type ChatMessageStatus =
  | 'sending'
  | 'sent'
  | 'streaming'
  | 'completed'
  | 'stopped'
  | 'failed'

export type ChatAttachmentStatus = 'uploaded' | 'processing' | 'parsed' | 'failed'

export type ChatAttachment = {
  id: string
  filename: string
  mimeType: string
  sizeBytes: number
  status: ChatAttachmentStatus
  createdAt: string
}

export type ChatMessage = {
  id: string
  conversationId: string
  role: ChatRole
  content: string
  createdAt: string
  status?: ChatMessageStatus
  attachments?: ChatAttachment[]
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
  attachmentIds?: string[]
}

export type SendMessageResponse = {
  studentMessage: ChatMessage
  assistantMessage: ChatMessage
}

export type CreateConversationRequest = {
  subject: string
  grade: string
  initialMessage?: string
}

export type TeacherHelpRequest = {
  conversationId: string
  message?: string
}

export type TeacherHelpResponse = {
  requestId: string
  conversationId: string
  status: 'pending' | 'assigned' | 'in_progress' | 'resolved' | 'cancelled'
  teacherName?: string
  createdAt: string
  updatedAt?: string
}

export type StreamMessageStartEvent = {
  type: 'message_start'
  messageId: string
  role: 'assistant'
  createdAt: string
}

export type StreamMessageDeltaEvent = {
  type: 'message_delta'
  messageId: string
  delta: string
}

export type StreamMessageDoneEvent = {
  type: 'message_done'
  messageId: string
  status: 'completed'
}

export type StreamMessageErrorEvent = {
  type: 'message_error'
  messageId?: string
  message: string
  code?: string
}

export type ChatStreamEvent =
  | StreamMessageStartEvent
  | StreamMessageDeltaEvent
  | StreamMessageDoneEvent
  | StreamMessageErrorEvent
