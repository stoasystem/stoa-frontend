import { useEffect, useMemo, useState } from 'react'
import { ChatHeader } from '@/components/chat/ChatHeader'
import { ChatInput } from '@/components/chat/ChatInput'
import { ChatMessageList } from '@/components/chat/ChatMessageList'
import { ConversationSidebar } from '@/components/chat/ConversationSidebar'
import { TeacherHelpStatusCard } from '@/components/chat/TeacherHelpStatusCard'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useConversationQuery } from '@/hooks/chat/useConversationQuery'
import { useConversationsQuery } from '@/hooks/chat/useConversationsQuery'
import { useCreateConversationMutation } from '@/hooks/chat/useCreateConversationMutation'
import { useStreamingChat } from '@/hooks/chat/useStreamingChat'
import { useTeacherHelpMutation } from '@/hooks/chat/useTeacherHelpMutation'
import { useTeacherHelpStatusQuery } from '@/hooks/chat/useTeacherHelpStatusQuery'
import type { TeacherHelpRequest } from '@/types/teacherHelp'

export function ChatPage() {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [sendError, setSendError] = useState<string | null>(null)
  const [teacherHelpRequest, setTeacherHelpRequest] = useState<TeacherHelpRequest | null>(null)
  const [teacherHelpError, setTeacherHelpError] = useState<string | null>(null)
  const [newConversationMessage, setNewConversationMessage] = useState('')
  const [queuedInitialMessage, setQueuedInitialMessage] = useState<{
    conversationId: string
    content: string
  } | null>(null)

  const conversationsQuery = useConversationsQuery()
  const conversations = useMemo(
    () => conversationsQuery.data?.items ?? [],
    [conversationsQuery.data],
  )

  useEffect(() => {
    if (conversations.length === 0) {
      setActiveConversationId(null)
      return
    }

    const activeConversationExists = conversations.some(
      (conversation) => conversation.id === activeConversationId,
    )

    if (!activeConversationId || !activeConversationExists) {
      setActiveConversationId(conversations[0].id)
    }
  }, [activeConversationId, conversations])

  const conversationQuery = useConversationQuery(activeConversationId)
  const createConversationMutation = useCreateConversationMutation()
  const teacherHelpMutation = useTeacherHelpMutation()
  const teacherHelpStatusQuery = useTeacherHelpStatusQuery(teacherHelpRequest?.requestId ?? null)
  const {
    localMessages,
    isStreaming,
    sendStreamingMessage,
    stopStreaming,
    retryMessage,
  } = useStreamingChat(activeConversationId)

  useEffect(() => {
    setTeacherHelpRequest(null)
    setTeacherHelpError(null)
  }, [activeConversationId])

  const displayedMessages = useMemo(() => {
    const backendMessages = conversationQuery.data?.messages ?? []
    const backendMessageIds = new Set(backendMessages.map((message) => message.id))

    return [
      ...backendMessages,
      ...localMessages.filter((message) => !backendMessageIds.has(message.id)),
    ]
  }, [conversationQuery.data?.messages, localMessages])

  useEffect(() => {
    if (
      !queuedInitialMessage ||
      !activeConversationId ||
      queuedInitialMessage.conversationId !== activeConversationId ||
      !conversationQuery.data
    ) {
      return
    }

    const content = queuedInitialMessage.content
    setQueuedInitialMessage(null)
    void sendStreamingMessage({ content })
  }, [activeConversationId, conversationQuery.data, queuedInitialMessage, sendStreamingMessage])

  function handleCreateConversation(message?: string) {
    const initialMessage = message?.trim()

    createConversationMutation.mutate(
      {
        subject: 'General',
        grade: 'Grade 8',
      },
      {
        onSuccess: (conversation) => {
          setActiveConversationId(conversation.id)
          if (initialMessage) {
            setQueuedInitialMessage({
              conversationId: conversation.id,
              content: initialMessage,
            })
          }
          setNewConversationMessage('')
          setTeacherHelpRequest(null)
          setTeacherHelpError(null)
        },
      },
    )
  }

  function handleSendMessage(payload: {
    content: string
    attachmentIds?: string[]
    attachments?: {
      id: string
      filename: string
      mimeType: string
      sizeBytes: number
      status: 'uploaded' | 'processing' | 'parsed' | 'failed'
      createdAt: string
    }[]
  }) {
    if (!activeConversationId || isStreaming) return

    setSendError(null)
    void sendStreamingMessage(payload)
  }

  function handleRequestTeacherHelp() {
    if (!activeConversationId || teacherHelpMutation.isPending) return

    setTeacherHelpError(null)
    teacherHelpMutation.mutate(
      {
        conversationId: activeConversationId,
        message: 'Student requested help from a teacher.',
      },
      {
        onSuccess: (request) => {
          setTeacherHelpRequest(request)
        },
        onError: (error) => {
          setTeacherHelpError(
            error instanceof Error ? error.message : 'Failed to request teacher help.',
          )
        },
      },
    )
  }

  if (conversationsQuery.isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        <LoadingState />
      </div>
    )
  }

  if (conversationsQuery.isError) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        <ErrorState message="Failed to load conversations." />
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-background px-4 text-foreground">
        <div className="w-full max-w-xl rounded-lg border bg-card p-5 shadow-sm">
          <EmptyState message="No conversations yet." />
          <form
            className="mt-5 space-y-3"
            onSubmit={(event) => {
              event.preventDefault()
              handleCreateConversation(newConversationMessage)
            }}
          >
            <Textarea
              value={newConversationMessage}
              onChange={(event) => setNewConversationMessage(event.target.value)}
              placeholder="Start with a homework question..."
              className="min-h-24 resize-none"
              disabled={createConversationMutation.isPending}
            />
            {createConversationMutation.isError && (
              <p className="text-xs text-destructive">
                {createConversationMutation.error instanceof Error
                  ? createConversationMutation.error.message
                  : 'Failed to create conversation.'}
              </p>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={createConversationMutation.isPending}
            >
              {createConversationMutation.isPending ? 'Starting...' : 'Start conversation'}
            </Button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <ConversationSidebar
        conversations={conversations}
        activeConversationId={activeConversationId ?? ''}
        onSelectConversation={setActiveConversationId}
        onCreateConversation={() => handleCreateConversation()}
      />
      <main className="flex min-w-0 flex-1 flex-col">
        <ChatHeader
          conversation={conversationQuery.data ?? null}
          onCreateConversation={() => handleCreateConversation()}
        />
        {conversationQuery.isLoading && (
          <div className="flex flex-1 items-center justify-center">
            <LoadingState />
          </div>
        )}
        {conversationQuery.isError && (
          <div className="flex flex-1 items-center justify-center">
            <ErrorState message="Failed to load this conversation." />
          </div>
        )}
        {conversationQuery.data && (
          <>
            <ChatMessageList
              messages={displayedMessages}
              isAssistantThinking={false}
              onRetryMessage={retryMessage}
            />
            {sendError && (
              <div className="px-4 pb-3 md:px-6">
                <div className="mx-auto max-w-3xl text-xs text-destructive">
                  {sendError}
                </div>
              </div>
            )}
            <TeacherHelpStatusCard
              onRequestTeacher={handleRequestTeacherHelp}
              isRequesting={teacherHelpMutation.isPending}
              request={teacherHelpStatusQuery.data ?? teacherHelpRequest}
              error={
                teacherHelpError ??
                (teacherHelpStatusQuery.isError ? 'Failed to load teacher-help status.' : null)
              }
            />
            <ChatInput
              onSendMessage={handleSendMessage}
              onStopStreaming={stopStreaming}
              isStreaming={isStreaming}
              disabled={!activeConversationId}
              conversationId={activeConversationId ?? undefined}
            />
          </>
        )}
      </main>
    </div>
  )
}
