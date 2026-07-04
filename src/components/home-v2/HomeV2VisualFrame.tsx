import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function HomeV2VisualFrame({
  children,
  className,
  contentClassName,
  label,
}: {
  children: ReactNode
  className?: string
  contentClassName?: string
  label?: string
}) {
  return (
    <div className={cn('rounded-[2rem] border border-border/70 bg-card/70 p-2 shadow-[0_24px_70px_hsl(28_25%_18%/0.08)]', className)}>
      <div className={cn('min-h-52 overflow-hidden rounded-[1.5rem] border border-white/70 bg-[hsl(var(--stoa-brand-paper))]', contentClassName)}>
        {label ? (
          <div className="border-b border-border/70 px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {label}
          </div>
        ) : null}
        {children}
      </div>
    </div>
  )
}
