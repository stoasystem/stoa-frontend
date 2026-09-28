import type { CSSProperties, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { SEGMENTED } from '@/components/base/sizes'
import { cn } from '@/lib/utils'

/*
 * Segmented control (Sizes board: navigation 30, filters 28; track padding 2,
 * radius 9 / 7, item padding 12, text 14). Canvas rule: "Filters are one
 * segmented control, never a row of buttons." The selected segment is Surface
 * with a small lift; the others are text in the secondary colour.
 */

const SELECTED =
  'bg-surface text-ink font-semibold shadow-[0_1px_3px_rgba(0,0,0,0.12),0_0_0_0.5px_rgba(0,0,0,0.04)]'
const UNSELECTED = 'bg-transparent text-caption font-medium hover:text-ink'

function trackStyle(fullWidth: boolean | undefined, style?: CSSProperties): CSSProperties {
  return {
    padding: SEGMENTED.trackPadding,
    borderRadius: SEGMENTED.trackRadius,
    width: fullWidth ? '100%' : undefined,
    ...style,
  }
}

function itemStyle(kind: 'nav' | 'filter'): CSSProperties {
  const spec = SEGMENTED[kind]
  return {
    height: spec.height,
    fontSize: spec.fontSize,
    paddingInline: SEGMENTED.itemPaddingX,
    borderRadius: SEGMENTED.itemRadius,
  }
}

const ITEM =
  'flex flex-1 cursor-pointer items-center justify-center whitespace-nowrap border-0 no-underline transition-colors duration-[var(--motion-press)] ease-out'

export type SegmentedNavItem = { to: string; label: ReactNode; key?: string }

/** Navigation between sibling pages (teacher Requests | Availability). */
export function SegmentedNav({
  items,
  activeIndex,
  label,
  fullWidth,
  className,
  style,
}: {
  items: readonly SegmentedNavItem[]
  /** -1 when none of the pages is open. */
  activeIndex: number
  label: string
  fullWidth?: boolean
  className?: string
  style?: CSSProperties
}) {
  return (
    <nav
      aria-label={label}
      data-segmented="nav"
      className={cn('flex shrink-0 gap-0.5 bg-fill', className)}
      style={trackStyle(fullWidth, style)}
    >
      {items.map((item, index) => (
        <Link
          key={item.key ?? item.to}
          to={item.to}
          aria-current={index === activeIndex ? 'page' : undefined}
          className={cn(ITEM, index === activeIndex ? SELECTED : UNSELECTED)}
          style={itemStyle('nav')}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  )
}

export type SegmentedOption<T extends string> = { value: T; label: ReactNode }

/** One filter over a list (All | Pending | Assigned ...). */
export function SegmentedFilter<T extends string>({
  options,
  value,
  onChange,
  label,
  fullWidth,
  className,
  style,
}: {
  options: readonly SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  label: string
  fullWidth?: boolean
  className?: string
  style?: CSSProperties
}) {
  return (
    <div
      role="group"
      aria-label={label}
      data-segmented="filter"
      className={cn('flex shrink-0 gap-0.5 bg-fill', className)}
      style={trackStyle(fullWidth, style)}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
          className={cn(ITEM, option.value === value ? SELECTED : UNSELECTED)}
          style={itemStyle('filter')}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
