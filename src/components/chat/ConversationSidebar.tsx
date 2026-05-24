import { MessageSquarePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConversationListItem } from '@/components/chat/ConversationListItem'
import type { Conversation } from '@/types/chat'

export function ConversationSidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
}: {
  conversations: Conversation[]
  activeConversationId: string
  onSelectConversation: (id: string) => void
}) {
  return (
    <aside className="hidden h-screen w-80 shrink-0 border-r bg-background/95 p-4 md:block">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="font-semibold tracking-tight">STOA Chat</div>
          <div className="text-xs text-muted-foreground">Student learning conversations</div>
        </div>
        <Button size="icon" variant="outline" aria-label="New conversation">
          <MessageSquarePlus className="h-4 w-4" />
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
