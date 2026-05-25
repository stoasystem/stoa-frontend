import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type PageHeaderProps = {
  title: string
  description?: string
  actions?: ReactNode
  eyebrow?: string
  className?: string
  titleClassName?: string
  eyebrowClassName?: string
}

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
  className,
  titleClassName,
  eyebrowClassName,
}: PageHeaderProps) {
  return (
    <header className={cn('flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between', className)}>
      <div className="min-w-0 space-y-2">
        {eyebrow && (
          <p
            className={cn(
              'text-xs font-medium uppercase tracking-normal text-muted-foreground',
              eyebrowClassName,
            )}
          >
            {eyebrow}
          </p>
        )}
        <div>
          <h1 className={cn('text-2xl font-semibold text-foreground', titleClassName)}>
            {title}
          </h1>
          {description && (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  )
}
