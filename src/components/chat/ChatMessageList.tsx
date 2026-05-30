import { useEffect, useRef } from 'react'
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
  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const prevMessageCountRef = useRef(messages.length)
  const prevLastMessageIdRef = useRef(messages.at(-1)?.id ?? '')

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const prevCount = prevMessageCountRef.current
    const prevLastId = prevLastMessageIdRef.current
    const currentCount = messages.length
    const currentLastId = messages.at(-1)?.id ?? ''

    // Determine if this is a brand-new conversation load (first render with messages)
    const isInitialLoad = prevCount === 0 && currentCount > 0
    // A genuinely new message arrived (count grew or last message ID changed during streaming)
    const isNewMessage = currentCount > prevCount || (currentCount === prevCount && currentLastId !== prevLastId)

    prevMessageCountRef.current = currentCount
    prevLastMessageIdRef.current = currentLastId

    if (isInitialLoad) {
      // On initial load jump instantly to bottom without animation
      bottomRef.current?.scrollIntoView({ behavior: 'instant' })
      return
    }

    if (!isNewMessage) return

    // Only auto-scroll if the user is already near the bottom (within 200px)
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 200
    if (isNearBottom) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  return (
    <div
      ref={scrollContainerRef}
      className="min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-6"
      role="log"
      aria-label={t('messageListLabel')}
      aria-live="polite"
      aria-relevant="additions text"
    >
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
              <Lightbulb className="h-4 w-4" aria-hidden="true" />
              <span>{t('preparing')}</span>
            </div>
          </div>
        )}
        {/* Scroll anchor */}
        <div ref={bottomRef} aria-hidden="true" />
      </div>
    </div>
  )
}
