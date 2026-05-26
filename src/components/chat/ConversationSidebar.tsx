import { MessageSquarePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
  return (
    <aside className="chat-panel hidden h-screen w-80 shrink-0 border-r p-4 md:block">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="font-semibold">STOA Chat</div>
          <div className="text-xs text-muted-foreground">Student learning conversations</div>
        </div>
        <Button
          size="icon"
          variant="outline"
          aria-label="New conversation"
          onClick={onCreateConversation}
          disabled={!onCreateConversation}
        >
          <MessageSquarePlus className="h-5 w-5 shrink-0" strokeWidth={2.25} aria-hidden="true" />
        </Button>
      </div>
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
