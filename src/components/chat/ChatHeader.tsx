import { ArrowLeft, MessageSquarePlus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ChatPageNavigation } from '@/components/chat/ChatPageNavigation'
import { TeacherAvailabilityStatus } from '@/components/chat/TeacherAvailabilityStatus'
import { Button } from '@/components/ui/button'
import type { Conversation } from '@/types/chat'

type ChatHeaderProps = {
  conversation: Conversation | null
  onCreateConversation?: () => void
  /** Offered where the conversation list is not on screen beside the thread. */
  onBackToConversations?: () => void
}

export function ChatHeader({
  conversation,
  onCreateConversation,
  onBackToConversations,
}: ChatHeaderProps) {
  const { t } = useTranslation('chat')

  return (
    <header className="chat-panel flex min-h-16 items-center justify-between border-b px-4 py-3 md:px-6">
      {onBackToConversations && (
        <Button
          className="mr-2 shrink-0 md:hidden"
          size="icon"
          variant="ghost"
          aria-label={t('backToConversations')}
          title={t('backToConversations')}
          onClick={onBackToConversations}
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </Button>
      )}
      <div className="min-w-0 flex-1 pr-3">
        <h1 className="truncate text-base font-semibold">
          {conversation?.title ?? t('newConversation')}
        </h1>
        <p className="mt-1 truncate text-sm text-muted-foreground">
          {conversation ? `${conversation.subject} · ${conversation.grade}` : t('emptyTitle')}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <TeacherAvailabilityStatus />
        <div className="flex items-center gap-1 md:hidden">
          <ChatPageNavigation compact />
          <Button
            size="icon"
            variant="outline"
            aria-label={t('newConversation')}
            onClick={onCreateConversation}
            disabled={!onCreateConversation}
          >
            <MessageSquarePlus className="h-5 w-5 shrink-0" strokeWidth={2.25} aria-hidden="true" />
          </Button>
        </div>
      </div>
    </header>
  )
}
