import { useEffect, useMemo, useState } from 'react'
import { ChatHeader } from '@/components/chat/ChatHeader'
import { ChatInput } from '@/components/chat/ChatInput'
import { ChatMessageList } from '@/components/chat/ChatMessageList'
import { ConversationSidebar } from '@/components/chat/ConversationSidebar'
import { TeacherEscalationCard } from '@/components/chat/TeacherEscalationCard'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { LoadingState } from '@/components/common/LoadingState'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useConversationQuery } from '@/hooks/chat/useConversationQuery'
import { useConversationsQuery } from '@/hooks/chat/useConversationsQuery'
import { useCreateConversationMutation } from '@/hooks/chat/useCreateConversationMutation'
import { useSendMessageMutation } from '@/hooks/chat/useSendMessageMutation'
import { useTeacherHelpMutation } from '@/hooks/chat/useTeacherHelpMutation'

export function ChatPage() {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [sendError, setSendError] = useState<string | null>(null)
  const [teacherHelpFeedback, setTeacherHelpFeedback] = useState<{
    message: string
    tone: 'success' | 'error'
  } | null>(null)
  const [newConversationMessage, setNewConversationMessage] = useState('')

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
  const sendMessageMutation = useSendMessageMutation(activeConversationId)
  const teacherHelpMutation = useTeacherHelpMutation()

  function handleCreateConversation(message?: string) {
    const initialMessage = message?.trim() || 'I need help with a homework question.'

    createConversationMutation.mutate(
      {
        subject: 'General',
        grade: 'Grade 8',
        initialMessage,
      },
      {
        onSuccess: (conversation) => {
          setActiveConversationId(conversation.id)
          setNewConversationMessage('')
          setSendError(null)
          setTeacherHelpFeedback(null)
        },
      },
    )
  }

  function handleSendMessage(content: string) {
    if (!activeConversationId || sendMessageMutation.isPending) return

    setSendError(null)
    sendMessageMutation.mutate(
      { content },
      {
        onError: (error) => {
          setSendError(error instanceof Error ? error.message : 'Failed to send message.')
        },
      },
    )
  }

  function handleRequestTeacherHelp() {
    if (!activeConversationId || teacherHelpMutation.isPending) return

    setTeacherHelpFeedback(null)
    teacherHelpMutation.mutate(
      {
        conversationId: activeConversationId,
        message: 'Student requested help from a teacher.',
      },
      {
        onSuccess: () => {
          setTeacherHelpFeedback({
            message: 'Teacher request sent. A tutor will review this conversation.',
            tone: 'success',
          })
        },
        onError: (error) => {
          setTeacherHelpFeedback({
            message: error instanceof Error ? error.message : 'Failed to request teacher help.',
            tone: 'error',
          })
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
              disabled={createConversationMutation.isPending || !newConversationMessage.trim()}
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
              messages={conversationQuery.data.messages}
              isAssistantThinking={sendMessageMutation.isPending}
            />
            {(sendError || sendMessageMutation.isError) && (
              <div className="px-4 pb-3 md:px-6">
                <div className="mx-auto max-w-3xl text-xs text-destructive">
                  {sendError ?? 'Failed to send message.'}
                </div>
              </div>
            )}
            <TeacherEscalationCard
              onRequestTeacher={handleRequestTeacherHelp}
              isRequesting={teacherHelpMutation.isPending}
              feedback={teacherHelpFeedback?.message}
              feedbackTone={teacherHelpFeedback?.tone}
            />
            <ChatInput
              onSendMessage={handleSendMessage}
              disabled={sendMessageMutation.isPending}
            />
          </>
        )}
      </main>
    </div>
  )
}
