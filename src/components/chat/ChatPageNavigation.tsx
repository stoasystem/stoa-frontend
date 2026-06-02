import {
  LayoutDashboard,
  type LucideIcon,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

type ChatNavItem = {
  labelKey: string
  labelFallback: string
  path: string
  Icon: LucideIcon
}

const chatNavItems: ChatNavItem[] = [
  {
    labelKey: 'navigation.dashboard',
    labelFallback: 'Dashboard',
    path: '/dashboard',
    Icon: LayoutDashboard,
  },
]

export function ChatPageNavigation({
  compact = false,
  className,
}: {
  compact?: boolean
  className?: string
}) {
  const { t } = useTranslation('common')

  return (
    <nav
      aria-label="Student navigation"
      className={cn(
        compact ? 'flex items-center gap-1' : 'grid gap-2',
        className,
      )}
    >
      {chatNavItems.map(({ labelKey, labelFallback, path, Icon }) => {
        const label = t(labelKey, { defaultValue: labelFallback })

        return (
          <Link
            aria-label={compact ? label : undefined}
            className={cn(
              'inline-flex items-center justify-center gap-2 rounded-md border border-border/90 bg-card/60 text-sm font-semibold text-foreground transition-colors hover:border-primary/35 hover:bg-[hsl(var(--stoa-brand-burgundy-soft))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              compact ? 'h-10 w-10 p-0' : 'min-w-0 px-2 py-2',
            )}
            key={path}
            title={compact ? label : undefined}
            to={path}
          >
            <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
            {!compact && <span className="truncate">{label}</span>}
          </Link>
        )
      })}
    </nav>
  )
}
