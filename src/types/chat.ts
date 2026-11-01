import type { AttachmentReference } from '@/types/file'

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

/** The sections of an answer a quote can point at, as `StructuredAnswer` names them. */
export type AnswerSection = 'steps' | 'answer' | 'hints' | 'similarExercises' | 'knowledgePoints'

/**
 * The part of an answer a quote was taken from (stoa-backend#132): one entry
 * of a list section, counted from 0; `answer` is one text and takes no index.
 * Only on a quote of an answer that carries sections and is `kind: 'answer'`;
 * anything else is a 422.
 */
export type QuotePart = {
  section: AnswerSection
  index?: number | null
}

/** Where a quoted passage was taken from: an exercise, or an earlier message. */
export type QuoteSource = {
  kind: 'challenge' | 'message'
  id: string
  /** Which part of that answer; absent for a passage chosen by hand. */
  part?: QuotePart | null
}

/** A passage quoted back to the assistant (#56). Longer than this is a 422. */
export const QUOTE_MAX_LENGTH = 500

export type MessageQuote = {
  text: string
  source: QuoteSource
}

/**
 * The star an answer offers to take the student to (#487, stoa-backend#124):
 * a unit of their star map, any subject's. At most one per answer, and only
 * when the student said they want to go there; `null` on every other message.
 */
export type TargetUnit = {
  unitId: string
}

/** A knowledge point an answer names; `unitId` is its star once the backend can match one. */
export type KnowledgePoint = {
  name: string
  unitId?: string | null
}

/**
 * An answer in the sections the model wrote it in (stoa-backend#132). How they
 * are laid out is this side's. `followUp` is an answer in plain words -- what
 * a question about one point of an earlier answer gets -- with nothing in the
 * list sections; the backend derives it from which sections are empty.
 */
export type StructuredAnswer = {
  kind: 'answer' | 'followUp'
  steps?: string[]
  answer?: string
  hints?: string[]
  similarExercises?: string[]
  knowledgePoints?: KnowledgePoint[]
  /** True only when the model asked for a teacher; then the answer offers one. */
  suggestTeacher?: boolean
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
  /** On an answer: the star it offers to fly to (#487). */
  targetUnit?: TargetUnit | null
  /**
   * An answer's sections; `null` on students' and teachers' messages and on
   * answers written before they were kept, which show `content` as it is.
   */
  structured?: StructuredAnswer | null
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
  attachmentIds?: AttachmentReference[]
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
  /** The same star the stored answer carries (#487). */
  targetUnit?: TargetUnit | null
  /** The answer's sections (stoa-backend#132), there before the conversation is read back. */
  structured?: StructuredAnswer | null
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
