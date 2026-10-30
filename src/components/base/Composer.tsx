import { ArrowUp, Camera, Plus } from 'lucide-react'
import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { IconButton } from '@/components/base/IconButton'
import { COMPOSER } from '@/components/base/sizes'
import { dictationPlatform } from '@/lib/dictationPlatform'
import { cn } from '@/lib/utils'

export type ComposerVariant = 'docked' | 'full'

export interface ComposerProps {
  value: string
  onChange: (value: string) => void
  onSubmit: (value: string) => void
  /** The field's name for assistive tech (visually hidden). */
  label: string
  placeholder?: string
  variant?: ComposerVariant
  /** Shows the + (photo or file) when given. */
  onAttach?: () => void
  /**
   * Shows the camera beside the + when given (#509): it takes a photo, where
   * the + chooses one that is already there.
   */
  onCapture?: () => void
  /** Full composer only: between + and send, e.g. the subject picker. */
  footerStart?: ReactNode
  disabled?: boolean
  /** The id of a line saying more about the field, e.g. why it is disabled. */
  describedBy?: string
  /** Sending: the field stays editable, send is held. */
  busy?: boolean
  /** An input method started composing (IME, dead keys). */
  onCompositionStart?: () => void
  /** An input method finished composing; the field's value then. */
  onCompositionEnd?: (value: string) => void
  /**
   * Ask's fields: while empty and focused, say how to dictate on this device
   * (#515). `floating` puts the line in the free space over the composer, like
   * the reason for not sending; `inline` gives it a line of its own above, kept
   * whether it shows or not, for a host with something to read or press right
   * over the composer (Ask's panel).
   */
  dictationHint?: DictationHintPlacement
  className?: string
}

export type DictationHintPlacement = 'floating' | 'inline'

/** The lines over the composer: the reason for not sending, how to dictate. */
const LINE_TEXT = 'm-0 text-center text-[13px] text-[color:var(--on-sky-text-body,var(--secondary))]'
const FLOATING_LINE = cn('pointer-events-none absolute inset-x-0 bottom-full mb-1.5', LINE_TEXT)

/** Why send would not go out yet. Pressing it says which, rather than doing nothing. */
type SendBlocked = 'empty' | 'busy'

/*
 * Components board, "Fields and composer": the composer is the only floating
 * surface on a page and holds the only filled control (send). Sizes board:
 * docked 46 high, radius 22-24, textarea 32, + 32/20, send 32/18; full ~150,
 * radius 18, textarea 78, footer row 32.
 *
 * Enter sends, Shift+Enter breaks the line, and nothing is sent while an input
 * method is still composing (Japanese, Chinese, accented keyboards).
 *
 * Send is checked when it is pressed rather than held shut before it (#125).
 * An empty field used to leave a grey arrow that swallowed every tap without a
 * word, and `disabled` took it out of the tab order too, so the reader who most
 * needs the reason could not even reach it. It stays pressable now: pressing it
 * puts the cursor in the field and says what is missing. The field's own
 * `disabled` -- Ask switched off during a quiz -- still shuts the whole
 * composer, because there the reason is already on screen beside it.
 */
