import { useMemo, useState } from 'react'
import { mockConversations } from '@/data/mockConversations'
import type { ChatMessage, Conversation } from '@/types/chat'

function createId() {
  return crypto.randomUUID()
}

export function useMockChat() {
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations)
  const [activeConversationId, setActiveConversationId] = useState<string>(mockConversations[0]?.id ?? '')
  const [thinkingConversationId, setThinkingConversationId] = useState<string | null>(null)

  const activeConversation = useMemo(() => {
    return conversations.find((conversation) => conversation.id === activeConversationId) ?? null
  }, [conversations, activeConversationId])

  function sendMessage(content: string) {
    if (!activeConversation || !content.trim()) return

    const conversationId = activeConversation.id
    const now = new Date().toISOString()
    const studentMessage: ChatMessage = {
      id: createId(),
      conversationId,
      role: 'student',
      content,
      createdAt: now,
      status: 'sent',
    }

    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === conversationId
          ? {
              ...conversation,
              messages: [...conversation.messages, studentMessage],
              updatedAt: now,
            }
          : conversation,
      ),
    )

    setThinkingConversationId(conversationId)

    window.setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: createId(),
        conversationId,
        role: 'assistant',
        content:
          'This is a mock AI response. In the next phase, this will be connected to the backend AI service.',
        createdAt: new Date().toISOString(),
        status: 'sent',
      }

      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === conversationId
            ? {
                ...conversation,
                messages: [...conversation.messages, assistantMessage],
                updatedAt: assistantMessage.createdAt,
              }
            : conversation,
        ),
      )
      setThinkingConversationId(null)
    }, 800)
  }

  return {
    conversations,
    activeConversation,
    activeConversationId,
    setActiveConversationId,
    sendMessage,
    isAssistantThinking: thinkingConversationId === activeConversationId,
  }
}
