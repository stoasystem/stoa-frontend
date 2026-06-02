import { cn } from '@/lib/utils'
import type { ChatMessage } from '@/types/chat'
import { LearningResponseFeedback } from '@/components/chat/LearningResponseFeedback'
import { AttachmentPreview } from '@/components/chat/AttachmentPreview'
import { RetryMessageButton } from '@/components/chat/RetryMessageButton'
import { useTranslation } from 'react-i18next'

function formatMessageTime(value: string) {
  return new Intl.DateTimeFormat('en', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

function getRoleLabel(message: ChatMessage) {
  if (message.role === 'teacher') return 'Tutor'
  if (message.role === 'system') return 'System'
  if (message.role === 'assistant') return 'STOA Learning Assistant'
  return null
}

function getStatusLabel(message: ChatMessage) {
  if (message.status === 'sending') return 'Sending'
  if (message.status === 'streaming') return 'Streaming'
  if (message.status === 'stopped') return 'Generation stopped'
  if (message.status === 'failed') return 'Needs retry'
  return null
}

export function ChatMessageBubble({
  message,
  onRetry,
  onRequestTeacher,
  isRequestingTeacher,
  teacherFeedback,
}: {
  message: ChatMessage
  onRetry?: (messageId: string) => void
  onRequestTeacher?: () => void
  isRequestingTeacher?: boolean
  teacherFeedback?: string | null
}) {
  const { t } = useTranslation('chat')
  const isStudent = message.role === 'student'
  const isSystem = message.role === 'system'
  const roleLabel = getRoleLabel(message)
  const statusLabel = getStatusLabel(message)

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <div className="max-w-[min(90%,36rem)] rounded-md bg-muted px-3 py-2 text-center text-xs text-muted-foreground">
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <article
      className={cn('flex w-full', isStudent ? 'justify-end' : 'justify-start')}
      aria-label={isStudent ? t('studentMessageLabel') : t('assistantMessageLabel')}
    >
      <div
        className={cn(
          'max-w-[min(80%,42rem)] rounded-lg px-4 py-3 text-sm leading-6 shadow-sm',
          isStudent
            ? 'bg-primary text-primary-foreground'
            : message.role === 'teacher'
              ? 'border border-primary/20 bg-[hsl(var(--stoa-brand-burgundy-soft))] text-[hsl(var(--stoa-brand-burgundy-strong))]'
              : 'border border-border/80 bg-card/95 text-card-foreground',
          message.status === 'failed' && 'border-destructive/50',
        )}
      >
        {roleLabel && (
          <div
            className={cn(
              'mb-1 text-[11px] font-medium',
              message.role === 'teacher' ? 'text-[hsl(var(--stoa-brand-burgundy))]' : 'text-muted-foreground',
            )}
          >
            {roleLabel}
          </div>
        )}
        <div className="whitespace-pre-wrap break-words">{message.content}</div>
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-3 grid gap-2">
            {message.attachments.map((attachment) => (
              <AttachmentPreview key={attachment.id} attachment={attachment} />
            ))}
          </div>
        )}
        <div
          className={cn(
            'mt-2 flex flex-wrap items-center gap-2 text-[11px]',
            isStudent ? 'text-primary-foreground/75' : 'text-muted-foreground',
          )}
        >
          <span>{formatMessageTime(message.createdAt)}</span>
          {statusLabel && <span>{statusLabel}</span>}
        </div>
        {message.status === 'failed' && isStudent && onRetry && (
          <div className="mt-3">
            <RetryMessageButton onRetry={() => onRetry(message.id)} />
          </div>
        )}
        {message.role === 'assistant' && message.status !== 'streaming' && (
          <LearningResponseFeedback
            onRequestTeacher={onRequestTeacher}
            isRequesting={isRequestingTeacher}
            feedback={teacherFeedback}
          />
        )}
      </div>
    </article>
  )
}
