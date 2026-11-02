import { FormEvent, useEffect, useRef } from 'react'
import { Code2, ImagePlus, List, Pilcrow, Send, Sigma, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { RichTeacherReply } from '@/components/teacher/RichTeacherReply'
import { Button } from '@/components/ui/button'
import { REPLY_MODES, type TeacherReply } from '@/features/teacherReply/useTeacherReply'
import { Attachments } from '@/features/uploads/Attachments'

const modeIcons: Record<(typeof REPLY_MODES)[number], typeof Pilcrow> = {
  paragraph: Pilcrow,
  formula: Sigma,
  unordered_list: List,
  code: Code2,
}

/**
 * The reply box over a help request: draws `useTeacherReply` and hands the
 * teacher's actions back to it (#564). Pictures go up as soon as they are
 * chosen, as a student's do, and are not kept with the draft: an upload is
 * good for 30 minutes, a draft for the whole tab (stoa-backend#145).
 */
export function TeacherReplyComposer({
  reply,
  disabled = false,
}: {
  reply: TeacherReply
  /** Keeps the draft on screen but takes nothing in or out. */
  disabled?: boolean
}) {
  const { t } = useTranslation('teacher')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { mode, value, blocks, problem, sending } = reply
  const wasSending = useRef(sending)

  // The send button is disabled while the reply is on its way, which drops
  // keyboard focus on the page; give it back to the reply once it lands (#332).
  useEffect(() => {
    const active = document.activeElement as (HTMLElement & { disabled?: boolean }) | null
    const lost = !active || active === document.body || active.disabled || !active.isConnected
    if (wasSending.current && !sending && lost) textareaRef.current?.focus()
    wasSending.current = sending
  }, [sending])

  const locked = sending || disabled
  const canSubmit = reply.canSend && !disabled

  function addBlock() {
    if (reply.addBlock()) textareaRef.current?.focus()
  }

  function removeBlock(index: number) {
    reply.removeBlock(index)
    textareaRef.current?.focus()
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSubmit) return
    void reply.send().then((sent) => {
      if (sent) textareaRef.current?.focus()
    })
  }

  return (
    <form className="space-y-3 rounded-md border bg-card p-4" onSubmit={handleSubmit}>
      <div className="flex flex-wrap items-center gap-2">
        {REPLY_MODES.map((option) => {
          const Icon = modeIcons[option]
          const active = mode === option
          return (
            <button
              key={option}
              type="button"
              title={t(`reply.modes.${option}`)}
              aria-label={t(`reply.modes.${option}`)}
              aria-pressed={active}
              className={`inline-flex h-9 w-9 items-center justify-center rounded-md border transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                active ? 'border-primary bg-primary text-primary-foreground' : 'bg-background hover:bg-secondary'
              }`}
              disabled={disabled}
              onClick={() => reply.setMode(option)}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
            </button>
          )
        })}
      </div>
      {blocks.length > 0 && (
        <div className="space-y-2 rounded-md border bg-secondary/40 p-3">
          <p id="teacher-reply-queued" className="text-xs text-muted-foreground">
            {t('reply.queued', { count: blocks.length })}
          </p>
          {/* What is queued is what will be sent: shown as the student sees it,
              and each block can be taken out again (#332). */}
          <ol aria-labelledby="teacher-reply-queued" className="space-y-2">
            {blocks.map((block, index) => (
              <li key={index} className="flex items-start justify-between gap-2 rounded-md bg-background p-2">
                <div className="min-w-0 flex-1">
                  <RichTeacherReply content={{ version: 1, blocks: [block] }} fallback="" />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label={t('reply.removeBlock', { number: index + 1 })}
                  disabled={locked}
                  onClick={() => removeBlock(index)}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </Button>
              </li>
            ))}
          </ol>
        </div>
      )}
      <label className="block text-sm font-medium" htmlFor="teacher-rich-reply">
        {t('reply.label')}
      </label>
      {/* Read-only, not disabled, while sending: a disabled field drops the
          keyboard focus (#332). Disabled only while the page cannot act (#331). */}
      <textarea
        ref={textareaRef}
        id="teacher-rich-reply"
        className="min-h-28 w-full resize-y rounded-md border bg-background px-3 py-2 text-sm leading-6 placeholder:text-muted-foreground"
        placeholder={mode === 'formula' ? '2x + 4 = 10' : t('reply.placeholder')}
        value={value}
        onChange={(event) => reply.setValue(event.target.value)}
        readOnly={sending}
        disabled={disabled}
        aria-invalid={problem ? true : undefined}
        aria-describedby={problem ? 'teacher-reply-problem' : undefined}
      />
      {problem && (
        <p id="teacher-reply-problem" className="text-sm text-destructive">
          {t(`reply.unsafe.${problem.reason}`, problem.values)}
        </p>
      )}
      <Attachments view={reply.attachments.view} copy="teacher" needsText={reply.previewBlocks.length === 0} />
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" disabled={locked} onClick={reply.attachments.pickFile}>
          <ImagePlus className="mr-2 h-4 w-4" aria-hidden="true" />
          {t('reply.attachments.add')}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={addBlock}
          disabled={locked || !value.trim() || Boolean(problem)}
        >
          {t('reply.addBlock')}
        </Button>
        <Button type="submit" disabled={!canSubmit}>
          <Send className="mr-2 h-4 w-4" aria-hidden="true" />
          {t('reply.send')}
        </Button>
      </div>
    </form>
  )
}
