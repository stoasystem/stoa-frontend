import { ChevronRight, type LucideIcon } from 'lucide-react'
import type { CSSProperties, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Avatar, type AvatarTone } from '@/components/base/Avatar'
import { ICON, ROW } from '@/components/base/sizes'
import { cn } from '@/lib/utils'

/*
 * Components board, "Grouped list": every navigation target is a row with a
 * chevron. Rows carry their value, status or progress; they never carry a
 * button. The group is Surface with a hairline border and no shadow; rows are
 * divided by hairlines.
 */
export function Group({
  title,
  children,
  className,
}: {
  /** Section header above the group (13 / 500, caps, +0.4). */
  title?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn('flex flex-col', className)}>
      {title && (
        <h2
          className="m-0 text-caption uppercase"
          style={{ font: 'var(--t-section)', letterSpacing: 'var(--t-section-tracking)', padding: '0 16px 8px' }}
        >
          {title}
        </h2>
      )}
      <div
        data-group
        className="flex flex-col overflow-hidden border border-[color:var(--card-border)] bg-surface [&>*+*]:border-t [&>*+*]:border-hairline"
        style={{ borderRadius: ROW.groupRadius }}
      >
        {children}
      </div>
    </section>
  )
}

export type RowLeading =
  | { kind: 'icon'; icon: LucideIcon; tone?: 'accent' | 'neutral' }
  | { kind: 'avatar'; name: string; tone?: AvatarTone }

export interface RowProps {
  title: ReactNode
  subtitle?: ReactNode
  leading?: RowLeading
  /** A value, a pill, a progress bar, a toggle: never a button. */
  trailing?: ReactNode
  /** Navigates: the row is a link and shows a chevron. */
  to?: string
  /** Opens something in place: the row is a button and shows a chevron. */
  onSelect?: () => void
  /** A settings row: 48 instead of 52. */
  compact?: boolean
  className?: string
}

/** Sizes board: 52; 48 in settings; 56 with a subtitle; 60-64 with an avatar. */
export function rowHeight({ leading, subtitle, compact }: Pick<RowProps, 'leading' | 'subtitle' | 'compact'>) {
  if (leading?.kind === 'avatar') return ROW.avatar
  if (subtitle) return ROW.subtitle
  return compact ? ROW.settings : ROW.default
}

function Leading({ leading }: { leading: RowLeading }) {
  if (leading.kind === 'avatar') {
    return <Avatar name={leading.name} size={ROW.avatar36} tone={leading.tone ?? 'neutral'} />
  }
  const Icon = leading.icon
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex shrink-0 items-center justify-center',
        leading.tone === 'accent' ? 'bg-accent-tint text-accent' : 'bg-fill text-pill-neutral',
      )}
      style={{ width: ROW.tile, height: ROW.tile, borderRadius: ROW.tileRadius }}
    >
      <Icon size={ICON.rowLeading} strokeWidth={ICON.stroke} />
    </span>
  )
}

export function Row({ title, subtitle, leading, trailing, to, onSelect, compact, className }: RowProps) {
  const navigates = Boolean(to || onSelect)
  const style: CSSProperties = {
    minHeight: rowHeight({ leading, subtitle, compact }),
    paddingBlock: ROW.paddingY,
    paddingInline: ROW.paddingX,
    gap: ROW.gap,
  }
  const body = (
    <>
      {leading && <Leading leading={leading} />}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5 text-left">
        <span className="truncate text-[15px] leading-[1.35] font-medium text-ink">{title}</span>
        {subtitle && <span className="truncate text-[13px] leading-[1.35] text-caption">{subtitle}</span>}
      </span>
      {(trailing || navigates) && (
        <span className="flex shrink-0 items-center gap-2.5 text-[15px] text-caption">
          {trailing}
          {navigates && (
            <ChevronRight aria-hidden="true" data-chevron size={ICON.rowLeading} strokeWidth={1.8} className="text-tertiary" />
          )}
        </span>
      )}
    </>
  )
  const classes = cn(
    'flex w-full items-center border-0 bg-transparent text-inherit no-underline',
    navigates && 'cursor-pointer transition-colors duration-[var(--motion-press)] ease-out hover:bg-ground',
    className,
  )

  if (to) {
    return (
      <Link to={to} data-row className={classes} style={style}>
        {body}
      </Link>
    )
  }
  if (onSelect) {
    return (
      <button type="button" data-row onClick={onSelect} className={classes} style={style}>
        {body}
      </button>
    )
  }
  return (
    <div data-row className={classes} style={style}>
      {body}
    </div>
  )
}
