import type { LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ICON, SOURCE_LIST } from '@/components/base/sizes'
import { cn } from '@/lib/utils'

export type SourceListItem = { to: string; label: string; icon: LucideIcon }

/*
 * The administrator's source list (Admin board: 240 wide on the sidebar
 * colour, items 34 high, radius 8, text 14, glyph 18; the open page in the
 * navy tint). On a phone the same links scroll sideways under the bar.
 */
export function SourceList({
  items,
  activeIndex,
  wide,
}: {
  items: readonly SourceListItem[]
  activeIndex: number
  wide: boolean
}) {
  const { t } = useTranslation('common')

  return (
    <nav
      aria-label={t('navigation.administration')}
      data-source-list={wide ? 'column' : 'strip'}
      className={cn(
        'shrink-0 bg-sidebar',
        wide
          ? 'sticky flex flex-col gap-1 self-start border-r border-separator px-3 py-4'
          : 'flex gap-1 overflow-x-auto border-b border-separator px-3 py-2',
      )}
      style={wide ? { width: SOURCE_LIST.width, top: 57, height: 'calc(100vh - 57px)' } : undefined}
    >
      {items.map((item, index) => {
        const active = index === activeIndex
        const Icon = item.icon
        return (
          <Link
            key={item.to}
            to={item.to}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex shrink-0 items-center gap-2.5 px-2.5 text-[14px] whitespace-nowrap no-underline transition-colors duration-[var(--motion-press)] ease-out',
              active ? 'bg-accent-tint font-semibold text-accent' : 'font-medium text-ink hover:bg-fill',
            )}
            style={{ height: SOURCE_LIST.item, borderRadius: SOURCE_LIST.itemRadius }}
          >
            <Icon
              aria-hidden="true"
              size={SOURCE_LIST.glyph}
              strokeWidth={ICON.stroke}
              className={active ? 'text-accent' : 'text-caption'}
            />
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
