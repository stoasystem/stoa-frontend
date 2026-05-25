import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export type BreadcrumbItem = {
  label: string
  to?: string
}

type BreadcrumbsProps = {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  if (items.length <= 1) return null

  return (
    <nav aria-label="Breadcrumb" className={cn('text-sm text-muted-foreground', className)}>
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, index) => {
          const isCurrent = index === items.length - 1

          return (
            <li className="flex min-w-0 items-center gap-1" key={`${item.label}-${index}`}>
              {index > 0 && <ChevronRight aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />}
              {item.to && !isCurrent ? (
                <Link className="truncate hover:text-foreground" to={item.to}>
                  {item.label}
                </Link>
              ) : (
                <span aria-current={isCurrent ? 'page' : undefined} className="truncate text-foreground">
                  {item.label}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
