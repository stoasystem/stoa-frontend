import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { TEXT_FIELD } from '@/components/base/sizes'
import { cn } from '@/lib/utils'

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Shown above the field; the placeholder is never the label. */
  label: string
  /** A line under the field, read out with it. */
  hint?: ReactNode
}

/*
 * Components board, "Fields and composer": a field is a fill, not a bordered
 * box. It takes the page search field's measure (Sizes: 38 high, radius 10,
 * 12 inside, text 15), with its label above it in the section style.
 */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, hint, id, className, style, 'aria-describedby': describedBy, ...props },
  ref,
) {
  const fallbackId = useId()
  const inputId = id ?? fallbackId
  const hintId = hint ? `${inputId}-hint` : undefined
  const describedByIds = [describedBy, hintId].filter(Boolean).join(' ') || undefined

  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)} data-text-field>
      <label htmlFor={inputId} className="text-[13px] leading-[1.3] font-medium text-ink">
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        aria-describedby={describedByIds}
        className="min-w-0 border-0 bg-fill text-ink placeholder:text-caption"
        style={{
          height: TEXT_FIELD.height,
          borderRadius: TEXT_FIELD.radius,
          paddingInline: TEXT_FIELD.paddingX,
          fontSize: TEXT_FIELD.fontSize,
          ...style,
        }}
        {...props}
      />
      {hint && (
        <p id={hintId} className="m-0 text-[13px] leading-[1.35] text-caption">
          {hint}
        </p>
      )}
    </div>
  )
})
