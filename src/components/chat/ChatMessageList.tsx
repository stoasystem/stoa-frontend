import { Lightbulb } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ChatMessageBubble } from '@/components/chat/ChatMessageBubble'
import { EmptyState } from '@/components/common/EmptyState'
import type { ChatMessage } from '@/types/chat'

export function ChatMessageList({
  messages,
  isAssistantThinking = false,
  onRetryMessage,
  onRequestTeacher,
  isRequestingTeacher,
  teacherFeedback,
}: {
  messages: ChatMessage[]
  isAssistantThinking?: boolean
  onRetryMessage?: (messageId: string) => void
  onRequestTeacher?: () => void
  isRequestingTeacher?: boolean
  teacherFeedback?: string | null
}) {
  const { t } = useTranslation('chat')

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        {messages.length === 0 ? (
          <div className="flex min-h-64 items-center justify-center">
            <EmptyState title={t('emptyTitle')} description={t('emptyDescription')} />
          </div>
        ) : (
          messages.map((message) => (
            <ChatMessageBubble
              key={message.id}
              message={message}
              onRetry={onRetryMessage}
              onRequestTeacher={onRequestTeacher}
              isRequestingTeacher={isRequestingTeacher}
              teacherFeedback={teacherFeedback}
            />
          ))
        )}
        {isAssistantThinking && (
          <div className="flex justify-start">
            <div className="flex max-w-[80%] items-center gap-2 rounded-lg border bg-card px-4 py-3 text-sm text-muted-foreground shadow-sm">
              <Lightbulb className="h-4 w-4" />
              <span>{t('preparing')}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
