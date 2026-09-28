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

/*
 * The page title of the redesign (Teacher, Parent and Admin boards; #52): a
 * large title (34 / 700) with a 17 subtitle in the secondary colour, and the
 * page's actions on the right, bottom-aligned with it. An eyebrow, where a
 * page still has one, is a group header above the title (13 / 500, caps).
 * Every page built before the redesign takes its title from here, so this
 * restyles their headers in one place.
 */
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
    <header className={cn('flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="min-w-0">
        {eyebrow && (
          <p
            className={cn('m-0 mb-1 text-caption uppercase', eyebrowClassName)}
            style={{ font: 'var(--t-section)', letterSpacing: 'var(--t-section-tracking)' }}
          >
            {eyebrow}
          </p>
        )}
        <h1
          className={cn('m-0 break-words text-ink', titleClassName)}
          style={{ font: 'var(--t-large)', letterSpacing: 'var(--t-large-tracking)' }}
        >
          {title}
        </h1>
        {description && (
          <p className="m-0 mt-1.5 max-w-2xl text-[17px] leading-[1.3] text-caption">{description}</p>
        )}
      </div>
      {actions && <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:shrink-0 sm:justify-end">{actions}</div>}
    </header>
  )
}
