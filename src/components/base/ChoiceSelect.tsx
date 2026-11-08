import { forwardRef, useId, type ReactNode, type SelectHTMLAttributes } from 'react'
import { TEXT_FIELD } from '@/components/base/sizes'
import { cn } from '@/lib/utils'
import type { ProfileChoice } from '@/types/student'

export type ChoiceSelectTone = 'page' | 'sky'

export interface ChoiceSelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'value' | 'defaultValue' | 'onChange' | 'children'> {
  /** Shown above the field; the placeholder is never the label. */
  label: string
  /** The values offered, in the order the backend gives them (`choices.<field>`, stoa-backend#310). */
  choices: readonly ProfileChoice[]
  /** The stored code. Anything not among `choices` (old text, nothing said) selects nothing. */
  value: string
  onChange: (code: string) => void
  /** The empty first option: what to read when nothing is chosen; choosing it means "not said". */
  placeholder: string
  /** A line under the field, read out with it. */
  hint?: ReactNode
  /** Said under the field, read out with it, and marks the field invalid. */
  error?: ReactNode
  /** On a page (`page`) or over the sky's glass (`sky`). */
  tone?: ChoiceSelectTone
}

/** `value` if it is one of `choices`, else "": what a list-chosen field reads as. */
export function readableChoice(choices: readonly ProfileChoice[] | undefined, value: string | null | undefined): string {
  return value && choices?.some((choice) => choice.code === value) ? value : ''
}

/*
 * A profile field chosen from a list the backend gives (#591): the grade,
 * and next the answer style preset (#597), both `choices.<field>` =
 * `[{code, label}]`. The backend names each code in the request's language,
 * so the client keeps no copy of the list and no translation of it.
 *
 * A native select, for the keyboard and screen reader every platform already
 * has, measured as the text field is (Sizes: 38 high, radius 10).
 */
export const ChoiceSelect = forwardRef<HTMLSelectElement, ChoiceSelectProps>(function ChoiceSelect(
  { label, choices, value, onChange, placeholder, hint, error, tone = 'page', id, className, style, 'aria-describedby': describedBy, ...props },
  ref,
) {
  const fallbackId = useId()
  const selectId = id ?? fallbackId
  const hintId = hint ? `${selectId}-hint` : undefined
  const errorId = error ? `${selectId}-error` : undefined
  const describedByIds = [describedBy, hintId, errorId].filter(Boolean).join(' ') || undefined
  const sky = tone === 'sky'

  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)} data-choice-select>
      <label
        htmlFor={selectId}
        className={cn('text-[13px] leading-[1.3] font-medium', sky ? 'text-[color:var(--on-sky-text)]' : 'text-ink')}
      >
        {label}
      </label>
      <select
        ref={ref}
        id={selectId}
        value={readableChoice(choices, value)}
        aria-describedby={describedByIds}
        aria-invalid={error ? true : undefined}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          'min-w-0 cursor-pointer disabled:cursor-default disabled:opacity-60',
          sky
            ? 'border border-solid border-[color:var(--on-sky-field-rule)] bg-white/[0.06] text-on-sky focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'
            : 'border-0 bg-fill text-ink',
        )}
        style={{
          height: TEXT_FIELD.height,
          borderRadius: TEXT_FIELD.radius,
          paddingInline: TEXT_FIELD.paddingX,
          fontSize: TEXT_FIELD.fontSize,
          // The open list is the platform's own: on the sky it is drawn dark, so its light text stays readable.
          colorScheme: sky ? 'dark' : undefined,
          ...style,
        }}
        {...props}
      >
        <option value="">{placeholder}</option>
        {choices.map((choice) => (
          <option key={choice.code} value={choice.code}>
            {choice.label}
          </option>
        ))}
      </select>
      {hint && (
        <p id={hintId} className={cn('m-0 text-[13px] leading-[1.35]', sky ? 'text-[color:var(--on-sky-text-caption)]' : 'text-caption')}>
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="m-0 text-[13px] leading-[1.35] text-red">
          {error}
        </p>
      )}
    </div>
  )
})
