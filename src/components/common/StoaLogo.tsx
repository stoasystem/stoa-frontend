import { cn } from '@/lib/utils'

/*
 * The website's logo (stoaedu.ch, img/logo/logo-stoa.svg): the mark and
 * "STOA", drawn in white on a 410 x 208 box. The drawing fills its box down to
 * 0.77 of the height (the mark runs 29-190 of 208), so a 48 high logo draws
 * about 37 high.
 *
 * `light` is the file as drawn, for the sky; `dark` takes it to black for a
 * light background.
 */
const logoUrl = new URL('../../../img/logo-stoa.svg', import.meta.url).href

export type StoaLogoProps = {
  variant?: 'dark' | 'light'
  size?: 'sm' | 'md' | 'lg'
  /** An exact height in px, as the bars take it (Sizes: logo 48, phone 40). Overrides `size`. */
  height?: number
  className?: string
}

const sizeClassNames = {
  sm: 'h-11',
  md: 'h-14',
  lg: 'h-20',
} as const

const variantClassNames = {
  dark: 'brightness-0',
  light: '',
} as const

export function StoaLogo({ variant = 'dark', size = 'md', height, className }: StoaLogoProps) {
  return (
    <img
      src={logoUrl}
      alt="STOA"
      data-logo-variant={variant}
      className={cn(
        'block w-auto max-w-full shrink-0 object-contain',
        variantClassNames[variant],
        height === undefined && sizeClassNames[size],
        className,
      )}
      style={height === undefined ? undefined : { height }}
      draggable={false}
    />
  )
}