export function Composer({
  value,
  onChange,
  onSubmit,
  label,
  placeholder,
  variant = 'docked',
  onAttach,
  onCapture,
  footerStart,
  disabled = false,
  describedBy,
  busy = false,
  onCompositionStart,
  onCompositionEnd,
  dictationHint,
  className,
}: ComposerProps) {
  const { t } = useTranslation('common')
  const fieldId = useId()
  const hintId = `${fieldId}-send-hint`
  const dictationId = `${fieldId}-dictation`
  const field = useRef<HTMLTextAreaElement>(null)
  const [blocked, setBlocked] = useState<SendBlocked | null>(null)
  const [focused, setFocused] = useState(false)
  const [platform] = useState(() => (dictationHint ? dictationPlatform() : null))
  const spec = COMPOSER[variant]
  const empty = value.trim().length === 0
  const canSend = !disabled && !busy && !empty
  // Only when there is nothing to read in the field yet and the child is about
  // to write: once a word is in, the line has done its work and goes. Not while
  // an answer is still coming, which is what the child is reading then.
  const dictation = platform && focused && empty && !disabled && !busy && !blocked ? platform : null

  // The answer arrived: the reason for holding send went with it.
  useEffect(() => {
    if (!busy) setBlocked((reason) => (reason === 'busy' ? null : reason))
  }, [busy])

  function change(next: string) {
    setBlocked(null)
    onChange(next)
  }

  function submit(event?: FormEvent) {
    event?.preventDefault()
    if (disabled) return
    if (busy) {
      setBlocked('busy')
      return
    }
    if (empty) {
      setBlocked('empty')
      field.current?.focus()
      return
    }
    setBlocked(null)
    onSubmit(value)
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    // keyCode 229 is how Safari reports the Enter that ends a composition.
    const composing = event.nativeEvent.isComposing || event.keyCode === 229
    if (event.key === 'Enter' && !event.shiftKey && !composing) {
      event.preventDefault()
      submit()
    }
  }

  const attach = onAttach && (
    <IconButton
      label={t('composer.attach')}
      icon={Plus}
      size={spec.attach}
      glyph={spec.attachGlyph}
      variant="tinted"
      onClick={onAttach}
      disabled={disabled}
    />
  )
  const capture = onCapture && (
    <IconButton
      label={t('composer.capture')}
      icon={Camera}
      size={spec.attach}
      glyph={spec.attachGlyph}
      variant="tinted"
      onClick={onCapture}
      disabled={disabled}
    />
  )
  const send = (
    <IconButton
      type="submit"
      label={t('composer.send')}
      icon={ArrowUp}
      size={spec.send}
      glyph={spec.sendGlyph}
      variant="filled"
      disabled={disabled}
      aria-disabled={canSend ? undefined : true}
      aria-describedby={blocked ? hintId : undefined}
      style={canSend ? undefined : { opacity: 'var(--disabled-opacity)' }}
    />
  )
  /*
   * Above the pill, not inside it: the docked composer is one row 46 high with
   * nowhere to put a sentence, and both hosts leave the space over it free.
   *
   * Always mounted, only its text changes: a live region added to the page
   * together with its words is not announced, so the reason was shown but
   * never read out (#345).
   */
  const hint = (
    <p
      id={hintId}
      data-composer-hint={blocked ?? undefined}
      role="status"
      className={FLOATING_LINE}
    >
      {blocked ? t(`composer.sendBlocked.${blocked}`) : null}
    </p>
  )
  /*
   * Floating, it shares the free space with the reason for not sending, which
   * takes its place when there is one. Not a live region: it would be read
   * out on every focus. The field points at it instead, so it is heard with
   * the field.
   */
  const inline = dictationHint === 'inline'
  /*
   * Inline, the line keeps its room whether it shows or not, and only its
   * words come and go. Taking the room on focus and giving it back on blur
   * moved everything over the composer by a line in the middle of a click:
   * pressing "Send again" took the focus off the empty field, the line went,
   * the message moved, and the click landed on nothing.
   */
  const dictationLine = inline
    ? platform && (
        <p
          id={dictationId}
          data-composer-dictation={dictation ?? undefined}
          data-composer-dictation-placement="inline"
          className={cn(LINE_TEXT, 'pb-1')}
          style={dictation ? undefined : { visibility: 'hidden' }}
        >
          {t(`composer.dictation.${platform}`)}
        </p>
      )
    : dictation && (
        <p
          id={dictationId}
          data-composer-dictation={dictation}
          data-composer-dictation-placement="floating"
          className={FLOATING_LINE}
        >
          {t(`composer.dictation.${dictation}`)}
        </p>
      )
  const fieldDescribedBy =
    [describedBy, blocked ? hintId : undefined, dictation ? dictationId : undefined].filter(Boolean).join(' ') ||
    undefined
  const fieldParts = (
    <>
      <label htmlFor={fieldId} className="sr-only">
        {label}
      </label>
      <textarea
        id={fieldId}
        ref={field}
        data-composer-field
        rows={variant === 'docked' ? 1 : 3}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        aria-describedby={fieldDescribedBy}
        onChange={(event) => change(event.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={onKeyDown}
        onCompositionStart={onCompositionStart}
        onCompositionEnd={onCompositionEnd && ((event) => onCompositionEnd(event.currentTarget.value))}
        className={cn(
          'min-w-0 resize-none border-0 bg-transparent text-ink outline-none placeholder:text-caption',
          variant === 'docked' ? 'flex-1 text-[16px] leading-[1.4]' : 'text-[17px] leading-[1.45]',
        )}
        style={{ height: spec.textarea, padding: variant === 'docked' ? '6px 4px' : '2px 4px' }}
      />
    </>
  )

  /*
   * Inline, the line sits above the form in the host's own flow, so it covers
   * nothing the host shows over the composer.
   */
  if (variant === 'docked') {
    const form = (
      <form
        data-composer="docked"
        onSubmit={submit}
        className={cn(
          'relative flex w-full items-center gap-2 border border-[color:var(--float-border)] bg-surface',
          className,
        )}
        style={{
          height: COMPOSER.docked.height,
          borderRadius: COMPOSER.docked.radius,
          padding: '6px 6px 6px 8px',
          boxShadow: 'var(--shadow-float)',
        }}
      >
        {hint}
        {!inline && dictationLine}
        {attach}
        {capture}
        {fieldParts}
        {send}
      </form>
    )
    return inline ? (
      <>
        {dictationLine}
        {form}
      </>
    ) : (
      form
    )
  }

  const form = (
    <form
      data-composer="full"
      onSubmit={submit}
      className={cn('relative flex w-full flex-col gap-3 border border-[color:var(--float-border)] bg-surface', className)}
      style={{
        minHeight: COMPOSER.full.minHeight,
        borderRadius: COMPOSER.full.radius,
        padding: '16px 16px 12px',
        boxShadow: 'var(--shadow-float)',
      }}
    >
      {hint}
      {!inline && dictationLine}
      {fieldParts}
      <div data-composer-footer className="flex items-center gap-1.5" style={{ height: COMPOSER.full.footer }}>
        {attach}
        {capture}
        {footerStart}
        <div className="flex-1" />
        {send}
      </div>
    </form>
  )
  return inline ? (
    <>
      {dictationLine}
      {form}
    </>
  ) : (
    form
  )
}
