import { cn } from '@/lib/utils'
import type { ConversationSummary } from '@/types/chat'

function formatUpdatedAt(value: string) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(value))
}

export function ConversationListItem({
  conversation,
  active,
  onClick,
}: {
  conversation: ConversationSummary
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full rounded-lg border border-transparent px-3 py-3 text-left transition hover:bg-muted',
        active && 'border-border bg-muted shadow-sm',
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="truncate text-sm font-medium">{conversation.title}</div>
        <div className="shrink-0 text-xs text-muted-foreground">{formatUpdatedAt(conversation.updatedAt)}</div>
      </div>
      <div className="mt-1 text-xs text-muted-foreground">
        {conversation.subject} · {conversation.grade}
      </div>
      {conversation.lastMessagePreview && (
        <div className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">
          {conversation.lastMessagePreview}
        </div>
      )}
    </button>
  )
}
