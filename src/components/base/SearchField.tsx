import { Search } from 'lucide-react'
import { forwardRef, useId, type InputHTMLAttributes } from 'react'
import { ICON, SEARCH_FIELD } from '@/components/base/sizes'
import { cn } from '@/lib/utils'

export type SearchFieldSize = 'toolbar' | 'default' | 'page'

export interface SearchFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> {
  /** The field's name for assistive tech; the placeholder is not a label. */
  label: string
  size?: SearchFieldSize
}

/*
 * Components board: "Search is a fill, not a bordered box." Sizes board: 36
 * high (32 in toolbars, 38 on a page), radius 10, magnifier 18.
 */
export const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(function SearchField(
  { label, size = 'default', className, style, id, ...props },
  ref,
) {
  const fallbackId = useId()
  const inputId = id ?? fallbackId

  return (
    <label
      htmlFor={inputId}
      data-search-field={size}
      className={cn('flex min-w-0 items-center gap-2 bg-fill text-caption', className)}
      style={{
        height: SEARCH_FIELD[size],
        borderRadius: SEARCH_FIELD.radius,
        paddingInline: SEARCH_FIELD.paddingX,
        ...style,
      }}
    >
      <Search aria-hidden="true" size={SEARCH_FIELD.glyph} strokeWidth={ICON.stroke} className="shrink-0" />
      <span className="sr-only">{label}</span>
      <input
        ref={ref}
        id={inputId}
        type="search"
        className="min-w-0 flex-1 border-0 bg-transparent p-0 text-ink outline-none placeholder:text-caption"
        style={{ fontSize: SEARCH_FIELD.fontSize }}
        {...props}
      />
    </label>
  )
})
