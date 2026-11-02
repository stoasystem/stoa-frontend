import { ArrowUp, Camera, Image as ImageGlyph, Mic, Plus, Smartphone, type LucideIcon } from 'lucide-react'
import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { IconButton } from '@/components/base/IconButton'
import { COMPOSER } from '@/components/base/sizes'
import * as Menu from '@radix-ui/react-dropdown-menu'
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
  /**
   * The + opens a menu of the ways to add a picture (#553), each shown when
   * given. `onAttach` chooses one already on the device.
   */
  onAttach?: () => void
  /** Takes a photo with the device's camera (#509): a phone or a tablet. */
  onCapture?: () => void
  /**
   * A photo taken on the phone, sent here by a QR (#514): for a computer,
   * where there is no camera to open.
   */
  onPhone?: () => void
  /**
   * The phone's way is there but cannot be used yet (no conversation to send
   * the photo into, #554): the menu shows it, off, with the reason.
   */
  phoneLater?: boolean
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
   * Ask's fields: a microphone that says how to dictate on this device (#515,
   * #553). STOA starts no dictation itself (ADR 0005); the device's own types
   * into the field like a keyboard. No microphone where the device is not known.
   */
  dictation?: boolean
  className?: string
}

/** The line over the composer: the reason for not sending. */
const LINE_TEXT = 'm-0 text-center text-[13px] text-[color:var(--on-sky-text-body,var(--secondary))]'
const FLOATING_LINE = cn('pointer-events-none absolute inset-x-0 bottom-full mb-1.5', LINE_TEXT)

