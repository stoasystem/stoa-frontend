import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type PageActionsProps = {
  primary?: ReactNode
  secondary?: ReactNode
  tertiary?: ReactNode
  danger?: ReactNode
  className?: string
}

export function PageActions({
  primary,
  secondary,
  tertiary,
  danger,
  className,
}: PageActionsProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {tertiary}
      {secondary}
      {danger}
      {primary}
    </div>
  )
}
