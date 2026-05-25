import { MessageSquarePlus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import type { Conversation } from '@/types/chat'

type ChatHeaderProps = {
  conversation: Conversation | null
  onCreateConversation?: () => void
}

export function ChatHeader({ conversation, onCreateConversation }: ChatHeaderProps) {
  const { t } = useTranslation('chat')

  return (
    <header className="flex min-h-16 items-center justify-between border-b bg-background/95 px-4 py-3 md:px-6">
      <div className="min-w-0">
        <h1 className="truncate text-base font-semibold tracking-tight">
          {conversation?.title ?? t('newConversation')}
        </h1>
        <p className="mt-1 truncate text-sm text-muted-foreground">
          {conversation ? `${conversation.subject} · ${conversation.grade}` : t('emptyTitle')}
        </p>
      </div>
      <Button
        className="md:hidden"
        size="icon"
        variant="outline"
        aria-label={t('newConversation')}
        onClick={onCreateConversation}
        disabled={!onCreateConversation}
      >
        <MessageSquarePlus className="h-4 w-4" />
      </Button>
    </header>
  )
}
