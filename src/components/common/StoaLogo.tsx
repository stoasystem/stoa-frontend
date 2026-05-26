import { cn } from '@/lib/utils'

export type StoaLogoProps = {
  variant?: 'dark' | 'light' | 'gold' | 'monochrome'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClassNames = {
  sm: 'text-xl',
  md: 'text-2xl',
  lg: 'text-4xl',
} as const

const variantClassNames = {
  dark: 'text-[hsl(var(--stoa-brand-charcoal))]',
  light: 'text-[hsl(var(--stoa-brand-paper))]',
  gold: 'text-[hsl(var(--accent))]',
  monochrome: 'text-current',
} as const

export function StoaLogo({ variant = 'dark', size = 'md', className }: StoaLogoProps) {
  return (
    <span
      className={cn(
        'inline-flex items-baseline gap-2 font-semibold leading-none tracking-[0.08em]',
        variantClassNames[variant],
        sizeClassNames[size],
        className,
      )}
      aria-label="STOA"
    >
      <span className="editorial-heading tracking-normal">STOA</span>
    </span>
  )
}
