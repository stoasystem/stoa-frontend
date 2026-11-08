import { ChevronDown } from 'lucide-react'
import { forwardRef, useId, type ReactNode, type SelectHTMLAttributes } from 'react'
import { TEXT_FIELD } from '@/components/base/sizes'
import { cn } from '@/lib/utils'

/** One thing to choose: the code that is stored and sent, and its name as the backend gives it. */
export type Choice = { code: string; label: string }

export interface ChoiceSelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'value' | 'onChange' | 'children'> {
  /** Shown above the field. */
  label: string
  /** What may be chosen, in the order offered (a profile response's `choices.<field>`). */
  choices: readonly Choice[]
  /** The code chosen; "" (or a value in no choice) for none. */
  value: string
  onChange: (code: string) => void
  /** The name of choosing nothing, the first entry. */
  placeholder: string
  /** A line under the field, read out with it. */
  hint?: ReactNode
  /** What went wrong with it, read out with it and marked as an error. */
  error?: ReactNode
  /** `sky`: drawn on the dark sky (the star map's cards); else on a light surface. */
  tone?: 'surface' | 'sky'
}

/*
 * A dropdown of the codes the backend offers for a list-chosen field
 * (stoa-backend#310: the year group; the answer style next, #597). The client
 * keeps no copy of the list or its names: it renders `{code, label}` as sent,
 * and sends the code. A value in no choice -- old free text the backend could
 * not read -- shows as nothing chosen.
 *
 * A native select, so a phone opens its own picker and a screen reader reads
 * it as what it is. It takes the text field's measure (Sizes: 38 high, radius
 * 10, text 15), its label above it.
 */
export const ChoiceSelect = forwardRef<HTMLSelectElement, ChoiceSelectProps>(function ChoiceSelect(
  { label, choices, value, onChange, placeholder, hint, error, tone = 'surface', id, className, style, 'aria-describedby': describedBy, ...props },
  ref,
) {
  const fallbackId = useId()
  const selectId = id ?? fallbackId
  const hintId = hint ? `${selectId}-hint` : undefined
  const errorId = error ? `${selectId}-error` : undefined
  const describedByIds = [describedBy, hintId, errorId].filter(Boolean).join(' ') || undefined
  const chosen = choices.some((choice) => choice.code === value) ? value : ''
  const sky = tone === 'sky'

  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)} data-choice-select>
      <label htmlFor={selectId} className={cn('text-[13px] leading-[1.3] font-medium', sky ? 'text-[color:var(--on-sky-text)]' : 'text-ink')}>
        {label}
      </label>
      <div className="relative min-w-0">
        <select
          ref={ref}
          id={selectId}
          value={chosen}
          aria-describedby={describedByIds}
          aria-invalid={error ? true : undefined}
          onChange={(event) => onChange(event.target.value)}
          className={cn(
            'w-full min-w-0 appearance-none disabled:opacity-60',
            sky ? 'border border-solid border-[color:var(--on-sky-field-rule)] bg-white/[0.06] text-[color:var(--on-sky-text)]' : 'border-0 bg-fill text-ink',
          )}
          style={{
            height: TEXT_FIELD.height,
            borderRadius: TEXT_FIELD.radius,
            paddingInlineStart: TEXT_FIELD.paddingX,
            paddingInlineEnd: TEXT_FIELD.paddingX + 24,
            fontSize: TEXT_FIELD.fontSize,
            // The open list follows the field: dark on the sky.
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
        <ChevronDown
          aria-hidden="true"
          className={cn('pointer-events-none absolute top-1/2 size-4 -translate-y-1/2', sky ? 'text-[color:var(--on-sky-text-caption)]' : 'text-caption')}
          style={{ insetInlineEnd: TEXT_FIELD.paddingX }}
        />
      </div>
      {hint && (
        <p id={hintId} className={cn('m-0 text-[13px] leading-[1.35]', sky ? 'text-[color:var(--on-sky-text-caption)]' : 'text-caption')}>
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className={cn('m-0 text-[13px] leading-[1.35]', sky ? 'text-[color:var(--on-sky-text)]' : 'text-red')}>
          {error}
        </p>
      )}
    </div>
  )
})
