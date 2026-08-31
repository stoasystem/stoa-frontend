import { MessageSquarePlus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { ChatPageNavigation } from '@/components/chat/ChatPageNavigation'
import { ConversationListItem } from '@/components/chat/ConversationListItem'
import type { ConversationSummary } from '@/types/chat'

export function ConversationSidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onCreateConversation,
}: {
  conversations: ConversationSummary[]
  activeConversationId: string
  onSelectConversation: (id: string) => void
  onCreateConversation?: () => void
}) {
  const { t } = useTranslation('chat')

  return (
    <aside className="chat-panel hidden h-full w-80 shrink-0 overflow-y-auto border-r p-4 md:block">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="font-semibold">{t('conversations')}</div>
          <div className="text-xs text-muted-foreground">{t('conversationsSubtitle')}</div>
        </div>
        <Button
          size="icon"
          variant="outline"
          aria-label={t('newConversation')}
          title={t('newConversation')}
          onClick={onCreateConversation}
          disabled={!onCreateConversation}
        >
          <MessageSquarePlus className="h-5 w-5 shrink-0" strokeWidth={2.25} aria-hidden="true" />
        </Button>
      </div>
      <ChatPageNavigation className="mb-4" />
      <div className="space-y-2">
        {conversations.map((conversation) => (
          <ConversationListItem
            key={conversation.id}
            conversation={conversation}
            active={conversation.id === activeConversationId}
            onClick={() => onSelectConversation(conversation.id)}
          />
        ))}
      </div>
    </aside>
  )
}
