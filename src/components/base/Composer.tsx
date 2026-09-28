import { ArrowUp, Plus } from 'lucide-react'
import { useId, type FormEvent, type KeyboardEvent, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { IconButton } from '@/components/base/IconButton'
import { COMPOSER } from '@/components/base/sizes'
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
  /** Full composer only: between + and send, e.g. the subject picker. */
  footerStart?: ReactNode
  disabled?: boolean
  /** Sending: the field stays editable, send is held. */
  busy?: boolean
  className?: string
}

/*
 * Components board, "Fields and composer": the composer is the only floating
 * surface on a page and holds the only filled control (send). Sizes board:
 * docked 46 high, radius 22-24, textarea 32, + 32/20, send 32/18; full ~150,
 * radius 18, textarea 78, footer row 32.
 *
 * Enter sends, Shift+Enter breaks the line, and nothing is sent while an input
 * method is still composing (Japanese, Chinese, accented keyboards).
 */
export function Composer({
  value,
  onChange,
  onSubmit,
  label,
  placeholder,
  variant = 'docked',
  onAttach,
  footerStart,
  disabled = false,
  busy = false,
  className,
}: ComposerProps) {
  const { t } = useTranslation('common')
  const fieldId = useId()
  const spec = COMPOSER[variant]
  const canSend = !disabled && !busy && value.trim().length > 0

  function submit(event?: FormEvent) {
    event?.preventDefault()
    if (canSend) onSubmit(value)
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
  const send = (
    <IconButton
      type="submit"
      label={t('composer.send')}
      icon={ArrowUp}
      size={spec.send}
      glyph={spec.sendGlyph}
      variant="filled"
      disabled={!canSend}
    />
  )
  const field = (
    <>
      <label htmlFor={fieldId} className="sr-only">
        {label}
      </label>
      <textarea
        id={fieldId}
        data-composer-field
        rows={variant === 'docked' ? 1 : 3}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
        className={cn(
          'min-w-0 resize-none border-0 bg-transparent text-ink outline-none placeholder:text-caption',
          variant === 'docked' ? 'flex-1 text-[16px] leading-[1.4]' : 'text-[17px] leading-[1.45]',
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
        className={cn('flex w-full items-center gap-2 border border-[color:var(--float-border)] bg-surface', className)}
        style={{
          height: COMPOSER.docked.height,
          borderRadius: COMPOSER.docked.radius,
          padding: '6px 6px 6px 8px',
          boxShadow: 'var(--shadow-float)',
        }}
      >
        {attach}
        {field}
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
      {field}
      <div data-composer-footer className="flex items-center gap-1.5" style={{ height: COMPOSER.full.footer }}>
        {attach}
        {footerStart}
        <div className="flex-1" />
        {send}
      </div>
    </form>
  )
}
