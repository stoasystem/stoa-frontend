import type { CSSProperties, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { SEGMENTED } from '@/components/base/sizes'
import { cn } from '@/lib/utils'

/*
 * Segmented control (Sizes board: navigation 30, filters 28; track padding 2,
 * radius 9 / 7, item padding 12, text 14). Canvas rule: "Filters are one
 * segmented control, never a row of buttons." The selected segment is Surface
 * with a small lift; the others are text in the secondary colour.
 *
 * Each segment is its link or button (the hit area) around the drawn face,
 * and the track is drawn behind them, so `hitHeight` can give a phone 44-high
 * targets while the control still looks 30 high.
 */

const SELECTED =
  'bg-surface text-ink font-semibold shadow-[0_1px_3px_rgba(0,0,0,0.12),0_0_0_0.5px_rgba(0,0,0,0.04)]'
const UNSELECTED = 'bg-transparent text-caption font-medium group-hover:text-ink'
const HIT =
  'group relative z-[1] flex flex-1 cursor-pointer items-center border-0 bg-transparent p-0 no-underline'
const FACE =
  'flex w-full items-center justify-center whitespace-nowrap transition-colors duration-[var(--motion-press)] ease-out'

type Kind = 'nav' | 'filter'

function geometry(kind: Kind, hitHeight: number | undefined) {
  const face = SEGMENTED[kind].height
  const drawn = face + 2 * SEGMENTED.trackPadding
  const row = Math.max(drawn, hitHeight ?? 0)
  return {
    face,
    row,
    // Without a larger hit area a segment is exactly its face.
    hit: hitHeight ? row : face,
    trackTop: (row - drawn) / 2,
    drawn,
  }
}

/** The track's own box and the fill drawn behind the segments. */
function trackParts(kind: Kind, hitHeight: number | undefined, fullWidth: boolean | undefined, style?: CSSProperties) {
  const g = geometry(kind, hitHeight)
  return {
    g,
    style: {
      height: g.row,
      paddingInline: SEGMENTED.trackPadding,
      paddingBlock: hitHeight ? 0 : SEGMENTED.trackPadding,
      width: fullWidth ? '100%' : undefined,
      ...style,
    } satisfies CSSProperties,
    background: (
      <span
        aria-hidden="true"
        data-segmented-track
        className="absolute inset-x-0 bg-fill"
        style={{ top: g.trackTop, height: g.drawn, borderRadius: SEGMENTED.trackRadius }}
      />
    ),
  }
}

function faceStyle(kind: Kind): CSSProperties {
  const spec = SEGMENTED[kind]
  return {
    height: spec.height,
    fontSize: spec.fontSize,
    paddingInline: SEGMENTED.itemPaddingX,
    borderRadius: SEGMENTED.itemRadius,
  }
}

export type SegmentedNavItem = { to: string; label: ReactNode; key?: string }

/** Navigation between sibling pages (teacher Requests | Availability). */
export function SegmentedNav({
  items,
  activeIndex,
  label,
  fullWidth,
  hitHeight,
  className,
  style,
}: {
  items: readonly SegmentedNavItem[]
  /** -1 when none of the pages is open. */
  activeIndex: number
  label: string
  fullWidth?: boolean
  /** A taller hit area than the drawn 30, e.g. 44 on a phone. */
  hitHeight?: number
  className?: string
  style?: CSSProperties
}) {
  const track = trackParts('nav', hitHeight, fullWidth, style)
  return (
    <nav aria-label={label} data-segmented="nav" className={cn('relative flex shrink-0 gap-0.5', className)} style={track.style}>
      {track.background}
      {items.map((item, index) => (
        <Link
          key={item.key ?? item.to}
          to={item.to}
          aria-current={index === activeIndex ? 'page' : undefined}
          className={HIT}
          style={{ height: track.g.hit }}
        >
          <span data-segment-face className={cn(FACE, index === activeIndex ? SELECTED : UNSELECTED)} style={faceStyle('nav')}>
            {item.label}
          </span>
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
  hitHeight,
  className,
  style,
}: {
  options: readonly SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  label: string
  fullWidth?: boolean
  hitHeight?: number
  className?: string
  style?: CSSProperties
}) {
  const track = trackParts('filter', hitHeight, fullWidth, style)
  return (
    <div
      role="group"
      aria-label={label}
      data-segmented="filter"
      className={cn('relative flex shrink-0 gap-0.5', className)}
      style={track.style}
    >
      {track.background}
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
          className={HIT}
          style={{ height: track.g.hit }}
        >
          <span data-segment-face className={cn(FACE, option.value === value ? SELECTED : UNSELECTED)} style={faceStyle('filter')}>
            {option.label}
          </span>
        </button>
      ))}
    </div>
  )
}
