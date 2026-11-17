import { ArrowUp, Camera, Image as ImageGlyph, LoaderCircle, Mic, Plus, Smartphone, Square, type LucideIcon } from 'lucide-react'
import { useCallback, useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { IconButton } from '@/components/base/IconButton'
import { COMPOSER } from '@/components/base/sizes'
import * as Menu from '@radix-ui/react-dropdown-menu'
import { useVoiceRecording, type VoiceInput } from '@/components/base/useVoiceRecording'
import { dictationPlatform } from '@/lib/dictationPlatform'
import { clockOf, insertAtCursor, MAX_RECORDING_SECONDS } from '@/lib/voiceRecording'
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
  /** A press on the field itself, by pointer: not focus, which a script or Tab also gives. */
  onFieldClick?: () => void
  /** Keys on the field, before the composer's own; `preventDefault` keeps them from it. */
  onFieldKeyDown?: (event: KeyboardEvent<HTMLTextAreaElement>) => void
  /** A popup the field opens (`onFieldClick`): its id and whether it is open. */
  fieldPopup?: { id: string; expanded: boolean }
  /** Full composer only: between + and send, e.g. the subject picker. */
  footerStart?: ReactNode
  disabled?: boolean
  /**
   * Said in the field instead of `placeholder` while `disabled`, e.g. that
   * asking is paused once the usage period has ended (#615). Without it the
   * field keeps its own placeholder, as during a quiz.
   */
  disabledPlaceholder?: string
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
  /**
   * Ask's fields, for a student a linked parent allowed to ask by voice
   * (#697): the microphone records, and what was said is put into the field
   * at the cursor, not sent. Without it, or once the browser refuses the
   * microphone, the microphone says how to dictate (`dictation`).
   */
  voice?: VoiceInput
  className?: string
}

/** The line over the composer: the reason for not sending. */
const LINE_TEXT = 'm-0 text-center text-[13px] text-[color:var(--on-sky-text-body,var(--secondary))]'
const FLOATING_LINE = cn('pointer-events-none absolute inset-x-0 bottom-full mb-1.5', LINE_TEXT)

