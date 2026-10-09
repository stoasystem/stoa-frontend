import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Avatar, Button } from '@/components/base'
import { MathRenderer } from '@/components/ui/MathRenderer'
import { cn } from '@/lib/utils'
import type { ChatMessage } from '@/types/chat'

/*
 * One message in the Ask thread, as the canvas draws the conversation (Home ·
 * conversation open, and its phone board): the student's own on the right in
 * navy, the assistant's on the left in white, 18 radius with the corner nearest
 * the speaker at 6, text 15 / 1.45.
 *
 * A teacher's reply (#12 point 2) is told apart by more than colour: it carries
 * the teacher's name and initials above it, on the green of "in progress".
 */
export function AskMessage({
  message,
  teacherName,
  onRetry,
  after,
}: {
  message: ChatMessage
  /** Who is helping, from the help request; the API does not name a message's author. */
  teacherName?: string | null
  onRetry?: (messageId: string) => void
  /** Shown under the message: the request for a teacher, under the latest answer. */
  after?: ReactNode
}) {
  const { t } = useTranslation('chat')

  if (message.role === 'system') {
    return (
      <p data-message-role="system" className="self-center text-center text-[12px] text-caption">
        {message.content}
      </p>
    )
  }

  if (message.role === 'student') {
    const failed = message.status === 'failed'
    return (
      <div data-message-role="student" className="flex max-w-[88%] flex-col items-end gap-1 self-end">
        <p className="sr-only">{t('ask.thread.you')}</p>
        <div
          className="flex flex-col gap-2 whitespace-pre-wrap break-words bg-accent text-on-accent"
          style={{ padding: '10px 14px', borderRadius: 18, borderBottomRightRadius: 6, fontSize: 15, lineHeight: 1.45 }}
        >
          {message.quote && (
            <figure
              data-message-quote={message.quote.source.kind}
              className="m-0 flex flex-col gap-1 border-l-2 border-[color:color-mix(in_srgb,var(--on-accent)_45%,transparent)] pl-2.5 text-left"
            >
              <figcaption className="text-[12px] font-semibold opacity-80">{t('ask.quote.title')}</figcaption>
              <blockquote className="m-0 text-[14px] leading-[1.4] opacity-90">{message.quote.text}</blockquote>
            </figure>
          )}
          {message.content}
        </div>
        {failed && (
          <div className="flex items-center gap-3 text-[13px]">
            <span className="text-red">{t('ask.thread.notSent')}</span>
            {onRetry && (
              <Button variant="plain" size="small" onClick={() => onRetry(message.id)}>
                {t('ask.thread.sendAgain')}
              </Button>
            )}
          </div>
        )}
      </div>
    )
  }

  if (message.role === 'teacher') {
    const name = teacherName?.trim() || t('ask.thread.teacherFallback')
    return (
      <div data-message-role="teacher" className="flex max-w-full flex-col items-start gap-1 self-start">
        <div className="flex items-center gap-1.5">
          <Avatar name={name} size={16} tone="green" />
          <span data-teacher-name className="text-[12px] font-semibold text-green">
            {name}
          </span>
        </div>
        <div
          className="whitespace-pre-wrap break-words bg-green-tint text-ink"
          style={{ padding: '10px 14px', borderRadius: 18, borderTopLeftRadius: 6, fontSize: 15, lineHeight: 1.45 }}
        >
          {message.content}
        </div>
      </div>
    )
  }

  const streaming = message.status === 'streaming'
  const failed = message.status === 'failed'
  return (
    <div data-message-role="assistant" className="flex w-full flex-col items-start gap-2 self-start">
      <p className="sr-only">{t('ask.thread.assistant')}</p>
      <div
        aria-busy={streaming || undefined}
        // Text chosen in an answer can be quoted back (#12 point 5, #50).
        data-quote-source={streaming || failed ? undefined : 'answer'}
        data-quote-id={message.id}
        className={cn(
          'max-w-full whitespace-pre-wrap break-words border border-[color:var(--card-border)] bg-surface',
          failed ? 'text-red' : 'text-ink',
        )}
        style={{ padding: '11px 15px', borderRadius: 18, borderBottomLeftRadius: 6, fontSize: 15, lineHeight: 1.45 }}
      >
        {message.content ? (
          failed ? message.content : <MathRenderer>{message.content}</MathRenderer>
        ) : streaming ? (
          <span className="text-caption">{t('ask.thread.thinking')}</span>
        ) : null}
      </div>
      {message.status === 'stopped' && <span className="text-[12px] text-caption">{t('ask.thread.stopped')}</span>}
      {after}
    </div>
  )
}
