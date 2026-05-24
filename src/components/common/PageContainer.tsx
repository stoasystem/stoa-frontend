import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type PageContainerProps = {
  children: ReactNode
  className?: string
  size?: 'default' | 'wide' | 'narrow'
}

const sizeClassNames = {
  default: 'max-w-6xl',
  wide: 'max-w-7xl',
  narrow: 'max-w-3xl',
}

export function PageContainer({
  children,
  className,
  size = 'default',
}: PageContainerProps) {
  return (
    <div
      className={cn(
        'mx-auto w-full space-y-6 px-4 py-6 sm:px-6 lg:px-8',
        sizeClassNames[size],
        className,
      )}
    >
      {children}
    </div>
  )
}
