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
    <div
      className={cn(
        'rounded-[2rem] bg-[hsl(var(--home-v2-ink)/0.045)] p-2 shadow-[0_34px_92px_hsl(var(--home-v2-ink)/0.14)] ring-1 ring-[hsl(var(--home-v2-line)/0.54)]',
        className,
      )}
    >
      <div
        className={cn(
          'min-h-52 overflow-hidden rounded-[calc(2rem-0.5rem)] bg-[hsl(var(--home-v2-porcelain))] shadow-[inset_0_1px_0_hsl(0_0%_100%/0.82)] ring-1 ring-white/70',
          contentClassName,
        )}
      >
        {label ? (
          <div className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-[hsl(var(--home-v2-ink)/0.42)]">
            {label}
          </div>
        ) : null}
        {children}
      </div>
    </div>
  )
}
