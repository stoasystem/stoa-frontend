import { useEffect, useMemo, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useConversationQuery } from '@/hooks/chat/useConversationQuery'
import { mergeWithServerMessages, useStreamingChat } from '@/hooks/chat/useStreamingChat'
import {
  teacherHelpPollInterval,
  useTeacherHelpStatusQuery,
} from '@/hooks/chat/useTeacherHelpStatusQuery'
import { chatQueryKeys } from '@/services/chat/chatQueryKeys'
import type { Conversation, ConversationListResponse } from '@/types/chat'
import type { TeacherHelpRequest } from '@/types/teacherHelp'

/** The conversation's last message as read, which the list previews; undefined until it is read. */
function lastMessageOf(conversation: Conversation | undefined): string | null | undefined {
  if (!conversation) return undefined
  const last = conversation.messages[conversation.messages.length - 1]
  return last ? JSON.stringify([last.id, last.status, last.content]) : null
}

/**
 * The list of conversations is read again when the open conversation's last
 * message or its help status changes, as read here: a teacher's reply that a
 * poll brought, an answer, help taken or ended (#405). Nothing else reads it
 * again while Ask stays open, so its preview, time and order went stale.
 *
 * The first reading of a conversation is not a change, but it can show the
 * list is behind: a teacher who replied while the list sat unread (#452). So
 * the list is read again when it has the conversation at another `updatedAt`,
 * or not at all. A list still on its first read is not asked for twice:
 * TanStack joins the read in flight.
 */
function useListFollows(
  conversationId: string | null,
  conversation: Conversation | undefined,
  help: TeacherHelpRequest | null | undefined,
) {
  const queryClient = useQueryClient()
  const lastMessage = lastMessageOf(conversation)
  const updatedAt = conversation?.updatedAt
  const helpStatus = help === undefined ? undefined : (help?.status ?? null)
  const seen = useRef({ conversationId, lastMessage, updatedAt, helpStatus })
  useEffect(() => {
    const before = seen.current
    seen.current = { conversationId, lastMessage, updatedAt, helpStatus }
    if (!conversationId || before.conversationId !== conversationId) return
    const changed = (now: string | null | undefined, then: string | null | undefined) =>
      now !== undefined && then !== undefined && now !== then
    const listBehind = () =>
      queryClient
        .getQueryData<ConversationListResponse>(chatQueryKeys.conversations())
        ?.items.find((item) => item.id === conversationId)?.updatedAt !== updatedAt
    if (
      changed(lastMessage, before.lastMessage) ||
      changed(helpStatus, before.helpStatus) ||
      (before.updatedAt === undefined && updatedAt !== undefined && listBehind())
    ) {
      void queryClient.invalidateQueries({ queryKey: chatQueryKeys.conversations(), exact: true })
    }
  }, [conversationId, helpStatus, lastMessage, queryClient, updatedAt])
}

/**
 * One Ask conversation: its messages as the server has them plus the ones on
 * their way (`useStreamingChat`: async send, the `/generation` wait, recovery
 * after a reload, retry), and where its teacher help stands.
 *
 * The help request is read from the server only
 * (`GET /teacher-help/conversations/:id/request`); nothing on this side says a
 * teacher joined (#12 point 2). While help is open the conversation itself is
 * read again at the same pace as the request -- 15 s waiting, 5 s once a
 * teacher has it -- which is how a teacher's reply reaches the thread.
 */
export function useAskConversation(conversationId: string | null) {
  const helpQuery = useTeacherHelpStatusQuery(conversationId)
  const help: TeacherHelpRequest | null = conversationId ? (helpQuery.data ?? null) : null
  const conversationQuery = useConversationQuery(conversationId, {
    refetchInterval: teacherHelpPollInterval(help?.status),
  })
  // A teacher who replies and resolves within one poll leaves the conversation
  // unpolled just as their reply lands: the resolved status turns the polling
  // off before the conversation is read again. So each change of status reads
  // the conversation once more, whatever the new status is.
  const status = help?.status ?? null
  const lastStatus = useRef(status)
  const { refetch } = conversationQuery
  useEffect(() => {
    if (lastStatus.current === status) return
    const previous = lastStatus.current
    lastStatus.current = status
    if (previous !== null && conversationId) void refetch()
  }, [conversationId, refetch, status])
  useListFollows(conversationId, conversationQuery.data, helpQuery.data)
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
    help,
    ...streaming,
  }
}
