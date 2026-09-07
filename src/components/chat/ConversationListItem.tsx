import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { formatDayAndMonth } from '@/lib/formatDateTime'
import type { ConversationSummary } from '@/types/chat'

export function ConversationListItem({
  conversation,
  active,
  onClick,
}: {
  conversation: ConversationSummary
  active: boolean
  onClick: () => void
}) {
  // Subscribes to i18n so the date beside the title re-renders in the new
  // language when the student switches it.
  useTranslation('chat')

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
        <div className="shrink-0 text-xs text-muted-foreground">{formatDayAndMonth(conversation.updatedAt)}</div>
      </div>
      {conversation.lastMessagePreview && (
        <div className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
          {conversation.lastMessagePreview}
        </div>
      )}
    </button>
  )
}
