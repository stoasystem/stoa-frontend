import { cn } from '@/lib/utils'
import type { ChatMessage } from '@/types/chat'
import { LearningResponseFeedback } from '@/components/chat/LearningResponseFeedback'
import { AttachmentPreview } from '@/components/chat/AttachmentPreview'
import { RetryMessageButton } from '@/components/chat/RetryMessageButton'
import { ModerationReportDialog } from '@/components/moderation/ModerationReportDialog'
import { MathRenderer } from '@/components/ui/MathRenderer'
import { formatTimeOfDay } from '@/lib/formatDateTime'
import { useTranslation } from 'react-i18next'

function roleLabelKey(message: ChatMessage) {
  if (message.role === 'teacher') return 'roles.tutor'
  if (message.role === 'system') return 'roles.system'
  if (message.role === 'assistant') return 'roles.assistant'
  return null
}

function statusLabelKey(message: ChatMessage) {
  if (message.status === 'sending') return 'messageStatus.sending'
  if (message.status === 'stopped') return 'messageStatus.stopped'
  if (message.status === 'failed') return 'messageStatus.failed'
  return null
}

/** Blinking text cursor shown at the end of streaming assistant messages. */
function StreamingCursor() {
  return (
    <span
      aria-hidden="true"
      className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[1px] animate-[blink_1s_step-end_infinite] rounded-[1px] bg-current align-baseline opacity-80"
    />
  )
}

export function ChatMessageBubble({
  message,
  onRetry,
  onRequestTeacher,
  isRequestingTeacher,
  teacherFeedback,
  teacherFeedbackTone,
  moderationTargetId,
}: {
  message: ChatMessage
  onRetry?: (messageId: string) => void
  onRequestTeacher?: () => void
  isRequestingTeacher?: boolean
  teacherFeedback?: string | null
  teacherFeedbackTone?: 'info' | 'error'
  moderationTargetId?: string | null
}) {
  const { t } = useTranslation('chat')
  const isStudent = message.role === 'student'
  const isSystem = message.role === 'system'
  const isStreaming = message.status === 'streaming'
  const roleKey = roleLabelKey(message)
  const statusKey = statusLabelKey(message)

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
        {roleKey && (
          <div
            className={cn(
              'mb-1 text-[11px] font-medium',
              message.role === 'teacher' ? 'text-[hsl(var(--stoa-brand-burgundy))]' : 'text-muted-foreground',
            )}
          >
            {t(roleKey)}
          </div>
        )}
        <div className="whitespace-pre-wrap break-words">
          {message.role === 'assistant' ? (
            <>
              {message.content
                ? <MathRenderer>{message.content}</MathRenderer>
                : isStreaming
                  ? <span className="text-muted-foreground/60 text-xs italic">{t('thinking')}</span>
                  : null}
              {isStreaming && <StreamingCursor />}
            </>
          ) : (
            message.content
          )}
        </div>
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
          <span>{formatTimeOfDay(message.createdAt)}</span>
          {statusKey && <span>{t(statusKey)}</span>}
        </div>
        {message.status === 'failed' && isStudent && onRetry && (
          <div className="mt-3">
            <RetryMessageButton onRetry={() => onRetry(message.id)} />
          </div>
        )}
        {message.role === 'assistant' && !isStreaming && (
          <LearningResponseFeedback
            onRequestTeacher={onRequestTeacher}
            isRequesting={isRequestingTeacher}
            feedback={teacherFeedback}
            feedbackTone={teacherFeedbackTone}
          />
        )}
        {moderationTargetId && message.role === 'assistant' && !isStreaming && (
          <div className="mt-2 border-t pt-2">
            <ModerationReportDialog
              questionId={moderationTargetId}
              surface="ai_answer"
              triggerLabel={t('report.trigger')}
              contextLabel={t('report.context')}
              defaultReason="incorrect_answer"
            />
          </div>
        )}
      </div>
    </article>
  )
}