type AddAction = { key: 'capture' | 'attach' | 'phone'; icon: LucideIcon; label: string; run: () => void }

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
  onFieldClick,
  onFieldKeyDown,
  fieldPopup,
  footerStart,
  disabled = false,
  disabledPlaceholder,
  describedBy,
  busy = false,
  onCompositionStart,
  onCompositionEnd,
  dictation = false,
  voice,
  className,
}: ComposerProps) {
  const { t } = useTranslation('common')
  const fieldId = useId()
  const hintId = `${fieldId}-send-hint`
  const dictationId = `${fieldId}-dictation`
  const field = useRef<HTMLTextAreaElement>(null)
  const [blocked, setBlocked] = useState<SendBlocked | null>(null)
  const voiceId = `${fieldId}-voice`
  const [platform] = useState(() => (dictation || voice ? dictationPlatform() : null))
  const [dictationOpen, setDictationOpen] = useState(false)
  const mic = useRef<HTMLButtonElement>(null)
  const bubble = useRef<HTMLDivElement>(null)
  const valueNow = useRef(value)
  useEffect(() => {
    valueNow.current = value
  })
  /*
   * What was said goes where the cursor is (a selection is replaced), and the
   * cursor goes after it, so the child reads it over and sends it themself
   * (#697). Nothing is sent from here.
   */
  const insertSpoken = useCallback((text: string) => {
    const node = field.current
    const { value: next, cursor } = insertAtCursor(valueNow.current, node?.selectionStart, node?.selectionEnd, text)
    valueNow.current = next
    setBlocked(null)
    onChange(next)
    window.requestAnimationFrame(() => {
      const now = field.current
      if (!now) return
      now.focus()
      now.setSelectionRange(cursor, cursor)
    })
  }, [onChange])
  const recording = useVoiceRecording(voice && !disabled ? voice : undefined, insertSpoken)
  const voiceState = recording.state
  /** The microphone records: voice questions are on and the browser has not refused the microphone. */
  const records = Boolean(voice) && !recording.micBlocked
  const listening = voiceState.phase === 'listening'
  const working = voiceState.phase === 'starting' || voiceState.phase === 'transcribing'
  const voiceOpen = records
    ? listening || voiceState.phase === 'transcribing' || voiceState.phase === 'failed'
    : voiceState.phase === 'failed' && voiceState.failure !== 'micBlocked'
  const spec = COMPOSER[variant]
  const empty = value.trim().length === 0
  const canSend = !disabled && !busy && !empty
  const shownPlaceholder = disabled && disabledPlaceholder ? disabledPlaceholder : placeholder
  /*
   * Shut, it has to look shut (#615). The white floating pill with its shadow
   * and inviting placeholder read as a field that was broken, not one that was
   * closed: so it sinks to the quiet --fill, loses the floating shadow, and the
   * pointer says no. The +, the microphone and send all carry IconButton's
   * disabled opacity (--disabled-opacity).
   */
  const surface = disabled ? 'bg-fill cursor-not-allowed' : 'bg-surface'
  const shadow = disabled ? 'none' : 'var(--shadow-float)'

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

  // Esc puts a recording, its transcription or its failure away; the field keeps what it had.
  const dismissVoice = recording.dismiss
  useEffect(() => {
    if (!voiceOpen) return
    function onKey(event: globalThis.KeyboardEvent) {
      if (event.key !== 'Escape') return
      dismissVoice()
      mic.current?.focus()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [voiceOpen, dismissVoice])

  // Switched off mid-recording (a quiz started, the period ended): nothing of it is kept.
  useEffect(() => {
    if (disabled) dismissVoice()
  }, [disabled, dismissVoice])

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
    onFieldKeyDown?.(event)
    if (event.defaultPrevented) return
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
   * phone take it, a new question as much as one already asked (#554). Ask's
   * docked composer offers the same menu on the star map, before Ask is open:
   * what is chosen there is handed to Ask's own composer (`AskHost`).
   */
  const actions = [
    onCapture && { key: 'capture', icon: Camera, label: t('composer.capture'), run: onCapture },
    onAttach && { key: 'attach', icon: ImageGlyph, label: t('composer.attach'), run: onAttach },
    onPhone && { key: 'phone', icon: Smartphone, label: t('composer.phone'), run: onPhone },
  ].filter(Boolean) as AddAction[]
  const addButton = (
    <IconButton
      label={t('composer.add')}
      icon={Plus}
      size={spec.attach}
      glyph={spec.attachGlyph}
      variant="tinted"
      disabled={disabled}
      data-composer-add
    />
  )
  const add = actions.length > 0 && (
    <Menu.Root modal={false}>
      <Menu.Trigger asChild disabled={disabled}>
        {addButton}
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
            onSelect={action.run}
            className="flex min-h-11 cursor-pointer select-none items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-[15px] focus:bg-fill"
          >
            <action.icon size={18} strokeWidth={1.8} aria-hidden="true" className="shrink-0" />
            <span className="min-w-0">{action.label}</span>
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
   * field: the child asked for an icon. Without voice questions it says how to
   * start the device's own dictation and that STOA only receives the text; it
   * starts nothing itself. With them (#697) it records: press to start, press
   * again to stop.
   */
  function pressMic() {
    if (!records) {
      dismissVoice()
      setDictationOpen((open) => !open)
      return
    }
    if (listening) recording.stop()
    else if (!working) void recording.start()
  }
  // The browser refused the microphone: from here on it says how to dictate, and says so at once.
  const micBlocked = recording.micBlocked
  useEffect(() => {
    if (!micBlocked) return
    dismissVoice()
    setDictationOpen(true)
  }, [micBlocked, dismissVoice])
  const micLabel = records
    ? t(listening ? 'composer.voice.stop' : 'composer.voice.start')
    : t('composer.dictation.label')
  const micButton = (platform || voice) && (
    <IconButton
      ref={mic}
      label={micLabel}
      icon={listening ? Square : Mic}
      size={spec.attach}
      glyph={spec.attachGlyph}
      variant={listening ? 'tinted' : 'plain'}
      aria-expanded={records ? undefined : dictationOpen}
      aria-controls={records ? (voiceOpen ? voiceId : undefined) : dictationOpen ? dictationId : undefined}
      aria-pressed={records ? listening : undefined}
      aria-disabled={records && working ? true : undefined}
      onClick={pressMic}
      disabled={disabled}
      data-composer-mic={records ? 'voice' : 'dictation'}
      data-composer-mic-phase={records ? voiceState.phase : undefined}
    />
  )
  /** Why the microphone says how to dictate, when it would have recorded. */
  const blockedNote = voice && micBlocked ? t('composer.voice.failed.micBlocked') : null
  const dictationBubble = !records && dictationOpen && (platform || blockedNote) && (
    <div
      ref={bubble}
      id={dictationId}
      role="note"
      aria-label={t('composer.dictation.label')}
      data-composer-dictation={platform ?? 'none'}
      className="absolute bottom-full right-0 z-10 mb-2 flex max-w-[320px] flex-col gap-1 rounded-[12px] border border-[color:var(--float-border)] [background:linear-gradient(var(--surface),var(--surface)),var(--ground)] p-3 text-left shadow-[var(--shadow-float)]"
    >
      {blockedNote && <p data-composer-dictation-blocked className="m-0 text-[15px] text-ink">{blockedNote}</p>}
      {platform && <p className="m-0 text-[15px] text-ink">{t(`composer.dictation.${platform}`)}</p>}
      {platform && <p className="m-0 text-[13px] text-caption">{t('composer.dictation.privacy')}</p>}
      {!platform && <p className="m-0 text-[13px] text-caption">{t('composer.voice.typeInstead')}</p>}
    </div>
  )
  /*
   * Where a voice question stands, over the field like the way to dictate:
   * listening (with the time, against the minute), turning it into text, or
   * what went wrong and the way on -- again, or typing. The field keeps what
   * it had through all of it.
   */
  function typeInstead() {
    recording.dismiss()
    field.current?.focus()
  }
  const voiceSaid =
    voiceState.phase === 'listening'
      ? t('composer.voice.listening')
      : voiceState.phase === 'transcribing'
        ? t('composer.voice.transcribing')
        : voiceState.phase === 'failed'
          ? t(`composer.voice.failed.${voiceState.failure}`)
          : ''
  const failedState = voiceState.phase === 'failed' ? voiceState : null
  const voiceBubble = voiceOpen && (
    <div
      id={voiceId}
      data-composer-voice={voiceState.phase}
      data-composer-voice-failure={failedState?.failure}
      className="absolute bottom-full right-0 z-10 mb-2 flex w-[min(320px,100%)] flex-col gap-2 rounded-[12px] border border-[color:var(--float-border)] [background:linear-gradient(var(--surface),var(--surface)),var(--ground)] p-3 text-left shadow-[var(--shadow-float)]"
    >
      {voiceState.phase === 'listening' && (
        <>
          <p className="m-0 flex items-center gap-2 text-[15px] text-ink">
            <span aria-hidden="true" className="inline-block size-2.5 shrink-0 rounded-full bg-[#d93025] motion-safe:animate-pulse" />
            <span className="min-w-0 flex-1">{voiceSaid}</span>
            <span data-composer-voice-clock className="tabular-nums text-caption">
              {clockOf(voiceState.seconds)} / {clockOf(MAX_RECORDING_SECONDS)}
            </span>
          </p>
          <p className="m-0 text-[13px] text-caption">{t('composer.voice.stopHint')}</p>
          <p className="m-0 text-[13px] text-caption">{t('composer.voice.privacy')}</p>
        </>
      )}
      {voiceState.phase === 'transcribing' && (
        <p className="m-0 flex items-center gap-2 text-[15px] text-ink">
          <LoaderCircle size={16} aria-hidden="true" className="shrink-0 motion-safe:animate-spin" />
          <span className="min-w-0">{voiceSaid}</span>
        </p>
      )}
      {failedState && (
        <>
          <p className="m-0 text-[15px] text-ink">{voiceSaid}</p>
          {(failedState.failure === 'notAllowed' || failedState.failure === 'unsupported') && platform && (
            <p className="m-0 text-[13px] text-caption">{t(`composer.dictation.${platform}`)}</p>
          )}
        </>
      )}
      {voiceState.phase !== 'listening' && (
        <div className="flex flex-wrap justify-end gap-2">
          {failedState?.retry && (
            <button
              type="button"
              data-composer-voice-retry={failedState.retry}
              onClick={recording.retry}
              className="min-h-9 cursor-pointer rounded-full border-0 bg-accent-tint px-3 text-[14px] font-medium text-accent"
            >
              {t(failedState.retry === 'send' ? 'composer.voice.sendAgain' : 'composer.voice.recordAgain')}
            </button>
          )}
          <button
            type="button"
            data-composer-voice-type
            onClick={typeInstead}
            className="min-h-9 cursor-pointer rounded-full border-0 bg-fill px-3 text-[14px] font-medium text-ink"
          >
            {t('composer.voice.typeInsteadAction')}
          </button>
        </div>
      )}
    </div>
  )
  /*
   * Read out as it changes (#345: always mounted, only its words change).
   * Not the running clock, which would be read every second.
   */
  const voiceStatus = (dictation || voice) && (
    <p role="status" className="sr-only" data-composer-voice-status>
      {voiceSaid}
    </p>
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
        placeholder={shownPlaceholder}
        disabled={disabled}
        aria-describedby={fieldDescribedBy}
        aria-haspopup={fieldPopup ? 'menu' : undefined}
        aria-expanded={fieldPopup ? fieldPopup.expanded : undefined}
        aria-controls={fieldPopup?.expanded ? fieldPopup.id : undefined}
        onChange={(event) => change(event.target.value)}
        onKeyDown={onKeyDown}
        onClick={onFieldClick}
        onCompositionStart={onCompositionStart}
        onCompositionEnd={onCompositionEnd && ((event) => onCompositionEnd(event.currentTarget.value))}
        className={cn(
          'min-w-0 resize-none border-0 bg-transparent text-ink outline-none placeholder:text-caption disabled:cursor-not-allowed',
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
        data-composer-disabled={disabled || undefined}
        onSubmit={submit}
        className={cn(
          'relative flex w-full items-center gap-2 border border-[color:var(--float-border)]',
          surface,
          className,
        )}
        style={{
          height: COMPOSER.docked.height,
          borderRadius: COMPOSER.docked.radius,
          padding: '6px 6px 6px 8px',
          boxShadow: shadow,
        }}
      >
        {hint}
        {voiceStatus}
        {dictationBubble}
        {voiceBubble}
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
      data-composer-disabled={disabled || undefined}
      onSubmit={submit}
      className={cn('relative flex w-full flex-col gap-3 border border-[color:var(--float-border)]', surface, className)}
      style={{
        minHeight: COMPOSER.full.minHeight,
        borderRadius: COMPOSER.full.radius,
        padding: '16px 16px 12px',
        boxShadow: shadow,
      }}
    >
      {hint}
      {voiceStatus}
      {dictationBubble}
      {voiceBubble}
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
