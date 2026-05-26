import { cn } from '@/lib/utils'

const logoUrl = new URL('../../../img/logo2.png', import.meta.url).href

export type StoaLogoProps = {
  variant?: 'dark' | 'light' | 'gold' | 'monochrome'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClassNames = {
  sm: 'h-11',
  md: 'h-14',
  lg: 'h-20',
} as const

const variantClassNames = {
  dark: '',
  light: 'brightness-0 invert',
  gold: 'sepia saturate-150',
  monochrome: 'grayscale',
} as const

export function StoaLogo({ variant = 'dark', size = 'md', className }: StoaLogoProps) {
  return (
    <img
      src={logoUrl}
      alt="STOA"
      className={cn(
        'block w-auto max-w-full shrink-0 object-contain',
        variantClassNames[variant],
        sizeClassNames[size],
        className,
      )}
      draggable={false}
    />
  )
}
