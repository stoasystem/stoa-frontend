import { FileText, Image as ImageGlyph } from 'lucide-react'
import { memo, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Avatar, Button } from '@/components/base'
import { ICON } from '@/components/base/sizes'
import { AskTargetCard } from '@/features/ask/AskTargetCard'
import { MathRenderer } from '@/components/ui/MathRenderer'
import { AskAnswerSections, hasSections, quoteCaption, type AnswerStep } from '@/features/ask/AskAnswerSections'
import { TeacherReplyImages } from '@/features/ask/TeacherReplyImages'
import { cn } from '@/lib/utils'
import type { ChatAttachment, ChatMessage, KnowledgePoint } from '@/types/chat'

/*
 * One message in the Ask thread, as the canvas draws the conversation (Home ·
 * conversation open, and its phone board): the student's own on the right in
 * navy, the assistant's on the left in white, 18 radius with the corner nearest
 * the speaker at 6, text 15 / 1.45.
 *
 * A teacher's reply (#12 point 2) is told apart by more than colour: it carries
 * the teacher's name and initials above it, on the green of "in progress".
 *
 * Drawn again only when what it is given changes: the thread around it is
 * drawn again at every key typed in the composer and every frame of the phone
 * sheet dragged, and a message's formulas are costly to draw (#416).
 */
export const AskMessage = memo(function AskMessage({
  message,
  teacherName,
  onRetry,
  onAskAboutStep,
  onKnowledgePoint,
  after,
}: {
  message: ChatMessage
  /** Who is helping, from the help request; the API does not name a message's author. */
  teacherName?: string | null
  onRetry?: (messageId: string) => void
  /** "I don't get this step" on an answer laid out in sections (#506). */
  onAskAboutStep?: (step: AnswerStep) => void
  /** To a knowledge point's star: left to #487's card, so absent until it is given one. */
  onKnowledgePoint?: (point: KnowledgePoint & { unitId: string }) => void
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
              <figcaption className="text-[12px] font-semibold opacity-80">{quoteCaption(message.quote, t)}</figcaption>
              <blockquote className="m-0 text-[14px] leading-[1.4] opacity-90">
                <MathRenderer plain>{message.quote.text}</MathRenderer>
              </blockquote>
            </figure>
          )}
          {/* Formulas as maths -- a question asked from an exercise carries its $...$ (#183) -- the rest as typed. */}
          <MathRenderer plain>{message.content}</MathRenderer>
          <MessageAttachments attachments={message.attachments} />
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
          {/*
            Ask is a dark surface (#125), where --green is 3.66:1 against it:
            readable as a fill, not as a word. Lifted towards the sky's own ink
            until it clears 4.5:1; tests/component/askSkySurface.test.tsx rates it.
          */}
          <span data-teacher-name className="text-[12px] font-semibold text-[color:color-mix(in_srgb,var(--green)_30%,var(--on-sky-text))]">
            {name}
          </span>
        </div>
        <div
          className="whitespace-pre-wrap break-words bg-[color:color-mix(in_srgb,var(--green)_26%,var(--sky))] text-ink"
          style={{ padding: '10px 14px', borderRadius: 18, borderTopLeftRadius: 6, fontSize: 15, lineHeight: 1.45 }}
        >
          <MathRenderer plain>{message.content}</MathRenderer>
        </div>
        <TeacherReplyImages attachments={message.attachments} teacher={name} />
      </div>
    )
  }

  const streaming = message.status === 'streaming'
  const failed = message.status === 'failed'
  // Laid out in its sections once it is whole (#506); while it is written,
  // and for a follow-up or an answer from before the sections, the text.
  const sections = !streaming && !failed && hasSections(message.structured) ? message.structured : null
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
        {sections ? (
          <AskAnswerSections
            messageId={message.id}
            structured={sections}
            onAskAboutStep={onAskAboutStep}
            onKnowledgePoint={onKnowledgePoint}
          />
        ) : message.content ? (
          failed ? message.content : <MathRenderer>{message.content}</MathRenderer>
        ) : streaming ? (
          <span className="text-caption">{t('ask.thread.thinking')}</span>
        ) : null}
        <MessageAttachments attachments={message.attachments} />
      </div>
      {message.status === 'stopped' && <span className="text-[12px] text-caption">{t('ask.thread.stopped')}</span>}
      {/* The star the answer found (#487): one card, once the answer is whole. */}
      {message.targetUnit && !streaming && !failed && <AskTargetCard unitId={message.targetUnit.unitId} />}
      {after}
    </div>
  )
})

/**
 * The files a message carries (#125). The server names each one and no more;
 * nothing here opens them, because the thread is for reading the answer and
 * the file is already the student's own.
 */
function MessageAttachments({ attachments }: { attachments?: ChatAttachment[] }) {
  const { t } = useTranslation('chat')
  if (!attachments || attachments.length === 0) return null
  return (
    <ul
      data-message-attachments={attachments.length}
      aria-label={t('ask.attachments.label')}
      className="m-0 flex list-none flex-col gap-1 p-0 pt-1"
    >
      {attachments.map((attachment) => (
        <li key={attachment.id} className="flex items-center gap-1.5 text-[13px] opacity-90">
          <span aria-hidden="true" className="shrink-0">
            {attachment.mimeType.startsWith('image/') ? (
              <ImageGlyph size={ICON.chip} strokeWidth={ICON.stroke} />
            ) : (
              <FileText size={ICON.chip} strokeWidth={ICON.stroke} />
            )}
          </span>
          <span className="truncate">{attachment.filename}</span>
        </li>
      ))}
    </ul>
  )
}
