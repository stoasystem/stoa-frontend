import { useEffect, useMemo, useRef } from 'react'
import { useConversationQuery } from '@/hooks/chat/useConversationQuery'
import { mergeWithServerMessages, useStreamingChat } from '@/hooks/chat/useStreamingChat'
import {
  teacherHelpPollInterval,
  useTeacherHelpStatusQuery,
} from '@/hooks/chat/useTeacherHelpStatusQuery'
import type { TeacherHelpRequest, TeacherHelpStatus } from '@/types/teacherHelp'

/** Help that has not ended: the card is pinned and the thread is read again. */
export const ACTIVE_HELP: ReadonlySet<TeacherHelpStatus> = new Set(['pending', 'assigned', 'in_progress'])

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
    helpActive: help !== null && ACTIVE_HELP.has(help.status),
    ...streaming,
  }
}
