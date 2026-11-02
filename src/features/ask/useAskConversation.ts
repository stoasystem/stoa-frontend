import { useEffect, useMemo, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useConversationQuery } from '@/hooks/chat/useConversationQuery'
import { mergeWithServerMessages, useStreamingChat } from '@/hooks/chat/useStreamingChat'
import { chatQueryKeys } from '@/services/chat/chatQueryKeys'
import type { Conversation, ConversationListResponse } from '@/types/chat'

/** The conversation's last message as read, which the list previews; undefined until it is read. */
function lastMessageOf(conversation: Conversation | undefined): string | null | undefined {
  if (!conversation) return undefined
  const last = conversation.messages[conversation.messages.length - 1]
  return last ? JSON.stringify([last.id, last.status, last.content]) : null
}

/**
 * The list of conversations is read again when the open conversation's last
 * message changes, as read here: a teacher's reply that a poll brought, an
 * answer (#405). Nothing else reads it again while Ask stays open, so its
 * preview, time and order went stale. A change of help status is followed by
 * the teacher help module (`teacherHelp/useTeacherHelp`).
 *
 * The first reading of a conversation is not a change, but it can show the
 * list is behind: a teacher who replied while the list sat unread (#452). So
 * the list is read again when it has the conversation at another `updatedAt`,
 * or not at all. A list still on its first read is not asked for twice:
 * TanStack joins the read in flight.
 */
function useListFollows(conversationId: string | null, conversation: Conversation | undefined) {
  const queryClient = useQueryClient()
  const lastMessage = lastMessageOf(conversation)
  const updatedAt = conversation?.updatedAt
  const seen = useRef({ conversationId, lastMessage, updatedAt })
  useEffect(() => {
    const before = seen.current
    seen.current = { conversationId, lastMessage, updatedAt }
    if (!conversationId || before.conversationId !== conversationId) return
    const changed = (now: string | null | undefined, then: string | null | undefined) =>
      now !== undefined && then !== undefined && now !== then
    const listBehind = () =>
      queryClient
        .getQueryData<ConversationListResponse>(chatQueryKeys.conversations())
        ?.items.find((item) => item.id === conversationId)?.updatedAt !== updatedAt
    if (
      changed(lastMessage, before.lastMessage) ||
      (before.updatedAt === undefined && updatedAt !== undefined && listBehind())
    ) {
      void queryClient.invalidateQueries({ queryKey: chatQueryKeys.conversations(), exact: true })
    }
  }, [conversationId, lastMessage, queryClient, updatedAt])
}

/**
 * One Ask conversation: its messages as the server has them plus the ones on
 * their way (`useStreamingChat`: async send, the `/generation` wait, recovery
 * after a reload, retry). How often it is read while a teacher is asked, and
 * where that help stands, is the teacher help module's
 * (`teacherHelp/useTeacherHelp`, #558).
 */
export function useAskConversation(conversationId: string | null) {
  const conversationQuery = useConversationQuery(conversationId)
  useListFollows(conversationId, conversationQuery.data)
  const streaming = useStreamingChat(conversationId)
  const serverMessages = conversationQuery.data?.messages
  const messages = useMemo(
    () => mergeWithServerMessages(serverMessages ?? [], streaming.localMessages),
    [serverMessages, streaming.localMessages],
  )

  return {
    conversationQuery,
    conversation: conversationQuery.data ?? null,
    messages,
    ...streaming,
  }
}
