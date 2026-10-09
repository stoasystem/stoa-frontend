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

/**
 * The exercise on screen, by id only (#56). The backend reads the exercise,
 * the chapter and the learning state from these itself, so nothing of the
 * question's wording goes into the message. Exactly these three keys: the
 * backend forbids any other and answers 422.
 */
export type PracticeContextRef = {
  challengeId: string
  lessonId: string
  unitId: string
}

/** Where a quoted passage was taken from: an exercise, or an earlier message. */
export type QuoteSource = {
  kind: 'challenge' | 'message'
  id: string
}

/** A passage quoted back to the assistant (#56). Longer than this is a 422. */
export const QUOTE_MAX_LENGTH = 500

export type MessageQuote = {
  text: string
  source: QuoteSource
}

export type ChatMessage = {
  id: string
  conversationId: string
  role: ChatRole
  content: string
  createdAt: string
  status?: ChatMessageStatus
  attachments?: ChatAttachment[]
  /** The passage this message quotes; `null` on every message without one. */
  quote?: MessageQuote | null
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
  practiceContext?: PracticeContextRef
  quote?: MessageQuote
}

export type SendMessageResponse = {
  studentMessage: ChatMessage
  assistantMessage: ChatMessage
}

export type CreateConversationRequest = {
  subject: string
  grade: string
  initialMessage?: string
  practiceContext?: PracticeContextRef
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
