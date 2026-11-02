import { createConversation } from '@/services/chat/chatApi'
import { streamConversationMessage, type StreamMessagePayload } from '@/services/chat/chatStreamApi'
import type { Conversation, CreateConversationRequest } from '@/types/chat'

/**
 * The server a question goes out to (#562): the two requests asking from the
 * list makes, and nothing else. Tests put an in-memory one in its place.
 */
export type AskQuestionAdapter = {
  /** `POST /conversations`, with or without the first question. */
  createConversation(payload: CreateConversationRequest): Promise<Conversation>
  /** A message sent into a conversation with nothing on screen waiting on its events. */
  sendMessage(conversationId: string, payload: StreamMessagePayload): Promise<unknown>
}

export const serverAskQuestionAdapter: AskQuestionAdapter = {
  createConversation: (payload) => createConversation(payload),
  sendMessage: (conversationId, payload) => streamConversationMessage({ conversationId, payload, onEvent: () => {} }),
}
