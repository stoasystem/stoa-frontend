import { apiPath } from '@/services/api/apiPath'
import { httpClient } from '@/services/api/httpClient'

import type {
  ChatAttachment,
  ChatMessage,
  Conversation,
  ConversationListResponse,
  CreateConversationRequest,
  SendMessageRequest,
  SendMessageResponse,
  TeacherHelpRequest,
  TeacherHelpResponse,
} from '@/types/chat'
import type { AttachmentSummary } from '@/types/file'

/** A conversation as the backend sends it: each message's files are `AttachmentSummary`. */
type WireMessage = Omit<ChatMessage, 'attachments'> & { attachments?: AttachmentSummary[] }
type WireConversation = Omit<Conversation, 'messages'> & { messages: WireMessage[] }
type WireSendMessageResponse = { studentMessage: WireMessage; assistantMessage: WireMessage }

function chatAttachment(attachment: AttachmentSummary): ChatAttachment {
  return {
    id: attachment.attachmentId,
    filename: attachment.filename,
    mimeType: attachment.mediaType,
    sizeBytes: attachment.sizeBytes,
    status: attachment.status === 'active' ? 'uploaded' : 'failed',
    createdAt: attachment.createdAt,
  }
}

/**
 * The files on a message read back are named `attachmentId` and `mediaType`
 * (openapi.json, ChatMessage.attachments), not as the thread names them. Read
 * as they came, the first conversation with a file in it broke the thread on
 * `mimeType` (#507).
 */
function messageFromWire({ attachments, ...message }: WireMessage): ChatMessage {
  return attachments ? { ...message, attachments: attachments.map(chatAttachment) } : message
}

function fromWire(conversation: WireConversation): Conversation {
  if (!Array.isArray(conversation.messages)) return conversation as unknown as Conversation
  return { ...conversation, messages: conversation.messages.map(messageFromWire) }
}

export async function getConversations() {
  const response = await httpClient.get<ConversationListResponse>('/conversations')
  return response.data
}

export async function getConversation(conversationId: string) {
  const response = await httpClient.get<WireConversation>(apiPath`/conversations/${conversationId}`)
  return fromWire(response.data)
}

export async function createConversation(payload: CreateConversationRequest) {
  const response = await httpClient.post<WireConversation>('/conversations', payload)
  return fromWire(response.data)
}

export async function sendConversationMessage(conversationId: string, payload: SendMessageRequest) {
  const response = await httpClient.post<WireSendMessageResponse>(
    apiPath`/conversations/${conversationId}/messages`,
    payload,
  )
  const { studentMessage, assistantMessage } = response.data
  return {
    studentMessage: messageFromWire(studentMessage),
    assistantMessage: messageFromWire(assistantMessage),
  } satisfies SendMessageResponse
}

export async function requestTeacherHelp(payload: TeacherHelpRequest) {
  const response = await httpClient.post<TeacherHelpResponse>('/teacher-help/request', payload)
  return response.data
}

