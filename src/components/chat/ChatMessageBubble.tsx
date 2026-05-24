import { cn } from '@/lib/utils'
import type { ChatMessage } from '@/types/chat'

function formatMessageTime(value: string) {
  return new Intl.DateTimeFormat('en', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

export function ChatMessageBubble({ message }: { message: ChatMessage }) {
  const isStudent = message.role === 'student'

  return (
    <div className={cn('flex w-full', isStudent ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[min(80%,42rem)] rounded-lg px-4 py-3 text-sm leading-6 shadow-sm',
          isStudent
            ? 'bg-primary text-primary-foreground'
            : 'border bg-card text-card-foreground',
        )}
      >
        <div className="whitespace-pre-wrap break-words">{message.content}</div>
        <div
          className={cn(
            'mt-2 text-[11px]',
            isStudent ? 'text-primary-foreground/75' : 'text-muted-foreground',
          )}
        >
          {formatMessageTime(message.createdAt)}
        </div>
      </div>
    </div>
  )
}
