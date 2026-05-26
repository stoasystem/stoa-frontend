import { httpClient } from '@/services/api/httpClient'
import { mockConversations } from '@/data/mockConversations'
import { withDemoFallback } from '@/services/demo/demoFallback'
import type {
  Conversation,
  ConversationListResponse,
  CreateConversationRequest,
  SendMessageRequest,
  SendMessageResponse,
  TeacherHelpRequest,
  TeacherHelpResponse,
} from '@/types/chat'

let demoConversations: Conversation[] = [...mockConversations]

export async function getConversations() {
  return withDemoFallback(async () => {
    const response = await httpClient.get<ConversationListResponse>('/conversations')
    return response.data
  }, {
    items: demoConversations.map(({ messages, ...conversation }) => ({
      ...conversation,
      lastMessagePreview: messages[messages.length - 1]?.content,
    })),
  })
}

export async function getConversation(conversationId: string) {
  return withDemoFallback(async () => {
    const response = await httpClient.get<Conversation>(`/conversations/${conversationId}`)
    return response.data
  }, demoConversations.find((conversation) => conversation.id === conversationId) ?? demoConversations[0])
}

export async function createConversation(payload: CreateConversationRequest) {
  return withDemoFallback(async () => {
    const response = await httpClient.post<Conversation>('/conversations', payload)
    return response.data
  }, () => {
    const now = new Date().toISOString()
    const conversation: Conversation = {
      id: `conv-${Date.now()}`,
      title: payload.subject,
      subject: payload.subject,
      grade: payload.grade,
      updatedAt: now,
      messages: [],
    }
    demoConversations = [conversation, ...demoConversations]
    return conversation
  })
}

export async function sendConversationMessage(conversationId: string, payload: SendMessageRequest) {
  return withDemoFallback(async () => {
    const response = await httpClient.post<SendMessageResponse>(
      `/conversations/${conversationId}/messages`,
      payload,
    )
    return response.data
  }, () => createDemoMessageResponse(conversationId, payload))
}

export async function requestTeacherHelp(payload: TeacherHelpRequest) {
  return withDemoFallback(async () => {
    const response = await httpClient.post<TeacherHelpResponse>('/teacher-help/request', payload)
    return response.data
  }, {
    requestId: `teacher-help-${Date.now()}`,
    conversationId: payload.conversationId,
    status: 'pending',
    teacherName: 'STOA teacher',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })
}

function createDemoMessageResponse(conversationId: string, payload: SendMessageRequest): SendMessageResponse {
  const now = new Date().toISOString()
  const studentMessage = {
    id: `student-${Date.now()}`,
    conversationId,
    role: 'student' as const,
    content: payload.content,
    createdAt: now,
    status: 'sent' as const,
  }
  const assistantMessage = {
    id: `assistant-${Date.now()}`,
    conversationId,
    role: 'assistant' as const,
    content: 'Let’s work through this step by step. First, identify what the question is asking, then choose the method that fits your current level.',
    createdAt: now,
    status: 'sent' as const,
  }

  demoConversations = demoConversations.map((conversation) =>
    conversation.id === conversationId
      ? {
          ...conversation,
          messages: [...conversation.messages, studentMessage, assistantMessage],
          updatedAt: now,
        }
      : conversation,
  )

  return { studentMessage, assistantMessage }
}
