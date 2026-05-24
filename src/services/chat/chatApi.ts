import { httpClient } from '@/services/api/httpClient'
import type {
  Conversation,
  ConversationListResponse,
  CreateConversationRequest,
  SendMessageRequest,
  SendMessageResponse,
  TeacherHelpRequest,
  TeacherHelpResponse,
} from '@/types/chat'

export async function getConversations() {
  const response = await httpClient.get<ConversationListResponse>('/conversations')
  return response.data
}

export async function getConversation(conversationId: string) {
  const response = await httpClient.get<Conversation>(`/conversations/${conversationId}`)
  return response.data
}

export async function createConversation(payload: CreateConversationRequest) {
  const response = await httpClient.post<Conversation>('/conversations', payload)
  return response.data
}

export async function sendConversationMessage(conversationId: string, payload: SendMessageRequest) {
  const response = await httpClient.post<SendMessageResponse>(
    `/conversations/${conversationId}/messages`,
    payload,
  )
  return response.data
}

export async function requestTeacherHelp(payload: TeacherHelpRequest) {
  const response = await httpClient.post<TeacherHelpResponse>('/teacher-help/request', payload)
  return response.data
}
