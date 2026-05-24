import { httpClient } from '@/services/api/httpClient'

export type SendMessageRequest = {
  message: string
  conversationId?: string
}

export type SendMessageResponse = {
  reply: string
  conversationId: string
}

export async function sendMessage(payload: SendMessageRequest) {
  const response = await httpClient.post<SendMessageResponse>('/chat', payload)
  return response.data
}