type AddAction = { key: 'capture' | 'attach' | 'phone'; icon: LucideIcon; label: string; note?: string; run?: () => void }

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
  onPhone,
  phoneLater = false,
  footerStart,
  disabled = false,
  describedBy,
  busy = false,
  onCompositionStart,
  onCompositionEnd,
  dictation = false,
  className,
}: ComposerProps) {
  const { t } = useTranslation('common')
  const fieldId = useId()
  const hintId = `${fieldId}-send-hint`
  const dictationId = `${fieldId}-dictation`
  const field = useRef<HTMLTextAreaElement>(null)
  const [blocked, setBlocked] = useState<SendBlocked | null>(null)
  const [platform] = useState(() => (dictation ? dictationPlatform() : null))
  const [dictationOpen, setDictationOpen] = useState(false)
  const mic = useRef<HTMLButtonElement>(null)
  const bubble = useRef<HTMLDivElement>(null)
  const spec = COMPOSER[variant]
  const empty = value.trim().length === 0
  const canSend = !disabled && !busy && !empty

  // The way to dictate stays until it is put away: Esc, the microphone again,
  // or a press anywhere else. Esc gives the keyboard back to the microphone.
  useEffect(() => {
    if (!dictationOpen) return
    function onKey(event: globalThis.KeyboardEvent) {
      if (event.key !== 'Escape') return
      setDictationOpen(false)
      mic.current?.focus()
    }
    function onPress(event: PointerEvent) {
      const target = event.target as Node
      if (bubble.current?.contains(target) || mic.current?.contains(target)) return
      setDictationOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPress)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPress)
    }
  }, [dictationOpen])

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

  /*
   * One + for every way to add a picture (#553): a child pressing it expects
   * the choice, and found a file dialog with no word of the phone. A phone or
   * tablet takes a photo or chooses one; a computer chooses one or has the
   * phone take it. A way that cannot be used yet stays in the list with its
   * reason, reachable and read out, rather than going missing.
   */
  const actions = [
    onCapture && { key: 'capture', icon: Camera, label: t('composer.capture'), run: onCapture },
    onAttach && { key: 'attach', icon: ImageGlyph, label: t('composer.attach'), run: onAttach },
    onPhone
      ? { key: 'phone', icon: Smartphone, label: t('composer.phone'), run: onPhone }
      : phoneLater && { key: 'phone', icon: Smartphone, label: t('composer.phone'), note: t('composer.phoneLater') },
  ].filter(Boolean) as AddAction[]
  const add = actions.length > 0 && (
    <Menu.Root modal={false}>
      <Menu.Trigger asChild disabled={disabled}>
        <IconButton
          label={t('composer.add')}
          icon={Plus}
          size={spec.attach}
          glyph={spec.attachGlyph}
          variant="tinted"
          disabled={disabled}
          data-composer-add
        />
      </Menu.Trigger>
      {/* Not in a portal: in the composer's own surface, so it takes the
        * panel's colours (on the sky, dark) rather than the page's. The sky's
        * surface is glass; laid over the ground, it hides what is under it. */}
      <Menu.Content
        side="top"
        align="start"
        sideOffset={8}
        data-composer-menu
        className="z-50 min-w-[240px] max-w-[320px] rounded-[12px] border border-[color:var(--float-border)] [background:linear-gradient(var(--surface),var(--surface)),var(--ground)] p-1.5 text-ink shadow-[var(--shadow-float)]"
      >
        {actions.map((action) => (
          <Menu.Item
            key={action.key}
            data-composer-action={action.key}
            aria-disabled={action.run ? undefined : true}
            onSelect={(event) => {
              if (!action.run) {
                // Off: the menu stays, and its reason stays on screen.
                event.preventDefault()
                return
              }
              action.run()
            }}
            className={cn(
              'flex min-h-11 cursor-pointer select-none items-start gap-2.5 rounded-[8px] px-2.5 py-2 text-[15px] focus:bg-fill',
              !action.run && 'cursor-default text-caption',
            )}
          >
            <action.icon size={18} strokeWidth={1.8} aria-hidden="true" className="mt-0.5 shrink-0" />
            <span className="flex min-w-0 flex-col gap-0.5">
              <span>{action.label}</span>
              {action.note && <span className="text-[13px] leading-snug text-caption">{action.note}</span>}
            </span>
          </Menu.Item>
        ))}
      </Menu.Content>
    </Menu.Root>
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
   * The microphone (#553) took the place of the line that used to sit over the
   * field: the child asked for an icon. It says how to start the device's own
   * dictation and that STOA only receives the text; it starts nothing itself.
   */
  const micButton = platform && (
    <IconButton
      ref={mic}
      label={t('composer.dictation.label')}
      icon={Mic}
      size={spec.attach}
      glyph={spec.attachGlyph}
      variant="plain"
      aria-expanded={dictationOpen}
      aria-controls={dictationOpen ? dictationId : undefined}
      onClick={() => setDictationOpen((open) => !open)}
      disabled={disabled}
      data-composer-mic
    />
  )
  const dictationBubble = platform && dictationOpen && (
    <div
      ref={bubble}
      id={dictationId}
      role="note"
      aria-label={t('composer.dictation.label')}
      data-composer-dictation={platform}
      className="absolute bottom-full right-0 z-10 mb-2 flex max-w-[320px] flex-col gap-1 rounded-[12px] border border-[color:var(--float-border)] [background:linear-gradient(var(--surface),var(--surface)),var(--ground)] p-3 text-left shadow-[var(--shadow-float)]"
    >
      <p className="m-0 text-[15px] text-ink">{t(`composer.dictation.${platform}`)}</p>
      <p className="m-0 text-[13px] text-caption">{t('composer.dictation.privacy')}</p>
    </div>
  )
  const fieldDescribedBy = [describedBy, blocked ? hintId : undefined].filter(Boolean).join(' ') || undefined
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
        onKeyDown={onKeyDown}
        onCompositionStart={onCompositionStart}
        onCompositionEnd={onCompositionEnd && ((event) => onCompositionEnd(event.currentTarget.value))}
        className={cn(
          'min-w-0 resize-none border-0 bg-transparent text-ink outline-none placeholder:text-caption',
          // One line: no scrollbar. Its arrows stood beside an empty field on
          // Windows, a pixel taller than its box, and meant nothing (#553).
          variant === 'docked'
            ? 'flex-1 text-[16px] leading-[1.4] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
            : 'text-[17px] leading-[1.45]',
        )}
        style={{ height: spec.textarea, padding: variant === 'docked' ? '6px 4px' : '2px 4px' }}
      />
    </>
  )

  if (variant === 'docked') {
    return (
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
        {dictationBubble}
        {add}
        {fieldParts}
        {micButton}
        {send}
      </form>
    )
  }

  return (
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
      {dictationBubble}
      {fieldParts}
      <div data-composer-footer className="flex items-center gap-1.5" style={{ height: COMPOSER.full.footer }}>
        {add}
        {footerStart}
        <div className="flex-1" />
        {micButton}
        {send}
      </div>
    </form>
  )
}
